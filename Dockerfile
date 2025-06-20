# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala las dependencias del proyecto
RUN pnpm install --frozen-lockfile

# Copia el resto del código fuente
COPY . .

# Da permisos de ejecución al entrypoint
RUN chmod +x ./entrypoint.sh

# Construye la aplicación Next.js
RUN pnpm build

# Expone el puerto en el que Next.js corre por defecto
EXPOSE 3000

# Usa el entrypoint personalizado
ENTRYPOINT ["sh", "./entrypoint.sh"]