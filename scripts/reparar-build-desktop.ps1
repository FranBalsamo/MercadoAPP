# Arregla los problemas mas comunes que dejan "npm run tauri dev" / "npm run tauri build"
# trabados o fallando con "Acceso denegado", generalmente por un build anterior interrumpido
# a mitad de camino (Ctrl+C, cierre de la terminal, etc.). Es seguro correrlo las veces que
# haga falta: solo toca cache/artefactos de build, nunca el codigo fuente ni los datos de la app.
#
# Que hace:
#   1. Saca el atributo de solo lectura de los artefactos empaquetados del backend
#      (backend/dist/jpackage-output) y de la carpeta target/ de Tauri — un build interrumpido
#      puede dejar ahi una copia "de solo lectura" que Windows se niega a sobrescribir despues,
#      con "Acceso denegado" (pasa incluso corriendo como administrador).
#   2. Si la carpeta del proyecto se movio o se copio a otra ubicacion desde el ultimo build,
#      borra frontend/src-tauri/target por completo: Cargo graba rutas absolutas en sus archivos
#      de fingerprint/dependencias, y si la carpeta cambio de lugar ese cache queda "roto" (tipicamente
#      con un error como "failed to read plugin permissions: ... El sistema no puede encontrar la
#      ruta especificada"), porque intenta leer archivos que genero en la ruta vieja.
#   3. Borra la copia local de NSIS que Tauri descarga solo (%LOCALAPPDATA%\tauri\NSIS): si esa
#      descarga se corta a mitad de camino queda un makensis.exe corrupto que cuelga el build.
#      Se vuelve a descargar sola, completa, en el proximo "npm run tauri build".
#   4. Si vendor/mysql-8.4.10-winx64.zip esta descargado pero no extraido, lo extrae.
#
# Uso:
#   scripts\reparar-build-desktop.ps1

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

Write-Host "== Reparando el entorno de build de la app de escritorio =="

# 1. Atributo de solo lectura en artefactos de build. Se hace antes que el paso 2 porque un
# target/ movido de otra ubicacion puede tener archivos de solo lectura (de un build anterior
# interrumpido), y eso haria fallar el borrado completo del paso 2 con "Acceso denegado".
$carpetasARevisar = @(
    (Join-Path $raiz "backend\dist\jpackage-output"),
    (Join-Path $raiz "frontend\src-tauri\target")
)

foreach ($carpeta in $carpetasARevisar) {
    if (-not (Test-Path $carpeta)) { continue }
    $soloLectura = Get-ChildItem $carpeta -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.IsReadOnly }
    if ($soloLectura.Count -gt 0) {
        Write-Host "  Sacando atributo de solo lectura a $($soloLectura.Count) archivo(s) en $carpeta"
        $soloLectura | ForEach-Object { $_.IsReadOnly = $false }
    } else {
        Write-Host "  OK (sin archivos de solo lectura): $carpeta"
    }
}

# 2. Cache de Rust (target/) con rutas absolutas de otra ubicacion del proyecto. Se detecta
# comparando contra un marcador con la ruta usada la ultima vez; si no coincide (o target/ existe
# pero nunca se registro una ruta), se borra target/ entero para que Cargo lo regenere desde cero.
$targetDir = Join-Path $raiz "frontend\src-tauri\target"
$marcadorRuta = Join-Path $raiz "frontend\src-tauri\.ultima-ruta-build.txt"
if (Test-Path $targetDir) {
    $rutaAnterior = if (Test-Path $marcadorRuta) { (Get-Content $marcadorRuta -Raw).Trim() } else { $null }
    if ($rutaAnterior -and $rutaAnterior -ne $raiz) {
        Write-Host "  El proyecto se movio de '$rutaAnterior' a '$raiz': borrando frontend\src-tauri\target (cache de Rust con rutas de la ubicacion vieja)..."
        Remove-Item -Path $targetDir -Recurse -Force
        Write-Host "  Borrado. Se va a recompilar todo Rust desde cero en el proximo build (tarda varios minutos)."
    }
}
Set-Content -Path $marcadorRuta -Value $raiz -NoNewline

# 3. Cache de NSIS: se borra siempre que se corre este script, es chica (~7MB) y se
# vuelve a descargar sola en el proximo build.
$nsisDir = Join-Path $env:LOCALAPPDATA "tauri\NSIS"
if (Test-Path $nsisDir) {
    Remove-Item -Path $nsisDir -Recurse -Force
    Write-Host "  Cache de NSIS eliminada ($nsisDir) -> se re-descarga sola en el proximo build."
} else {
    Write-Host "  No habia cache de NSIS para borrar."
}

# 4. MySQL portable: extraer si falta
$vendorDir = Join-Path $raiz "vendor"
$mysqlZip = Join-Path $vendorDir "mysql-8.4.10-winx64.zip"
$mysqlExtraido = Join-Path $vendorDir "mysql-8.4.10-winx64"
if ((Test-Path $mysqlZip) -and -not (Test-Path (Join-Path $mysqlExtraido "bin\mysqld.exe"))) {
    Write-Host "  Extrayendo $mysqlZip ..."
    Expand-Archive -Path $mysqlZip -DestinationPath $vendorDir -Force
    Write-Host "  Extraccion completa."
} elseif (Test-Path (Join-Path $mysqlExtraido "bin\mysqld.exe")) {
    Write-Host "  OK: MySQL portable ya esta extraido."
} else {
    Write-Host "  Aviso: no se encontro $mysqlZip. Corre scripts\descargar-mysql-portable.ps1 primero."
}

Write-Host "`nListo. Proba de nuevo 'npm run tauri dev' o 'npm run tauri build'."
