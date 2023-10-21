#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod common;

use std::os::windows::process::CommandExt;

use common::{
    db::get_connection,
    error::AppError,
    result::AppResult,
    types::{PoolState, RunningGames, RunningGamesState},
};
use diesel::prelude::*;
use diesel::query_builder::AsQuery;
use diesel::r2d2::ConnectionManager;
use diesel::r2d2::Pool;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dosbox_express::models::{Game, NewGame};
use dosbox_express::schema::games;
use dosbox_express::schema::games::dsl::games as games_table;
use std::path::PathBuf;
use std::time::Instant;
use std::{path::Path, process::Output};
use tauri::Manager;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

#[tauri::command]
fn get_games_directory_path() -> AppResult<String> {
    return Ok(common::path::games_dir()?.to_string_lossy().to_string());
}

#[tauri::command]
fn generate_game_config(executable_path: String) -> AppResult<String> {
    let executable_path_buf = PathBuf::from(executable_path);
    let executable_file_name = executable_path_buf
        .file_name()
        .ok_or(AppError::InvalidConfigPath)?;
    let mut conf_path_buf = executable_path_buf.clone();
    conf_path_buf.set_extension("conf");
    if !Path::new(&conf_path_buf).exists() {
        let contents = format!(
            "[autoexec]\n@ECHO OFF\nMOUNT C .\nC:\nCLS\n{}\nEXIT",
            executable_file_name.to_string_lossy()
        );
        common::file::write(&conf_path_buf, contents)?;
    }
    return Ok(conf_path_buf.to_string_lossy().to_string());
}

#[tauri::command]
fn open_base_config(app: tauri::AppHandle) -> AppResult<()> {
    let path = common::path::base_config_file()?
        .to_string_lossy()
        .to_string();
    return Ok(tauri::api::shell::open(&app.shell_scope(), &path, None)?);
}

#[tauri::command]
fn get_base_config() -> AppResult<String> {
    let path = common::path::base_config_file()?;
    return common::file::read_to_string(&path);
}

#[tauri::command]
fn get_settings() -> AppResult<Option<String>> {
    let settings_path = common::path::settings_file()?;
    if !settings_path.exists() {
        return Ok(None);
    }
    let contents = common::file::read_to_string(&settings_path)?;
    return Ok(Some(contents));
}

#[tauri::command]
fn set_settings(text: String) -> AppResult<()> {
    let path = common::path::settings_file()?;
    common::file::write(&path, text)?;
    return Ok(());
}

#[tauri::command]
fn get_theme_filenames() -> AppResult<Vec<String>> {
    let theme_dir_files = tauri::api::dir::read_dir(common::path::themes_dir()?, false)
        .unwrap_or_default()
        .into_iter()
        .filter(|entry| match entry.path.extension() {
            Some(ext) => ext == "css",
            None => false,
        })
        .filter_map(|entry| entry.name)
        .collect();
    return Ok(theme_dir_files);
}

#[tauri::command]
fn get_theme(filename: String) -> AppResult<String> {
    let path = common::path::themes_dir()?.join(filename);
    return Ok(common::file::read_to_string(&path)?);
}

#[tauri::command]
fn get_running_games(running_games: RunningGamesState) -> AppResult<Vec<i32>> {
    return Ok(running_games.0.lock()?.clone().into_keys().collect());
}

#[tauri::command]
fn make_relative_path(path: String) -> AppResult<Option<String>> {
    return Ok(pathdiff::diff_paths(path, common::path::exe_dir()?)
        .and_then(|d| Some(d.to_string_lossy().to_string())));
}

#[tauri::command]
fn get_config(pool: PoolState, id: i32) -> AppResult<String> {
    let connection = &mut get_connection(&pool)?;
    let game = games_table
        .filter(games::id.eq(id))
        .first::<Game>(connection)?;

    return Ok(common::file::read_to_string(
        &common::path::resolve_relative_path(&game.config_path)?,
    )?);
}

#[tauri::command]
fn update_game_config(pool: PoolState, id: i32, config: String) -> AppResult<()> {
    let connection = &mut get_connection(&pool)?;
    let game = games_table
        .filter(games::id.eq(id))
        .first::<Game>(connection)?;
    let config_path = common::path::resolve_relative_path(&game.config_path)?;

    return Ok(common::file::write(&config_path, config)?);
}

