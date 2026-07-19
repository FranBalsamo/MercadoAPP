use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::Manager;

const MYSQL_PORT: u16 = 33061;
const BACKEND_PORT: u16 = 8080;

// CREATE_NO_WINDOW: evita que se abra una consola negra al spawnear mysqld/el backend.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(windows)]
fn sin_ventana(comando: &mut Command) -> &mut Command {
    use std::os::windows::process::CommandExt;
    comando.creation_flags(CREATE_NO_WINDOW)
}

#[cfg(not(windows))]
fn sin_ventana(comando: &mut Command) -> &mut Command {
    comando
}

struct ProcesosLocales {
    mysqld: Mutex<Option<Child>>,
    backend: Mutex<Option<Child>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn puerto_abierto(host: &str, puerto: u16) -> bool {
    format!("{host}:{puerto}")
        .parse()
        .ok()
        .map(|direccion| TcpStream::connect_timeout(&direccion, Duration::from_millis(300)).is_ok())
        .unwrap_or(false)
}

fn esperar_puerto(host: &str, puerto: u16, timeout: Duration) -> bool {
    let inicio = Instant::now();
    while inicio.elapsed() < timeout {
        if puerto_abierto(host, puerto) {
            return true;
        }
        std::thread::sleep(Duration::from_millis(400));
    }
    false
}

// Recursos empaquetados junto a la app (mysql portable + backend.exe con su JRE).
// En 'tauri dev' estos archivos no existen: en ese caso no hacemos nada y se asume
// que el backend ya esta corriendo aparte (Docker), como en el flujo de desarrollo actual.
fn buscar_backend_local(app: &tauri::AppHandle) -> Option<(PathBuf, PathBuf)> {
    let recursos = app.path().resource_dir().ok()?;
    let mysql_bin = recursos.join("mysql-portable").join("bin");
    let backend_exe = recursos
        .join("MercadoAppBackend")
        .join("MercadoAppBackend.bin");

    if mysql_bin.join("mysqld.exe").exists() && backend_exe.exists() {
        Some((mysql_bin, backend_exe))
    } else {
        None
    }
}

fn iniciar_backend_local(app: &tauri::AppHandle) {
    let Some((mysql_bin, backend_exe)) = buscar_backend_local(app) else {
        println!("No se encontraron los recursos de MySQL/backend embebidos; se asume backend externo (dev).");
        return;
    };

    let Ok(datos_app) = app.path().app_data_dir() else {
        eprintln!("No se pudo resolver la carpeta de datos de la app.");
        return;
    };

    let mysql_datadir = datos_app.join("mysql-data");
    let mysqld_exe = mysql_bin.join("mysqld.exe");
    let mysql_exe = mysql_bin.join("mysql.exe");

    if !mysql_datadir.exists() {
        println!("Primer arranque: inicializando la base de datos local...");
        if let Err(e) = std::fs::create_dir_all(&mysql_datadir) {
            eprintln!("No se pudo crear el datadir: {e}");
            return;
        }

        let resultado = sin_ventana(&mut Command::new(&mysqld_exe))
            .args([
                "--no-defaults".to_string(),
                format!("--datadir={}", mysql_datadir.display()),
                "--initialize-insecure".to_string(),
            ])
            .status();

        match resultado {
            Ok(estado) if estado.success() => {}
            _ => {
                eprintln!("No se pudo inicializar la base de datos local.");
                return;
            }
        }
    }

    let mysqld_hijo = sin_ventana(&mut Command::new(&mysqld_exe))
        .args([
            "--no-defaults".to_string(),
            format!("--datadir={}", mysql_datadir.display()),
            format!("--port={MYSQL_PORT}"),
            "--bind-address=127.0.0.1".to_string(),
        ])
        .spawn();

    let mysqld_hijo = match mysqld_hijo {
        Ok(hijo) => hijo,
        Err(e) => {
            eprintln!("No se pudo arrancar mysqld: {e}");
            return;
        }
    };

    if !esperar_puerto("127.0.0.1", MYSQL_PORT, Duration::from_secs(30)) {
        eprintln!("mysqld no respondio a tiempo.");
    }

    // Primera vez: crear la base y el usuario que espera el backend.
    let marca_configurada = mysql_datadir.join(".mercadoapp_configurada");
    if !marca_configurada.exists() {
        let sql = "CREATE DATABASE IF NOT EXISTS mercado_db CHARACTER SET utf8mb4; \
                    CREATE USER IF NOT EXISTS 'mercado_user'@'127.0.0.1' IDENTIFIED BY 'mercado_pass'; \
                    GRANT ALL PRIVILEGES ON mercado_db.* TO 'mercado_user'@'127.0.0.1'; \
                    FLUSH PRIVILEGES;";

        let resultado = sin_ventana(&mut Command::new(&mysql_exe))
            .args([
                "--no-defaults",
                "-h",
                "127.0.0.1",
                "-P",
                &MYSQL_PORT.to_string(),
                "-u",
                "root",
                "-e",
                sql,
            ])
            .status();

        if resultado.map(|s| s.success()).unwrap_or(false) {
            let _ = std::fs::write(&marca_configurada, "ok");
        } else {
            eprintln!("No se pudo crear la base/usuario de la app.");
        }
    }

    let backend_hijo = sin_ventana(&mut Command::new(&backend_exe))
        .env("SPRING_PROFILES_ACTIVE", "desktop")
        .spawn();

    let backend_hijo = match backend_hijo {
        Ok(hijo) => hijo,
        Err(e) => {
            eprintln!("No se pudo arrancar el backend: {e}");
            return;
        }
    };

    if !esperar_puerto("127.0.0.1", BACKEND_PORT, Duration::from_secs(60)) {
        eprintln!("El backend no respondio a tiempo.");
    }

    app.manage(ProcesosLocales {
        mysqld: Mutex::new(Some(mysqld_hijo)),
        backend: Mutex::new(Some(backend_hijo)),
    });
}

fn detener_backend_local(app: &tauri::AppHandle) {
    let Some(procesos) = app.try_state::<ProcesosLocales>() else {
        return;
    };

    if let Ok(mut guarda) = procesos.backend.lock() {
        if let Some(mut hijo) = guarda.take() {
            let _ = hijo.kill();
            let _ = hijo.wait();
        }
    }

    if let Ok(mut guarda) = procesos.mysqld.lock() {
        if let Some(mut hijo) = guarda.take() {
            // Apagado prolijo via mysqladmin (para que InnoDB cierre bien sus archivos)
            // en vez de matar el proceso directamente.
            if let Some((mysql_bin, _)) = buscar_backend_local(app) {
                let mysqladmin = mysql_bin.join("mysqladmin.exe");
                if mysqladmin.exists() {
                    let _ = sin_ventana(&mut Command::new(&mysqladmin))
                        .args([
                            "--no-defaults",
                            "-h",
                            "127.0.0.1",
                            "-P",
                            &MYSQL_PORT.to_string(),
                            "-u",
                            "root",
                            "shutdown",
                        ])
                        .status();
                }
            }
            // Por si el apagado prolijo no alcanzo a terminar a tiempo.
            let _ = hijo.wait_timeout_o_matar();
        }
    };
}

trait EsperarOMatar {
    fn wait_timeout_o_matar(&mut self) -> std::io::Result<()>;
}

impl EsperarOMatar for Child {
    fn wait_timeout_o_matar(&mut self) -> std::io::Result<()> {
        let inicio = Instant::now();
        loop {
            if let Ok(Some(_)) = self.try_wait() {
                return Ok(());
            }
            if inicio.elapsed() > Duration::from_secs(10) {
                return self.kill();
            }
            std::thread::sleep(Duration::from_millis(300));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Debe ser el primer plugin registrado. Si ya hay una instancia corriendo,
        // esta segunda invocacion no llega a levantar otro mysqld/backend en paralelo
        // (lo que corrompia el arranque): simplemente enfoca la ventana existente.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(ventana) = app.get_webview_window("main") {
                let _ = ventana.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // 'tauri dev' compila en modo debug y ahora tambien copia los recursos empaquetados
            // (MercadoAppBackend.bin, mysql-portable) dentro de target/debug, asi que sin este
            // chequeo terminaria arrancando el backend nativo local en paralelo a Docker incluso
            // en desarrollo. Solo la app instalada (build release) debe levantar su propio
            // MySQL/backend; en dev siempre se usa el backend de Docker (ver README).
            if !cfg!(debug_assertions) {
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    iniciar_backend_local(&handle);
                });
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                detener_backend_local(window.app_handle());
            }
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
