use crate::{input::Input, output::Output};
use std::io::Write;
use typescript_type_def::{write_definition_file, DefinitionFileOptions};

pub fn generate_to<Target>(mut target: Target)
where
    Target: Write,
{
    writeln!(target, "// This file was generated, do not edit\n").unwrap();
    writeln!(target, "// sane-fmt-ignore-file\n").unwrap();
    write_definition_file::<_, (Input, Output)>(
        target,
        DefinitionFileOptions {
            header: None,
            root_namespace: None,
        },
    )
    .expect("write TypeScript definitions to output");
}
