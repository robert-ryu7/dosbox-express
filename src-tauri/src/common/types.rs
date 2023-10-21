use diesel::r2d2;
use std::{collections, sync, time};
use tauri::State;

pub struct RunningGames(pub(crate) sync::Mutex<collections::HashMap<i32, (u32, time::Instant)>>);

pub type PoolState<'a> = State<'a, r2d2::Pool<r2d2::ConnectionManager<diesel::SqliteConnection>>>;
pub type RunningGamesState<'a> = State<'a, RunningGames>;