#[tauri::command]
async fn run_game(
    pool: PoolState<'_>,
    running_games: RunningGamesState<'_>,
    app: tauri::AppHandle,
    id: i32,
) -> AppResult<()> {
    if running_games.0.lock()?.contains_key(&id) {
        return Err(AppError::GameAlreadyStarted { id })?;
    }
    let connection = &mut get_connection(&pool)?;
    let game = games_table
        .filter(games::id.eq(id))
        .first::<Game>(connection)?;
    let config_path = common::path::resolve_relative_path(&game.config_path)?;
    let mount_path = config_path
        .parent()
        .ok_or(AppError::FailedResolvingMountPath)?;
    let base_conf_path = common::path::base_config_file()?;
    let dosbox_exe_path = common::path::dosbox_exe_file()?;

    let child = shell!(
        r#""{}" "{}" -conf "{}" -conf "{}""#,
        dosbox_exe_path.display(),
        mount_path.display(),
        base_conf_path.display(),
        config_path.display()
    )
    .current_dir(mount_path)
    .stderr(std::process::Stdio::piped())
    .spawn()?;

    std::thread::spawn(move || -> () {
        let result = || -> AppResult<Output> {
            let pid = child.id();
            println!("Child process {} has started.", pid);
            let pool = app.state::<Pool<ConnectionManager<SqliteConnection>>>();
            let running_games_state = app.state::<RunningGames>();
            let mut running_games = running_games_state.0.lock()?;
            running_games.insert(id, (pid, Instant::now()));
            app.emit_all(
                "running_games_changed",
                running_games.clone().into_keys().collect::<Vec<i32>>(),
            )?;

            let output = child.wait_with_output()?;

            println!(
                "Child process {} has exited with status {:?}.",
                pid, output.status
            );
            let (_, a) = running_games
                .remove(&id)
                .ok_or(AppError::FailedToRemoveGameFromRunningGames { id })?;
            let duration: i32 = Instant::now()
                .duration_since(a)
                .as_secs()
                .try_into()
                .or(Err(AppError::FailedToCalculateGameRunTime))?;
            let connection = &mut get_connection(&pool)?;
            diesel::update(games_table.filter(games::id.eq(id)))
                .set(games::run_time.eq(games::run_time + duration))
                .execute(connection)?;
            app.emit_all(
                "running_games_changed",
                running_games.clone().into_keys().collect::<Vec<i32>>(),
            )?;
            app.emit_all("games_changed", "run_game")?;

            return Ok(output);
        };

        match result() {
            Ok(output) => {
                if !output.status.success() {
                    let stderr = String::from_utf8(output.stderr).ok();
                    app.emit_all(
                        "error",
                        AppError::GameRunFailed {
                            exit_status: format!("{:?}", output.status),
                            stderr: stderr,
                        },
                    )
                    .unwrap();
                }
            }
            Err(error) => app.emit_all("error", error).unwrap(),
        }
    });

    return Ok(());
}

#[tauri::command]
async fn run_dosbox(params: String) -> AppResult<String> {
    let dosbox_exe_path = common::path::dosbox_exe_file()?;
    let capture_data = shell!(r#""{}" {}"#, dosbox_exe_path.display(), params)
        .stderr(std::process::Stdio::piped())
        .output()?;

    match capture_data.status.success() {
        true => return Ok(String::from_utf8(capture_data.stdout).unwrap_or_default()),
        false => {
            return Err(AppError::DOSBoxRunFailed {
                exit_status: format!("{:?}", capture_data.status),
                stderr: String::from_utf8(capture_data.stderr).ok(),
            })
        }
    }
}

#[tauri::command]
fn create_game(
    pool: PoolState,
    app: tauri::AppHandle,
    title: &str,
    config_path: &str,
) -> AppResult<()> {
    let connection = &mut get_connection(&pool)?;
    let new_game = NewGame { title, config_path };

    diesel::insert_into(games_table)
        .values(&new_game)
        .execute(connection)?;

    app.emit_all("games_changed", "create_game")?;

    return Ok(());
}

#[tauri::command]
fn update_game(
    pool: PoolState,
    app: tauri::AppHandle,
    id: i32,
    title: &str,
    reset_run_time: bool,
    config_path: &str,
) -> AppResult<()> {
    let connection = &mut get_connection(&pool)?;
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

    query_result?;

    app.emit_all("games_changed", "update_game")?;

    return Ok(());
}

#[tauri::command]
fn get_games(pool: PoolState, search: Option<&str>) -> AppResult<Vec<Game>> {
    let connection = &mut get_connection(&pool)?;
    let mut query = games_table.as_query().into_boxed();

    if search.is_some() {
        query =
            diesel::QueryDsl::filter(query, games::title.like(format!("%{}%", search.unwrap())));
    }

    let games = query.load::<Game>(connection)?;

    return Ok(games);
}

#[tauri::command]
fn delete_games(pool: PoolState, app: tauri::AppHandle, ids: Vec<i32>) -> AppResult<()> {
    let connection = &mut get_connection(&pool)?;

    diesel::delete(games_table.filter(games::id.eq_any(ids))).execute(connection)?;

    app.emit_all("games_changed", "delete_games")?;

    return Ok(());
}

fn main() {
    dotenvy::dotenv().ok();

    let context = tauri::generate_context!();
    let url = common::path::database_file().expect("Failed to resolve database URL.");
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
        .invoke_handler(tauri::generate_handler![
            get_games_directory_path,
            generate_game_config,
            open_base_config,
            get_base_config,
            get_config,
            get_settings,
            set_settings,
            get_theme_filenames,
            get_theme,
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
