use std::path::{Path, PathBuf};

use super::result::AppResult;

#[cfg(target_os = "linux")]
fn get_exe_path() -> AppResult<PathBuf> {
    let exe_path = match std::env::var("APPIMAGE") {
        Ok(path) => PathBuf::from(path),
        Err(_) => tauri::utils::platform::current_exe()?,
    };

    Ok(exe_path)
}

#[cfg(not(target_os = "linux"))]
fn get_exe_path() -> AppResult<PathBuf> {
    let exe_path = tauri::utils::platform::current_exe()?;

    Ok(exe_path)
}

/// Get currently running binary's directory path.
pub fn exe_dir() -> AppResult<PathBuf> {
    let exe_path = get_exe_path()?;
    let exe_dir_path = exe_path.parent().unwrap();

    return Ok(dunce::simplified(exe_dir_path).to_path_buf());
}

/// Resolves the path relative to currently running binary's path.
pub fn resolve_relative_path<P: AsRef<Path>>(path: P) -> AppResult<PathBuf> {
    let resolved_path_buf = exe_dir()?.join(path);
    let resolved_path = resolved_path_buf.as_path();
    return Ok(dunce::simplified(resolved_path).to_path_buf());
}

/// Get resolved path to settings file.
pub fn settings_file() -> AppResult<PathBuf> {
    return resolve_relative_path("settings.json");
}

/// Get resolved path to base config file. Tries to create this file if it doesn't exist.
pub fn base_config_file() -> AppResult<PathBuf> {
    let base_conf_path = resolve_relative_path("base.conf")?;
    if !Path::new(&base_conf_path).exists() {
        println!("No base configuration found. Creating a new one...");
        let dosbox_exe_path = dosbox_exe_file()?;
        std::process::Command::new(dosbox_exe_path)
            .args([
                "-c",
                &format!("CONFIG -writeconf \"{}\"", base_conf_path.to_string_lossy()),
                "-exit",
            ])
            .output()?;
    }
    return Ok(base_conf_path);
}

/// Get resolved path to themes directory.
pub fn themes_dir() -> AppResult<PathBuf> {
    return resolve_relative_path("themes");
}

/// Get resolved path to games directory.
pub fn games_dir() -> AppResult<PathBuf> {
    return resolve_relative_path("games");
}

#[cfg(target_os = "linux")]
/// Get resolved path to DOSBox executable file. It checks for path existence.
pub fn dosbox_exe_file() -> AppResult<PathBuf> {
    let dosbox_exe_path = resolve_relative_path("dosbox/dosbox")?;
    if !dosbox_exe_path.exists() {
        return Err(super::error::AppError::DOSBoxExeNotFound);
    }
    return Ok(dosbox_exe_path);
}

#[cfg(not(target_os = "linux"))]
/// Get resolved path to DOSBox executable file. It checks for path existence.
pub fn dosbox_exe_file() -> AppResult<PathBuf> {
    let dosbox_exe_path = resolve_relative_path("dosbox\\dosbox.exe")?;
    if !dosbox_exe_path.exists() {
        return Err(super::error::AppError::DOSBoxExeNotFound);
    }
    return Ok(dosbox_exe_path);
}

/// Get resolved path to database file.
pub fn database_file() -> AppResult<PathBuf> {
    return resolve_relative_path("db.sqlite");
}
