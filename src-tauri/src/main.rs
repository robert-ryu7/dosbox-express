#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use diesel::associations::HasTable;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dosbox_express::models::{Game, NewGame};
use dosbox_express::schema::games::dsl::games;
use dotenvy::dotenv;
use std::collections::HashMap;
use std::env;
use std::path::Path;
use std::sync::Mutex;
use std::thread;
use subprocess::Exec;
use tauri::Manager;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

struct RunningGames(Mutex<HashMap<i32, u32>>);

#[tauri::command]
fn get_running_games(running_games: tauri::State<RunningGames>) -> Vec<i32> {
    return running_games
        .0
        .lock()
        .unwrap()
        .clone()
        .into_keys()
        .collect();
}

fn get_dosbox_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let path = app
        .path_resolver()
        .resolve_resource("dosbox/dosbox.exe")
        .ok_or("Failed to resolve DOSBox path")?;

    return dunce::canonicalize(path).or_else(|err| Err(err.to_string()));
}

#[tauri::command]
async fn run_game(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    handle: tauri::AppHandle,
    id: i32,
) -> Result<(), String> {
    let running_games = handle.state::<RunningGames>();
    if running_games.0.lock().unwrap().contains_key(&id) {
        return Err(format!("Game with id {} has already started", id));
    }

    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    let game = games
        .filter(dosbox_express::schema::games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let parent_path = Path::new(&game.config_path)
        .parent()
        .ok_or("Failed to find parent path")?;
    let dosbox_path = get_dosbox_path(&app)?;

    match Exec::cmd("cmd")
        .detached()
        .arg("/c")
        .arg(dosbox_path)
        .arg(parent_path)
        .arg("-conf")
        .arg(game.config_path)
        .arg("-noconsole")
        .popen()
    {
        Ok(mut popen) => {
            thread::spawn(move || {
                let pid = popen.pid().unwrap();
                println!("Subprocess {} has started", pid);
                let running_games = handle.state::<RunningGames>();
                running_games.0.lock().unwrap().insert(id, pid);
                app.emit_all(
                    "running_games_changed",
                    running_games
                        .0
                        .lock()
                        .unwrap()
                        .clone()
                        .into_keys()
                        .collect::<Vec<i32>>(),
                )
                .unwrap();

                match popen.wait() {
                    Ok(exit_status) => {
                        println!(
                            "Subprocess {} has exited with status {:?}.",
                            pid, exit_status
                        );
                        running_games.0.lock().unwrap().remove(&id);
                        app.emit_all(
                            "running_games_changed",
                            running_games
                                .0
                                .lock()
                                .unwrap()
                                .clone()
                                .into_keys()
                                .collect::<Vec<i32>>(),
                        )
                        .unwrap();

                        return Ok(());
                    }
                    Err(error) => return Err(error.to_string()),
                }
            });
            return Ok(());
        }
        Err(error) => return Err(error.to_string()),
    }
}

#[tauri::command]
fn add_game(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    title: &str,
    config_path: &str,
) -> () {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    let new_game = NewGame { title, config_path };

    diesel::insert_into(games::table())
        .values(&new_game)
        .execute(connection)
        .expect("Error saving new game");

    app.emit_all("games_changed", "add_game").unwrap();
}

#[tauri::command]
fn edit_game(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    id: i32,
    title: &str,
    config_path: &str,
) -> Result<(), String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    diesel::update(games.filter(dosbox_express::schema::games::id.eq(id)))
        .set((
            dosbox_express::schema::games::title.eq(title),
            dosbox_express::schema::games::config_path.eq(config_path),
        ))
        .execute(connection)
        .or(Err("Failed to update game"))?;

    app.emit_all("games_changed", "add_game").unwrap();

    Ok(())
}

#[tauri::command]
fn get_games(state: tauri::State<'_, Mutex<SqliteConnection>>) -> Result<Vec<Game>, String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    games
        .load::<Game>(connection)
        .or(Err("Error loading games".to_string()))
}

#[tauri::command]
fn delete_games(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    ids: Vec<i32>,
) -> Result<(), String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    diesel::delete(games.filter(dosbox_express::schema::games::id.eq_any(ids)))
        .execute(connection)
        .or(Err("Error deleting games"))?;

    app.emit_all("games_changed", "delete_games").unwrap();

    Ok(())
}

fn main() {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let mut connection = SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url));
    connection
        .run_pending_migrations(MIGRATIONS)
        .expect("Failed to establish database connection");

    tauri::Builder::default()
        .setup(|app| {
            let dosbox_path = get_dosbox_path(&app.handle())?;
            let resource_dir = app
                .path_resolver()
                .resource_dir()
                .ok_or("Failed to resolve resource directory")
                .and_then(|path| {
                    dunce::canonicalize(path).or(Err("Failed to canonicalize resource directory"))
                })?;
            let base_conf_path = resource_dir.join("base.conf");

            if !base_conf_path.exists() {
                print!("No base configuration found. Creating a new one...");
                Exec::cmd("cmd")
                    .arg("/c")
                    .arg(dosbox_path)
                    .arg("-c")
                    .arg(format!(
                        "config -writeconf {}",
                        base_conf_path.to_string_lossy()
                    ))
                    .arg("-exit")
                    .join()?;
                println!("done");
            }
            Ok(())
        })
        .manage(std::sync::Mutex::new(connection))
        .manage(RunningGames(Default::default()))
        .invoke_handler(tauri::generate_handler![
            get_running_games,
            run_game,
            add_game,
            edit_game,
            get_games,
            delete_games
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
