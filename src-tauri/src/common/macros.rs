#[macro_export]
#[cfg(target_os = "linux")]
macro_rules! shell {
    ($($arg:tt)*) => {{
        std::process::Command::new("sh").arg("-c").arg(format!($($arg)*))
    }}
}

#[macro_export]
#[cfg(target_os = "windows")]
macro_rules! shell {
    ($($arg:tt)*) => {{
        let cmd = format!($($arg)*);
        std::process::Command::new("cmd").arg("/C").raw_arg(format!(r#""{}""#, cmd))
    }}
}
