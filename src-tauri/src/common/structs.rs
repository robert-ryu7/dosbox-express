use std::{collections::HashMap, sync::Mutex, time::Instant};

pub struct RunningGames(pub(crate) Mutex<HashMap<i32, (u32, Instant)>>);
