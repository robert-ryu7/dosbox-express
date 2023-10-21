use std::path::PathBuf;

use super::result::AppResult;

pub fn read_to_string(path: &PathBuf) -> AppResult<String> {
    return Ok(std::fs::read_to_string(path)?);
}

pub fn write<C: AsRef<[u8]>>(path: &PathBuf, contents: C) -> AppResult<()> {
    return Ok(std::fs::write(path, contents)?);
}
