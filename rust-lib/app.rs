use crate::{
    input::Input,
    output::{Output, ParseResponseError},
};
use clap::Parser;
use derive_more::Display;
use pipe_trait::Pipe;
use std::io::stdin;

#[derive(Debug, Parser)]
#[clap(about = "Binary helper for the GNOME extension to avoid dealing with libsoup complications")]
pub struct App;

#[derive(Debug, Display)]
pub enum AppError {
    #[display("Cannot parse STDIN as JSON: {_0}")]
    ParseJson(serde_json::Error),
    #[display("Failed to fetch notifications: {_0}")]
    Request(reqwest::Error),
    ParseResponse(ParseResponseError),
    #[display("Cannot serialize response data as JSON: {_0}")]
    SerializeResponse(serde_json::Error),
}

impl App {
    pub fn run(self) -> Result<(), AppError> {
        let App = self;

        let output = stdin()
            .pipe(serde_json::from_reader::<_, Input>)
            .map_err(AppError::ParseJson)?
            .get()
            .send()
            .map_err(AppError::Request)?
            .pipe(Output::try_from)
            .map_err(AppError::ParseResponse)?
            .pipe_ref(serde_json::to_string)
            .map_err(AppError::SerializeResponse)?;

        println!("{output}");

        Ok(())
    }
}
