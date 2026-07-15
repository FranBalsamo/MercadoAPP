# MercadoApp

Aplicación de punto de venta / gestión para comercios (planillas, boletas, clientes, productos, estadísticas), con backend en Spring Boot + MySQL y frontend en React empaquetado como app de escritorio con Tauri.

- **Backend**: `backend/` — Spring Boot 4 (Java 21), Maven.
- **Frontend + app de escritorio**: `frontend/` — React + Vite, empaquetado con Tauri 2.
- **Scripts de apoyo**: `scripts/` — PowerShell, para descargar/empaquetar dependencias.

Hay dos formas totalmente distintas de correr la app, no las mezcles:

| | Desarrollo | App de escritorio instalada |
|---|---|---|
| Base de datos | MySQL en Docker | MySQL portable embebido, sin Docker |
| Backend | `mvnw`/IntelliJ o `npm run tauri dev` | Empaquetado con jpackage, arranca solo |
| Para qué sirve | Programar y probar cambios | Lo que instala/usa el cliente final |

---

## Requisitos previos

Para desarrollar necesitás instalado:

- **Node.js** (v20+; se probó con v24) y npm.
- **Rust** + Cargo (para compilar el lado Tauri). Instalar desde [rustup.rs](https://rustup.rs/).
- **JDK 21** (Eclipse Temurin recomendado). Necesario tanto para correr el backend como para `jpackage` a la hora de generar el instalador.
- **Docker Desktop** — solo para la base de datos en desarrollo (no hace falta para la app final instalada).
- (Windows) Herramientas de compilación de Visual Studio y el runtime de WebView2 — son prerequisitos estándar de Tauri en Windows; si `npm run tauri dev` se queja de esto, seguí las instrucciones que imprime.

---

## Desarrollo

```bash
docker compose up -d          # levanta MySQL en Docker (puerto 3306)
cd frontend
npm install
npm run tauri dev             # compila y abre la app de escritorio real, con hot-reload del frontend
```

El backend corre apuntando a `http://localhost:8080` contra el MySQL de Docker. También podés correr el backend aparte (por ejemplo desde IntelliJ) con `./mvnw spring-boot:run` — por defecto usa el perfil sin especificar, que ya apunta a `localhost:3306` (mismas credenciales que `.env`).

### Perfiles de Spring (`backend/src/main/resources/`)

- **`application.properties`** (default): MySQL en `localhost:3306`, para desarrollar con `docker compose up -d db` levantado.
- **`application-docker.properties`** (perfil `docker`): usado por el backend cuando corre dentro de su propio contenedor Docker (`docker-compose.yml`), apunta a `db:3306` (nombre del servicio).
- **`application-desktop.properties`** (perfil `desktop`): usado por la app de escritorio empaquetada, apunta a `127.0.0.1:33061` (el MySQL portable que arranca la propia app). No se usa en desarrollo normal.

Los tres tienen la zona horaria fijada a `America/Argentina/Buenos_Aires` en la URL JDBC — si el backend corre en un contenedor o proceso con otro `TZ` de sistema, las fechas se van a desalinear (ver el `Dockerfile` y `frontend/src-tauri/src/lib.rs`, que también fuerzan esa zona horaria).

### Estructura relevante

```
backend/                          Spring Boot (Maven)
frontend/                         React (Vite) + Tauri
  src-tauri/                      Lado nativo (Rust) de la app de escritorio
    src/lib.rs                    Orquestación: arranca/apaga MySQL + backend al abrir/cerrar la app
    tauri.conf.json                Configuración de Tauri (icono, recursos empaquetados, etc.)
scripts/                          Scripts de PowerShell (ver más abajo)
vendor/                           MySQL portable descargado (generado, no versionado en git)
backend/dist/                     Backend empaquetado con jpackage (generado, no versionado en git)
```

---

## Generar el instalador de escritorio (build de producción)

Esto arma un `.exe` que instala la app completa en cualquier PC Windows, **sin que esa PC necesite tener Java, MySQL ni Docker instalados** — todo va empaquetado adentro.

**1. Descargar MySQL portable** (solo hace falta la primera vez; ~280MB, no se vuelve a descargar si ya existe):
```powershell
scripts\descargar-mysql-portable.ps1
```

**2. Compilar y empaquetar el backend** (con su propio JRE, vía `jpackage`; hay que repetir este paso cada vez que cambie código del backend):
```powershell
scripts\empaquetar-backend.ps1
```
Genera `backend/dist/jpackage-output/MercadoAppBackend/` (incluye `MercadoAppBackend.bin`, el ejecutable — ver nota abajo sobre por qué no es `.exe`).

**3. Generar el instalador**:
```bash
cd frontend
npm run tauri build
```
Tarda unos minutos (compila Rust en modo release y comprime ~500MB de recursos). El instalador queda en:
```
frontend\src-tauri\target\release\bundle\nsis\MercadoApp_<version>_x64-setup.exe
```

> **Por qué `MercadoAppBackend.bin` y no `.exe`**: Tauri le aplica un procesamiento especial a los archivos `.exe` ubicados en la raíz de un recurso empaquetado (`bundle.resources`), que falla con "Acceso denegado" en Windows. Se lo renombra a `.bin` como workaround — Windows igual lo puede ejecutar invocándolo por su ruta completa (que es justamente lo que hace `src-tauri/src/lib.rs`). El script `empaquetar-backend.ps1` ya hace este renombre automáticamente.

---

## Instalar la app en una PC (usuario final)

1. Copiar `MercadoApp_<version>_x64-setup.exe` a la PC destino y ejecutarlo (doble clic). Para instalación silenciosa: `MercadoApp_<version>_x64-setup.exe /S`.
2. Al abrir la app por primera vez, va a tardar un poco más de lo normal: internamente inicializa la base de datos local antes de mostrar la pantalla principal (se ve una pantalla de "Iniciando...").
3. No hace falta instalar Java, MySQL ni Docker en esa PC — viene todo adentro del instalador.

**Dónde queda todo, por si hay que revisar algo a mano:**
- App instalada: `%LOCALAPPDATA%\MercadoApp\` (incluye el desinstalador, `uninstall.exe`).
- Datos (base de datos MySQL): `%APPDATA%\com.franbalsamo.mercadoapp\mysql-data\` — **esta carpeta sobrevive a una desinstalación/reinstalación**, no se borra sola.

### Actualizar la app a una versión nueva

1. Generar el instalador nuevo (pasos de la sección anterior).
2. Desinstalar la versión vieja: Configuración de Windows → Aplicaciones → MercadoApp → Desinstalar (o correr directamente `%LOCALAPPDATA%\MercadoApp\uninstall.exe`).
3. Instalar el `.exe` nuevo.

Los datos (clientes, boletas, planillas) no se pierden entre medio, porque viven aparte de la carpeta del programa (ver arriba).

### Cómo arranca la app por dentro

Al abrir la app (`frontend/src-tauri/src/lib.rs`):
1. Si es la primera vez (no existe `%APPDATA%\com.franbalsamo.mercadoapp\mysql-data`), inicializa una base MySQL nueva ahí mismo.
2. Arranca `mysqld` (el MySQL portable empaquetado) en el puerto `33061`, solo accesible desde `127.0.0.1`.
3. Arranca el backend (`MercadoAppBackend.bin`) con el perfil `desktop`, apuntando a ese MySQL.
4. Espera a que el backend responda antes de que el frontend deje de mostrar la pantalla de carga.

Al cerrar la ventana, se apagan en orden inverso: primero el backend, después `mysqld` con un apagado prolijo (`mysqladmin shutdown`, no un kill directo) para que no queden datos a medio escribir.

Hay protección de instancia única (`tauri-plugin-single-instance`): si la app ya está abierta y se intenta abrir de nuevo, simplemente enfoca la ventana existente en vez de levantar una segunda base de datos en paralelo (eso corrompía el arranque antes de agregar esta protección).

---

## Backups

### Backup manual

Desde **Configuración → Backup**, "Exportar Backup" descarga un dump completo de la base (`.sql`), e "Importar Backup" restaura un archivo previamente exportado (reemplaza todos los datos actuales).

### Backup automático

Se puede activar un backup periódico (cada N horas) que se genera solo, sin intervención del usuario. Desde la app, con el botón "Elegir..." se puede elegir cualquier carpeta de cualquier disco conectado a la PC como destino.

#### Cómo funciona por dentro (solo en desarrollo, con Docker)

En desarrollo, el backend corre dentro de un contenedor Docker, que por defecto solo tiene acceso a su propio sistema de archivos aislado. Para que el selector de carpetas de la app pueda apuntar a cualquier disco de Windows (no solo una carpeta fija), se usan dos piezas:

1. **`scripts/refrescar-discos.ps1`**: detecta todos los discos conectados a la PC (fijos y externos, como pendrives o discos externos) y genera `docker-compose.override.yml`, montando cada uno dentro del contenedor en `/mnt/<letra>` (ej. `D:\` → `/mnt/d`). Docker Compose carga automáticamente ese archivo si existe en la raíz del proyecto.

   Correr este script:
   - La primera vez, antes de `docker compose up -d`.
   - Cada vez que conectes un disco nuevo que quieras poder usar como destino de backup (Docker no detecta discos nuevos en un contenedor que ya está corriendo — hay que volver a correr el script y reiniciar la app).

2. **Traducción de rutas en el frontend**: el selector nativo de carpetas devuelve una ruta de Windows (ej. `D:\Backups\Mercado`). El frontend la traduce a la ruta equivalente dentro del contenedor (`/mnt/d/Backups/Mercado`) antes de guardarla, y la vuelve a traducir a formato Windows para mostrarla en pantalla. Esta lógica vive en `frontend/src/components/Vistas/TabBackup.jsx` (`rutaWindowsAContenedor` / `rutaContenedorAWindows`).

   En la **app de escritorio instalada** (sin Docker), el backend corre nativo y ya tiene acceso directo a todos los discos de la PC — este mecanismo de "montar discos" no aplica ahí, el selector de carpetas funciona directo contra cualquier ruta de Windows.

#### Variable `BACKUP_HOST_PATH` (solo desarrollo con Docker)

Además del selector de carpetas, existe una variable de entorno `BACKUP_HOST_PATH` en el `.env` de la raíz del proyecto, que controla a qué carpeta del host apunta el volumen por defecto del contenedor (`/app/backups`). Por defecto es `./backend_backups`. Cambiarla requiere reiniciar los contenedores (`docker compose up -d`) para que aplique.

---

## Scripts (`scripts/`)

| Script | Para qué sirve | Cuándo correrlo |
|---|---|---|
| `descargar-mysql-portable.ps1` | Descarga el MySQL portable usado por la app de escritorio | Una vez, antes del primer `tauri build` |
| `empaquetar-backend.ps1` | Compila el backend y lo empaqueta con `jpackage` (JRE incluido) | Cada vez que cambia código del backend, antes de `tauri build` |
| `refrescar-discos.ps1` | Monta todos los discos de la PC en el contenedor Docker del backend | Solo en desarrollo con Docker, para probar el backup a otro disco |
