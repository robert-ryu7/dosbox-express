// @generated automatically by Diesel CLI.

diesel::table! {
    games (id) {
        id -> Integer,
        title -> Text,
        config_path -> Text,
        run_time -> Integer,
    }
}
