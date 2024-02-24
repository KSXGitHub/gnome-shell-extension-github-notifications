use derive_more::Display;
use pipe_trait::Pipe;
use reqwest::{blocking::Response, header::LAST_MODIFIED, StatusCode};
use serde::{Deserialize, Serialize};
use typescript_type_def::TypeDef;

#[derive(Debug, Serialize, TypeDef)]
#[serde(tag = "type")]
pub enum Output {
    Success(SuccessValue),
    Unauthorized(UnauthorizedValue),
    OtherFailure(OtherFailureValue),
}

#[derive(Debug, Display)]
pub enum ParseResponseError {
    #[display("Failed to get response text: {_0}")]
    GetResponseText(reqwest::Error),
    #[display("Cannot parse response text as JSON: {_0}")]
    ParseJson(serde_json::Error),
}

impl TryFrom<Response> for Output {
    type Error = ParseResponseError;

    fn try_from(response: Response) -> Result<Self, Self::Error> {
        let status = response.status();
        let status_code = status.as_u16();
        let headers = response.headers();

        if status == StatusCode::UNAUTHORIZED {
            let value = UnauthorizedValue { status_code };
            return value.pipe(Output::Unauthorized).pipe(Ok);
        }

        if !status.is_success() && status != StatusCode::NOT_MODIFIED {
            let response = response
                .text()
                .ok()
                .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok());
            let value = OtherFailureValue {
                status_code,
                response,
            };
            return value.pipe(Output::OtherFailure).pipe(Ok);
        }

        let last_modified = headers
            .get(LAST_MODIFIED)
            .and_then(|x| x.to_str().ok())
            .map(|x| x.to_string());
        let poll_interval = headers
            .get("X-Poll-Interval")
            .and_then(|x| x.to_str().ok())
            .map(|x| x.to_string());
        let response = response
            .text()
            .map_err(ParseResponseError::GetResponseText)?
            .pipe_as_ref(serde_json::from_str::<Vec<Item>>)
            .map_err(ParseResponseError::ParseJson)?;
        let value = SuccessValue {
            status_code,
            last_modified,
            poll_interval,
            response,
        };
        value.pipe(Output::Success).pipe(Ok)
    }
}

#[derive(Debug, Serialize, TypeDef)]
pub struct SuccessValue {
    pub status_code: u16,
    pub response: Vec<Item>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_modified: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub poll_interval: Option<String>,
}

#[derive(Debug, Serialize, TypeDef)]
pub struct UnauthorizedValue {
    pub status_code: u16,
}

#[derive(Debug, Serialize, TypeDef)]
pub struct OtherFailureValue {
    pub status_code: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Serialize, TypeDef)]
pub struct Item {
    pub id: String,
    pub repository: Repository,
    pub subject: Subject,
    pub reason: String,
    pub unread: bool,
    pub updated_at: String,
    pub last_read_at: String,
    pub url: String,
}

#[derive(Debug, Deserialize, Serialize, TypeDef)]
pub struct Repository {
    pub id: u64,
    pub node_id: String,
    pub name: String,
    pub full_name: String,
    pub owner: Owner,
    pub private: bool,
    pub html_url: String,
    pub description: String,
    pub fork: bool,
    pub url: String,
}

#[derive(Debug, Deserialize, Serialize, TypeDef)]
pub struct Owner {
    pub login: String,
    pub id: u64,
    pub node_id: String,
    pub avatar_url: String,
    pub gravatar_id: String,
    pub url: String,
    pub html_url: String,
    pub r#type: String,
    pub site_admin: bool,
}

#[derive(Debug, Deserialize, Serialize, TypeDef)]
pub struct Subject {
    pub title: String,
    pub url: String,
    pub latest_comment_url: String,
    pub r#type: String,
}
