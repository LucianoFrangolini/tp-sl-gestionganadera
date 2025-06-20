#!/bin/sh
# filepath: entrypoint.sh
# Variables
MONGO_HOST="mongodb"
MONGO_PORT="27017"
MONGO_DB="gestion_ganadera"
# Esperar a que MongoDB esté listo
echo "Esperando a que MongoDB esté disponible..."
until nc -z "$MONGO_HOST" "$MONGO_PORT"; do
  sleep 1
done

echo "MongoDB está disponible."

# Verificar si la colección 'users' tiene datos
EXISTING_USERS=$(node ./check-db.js)
if [ "$EXISTING_USERS" -gt 0 ]; then
  echo "La base de datos ya tiene datos."
else
  echo "La base de datos está vacía. Ejecutar restore"
fi

# Iniciar la aplicación normalmente
pnpm start
