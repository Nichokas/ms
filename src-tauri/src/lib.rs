use std::env::var;
use unofficial_appwrite::client::ClientBuilder;
use unofficial_appwrite::error::Error;
use serde_json::{json, Map};
use unofficial_appwrite::id::ID;
use unofficial_appwrite::services::server::databases::Databases;
use unofficial_appwrite::query::Query;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct PlayerScore {
    position: usize,
    name: String,
    score: i32,
}


async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
  if let Some(update) = app.updater()?.check().await? {
    let mut downloaded = 0;

    // alternatively we could also call update.download() and update.install() separately
    update
      .download_and_install(
        |chunk_length, content_length| {
          downloaded += chunk_length;
          println!("downloaded {downloaded} from {content_length:?}");
        },
        || {
          println!("download finished");
        },
      )
      .await?;

    println!("update installed");
    app.restart();
  }

  Ok(())
}

#[tauri::command]
async fn upload_score() {
    println!("score");
}

#[tauri::command]
async fn get_score() -> Result<Vec<PlayerScore>, ()> {
    let client = ClientBuilder::default()
        .set_endpoint("https://cloud.appwrite.io/v1")
        .expect("err")
        .set_project("674af771001c9bd25d19")
        .expect("err")
        .set_key("standard_ad3cf058d54a57c685319274fac4af65edd611d74e3467718b9920b1a6a773bfcdead6833575c93beec5b8b3966a68c617b600c1b46e94277d9709c0f12e17de34d5c2ff03383eb45ff8280d6d7242d5ccf0cddd27c8c115e7884b6bea669fbec368bb24b8e304466d013090f79e7097ea04e0933f98dddeb846f6800e1b4c9a")
        .expect("err")
        .build()
        .expect("err");

    let queries = vec![
        Query::order_asc("score"),
        Query::limit(5)
    ];

    let col_list = Databases::list_documents(
        &client,
        "674affe00035c269732a",
        "674affff003d3a0b1c72",
        Some(queries)
    ).await.map_err(|_| ())?;

    // Convertir los documentos a nuestra estructura simplificada
    let scores: Vec<PlayerScore> = col_list.documents
        .into_iter()
        .enumerate()
        .map(|(index, doc)| {
            let data = doc.data;
            PlayerScore {
                position: index + 1, // Posición empezando desde 1
                name: data.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
                score: data.get("score").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
            }
        })
        .collect();

    Ok(scores)
}

use tauri_plugin_updater::UpdaterExt;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        update(handle).await.unwrap();
      });
      Ok(())
    })
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![upload_score, get_score])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}