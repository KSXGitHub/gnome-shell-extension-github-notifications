use reqwest::{
    blocking::{Client, RequestBuilder},
    header::{ACCEPT, USER_AGENT},
};
use serde::Deserialize;
use typescript_type_def::TypeDef;

#[derive(Debug, Deserialize, TypeDef)]
pub struct Input {
    pub domain: String,
    pub show_participating_only: bool,
    pub handle: String,
    pub token: String,
}

impl Input {
    fn to_url(&self) -> String {
        let Input {
            domain,
            show_participating_only,
            ..
        } = self;
        let mut url = format!("https://api.{domain}/notifications");
        if *show_participating_only {
            url += "?participating=1";
        }
        url
    }

    pub fn get(&self) -> RequestBuilder {
        let Input { token, .. } = self;
        let url = self.to_url();
        Client::new()
            .get(url)
            .bearer_auth(token)
            .header(
                USER_AGENT,
                "gnome-shell-extension github notification via reqwest",
            )
            .header(ACCEPT, "application/vnd.github+json")
            .header("X-GitHub-Api-Version", "2022-11-28")
    }
}
