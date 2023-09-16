// @generated automatically by Diesel CLI.

diesel::table! {
    games (id) {
        id -> Nullable<Integer>,
        title -> Text,
        config_path -> Text,
    }
}
