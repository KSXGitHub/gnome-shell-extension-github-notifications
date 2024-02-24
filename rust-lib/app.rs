use clap::Parser;

#[derive(Debug, Parser)]
#[clap(about = "Binary helper for the GNOME extension to avoid dealing with libsoup complications")]
pub struct App;

impl App {
    pub fn run(self) {
        dbg!(self);
    }
}
