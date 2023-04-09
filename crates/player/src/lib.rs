use tauri::App;
#[cfg(mobile)]
mod mobile;
mod tray;

#[cfg(mobile)]
pub use mobile::*;
pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn is_win_11() -> bool {
    common::is_win_11()
}

#[cfg(mobile)]
#[tauri::command]
fn do_something() {
    println!("Hello from Mobile111!");
}

#[cfg(desktop)]
#[tauri::command]
fn do_something() {
    println!("Hello from Desktop!");
}

#[tauri::command]
fn run() {
    if cfg!(mobile) {
        println!("Hello from Mobile!");
    } else {
        println!("Hello from Desktop!");
    }
}

#[derive(Default)]
pub struct AppBuilder {
    setup: Option<SetupHook>,
}

impl AppBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[must_use]
    pub fn setup<F>(mut self, setup: F) -> Self
    where
        F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup.replace(Box::new(setup));
        self
    }
    pub fn run(self) {
        let setup = self.setup;
        tauri::Builder::default()
            .system_tray(tray::SystemTrayBuilder::build())
            .on_system_tray_event(tray::SystemTrayBuilder::handle_tray_event)
            .setup(move |app| {
                if let Some(setup) = setup {
                    (setup)(app)?;
                }
                Ok(())
            })
            .invoke_handler(tauri::generate_handler![
                greet,
                is_win_11,
                do_something,
                run
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}
