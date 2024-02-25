// This file was generated, do not edit

// sane-fmt-ignore-file

export type F64 = number;
export type U64 = number;
export type Duration = ({
    "unit": "s";
    "amount": F64;
} | {
    "unit": "ms";
    "amount": U64;
} | {
    "unit": "μs";
    "amount": U64;
} | {
    "unit": "ns";
    "amount": U64;
});
export type Input = {
    "domain": string;
    "show_participating_only": boolean;
    "token": string;
    "timeout"?: Duration;
};
export type U16 = number;
export type Owner = {
    "login"?: string;
    "id"?: U64;
    "node_id"?: string;
    "avatar_url"?: string;
    "gravatar_id"?: string;
    "url"?: string;
    "html_url"?: string;
    "type"?: string;
    "site_admin"?: boolean;
};
export type Repository = {
    "id"?: U64;
    "node_id"?: string;
    "name"?: string;
    "full_name"?: string;
    "owner"?: Owner;
    "private"?: boolean;
    "html_url"?: string;
    "description"?: string;
    "fork"?: boolean;
    "url"?: string;
};
export type Subject = {
    "title"?: string;
    "url"?: string;
    "latest_comment_url"?: string;
    "type"?: string;
};
export type Item = {
    "id"?: string;
    "repository"?: Repository;
    "subject"?: Subject;
    "reason"?: string;
    "unread"?: boolean;
    "updated_at"?: string;
    "last_read_at"?: string;
    "url"?: string;
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
