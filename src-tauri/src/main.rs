#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod common;

use common::exec::get_dosbox_exec;
use common::path::resolve_relative_path;
use common::structs::RunningGames;
use common::types::{PoolState, Result, RunningGamesState};
use diesel::prelude::*;
use diesel::query_builder::AsQuery;
use diesel::r2d2::ConnectionManager;
use diesel::r2d2::Pool;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dosbox_express::models::{Game, NewGame};
use dosbox_express::schema::games;
use dosbox_express::schema::games::dsl::games as games_table;
use std::path::Path;
use std::time::Instant;
use tauri::AppHandle;
use tauri::Manager;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

#[tauri::command]
fn generate_game_config(executable_path: String) -> Result<String> {
    let executable_path_buf = std::path::PathBuf::from(executable_path);
    let executable_file_name = executable_path_buf
        .file_name()
        .ok_or("Failed to get executable file name.")?;
    let mut conf_path_buf = executable_path_buf.clone();
    conf_path_buf.set_extension("conf");

    if !Path::new(&conf_path_buf).exists() {
        std::fs::write(
            &conf_path_buf,
            format!(
                "[autoexec]\n@ECHO OFF\nMOUNT C .\nC:\nCLS\n{}",
                executable_file_name.to_string_lossy()
            ),
        )
        .or_else(|err| Err(err.to_string()))?;
    }

    return Ok(conf_path_buf.to_string_lossy().to_string());
}

