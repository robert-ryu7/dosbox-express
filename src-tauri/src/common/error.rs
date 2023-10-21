use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "type")]
pub enum AppError {
    IO {
        message: String,
    },
    Database {
        message: String,
    },
    Tauri {
        message: String,
    },
    TauriApi {
        message: String,
    },
    Poison {
        message: String,
    },
    DatabaseConnection {
        message: String,
    },
    DOSBoxExeNotFound,
    InvalidConfigPath,
    FailedResolvingMountPath,
    FailedToCalculateGameRunTime,
    FailedToRemoveGameFromRunningGames {
        id: i32,
    },
    GameAlreadyStarted {
        id: i32,
    },
    DOSBoxRunFailed {
        exit_status: String,
        stderr: Option<String>,
    },
    GameRunFailed {
        exit_status: String,
        stderr: Option<String>,
    },
}

impl From<std::io::Error> for AppError {
    fn from(value: std::io::Error) -> Self {
        AppError::IO {
            message: value.to_string(),
        }
    }
}

impl From<diesel::result::Error> for AppError {
    fn from(value: diesel::result::Error) -> Self {
        AppError::Database {
            message: value.to_string(),
        }
    }
}

impl From<tauri::Error> for AppError {
    fn from(value: tauri::Error) -> Self {
        AppError::Tauri {
            message: value.to_string(),
        }
    }
}

impl From<tauri::api::Error> for AppError {
    fn from(value: tauri::api::Error) -> Self {
        AppError::TauriApi {
            message: value.to_string(),
        }
    }
}

impl<T> From<std::sync::PoisonError<T>> for AppError {
    fn from(value: std::sync::PoisonError<T>) -> Self {
        AppError::Poison {
            message: value.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn to_string() {
        assert_eq!(
            serde_json::to_string(&AppError::from(std::io::Error::from_raw_os_error(22))).unwrap(),
            "{\"type\":\"IO\",\"message\":\"Invalid argument (os error 22)\"}",
        );
    }
}
