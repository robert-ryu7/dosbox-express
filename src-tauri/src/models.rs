use crate::schema::games;
use crate::schema::settings;
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

#[derive(Serialize, Deserialize, Debug, Queryable)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

#[derive(Insertable, Deserialize)]
#[diesel(table_name = settings)]
pub struct UpsertSetting<'a> {
    pub key: &'a str,
    pub value: &'a str,
}
