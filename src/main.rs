mod cli;

fn main() {
    let command: cli::Cli = clap::Parser::parse();
    dbg!(command);
}
