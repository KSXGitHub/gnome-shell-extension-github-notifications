use gnome_shell_extension_github_notifications::app::{App, ParseError};
use std::{env::args, process::ExitCode};

fn main() -> ExitCode {
    let args: Vec<_> = args().collect();

    let app = match App::parse(&args) {
        Ok(app) => app,
        Err(ParseError::EarlyExit(code)) => return code,
        Err(error) => {
            eprintln!("ERROR: {error}");
            return ExitCode::FAILURE;
        }
    };

    if let Err(error) = app.run() {
        eprintln!("ERROR: {error}");
        return ExitCode::FAILURE;
    }
    ExitCode::SUCCESS
}
