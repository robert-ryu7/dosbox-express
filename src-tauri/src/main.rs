#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use diesel::associations::HasTable;
use diesel::prelude::*;
use diesel::sql_types::Text;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dosbox_express::models::{Game, NewGame, Setting};
use dosbox_express::schema::games::dsl::games;
use dosbox_express::schema::settings::dsl::settings;
use dotenvy::dotenv;
use std::collections::HashMap;
use std::sync::Mutex;
use std::thread;
use subprocess::Exec;
use tauri::Manager;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

struct RunningGames(Mutex<HashMap<i32, u32>>);

fn get_dosbox_path() -> Result<std::path::PathBuf, String> {
    let path = std::env::var("DOSBOX_PATH").expect("DOSBOX_PATH must be set");

    return dunce::canonicalize(path).or_else(|err| Err(err.to_string()));
}

#[tauri::command]
fn get_game_config(
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    id: i32,
) -> Result<String, String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    let game = games
        .filter(dosbox_express::schema::games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;

    std::fs::read_to_string(game.config_path).or_else(|err| Err(err.to_string()))
}

#[tauri::command]
fn update_game_config(
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    id: i32,
    config: String,
) -> Result<(), String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    let game = games
        .filter(dosbox_express::schema::games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;

    std::fs::write(game.config_path, config).or_else(|err| Err(err.to_string()))
}

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

#[tauri::command]
fn make_relative_path(path: String) -> Option<String> {
    let current_dir = std::env::current_dir().unwrap();
    return pathdiff::diff_paths(path, current_dir)
        .and_then(|path| path.to_str().and_then(|str| Some(String::from(str))));
}

#[tauri::command]
async fn run_game(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    id: i32,
) -> Result<(), String> {
    let running_games = app.state::<RunningGames>();
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
    let resolved_config_path =
        dunce::canonicalize(&game.config_path).or_else(|err| Err(err.to_string()))?;

    let parent_path = resolved_config_path
        .parent()
        .ok_or("Failed to find parent path")?;
    let dosbox_path = get_dosbox_path()?;

    match Exec::cmd("cmd")
        .detached()
        .arg("/c")
        .arg(dosbox_path)
        .arg(parent_path)
        .arg("-conf")
        .arg(resolved_config_path)
        .popen()
    {
        Ok(mut popen) => {
            thread::spawn(move || {
                let pid = popen.pid().unwrap();
                println!("Subprocess {} has started", pid);
                let running_games = app.state::<RunningGames>();
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
async fn run_dosbox(params: String) -> Result<String, String> {
    let dosbox_path = get_dosbox_path()?;

    let capture_data = Exec::cmd("cmd")
        .detached()
        .arg("/c")
        .arg(dosbox_path)
        .arg(params)
        .capture()
        .or_else(|err| Err(err.to_string()))?;

    if capture_data.success() {
        return Ok(capture_data.stdout_str());
    } else {
        return Err(capture_data.stderr_str());
    }
}

#[tauri::command]
fn create_game(
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

    app.emit_all("games_changed", "create_game").unwrap();
}

#[tauri::command]
fn update_game(
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

    app.emit_all("games_changed", "update_game").unwrap();

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

#[tauri::command]
fn get_settings(state: tauri::State<'_, Mutex<SqliteConnection>>) -> Result<Vec<Setting>, String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    settings
        .load::<Setting>(connection)
        .or(Err("Error loading settings".to_string()))
}

#[tauri::command]
fn update_settings(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<diesel::sqlite::SqliteConnection>>,
    changed_settings: Vec<dosbox_express::models::UpsertSetting>,
) -> Result<(), String> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    connection.transaction::<_, diesel::result::Error, _>(|conn| {
        for changed_setting in changed_settings {
            let result = diesel::sql_query("INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
                .bind::<Text, _>(changed_setting.key)
                .bind::<Text, _>(changed_setting.value)
                .execute(conn);

            if result.is_err() {
                return Err(diesel::result::Error::RollbackTransaction);
            }
        }

        Ok(())
    }).or(Err("Failed to update settings".to_string()))?;

    let payload = settings
        .load::<Setting>(connection)
        .or(Err("Error loading settings".to_string()))?;

    app.emit_all("settings_changed", &payload).unwrap();

    Ok(())
}

fn main() {
    dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let mut connection = SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url));
    connection
        .run_pending_migrations(MIGRATIONS)
        .expect("Failed to establish database connection");

    tauri::Builder::default()
        .setup(|app| {
            let dosbox_path = get_dosbox_path()?;
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
            get_game_config,
            update_game_config,
            get_running_games,
            make_relative_path,
            run_game,
            run_dosbox,
            create_game,
            update_game,
            get_games,
            delete_games,
            get_settings,
            update_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
