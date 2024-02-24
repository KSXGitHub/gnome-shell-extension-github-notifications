use derive_more::Display;
use pipe_trait::Pipe;
use reqwest::{blocking::Response, header::LAST_MODIFIED, StatusCode};
use serde::{Deserialize, Serialize};
use typescript_type_def::TypeDef;

#[derive(Debug, Serialize, TypeDef)]
#[serde(tag = "type")]
pub enum Output {
    Success(SuccessValue),
    Failure(FailureValue),
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

        if !status.is_success() && status != StatusCode::NOT_MODIFIED {
            let response = response
                .text()
                .ok()
                .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok());
            let value = FailureValue {
                status_code,
                response,
            };
            return value.pipe(Output::Failure).pipe(Ok);
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
pub struct FailureValue {
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
    pub subscription_url: String,
}

#[derive(Debug, Deserialize, Serialize, TypeDef)]
pub struct Repository {
    pub id: i64,
    pub node_id: String,
    pub name: String,
    pub full_name: String,
    pub owner: Owner,
    pub private: bool,
    pub html_url: String,
    pub description: String,
    pub fork: bool,
    pub url: String,
    pub archive_url: String,
    pub assignees_url: String,
    pub blobs_url: String,
    pub branches_url: String,
    pub collaborators_url: String,
    pub comments_url: String,
    pub commits_url: String,
    pub compare_url: String,
    pub contents_url: String,
    pub contributors_url: String,
    pub deployments_url: String,
    pub downloads_url: String,
    pub events_url: String,
    pub forks_url: String,
    pub git_commits_url: String,
    pub git_refs_url: String,
    pub git_tags_url: String,
    pub git_url: String,
    pub issue_comment_url: String,
    pub issue_events_url: String,
    pub issues_url: String,
    pub keys_url: String,
    pub labels_url: String,
    pub languages_url: String,
    pub merges_url: String,
    pub milestones_url: String,
    pub notifications_url: String,
    pub pulls_url: String,
    pub releases_url: String,
    pub ssh_url: String,
    pub stargazers_url: String,
    pub statuses_url: String,
    pub subscribers_url: String,
    pub subscription_url: String,
    pub tags_url: String,
    pub teams_url: String,
    pub trees_url: String,
    pub hooks_url: String,
}

#[derive(Debug, Deserialize, Serialize, TypeDef)]
pub struct Owner {
    pub login: String,
    pub id: i64,
    pub node_id: String,
    pub avatar_url: String,
    pub gravatar_id: String,
    pub url: String,
    pub html_url: String,
    pub followers_url: String,
    pub following_url: String,
    pub gists_url: String,
    pub starred_url: String,
    pub subscriptions_url: String,
    pub organizations_url: String,
    pub repos_url: String,
    pub events_url: String,
    pub received_events_url: String,
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
