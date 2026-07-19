# Compila el backend y lo empaqueta como ejecutable standalone (con su propio JRE embebido)
# usando jpackage, para que la app de escritorio no dependa de tener Java instalado.
#
# Salida: backend/dist/jpackage-output/MercadoAppBackend/MercadoAppBackend.bin (+ runtime/, app/)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $raiz "backend"

# Ajustar esta ruta si el JDK 21 esta instalado en otro lado.
$jdk21 = "C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot"
$jpackage = Join-Path $jdk21 "bin\jpackage.exe"

if (-not (Test-Path $jpackage)) {
    Write-Error "No se encontro jpackage en '$jpackage'. Instala un JDK 21 o ajusta la variable `$jdk21` en este script."
    exit 1
}

Push-Location $backendDir
try {
    Write-Host "Compilando el backend (mvnw package)..."
    & ./mvnw -q clean package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Fallo la compilacion del backend." }

    # jpackage-output vive fuera de target/ a proposito: si quedara dentro, un "mvn clean"
    # posterior con el .exe todavia en uso (por ej. corriendo en la app) fallaria al borrarlo.
    $inputDir = Join-Path $backendDir "dist\jpackage-input"
    New-Item -ItemType Directory -Force -Path $inputDir | Out-Null
    Copy-Item (Join-Path $backendDir "target\backend-0.0.1-SNAPSHOT.jar") (Join-Path $inputDir "backend.jar") -Force

    $destDir = Join-Path $backendDir "dist\jpackage-output"
    if (Test-Path $destDir) { Remove-Item -Recurse -Force $destDir }

    Write-Host "Empaquetando con jpackage..."
    & $jpackage `
        --type app-image `
        --input $inputDir `
        --main-jar backend.jar `
        --name MercadoAppBackend `
        --dest $destDir `
        --app-version 0.0.1 `
        --vendor "MercadoApp"

    if ($LASTEXITCODE -ne 0) { throw "Fallo jpackage." }

    # Se renombra a .bin: Tauri le aplica un procesamiento especial a los .exe ubicados
    # en la raiz de un recurso empaquetado (bundle.resources) que falla con "Acceso denegado".
    # Windows puede ejecutar el binario igual sin importar la extension, invocandolo por
    # ruta completa (ver iniciar_backend_local en src-tauri/src/lib.rs).
    $exeOriginal = Join-Path $destDir "MercadoAppBackend\MercadoAppBackend.exe"
    $binFinal = Join-Path $destDir "MercadoAppBackend\MercadoAppBackend.bin"
    Move-Item $exeOriginal $binFinal -Force

    Write-Host "Listo: $binFinal"
    Write-Host "Tamano:"
    (Get-ChildItem $destDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
} finally {
    Pop-Location
}
