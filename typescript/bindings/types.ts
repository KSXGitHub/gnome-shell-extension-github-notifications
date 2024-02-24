// This file was generated, do not edit

// sane-fmt-ignore-file

export type F64 = number;
export type U64 = number;
export type Duration = (({
    "unit": "s";
} & F64) | ({
    "unit": "ms";
} & U64) | ({
    "unit": "μs";
} & U64) | ({
    "unit": "ns";
} & U64));
export type Input = {
    "domain": string;
    "show_participating_only": boolean;
    "token": string;
    "timeout"?: Duration;
};
export type U16 = number;
export type Owner = {
    "login": string;
    "id": U64;
    "node_id": string;
    "avatar_url": string;
    "gravatar_id": string;
    "url": string;
    "html_url": string;
    "followers_url": string;
    "following_url": string;
    "gists_url": string;
    "starred_url": string;
    "subscriptions_url": string;
    "organizations_url": string;
    "repos_url": string;
    "events_url": string;
    "received_events_url": string;
    "type": string;
    "site_admin": boolean;
};
export type Repository = {
    "id": U64;
    "node_id": string;
    "name": string;
    "full_name": string;
    "owner": Owner;
    "private": boolean;
    "html_url": string;
    "description": string;
    "fork": boolean;
    "url": string;
    "archive_url": string;
    "assignees_url": string;
    "blobs_url": string;
    "branches_url": string;
    "collaborators_url": string;
    "comments_url": string;
    "commits_url": string;
    "compare_url": string;
    "contents_url": string;
    "contributors_url": string;
    "deployments_url": string;
    "downloads_url": string;
    "events_url": string;
    "forks_url": string;
    "git_commits_url": string;
    "git_refs_url": string;
    "git_tags_url": string;
    "git_url": string;
    "issue_comment_url": string;
    "issue_events_url": string;
    "issues_url": string;
    "keys_url": string;
    "labels_url": string;
    "languages_url": string;
    "merges_url": string;
    "milestones_url": string;
    "notifications_url": string;
    "pulls_url": string;
    "releases_url": string;
    "ssh_url": string;
    "stargazers_url": string;
    "statuses_url": string;
    "subscribers_url": string;
    "subscription_url": string;
    "tags_url": string;
    "teams_url": string;
    "trees_url": string;
    "hooks_url": string;
};
export type Subject = {
    "title": string;
    "url": string;
    "latest_comment_url": string;
    "type": string;
};
export type Item = {
    "id": string;
    "repository": Repository;
    "subject": Subject;
    "reason": string;
    "unread": boolean;
    "updated_at": string;
    "last_read_at": string;
    "url": string;
    "subscription_url": string;
};
export type SuccessValue = {
    "status_code": U16;
    "response": (Item)[];
    "last_modified"?: string;
    "poll_interval"?: string;
};
export type UnauthorizedValue = {
    "status_code": U16;
};
export type JSONValue = (null | boolean | number | string | (JSONValue)[] | {
    [key:string]:JSONValue;
});
export type OtherFailureValue = {
    "status_code": U16;
    "response"?: JSONValue;
};
export type Output = (({
    "type": "Success";
} & SuccessValue) | ({
    "type": "Unauthorized";
} & UnauthorizedValue) | ({
    "type": "OtherFailure";
} & OtherFailureValue));
