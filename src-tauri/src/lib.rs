mod db;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let database_directory = app.path().app_config_dir()?;
            std::fs::create_dir_all(&database_directory)?;
            app.manage(db::SqliteState::new(
                database_directory.join("mathventure-app.sqlite3"),
            ));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::sqlite_begin_transaction,
            db::sqlite_query_transaction,
            db::sqlite_execute_transaction,
            db::sqlite_commit_transaction,
            db::sqlite_rollback_transaction,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MathVenture");
}
