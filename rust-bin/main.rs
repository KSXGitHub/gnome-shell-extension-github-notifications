use clap::Parser;
use gnome_shell_extension_github_notifications::app::App;
use std::process::ExitCode;

fn main() -> ExitCode {
    if let Err(error) = App::parse().run() {
        eprintln!("ERROR: {error}");
        return ExitCode::FAILURE;
    }
    ExitCode::SUCCESS
}
