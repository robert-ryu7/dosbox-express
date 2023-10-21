use diesel::{
    r2d2::{ConnectionManager, PooledConnection},
    SqliteConnection,
};

use super::{error::AppError, result::AppResult, types::PoolState};

pub fn get_connection(
    pool: &PoolState,
) -> AppResult<PooledConnection<ConnectionManager<SqliteConnection>>> {
    return pool.get().map_err(|error| AppError::DatabaseConnection {
        message: error.to_string(),
    });
}
