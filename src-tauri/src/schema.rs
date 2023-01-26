// @generated automatically by Diesel CLI.

diesel::table! {
    games (id) {
        id -> Nullable<Integer>,
        title -> Text,
        config_path -> Text,
    }
}

diesel::table! {
    settings (key) {
        key -> Text,
        value -> Text,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    games,
    settings,
);
