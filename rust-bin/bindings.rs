use clap::Parser;
use gnome_shell_extension_github_notifications::bindings::generate_to;
use pipe_trait::Pipe;
use std::{
    fs::{create_dir_all, File},
    path::PathBuf,
};

#[derive(Debug, Parser)]
#[clap(about = "Generate TypeScript definitions for Input and Output")]
struct Args {
    #[clap(help = "Path to the output file")]
    output: PathBuf,
}

fn main() {
    let Args { output } = Parser::parse();
    output
        .parent()
        .expect("get parent dir of output path")
        .pipe(create_dir_all)
        .expect("create parent dir");
    File::create(output)
        .expect("open output file as write")
        .pipe(generate_to);
}
