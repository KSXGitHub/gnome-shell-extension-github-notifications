use serde::Serialize;
use typescript_type_def::TypeDef;

#[derive(Debug, Serialize, TypeDef)]
#[serde(tag = "type")]
pub enum Output {
    Success(SuccessValue),
    Failure(FailureValue),
}

#[derive(Debug, Serialize, TypeDef)]
pub struct SuccessValue {
    pub status_code: i64,
    pub response: Vec<Item>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_modified: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub poll_interval: Option<String>,
}

#[derive(Debug, Serialize, TypeDef)]
pub struct FailureValue {
    pub status_code: i64,
    pub response: serde_json::Value,
}

#[derive(Debug, Serialize, TypeDef)]
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

#[derive(Debug, Serialize, TypeDef)]
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

#[derive(Debug, Serialize, TypeDef)]
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

#[derive(Debug, Serialize, TypeDef)]
pub struct Subject {
    pub title: String,
    pub url: String,
    pub latest_comment_url: String,
    pub r#type: String,
}
