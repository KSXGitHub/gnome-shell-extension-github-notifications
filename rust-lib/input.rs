use serde::Deserialize;
use typescript_type_def::TypeDef;

#[derive(Debug, Deserialize, TypeDef)]
pub struct Input {
    pub domain: String,
    pub show_participating_only: bool,
    pub handle: String,
    pub token: String,
}
