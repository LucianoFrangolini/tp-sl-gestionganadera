#!/bin/bash

CONFIG_FILE="/etc/backup-mongo/config.conf"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Archivo de configuración no encontrado: $CONFIG_FILE"
    exit 1
fi

source "$CONFIG_FILE"

if [ -z "$CONTAINER_NAME" ] || [ -z "$BACKUP_DIR" ]; then
    echo "Falta información en el archivo de configuración."
    exit 1
fi

# Buscar el backup mas reciente
LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/*.gz 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "No se encontró ningún backup en $BACKUP_DIR"
    exit 1
fi

echo "Restaurando backup más reciente: $LATEST_BACKUP"

# Restaurar dentro del contenedor
gunzip -c "$LATEST_BACKUP" | docker exec -i "$CONTAINER_NAME" mongorestore --archive --drop

if [ $? -ne 0 ]; then
    echo "Error al restaurar el backup."
    exit 1
fi

echo "Restauración completada exitosamente."
