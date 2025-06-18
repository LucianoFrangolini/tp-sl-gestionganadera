#!/bin/bash

CONFIG_FILE="/etc/backup-mongo/config.conf"

# Cargar config
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Archivo de configuración no encontrado: $CONFIG_FILE"
    exit 1
fi

source "$CONFIG_FILE"

# Verifica el config file
if [ -z "$CONTAINER_NAME" ] || [ -z "$BACKUP_DIR" ] || [ -z "$MAX_BACKUPS" ]; then
    echo "Falta info en el config file. Debe tener CONTAINER_NAME, BACKUP_DIR y MAX_BACKUPS"
    exit 1
fi

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mongo-backup-$TIMESTAMP.gz"

# Ejecutar mongodump dentro del contenedor y comprimir
docker exec "$CONTAINER_NAME" mongodump --archive | gzip > "$BACKUP_FILE"
if [ $? -ne 0 ]; then
    echo "Error al crear el backup de MongoDB"
    exit 1
fi

echo "Backup guardado en $BACKUP_FILE"

# Si hay mas backups que lo configurado borra el mas antiguo
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    TO_DELETE=$((BACKUP_COUNT - MAX_BACKUPS))
    ls -1t "$BACKUP_DIR"/*.gz | tail -n "$TO_DELETE" | xargs rm -f
    echo "Se eliminaron $TO_DELETE backups antiguos."
fi
