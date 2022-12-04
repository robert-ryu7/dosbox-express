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
use dosbox_express::schema::games::id;
use dotenvy::dotenv;
use std::env;
use std::sync::Mutex;
use tauri::Manager;
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

#[derive(Clone, serde::Serialize)]
struct GamesChangedPayload {
    reason: String,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
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

    app.emit_all(
        "games_changed",
        GamesChangedPayload {
            reason: "create_game".into(),
        },
    )
    .unwrap();
}

#[tauri::command]
fn get_games(state: tauri::State<'_, Mutex<SqliteConnection>>) -> Vec<Game> {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    games.load::<Game>(connection).expect("Error loading games")
}

#[tauri::command]
fn delete_games(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SqliteConnection>>,
    ids: Vec<i32>,
) -> () {
    let mut connection = state
        .lock()
        .expect("Database connection was not found in state");
    let connection = &mut *connection;

    diesel::delete(games.filter(id.eq_any(ids)))
        .execute(connection)
        .expect("Error deleting games");

    app.emit_all(
        "games_changed",
        GamesChangedPayload {
            reason: "delete_games".into(),
        },
    )
    .unwrap();
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
        .manage(std::sync::Mutex::new(connection))
        .invoke_handler(tauri::generate_handler![
            create_game,
            get_games,
            delete_games
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
