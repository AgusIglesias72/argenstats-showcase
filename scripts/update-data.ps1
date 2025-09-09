# Script de actualización de datos para ArgenStats (PowerShell)
# Uso: .\scripts\update-data.ps1 [tipo]
# Tipos: all, critical, daily, dollar, ipc, emae, labor, poverty, risk, bcra

param(
    [Parameter(Position=0)]
    [ValidateSet("all", "critical", "daily", "dollar", "ipc", "emae", "labor", "poverty", "risk", "bcra")]
    [string]$UpdateType = "all"
)

# Configuración
$BaseUrl = if ($env:VERCEL_URL) { "https://$($env:VERCEL_URL)" } else { "http://localhost:3000" }
$ApiKey = $env:ADMIN_API_KEY
$LogFile = "$env:TEMP\argenstats-update.log"

# Función para logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    switch ($Level) {
        "SUCCESS" { Write-Host "✅ $logMessage" -ForegroundColor Green }
        "ERROR" { Write-Host "❌ $logMessage" -ForegroundColor Red }
        "WARNING" { Write-Host "⚠️ $logMessage" -ForegroundColor Yellow }
        default { Write-Host "🔄 $logMessage" -ForegroundColor Blue }
    }
    
    Add-Content -Path $LogFile -Value $logMessage
}

# Función para ejecutar actualización
function Update-Service {
    param(
        [string]$ServiceName,
        [string]$Endpoint,
        [int]$TimeoutSeconds = 300
    )
    
    Write-Log "Actualizando $ServiceName..."
    
    $startTime = Get-Date
    
    try {
        $headers = @{
            "x-api-key" = $ApiKey
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method GET -Headers $headers -TimeoutSec $TimeoutSeconds
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Log "$ServiceName completado en $([math]::Round($duration, 2))s" "SUCCESS"
        
        if ($response.recordsProcessed) {
            Write-Log "Registros procesados: $($response.recordsProcessed)"
        }
        
        return $true
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Log "$ServiceName falló en $([math]::Round($duration, 2))s: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Función para actualización crítica
function Update-Critical {
    Write-Log "Ejecutando actualización crítica..."
    
    $successCount = 0
    $totalCount = 0
    
    # Dólar
    $totalCount++
    if (Update-Service "Dólar" "/api/internal/update-dollar" 180) {
        $successCount++
    }
    
    # Riesgo País
    $totalCount++
    if (Update-Service "Riesgo País" "/api/internal/update-country-risk" 120) {
        $successCount++
    }
    
    # IPC
    $totalCount++
    if (Update-Service "IPC" "/api/internal/update-ipc" 300) {
        $successCount++
    }
    
    Write-Log "Actualización crítica: $successCount/$totalCount servicios exitosos"
}

# Función para actualización diaria
function Update-Daily {
    Write-Log "Ejecutando actualización diaria completa..."
    
    if (Update-Service "Todos los Indicadores" "/api/internal/update-all" 600) {
        Write-Log "Actualización diaria completada exitosamente" "SUCCESS"
    } else {
        Write-Log "Actualización diaria falló" "ERROR"
        return $false
    }
}

# Función para actualización completa
function Update-All {
    Write-Log "Ejecutando actualización completa..."
    
    $services = @(
        @{ Name = "Dólar"; Endpoint = "/api/internal/update-dollar"; Timeout = 180 },
        @{ Name = "IPC"; Endpoint = "/api/internal/update-ipc"; Timeout = 300 },
        @{ Name = "EMAE"; Endpoint = "/api/internal/update-emae"; Timeout = 300 },
        @{ Name = "Mercado Laboral"; Endpoint = "/api/internal/update-labor-market"; Timeout = 300 },
        @{ Name = "Pobreza"; Endpoint = "/api/internal/update-poverty"; Timeout = 300 },
        @{ Name = "Riesgo País"; Endpoint = "/api/internal/update-country-risk"; Timeout = 120 },
        @{ Name = "BCRA"; Endpoint = "/api/internal/update-bcra"; Timeout = 300 }
    )
    
    $successCount = 0
    $totalCount = $services.Count
    
    foreach ($service in $services) {
        if (Update-Service $service.Name $service.Endpoint $service.Timeout) {
            $successCount++
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Log "Actualización completa: $successCount/$totalCount servicios exitosos"
}

# Función para actualización individual
function Update-Single {
    param([string]$Service)
    
    switch ($Service) {
        "dollar" { Update-Service "Dólar" "/api/internal/update-dollar" 180 }
        "ipc" { Update-Service "IPC" "/api/internal/update-ipc" 300 }
        "emae" { Update-Service "EMAE" "/api/internal/update-emae" 300 }
        "labor" { Update-Service "Mercado Laboral" "/api/internal/update-labor-market" 300 }
        "poverty" { Update-Service "Pobreza" "/api/internal/update-poverty" 300 }
        "risk" { Update-Service "Riesgo País" "/api/internal/update-country-risk" 120 }
        "bcra" { Update-Service "BCRA" "/api/internal/update-bcra" 300 }
        default {
            Write-Log "Servicio desconocido: $Service" "ERROR"
            Write-Log "Servicios disponibles: dollar, ipc, emae, labor, poverty, risk, bcra"
            exit 1
        }
    }
}

# Verificar dependencias
function Test-Dependencies {
    if (-not $ApiKey) {
        Write-Log "ADMIN_API_KEY no está configurado" "ERROR"
        exit 1
    }
    
    try {
        $testResponse = Invoke-WebRequest -Uri "$BaseUrl/api/test-redis" -Method GET -TimeoutSec 10
        if ($testResponse.StatusCode -ne 200) {
            Write-Log "No se puede conectar al servidor: $BaseUrl" "WARNING"
        }
    }
    catch {
        Write-Log "No se puede conectar al servidor: $BaseUrl" "WARNING"
    }
}

# Función principal
function Main {
    Write-Log "Iniciando actualización de datos ArgenStats"
    Write-Log "Tipo: $UpdateType"
    Write-Log "URL Base: $BaseUrl"
    
    Test-Dependencies
    
    switch ($UpdateType) {
        "critical" { Update-Critical }
        "daily" { Update-Daily }
        "all" { Update-All }
        default { Update-Single $UpdateType }
    }
    
    Write-Log "Actualización completada" "SUCCESS"
}

# Ejecutar función principal
Main
