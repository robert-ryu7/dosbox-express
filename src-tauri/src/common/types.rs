use super::structs::RunningGames;
use diesel::{
    r2d2::{ConnectionManager, Pool},
    SqliteConnection,
};
use tauri::State;

pub type PoolState<'a> = State<'a, Pool<ConnectionManager<SqliteConnection>>>;
pub type RunningGamesState<'a> = State<'a, RunningGames>;
pub type Result<T> = std::result::Result<T, String>;
