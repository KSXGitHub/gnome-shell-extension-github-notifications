use crate::{input::Input, output::Output};
use std::io::Write;
use typescript_type_def::{write_definition_file, DefinitionFileOptions};

pub fn generate_to<Target>(target: Target)
where
    Target: Write,
{
    let header = concat!(
        "// This file was generated, do not edit\n",
        "\n",
        "// sane-fmt-ignore-file\n",
    );
    write_definition_file::<_, (Input, Output)>(
        target,
        DefinitionFileOptions {
            header: Some(header),
            root_namespace: None,
        },
    )
    .expect("write TypeScript definitions to output");
}
