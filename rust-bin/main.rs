use clap::Parser;
use gnome_shell_extension_github_notifications::cli::Cli;

fn main() {
    Cli::parse().run()
}
