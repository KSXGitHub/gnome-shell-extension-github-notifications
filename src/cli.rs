use clap::Parser;

#[derive(Debug, Parser)]
#[clap(about = "Binary helper for the GNOME extension to avoid dealing with libsoup complications")]
pub enum Cli {
    #[clap(about = "Fetch notifications from GitHub")]
    FetchNotifications,
}
