use crate::schema::games;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Queryable)]
pub struct Game {
    pub id: Option<i32>,
    pub title: String,
    pub config_path: String,
}

#[derive(Insertable)]
#[diesel(table_name = games)]
pub struct NewGame<'a> {
    pub title: &'a str,
    pub config_path: &'a str,
}
