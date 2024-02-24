use clap::Parser;
use gnome_shell_extension_github_notifications::{input::Input, output::Output};
use pipe_trait::Pipe;
use std::{
    fs::{create_dir_all, File},
    io::Write,
    path::PathBuf,
};
use typescript_type_def::write_definition_file;

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
    let mut output = File::create(output).expect("open output file as write");
    writeln!(output, "// This file was generated, do not edit\n").unwrap();
    writeln!(output, "// sane-fmt-ignore-file\n").unwrap();
    write_definition_file::<_, (Input, Output)>(output, Default::default())
        .expect("write TypeScript definitions to output");
}
