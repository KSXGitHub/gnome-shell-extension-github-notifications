use crate::{
    input::Input,
    output::{Output, ParseResponseError},
};
use derive_more::Display;
use pipe_trait::Pipe;
use std::{io::stdin, process::ExitCode};

#[derive(Debug)]
pub struct App;

#[derive(Debug, Display)]
pub enum ParseError<'a> {
    #[display("Too many CLI arguments")]
    TooManyArguments,
    #[display("Unknown command or flag: {_0}")]
    UnknownArgument(&'a str),
    #[display("early exit")]
    EarlyExit(ExitCode),
}

impl App {
    pub fn parse<'a, Argument, ArgumentList>(argv: &'a ArgumentList) -> Result<Self, ParseError<'a>>
    where
        Argument: AsRef<str> + 'a,
        ArgumentList: AsRef<[Argument]> + 'a,
    {
        if argv.as_ref().len() > 2 {
            return Err(ParseError::TooManyArguments);
        }

        match argv.as_ref().get(1).map(AsRef::as_ref) {
            Some("--help" | "-h" | "help") => {
                println!("Binary helper for the GitHub Notifications GNOME extension");
                println!();
                println!("USAGE: Pipe a JSON object of type Input to stdin of this program and receive result via stdout");
                println!();
                println!("FLAGS:");
                println!("  --help, -h: See this message");
                ExitCode::SUCCESS.pipe(ParseError::EarlyExit).pipe(Err)
            }
            Some(first_arg) => first_arg.pipe(ParseError::UnknownArgument).pipe(Err),
            None => Ok(App),
        }
    }
}

#[derive(Debug, Display)]
pub enum RunError {
    #[display("Cannot parse STDIN as JSON: {_0}")]
    ParseJson(serde_json::Error),
    #[display("Failed to fetch notifications: {_0}")]
    Request(reqwest::Error),
    ParseResponse(ParseResponseError),
    #[display("Cannot serialize response data as JSON: {_0}")]
    SerializeResponse(serde_json::Error),
}

impl App {
    pub fn run(self) -> Result<(), RunError> {
        let App = self;

        let output = stdin()
            .pipe(serde_json::from_reader::<_, Input>)
            .map_err(RunError::ParseJson)?
            .get()
            .send()
            .map_err(RunError::Request)?
            .pipe(Output::try_from)
            .map_err(RunError::ParseResponse)?
            .pipe_ref(serde_json::to_string)
            .map_err(RunError::SerializeResponse)?;

        println!("{output}");

        Ok(())
    }
}
