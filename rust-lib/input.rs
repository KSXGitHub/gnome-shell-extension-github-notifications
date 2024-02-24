use reqwest::{
    blocking::{Client, RequestBuilder},
    header::{ACCEPT, USER_AGENT},
};
use serde::Deserialize;
use std::time::Duration as StdDuration;
use typescript_type_def::TypeDef;

#[derive(Debug, Deserialize, TypeDef)]
pub struct Input {
    pub domain: String,
    pub show_participating_only: bool,
    pub token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout: Option<Duration>,
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
        let Input { token, timeout, .. } = self;
        let url = self.to_url();
        let timeout: StdDuration = timeout.unwrap_or_default().into();
        Client::new()
            .get(url)
            .timeout(timeout)
            .bearer_auth(token)
            .header(
                USER_AGENT,
                "gnome-shell-extension github notification via reqwest",
            )
            .header(ACCEPT, "application/vnd.github+json")
            .header("X-GitHub-Api-Version", "2022-11-28")
    }
}

#[derive(Debug, Clone, Copy, Deserialize, TypeDef)]
#[serde(tag = "unit")]
pub enum Duration {
    #[serde(rename = "s")]
    Sec(f64),
    #[serde(rename = "ms")]
    MilliSec(u64),
    #[serde(rename = "μs")]
    MicroSec(u64),
    #[serde(rename = "ns")]
    NanoSec(u64),
}

impl Default for Duration {
    fn default() -> Self {
        Duration::Sec(5.0)
    }
}

impl From<Duration> for StdDuration {
    fn from(duration: Duration) -> Self {
        match duration {
            Duration::Sec(secs) => StdDuration::from_secs_f64(secs),
            Duration::MilliSec(millis) => StdDuration::from_millis(millis),
            Duration::MicroSec(micros) => StdDuration::from_micros(micros),
            Duration::NanoSec(nanos) => StdDuration::from_nanos(nanos),
        }
    }
}
