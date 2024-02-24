use clap::Parser;
use gnome_shell_extension_github_notifications::app::App;

fn main() {
    App::parse().run()
}
