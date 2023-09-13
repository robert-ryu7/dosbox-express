#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use diesel::associations::HasTable;
use diesel::prelude::*;
use diesel::query_builder::AsQuery;
use diesel::sql_types::Text;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dosbox_express::models::{Game, NewGame, Setting};
use dosbox_express::schema::{games, settings};
use tauri::Manager;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

struct RunningGames(std::sync::Mutex<std::collections::HashMap<i32, u32>>);

struct DbConnection {
    db: std::sync::Mutex<SqliteConnection>,
}

fn resolve_relative_path(
    app: &tauri::AppHandle,
    relative_path: &str,
) -> Result<std::path::PathBuf, String> {
    let resource_dir = app
        .path_resolver()
        .resource_dir()
        .ok_or("Failed to resolve resource directory")?;
    let resolved_path =
        std::path::PathBuf::from(dunce::simplified(&resource_dir.join(relative_path)));

    return Ok(resolved_path);
}

fn get_dosbox_exec(app: &tauri::AppHandle) -> Result<subprocess::Exec, String> {
    if cfg!(windows) {
        let path = resolve_relative_path(&app, "dosbox/dosbox.exe")?;
        return Ok(subprocess::Exec::cmd("cmd").detached().arg("/c").arg(path));
    } else {
        let path = resolve_relative_path(&app, "dosbox/dosbox")?;
        return Ok(subprocess::Exec::cmd(path).detached());
    }
}

#[tauri::command]
fn generate_game_config(executable_path: String) -> Result<String, String> {
    match std::path::PathBuf::from(executable_path.clone()).file_name() {
        Some(executable_file_name) => {
            let mut conf_path_buf = std::path::PathBuf::from(executable_path.clone());
            conf_path_buf.set_extension("conf");
            let conf_path = conf_path_buf.to_string_lossy();

            if !std::path::Path::new(&conf_path_buf).exists() {
                match std::fs::write(
                    &conf_path_buf,
                    format!(
                        "[autoexec]\n@ECHO OFF\nMOUNT C .\nC:\nCLS\n{}",
                        executable_file_name.to_string_lossy()
                    ),
                ) {
                    Ok(_) => {}
                    Err(error) => return Err(error.to_string()),
                }
            }

            return Ok(String::from(conf_path));
        }
        None => return Err("Failed to get executable file name".to_string()),
    }
}

#[tauri::command]
fn get_game_config(
    app: tauri::AppHandle,
    state: tauri::State<DbConnection>,
    id: i32,
) -> Result<String, String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;
    let game = games::dsl::games
        .filter(games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let config_path = resolve_relative_path(&app, &game.config_path)?;

    return std::fs::read_to_string(config_path).or_else(|err| Err(err.to_string()));
}

#[tauri::command]
fn update_game_config(
    app: tauri::AppHandle,
    state: tauri::State<DbConnection>,
    id: i32,
    config: String,
) -> Result<(), String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;
    let game = games::dsl::games
        .filter(games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let config_path = resolve_relative_path(&app, &game.config_path)?;

    return std::fs::write(config_path, config).or_else(|err| Err(err.to_string()));
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
fn make_relative_path(app: tauri::AppHandle, path: String) -> Result<Option<String>, String> {
    let base_path = resolve_relative_path(&app, ".")?;

    return Ok(
        pathdiff::diff_paths(path, base_path).and_then(|d| Some(d.to_string_lossy().to_string()))
    );
}

#[tauri::command]
async fn run_game(
    app: tauri::AppHandle,
    state: tauri::State<'_, DbConnection>,
    id: i32,
) -> Result<(), String> {
    let running_games = app.state::<RunningGames>();
    if running_games.0.lock().unwrap().contains_key(&id) {
        return Err(format!("Game with id {} has already started", id));
    }

    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

    let game = games::dsl::games
        .filter(games::id.eq(id))
        .first::<Game>(connection)
        .or_else(|err| Err(err.to_string()))?;
    let config_path = resolve_relative_path(&app, &game.config_path)?;
    let mount_path = config_path.parent().ok_or("Failed to find parent path")?;
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
async fn run_dosbox(app: tauri::AppHandle, params: String) -> Result<String, String> {
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
fn create_game(
    app: tauri::AppHandle,
    state: tauri::State<DbConnection>,
    title: &str,
    config_path: &str,
) -> Result<(), String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

    let new_game = NewGame { title, config_path };

    diesel::insert_into(games::dsl::games::table())
        .values(&new_game)
        .execute(connection)
        .expect("Error saving new game");

    app.emit_all("games_changed", "create_game").unwrap();

    return Ok(());
}

#[tauri::command]
fn update_game(
    app: tauri::AppHandle,
    state: tauri::State<DbConnection>,
    id: i32,
    title: &str,
    config_path: &str,
) -> Result<(), String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

    diesel::update(games::dsl::games.filter(games::id.eq(id)))
        .set((games::title.eq(title), games::config_path.eq(config_path)))
        .execute(connection)
        .or(Err("Failed to update game"))?;

    app.emit_all("games_changed", "update_game").unwrap();

    Ok(())
}

#[tauri::command]
fn get_games(state: tauri::State<DbConnection>, search: Option<&str>) -> Result<Vec<Game>, String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

    let mut query = games::dsl::games.as_query().into_boxed();

    if search.is_some() {
        query =
            diesel::QueryDsl::filter(query, games::title.like(format!("%{}%", search.unwrap())));
    }

    query
        .load::<Game>(connection)
        .or(Err("Error loading games".to_string()))
}

#[tauri::command]
fn delete_games(
    app: tauri::AppHandle,
    state: tauri::State<DbConnection>,
    ids: Vec<i32>,
) -> Result<(), String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

    diesel::delete(games::dsl::games.filter(games::id.eq_any(ids)))
        .execute(connection)
        .or(Err("Error deleting games"))?;

    app.emit_all("games_changed", "delete_games").unwrap();

    Ok(())
}

#[tauri::command]
fn get_settings(state: tauri::State<DbConnection>) -> Result<Vec<Setting>, String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

    settings::dsl::settings
        .load::<Setting>(connection)
        .or(Err("Error loading settings".to_string()))
}

#[tauri::command]
fn update_settings(
    app: tauri::AppHandle,
    state: tauri::State<DbConnection>,
    changed_settings: Vec<dosbox_express::models::UpsertSetting>,
) -> Result<(), String> {
    let connection = &mut *state
        .db
        .lock()
        .or(Err("Failed to acquire database connection"))?;

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

    let payload = settings::dsl::settings
        .load::<Setting>(connection)
        .or(Err("Error loading settings".to_string()))?;

    app.emit_all("settings_changed", &payload).unwrap();

    Ok(())
}

fn main() {
    dotenvy::dotenv().ok();

    let context = tauri::generate_context!();
    let database_url =
        tauri::utils::platform::resource_dir(context.package_info(), &tauri::utils::Env::default())
            .and_then(|resource_dir| Ok(resource_dir.join("db.sqlite")))
            .unwrap();
    let mut connection = SqliteConnection::establish(&database_url.to_string_lossy()).unwrap();

    connection.run_pending_migrations(MIGRATIONS).unwrap();

    tauri::Builder::default()
        .manage(DbConnection {
            db: std::sync::Mutex::new(connection),
        })
        .manage(RunningGames(Default::default()))
        .setup(|app| {
            let base_conf_path = resolve_relative_path(&app.handle(), "base.conf").unwrap();
            if !std::path::Path::new(&base_conf_path).exists() {
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
                println!("done");
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
            delete_games,
            get_settings,
            update_settings
        ])
        .run(context)
        .expect("error while running tauri application");
}
