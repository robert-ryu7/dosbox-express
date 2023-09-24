use super::path::resolve_relative_path;

pub fn get_dosbox_exec(app: &tauri::AppHandle) -> Result<subprocess::Exec, String> {
    if cfg!(windows) {
        let path = resolve_relative_path(&app, "dosbox/dosbox.exe")?;
        return Ok(subprocess::Exec::cmd("cmd").detached().arg("/c").arg(path));
    } else {
        let path = resolve_relative_path(&app, "dosbox/dosbox")?;
        return Ok(subprocess::Exec::cmd(path).detached());
    }
}
