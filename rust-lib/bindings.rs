use crate::{input::Input, output::Output};
use std::io::Write;
use text_block_macros::text_block_fnl;
use typescript_type_def::{write_definition_file, DefinitionFileOptions};

pub fn generate_to<Target>(target: Target)
where
    Target: Write,
{
    let header = text_block_fnl! {
        "// This file was generated, do not edit"
        ""
        "// sane-fmt-ignore-file"
    };
    write_definition_file::<_, (Input, Output)>(
        target,
        DefinitionFileOptions {
            header: Some(header),
            root_namespace: None,
        },
    )
    .expect("write TypeScript definitions to output");
}
