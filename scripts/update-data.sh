#!/bin/bash

# Script de actualización de datos para ArgenStats
# Uso: ./scripts/update-data.sh [tipo]
# Tipos: all, critical, daily, dollar, ipc, emae, labor, poverty, risk, bcra

set -e

# Configuración
BASE_URL="${VERCEL_URL:-http://localhost:3000}"
API_KEY="${ADMIN_API_KEY}"
LOG_FILE="/tmp/argenstats-update.log"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

# Función para ejecutar actualización
update_service() {
    local service_name="$1"
    local endpoint="$2"
    local timeout="${3:-300}" # 5 minutos por defecto
    
    log "🔄 Actualizando $service_name..."
    
    local start_time=$(date +%s)
    
    if response=$(curl -s -w "\n%{http_code}" \
        -X GET \
        -H "x-api-key: $API_KEY" \
        -H "Content-Type: application/json" \
        --max-time "$timeout" \
        "$BASE_URL$endpoint" 2>/dev/null); then
        
        local http_code=$(echo "$response" | tail -n1)
        local body=$(echo "$response" | head -n -1)
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ "$http_code" -eq 200 ]; then
            log_success "$service_name completado en ${duration}s"
            echo "$body" | jq -r '.message // .recordsProcessed // "N/A"' 2>/dev/null || echo "Actualizado"
            return 0
        else
            log_error "$service_name falló con código HTTP $http_code"
            echo "$body" | jq -r '.error // .message // "Error desconocido"' 2>/dev/null || echo "Error HTTP $http_code"
            return 1
        fi
    else
        log_error "$service_name falló por timeout o error de conexión"
        return 1
    fi
}

# Función para actualización crítica (cada 6 horas)
update_critical() {
    log "🔥 Ejecutando actualización crítica..."
    
    local success_count=0
    local total_count=0
    
    # Dólar (más crítico)
    total_count=$((total_count + 1))
    if update_service "Dólar" "/api/internal/update-dollar" 180; then
        success_count=$((success_count + 1))
    fi
    
    # Riesgo País
    total_count=$((total_count + 1))
    if update_service "Riesgo País" "/api/internal/update-country-risk" 120; then
        success_count=$((success_count + 1))
    fi
    
    # IPC (si es necesario)
    total_count=$((total_count + 1))
    if update_service "IPC" "/api/internal/update-ipc" 300; then
        success_count=$((success_count + 1))
    fi
    
    log "📊 Actualización crítica: $success_count/$total_count servicios exitosos"
}

# Función para actualización diaria
update_daily() {
    log "📊 Ejecutando actualización diaria completa..."
    
    if update_service "Todos los Indicadores" "/api/internal/update-all" 600; then
        log_success "Actualización diaria completada exitosamente"
    else
        log_error "Actualización diaria falló"
        return 1
    fi
}

# Función para actualización completa
update_all() {
    log "🚀 Ejecutando actualización completa..."
    
    local services=(
        "Dólar:/api/internal/update-dollar:180"
        "IPC:/api/internal/update-ipc:300"
        "EMAE:/api/internal/update-emae:300"
        "Mercado Laboral:/api/internal/update-labor-market:300"
        "Pobreza:/api/internal/update-poverty:300"
        "Riesgo País:/api/internal/update-country-risk:120"
        "BCRA:/api/internal/update-bcra:300"
    )
    
    local success_count=0
    local total_count=${#services[@]}
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name endpoint timeout <<< "$service_info"
        if update_service "$name" "$endpoint" "$timeout"; then
            success_count=$((success_count + 1))
        fi
        sleep 2 # Pequeña pausa entre servicios
    done
    
    log "📊 Actualización completa: $success_count/$total_count servicios exitosos"
}

# Función para actualización individual
update_single() {
    local service="$1"
    
    case "$service" in
        "dollar")
            update_service "Dólar" "/api/internal/update-dollar" 180
            ;;
        "ipc")
            update_service "IPC" "/api/internal/update-ipc" 300
            ;;
        "emae")
            update_service "EMAE" "/api/internal/update-emae" 300
            ;;
        "labor")
            update_service "Mercado Laboral" "/api/internal/update-labor-market" 300
            ;;
        "poverty")
            update_service "Pobreza" "/api/internal/update-poverty" 300
            ;;
        "risk")
            update_service "Riesgo País" "/api/internal/update-country-risk" 120
            ;;
        "bcra")
            update_service "BCRA" "/api/internal/update-bcra" 300
            ;;
        *)
            log_error "Servicio desconocido: $service"
            echo "Servicios disponibles: dollar, ipc, emae, labor, poverty, risk, bcra"
            exit 1
            ;;
    esac
}

# Verificar dependencias
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl no está instalado"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq no está instalado, algunas funciones pueden no funcionar correctamente"
    fi
    
    if [ -z "$API_KEY" ]; then
        log_error "ADMIN_API_KEY no está configurado"
        exit 1
    fi
}

# Función principal
main() {
    local update_type="${1:-all}"
    
    log "🚀 Iniciando actualización de datos ArgenStats"
    log "📅 Tipo: $update_type"
    log "🌐 URL Base: $BASE_URL"
    
    check_dependencies
    
    case "$update_type" in
        "critical")
            update_critical
            ;;
        "daily")
            update_daily
            ;;
        "all")
            update_all
            ;;
        "dollar"|"ipc"|"emae"|"labor"|"poverty"|"risk"|"bcra")
            update_single "$update_type"
            ;;
        *)
            log_error "Tipo de actualización no válido: $update_type"
            echo "Tipos disponibles: all, critical, daily, dollar, ipc, emae, labor, poverty, risk, bcra"
            exit 1
            ;;
    esac
    
    log_success "Actualización completada"
}

# Ejecutar función principal
main "$@"
