# MercadoApp

Aplicación de punto de venta / gestión para comercios (planillas, boletas, clientes, productos, estadísticas), con backend en Spring Boot + MySQL y frontend en React empaquetado como app de escritorio con Tauri.

## Levantar el proyecto (desarrollo local)

```bash
docker compose up -d
cd frontend
npm install
npm run tauri dev
```

El backend queda en `http://localhost:8080`, la base de datos MySQL corre en un contenedor Docker (`docker-compose.yml`), y `npm run tauri dev` abre la app de escritorio real.

## Backups

### Backup manual

Desde **Configuración → Backup**, "Exportar Backup" descarga un dump completo de la base (`.sql`), e "Importar Backup" restaura un archivo previamente exportado (reemplaza todos los datos actuales).

### Backup automático

Se puede activar un backup periódico (cada N horas) que se genera solo, sin intervención del usuario. Desde la app, con el botón "Elegir..." se puede elegir cualquier carpeta de cualquier disco conectado a la PC como destino.

#### Cómo funciona por dentro

El backend corre dentro de un contenedor Docker, que por defecto solo tiene acceso a su propio sistema de archivos aislado. Para que el selector de carpetas de la app pueda apuntar a cualquier disco de Windows (no solo una carpeta fija), se usan dos piezas:

1. **`scripts/refrescar-discos.ps1`**: detecta todos los discos conectados a la PC (fijos y externos, como pendrives o discos externos) y genera `docker-compose.override.yml`, montando cada uno dentro del contenedor en `/mnt/<letra>` (ej. `D:\` → `/mnt/d`). Docker Compose carga automáticamente ese archivo si existe en la raíz del proyecto.

   Correr este script:
   - La primera vez, antes de `docker compose up -d`.
   - Cada vez que conectes un disco nuevo que quieras poder usar como destino de backup (Docker no detecta discos nuevos en un contenedor que ya está corriendo — hay que volver a correr el script y reiniciar la app).

2. **Traducción de rutas en el frontend**: el selector nativo de carpetas devuelve una ruta de Windows (ej. `D:\Backups\Mercado`). El frontend la traduce a la ruta equivalente dentro del contenedor (`/mnt/d/Backups/Mercado`) antes de guardarla, y la vuelve a traducir a formato Windows para mostrarla en pantalla. Esta lógica vive en `frontend/src/components/Vistas/TabBackup.jsx` (`rutaWindowsAContenedor` / `rutaContenedorAWindows`).

#### Variable `BACKUP_HOST_PATH`

Además del selector de carpetas, existe una variable de entorno `BACKUP_HOST_PATH` en el `.env` de la raíz del proyecto, que controla a qué carpeta del host apunta el volumen por defecto del contenedor (`/app/backups`). Por defecto es `./backend_backups`. Cambiarla requiere reiniciar los contenedores (`docker compose up -d`) para que aplique. En la práctica, el selector de carpetas de la app cubre el mismo caso de uso de forma más cómoda; esta variable queda como mecanismo de configuración manual/alternativo.

#### Nota sobre el despliegue final

Todo este mecanismo de "montar discos" existe porque, en desarrollo, el backend corre en Docker (aislado del resto del sistema de archivos de Windows). Si en el futuro el backend pasa a correr nativo (por ejemplo, empaquetado directamente con la app de escritorio en vez de en un contenedor), este paso deja de ser necesario: el backend tendría acceso directo a todos los discos sin tener que montarlos explícitamente.