#[tauri::command]
fn get_game_config(pool: PoolState, app: AppHandle, id: i32) -> Result<String> {
    let connection = &mut pool.get().unwrap();
    let game = games_table
        .filter(games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let config_path = resolve_relative_path(&app, &game.config_path)?;

    return std::fs::read_to_string(config_path).or_else(|err| Err(err.to_string()));
}

#[tauri::command]
fn update_game_config(pool: PoolState, app: AppHandle, id: i32, config: String) -> Result<()> {
    let connection = &mut pool.get().unwrap();
    let game = games_table
        .filter(games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let config_path = resolve_relative_path(&app, &game.config_path)?;

    return std::fs::write(config_path, config).or_else(|err| Err(err.to_string()));
}

#[tauri::command]
fn get_running_games(running_games: RunningGamesState) -> Vec<i32> {
    return running_games
        .0
        .lock()
        .unwrap()
        .clone()
        .into_keys()
        .collect();
}

#[tauri::command]
fn make_relative_path(app: AppHandle, path: String) -> Result<Option<String>> {
    let base_path = resolve_relative_path(&app, ".")?;

    return Ok(
        pathdiff::diff_paths(path, base_path).and_then(|d| Some(d.to_string_lossy().to_string()))
    );
}

#[tauri::command]
async fn run_game(
    pool: PoolState<'_>,
    running_games: RunningGamesState<'_>,
    app: AppHandle,
    id: i32,
) -> Result<()> {
    if running_games
        .0
        .lock()
        .or_else(|err| Err(err.to_string()))?
        .contains_key(&id)
    {
        return Err(format!("Game with id {} has already started.", id));
    }
    let connection = &mut pool.get().unwrap();
    let game = games_table
        .filter(games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let config_path = resolve_relative_path(&app, &game.config_path)?;
    let mount_path = config_path.parent().ok_or("Failed to find parent path.")?;
    let base_conf_path = resolve_relative_path(&app, "base.conf")?;
    let exec = get_dosbox_exec(&app)?;

    match exec
        .arg(mount_path)
        .arg("-conf")
        .arg(base_conf_path)
        .arg("-conf")
        .arg(config_path)
        .popen()
    {
        Ok(mut popen) => {
            std::thread::spawn(move || {
                let pid = popen
                    .pid()
                    .ok_or("Failed to get PID of running game subprocess.")?;
                println!("Subprocess {} has started.", pid);
                let pool = app.state::<Pool<ConnectionManager<SqliteConnection>>>();
                let running_games_state = app.state::<RunningGames>();
                let mut running_games = running_games_state
                    .0
                    .lock()
                    .or_else(|err| Err(err.to_string()))?;
                running_games.insert(id, (pid, Instant::now()));
                app.emit_all(
                    "running_games_changed",
                    running_games.clone().into_keys().collect::<Vec<i32>>(),
                )
                .or_else(|err| Err(err.to_string()))?;

                match popen.wait() {
                    Ok(exit_status) => {
                        println!(
                            "Subprocess {} has exited with status {:?}.",
                            pid, exit_status
                        );
                        {
                            let (_, a) = running_games
                                .remove(&id)
                                .ok_or("Failed to remove id from running games map.")?;
                            let duration: i32 = Instant::now()
                                .duration_since(a)
                                .as_secs()
                                .try_into()
                                .or(Err("Failed to calculate game run time."))?;
                            let connection = &mut pool.get().unwrap();
                            diesel::update(games_table.filter(games::id.eq(id)))
                                .set(games::run_time.eq(games::run_time + duration))
                                .execute(connection)
                                .or(Err("Failed to update game run time."))?;
                        }
                        app.emit_all(
                            "running_games_changed",
                            running_games.clone().into_keys().collect::<Vec<i32>>(),
                        )
                        .or_else(|err| Err(err.to_string()))?;
                        app.emit_all("games_changed", "run_game")
                            .or_else(|err| Err(err.to_string()))?;
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
async fn run_dosbox(app: AppHandle, params: String) -> Result<String> {
    let exec = get_dosbox_exec(&app)?;
    let capture_data = exec
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
fn create_game(pool: PoolState, app: AppHandle, title: &str, config_path: &str) -> Result<()> {
    let connection = &mut pool.get().unwrap();
    let new_game = NewGame { title, config_path };

    diesel::insert_into(games_table)
        .values(&new_game)
        .execute(connection)
        .expect("Error saving new game.");

    app.emit_all("games_changed", "create_game")
        .or_else(|err| Err(err.to_string()))?;

    return Ok(());
}

#[tauri::command]
fn update_game(
    pool: PoolState,
    app: AppHandle,
    id: i32,
    title: &str,
    reset_run_time: bool,
    config_path: &str,
) -> Result<()> {
    let connection = &mut pool.get().unwrap();
    let query_result;

    if reset_run_time {
        query_result = diesel::update(games_table.filter(games::id.eq(id)))
            .set((
                games::title.eq(title),
                games::config_path.eq(config_path),
                games::run_time.eq(0),
            ))
            .execute(connection);
    } else {
        query_result = diesel::update(games_table.filter(games::id.eq(id)))
            .set((games::title.eq(title), games::config_path.eq(config_path)))
            .execute(connection);
    }

    query_result.or(Err("Failed to update game."))?;

    app.emit_all("games_changed", "update_game")
        .or_else(|err| Err(err.to_string()))?;

    return Ok(());
}

#[tauri::command]
fn get_games(pool: PoolState, search: Option<&str>) -> Result<Vec<Game>> {
    let connection = &mut pool.get().unwrap();
    let mut query = games_table.as_query().into_boxed();

    if search.is_some() {
        query =
            diesel::QueryDsl::filter(query, games::title.like(format!("%{}%", search.unwrap())));
    }

    let games = query
        .load::<Game>(connection)
        .or(Err("Error loading games."))?;

    return Ok(games);
}

#[tauri::command]
fn delete_games(pool: PoolState, app: AppHandle, ids: Vec<i32>) -> Result<()> {
    let connection = &mut pool.get().unwrap();

    diesel::delete(games_table.filter(games::id.eq_any(ids)))
        .execute(connection)
        .or(Err("Error deleting games."))?;

    app.emit_all("games_changed", "delete_games")
        .or_else(|err| Err(err.to_string()))?;

    return Ok(());
}

fn main() {
    dotenvy::dotenv().ok();

    let context = tauri::generate_context!();
    let url =
        tauri::utils::platform::resource_dir(context.package_info(), &tauri::utils::Env::default())
            .and_then(|resource_dir| Ok(resource_dir.join("db.sqlite")))
            .expect("Failed to resolve database URL.");
    let manager = ConnectionManager::<SqliteConnection>::new(url.to_string_lossy());
    let pool = Pool::builder()
        .test_on_check_out(true)
        .build(manager)
        .expect("Could not build connection pool.");
    pool.get()
        .unwrap()
        .run_pending_migrations(MIGRATIONS)
        .expect("Failed to run migrations.");

    tauri::Builder::default()
        .manage(RunningGames(Default::default()))
        .manage(pool)
        .setup(|app| {
            let base_conf_path = resolve_relative_path(&app.handle(), "base.conf").unwrap();
            if !Path::new(&base_conf_path).exists() {
                print!("No base configuration found. Creating a new one...");
                let exec = get_dosbox_exec(&app.handle()).unwrap();
                exec.arg("-c")
                    .arg(format!(
                        "config -writeconf {}",
                        base_conf_path.to_string_lossy()
                    ))
                    .arg("-exit")
                    .join()
                    .unwrap();
                println!(" done.");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            generate_game_config,
            get_game_config,
            update_game_config,
            get_running_games,
            make_relative_path,
            run_game,
            run_dosbox,
            create_game,
            update_game,
            get_games,
            delete_games
        ])
        .run(context)
        .expect("Error while running tauri application.");
}
