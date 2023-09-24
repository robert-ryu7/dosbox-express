use super::types::Result;
use dunce::simplified;
use std::path::PathBuf;
use tauri::AppHandle;

pub fn resolve_relative_path(app: &AppHandle, relative_path: &str) -> Result<PathBuf> {
    let resource_dir = app
        .path_resolver()
        .resource_dir()
        .ok_or("Failed to resolve resource directory")?;
    let resolved_path = PathBuf::from(simplified(&resource_dir.join(relative_path)));

    return Ok(resolved_path);
}
