# Detecta todos los discos (fijos y extraibles, incluyendo pendrives/discos externos ya conectados)
# y genera un docker-compose.override.yml que los monta en el contenedor del backend en /mnt/<letra>.
#
# Corre este script:
#   - Antes de "docker compose up -d" por primera vez.
#   - Cada vez que conectes un disco nuevo (pendrive, disco externo) y quieras poder
#     elegirlo como destino de backup: volve a correr este script y despues
#     "docker compose up -d" para que el contenedor lo vea (Docker no detecta discos
#     nuevos en un contenedor que ya esta corriendo).

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

$discos = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Root -match '^[A-Za-z]:\\$' }

if (-not $discos -or $discos.Count -eq 0) {
    Write-Host "No se detecto ningun disco con letra. No se genero docker-compose.override.yml."
    exit 0
}

$lineas = @("services:", "  backend:", "    volumes:")
foreach ($disco in $discos) {
    $letra = $disco.Name.ToLower()
    $lineas += "      - $($disco.Name):/:/mnt/$letra"
}

$destino = Join-Path $raiz "docker-compose.override.yml"
($lineas -join "`n") | Out-File -FilePath $destino -Encoding utf8 -NoNewline

Write-Host "docker-compose.override.yml generado con $($discos.Count) disco(s): $(($discos.Name -join ', '))"
Write-Host "Ahora corre 'docker compose up -d' (o reinicia el backend) para que el contenedor los vea."
