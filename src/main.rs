fn main() {
    let command: gnome_shell_extension_github_notifications::cli::Cli = clap::Parser::parse();
    dbg!(command);
}
