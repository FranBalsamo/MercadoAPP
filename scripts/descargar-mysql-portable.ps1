# Descarga el MySQL Community Server portable (ZIP "noinstall") que se empaqueta junto
# a la app de escritorio como sidecar de Tauri. No se versiona en git por su tamano (~280MB).
#
# Se guarda en vendor/mysql-8.4.10-winx64.zip (ignorado por git).

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$destinoDir = Join-Path $raiz "vendor"
$destinoZip = Join-Path $destinoDir "mysql-8.4.10-winx64.zip"

if (Test-Path $destinoZip) {
    Write-Host "Ya existe $destinoZip, no se vuelve a descargar."
    exit 0
}

New-Item -ItemType Directory -Force -Path $destinoDir | Out-Null

$url = "https://cdn.mysql.com/archives/mysql-8.4/mysql-8.4.10-winx64.zip"
Write-Host "Descargando MySQL 8.4.10 portable desde $url ..."
Invoke-WebRequest -Uri $url -OutFile $destinoZip

Write-Host "Descarga completa: $destinoZip"
