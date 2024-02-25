use gnome_shell_extension_github_notifications::app::{App, ParseResult};
use std::{env::args, process::ExitCode};

fn main() -> ExitCode {
    let args: Vec<_> = args().collect();

    let app = match App::parse(&args) {
        ParseResult::Continue(app) => app,
        ParseResult::Exit(code) => return code,
        ParseResult::Failure(error) => {
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
