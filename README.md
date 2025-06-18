# GanaTech - Sistema de Gestión Ganadera

GanaTech es una plataforma web para el monitoreo y gestión de ganado en tiempo real. Permite visualizar la ubicación de los animales, gestionar usuarios y zonas, y simular alertas de seguridad en una granja.

## Tecnologías principales

- **Next.js** (React, TypeScript)
- **MongoDB** (base de datos)
- **TailwindCSS** (estilos)
- **Docker** y **Docker Compose** (despliegue y desarrollo)

---

## ¿Cómo correr el proyecto con Docker?

1. **Clona el repositorio**  
   ```sh
   git clone <url-del-repo>
   cd tp-sl-gestionganadera
   ```

2. **Construye y levanta los servicios**  
   Ejecuta en la raíz del proyecto:
   ```sh
   docker-compose up --build
   ```

   Esto hará lo siguiente:
   - Construirá la imagen de la aplicación Next.js usando el `Dockerfile`.
   - Levantará un contenedor para la app y otro para MongoDB.
   - Poblará automáticamente la base de datos con datos de ejemplo (usuarios, ganado y zonas) usando los scripts `seed-users.ts`, `seed-cattle.ts` y `seed-zones.ts`.

3. **Accede a la aplicación**  
   Una vez que los contenedores estén corriendo, abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ¿Qué sucede al levantar Docker Compose?

- **MongoDB** se inicia y expone el puerto 27017.
- **La aplicación Next.js** se construye y arranca en modo producción en el puerto 3000.
- **Se ejecutan automáticamente los scripts de seed** para poblar la base de datos con datos de ejemplo.
- La app queda lista para usarse, con usuarios y datos de ganado simulados.

---

## Credenciales de acceso de ejemplo

- **Usuario:** admin@ejemplo.com
- **Contraseña:** password

---

## Estructura principal del proyecto

- `/app` - Código de la aplicación Next.js (páginas, API, layouts)
- `/components` - Componentes reutilizables de React
- `/lib` - Lógica de negocio, contextos y utilidades
- `/hooks` - Custom hooks de React
- `/public` - Archivos estáticos
- `/seed-*.ts` - Scripts para poblar la base de datos

---

## Notas

- Si necesitas reiniciar los datos, puedes volver a levantar los contenedores con `docker-compose up --build` o ejecutar manualmente los scripts de seed.
- Para desarrollo local sin Docker, asegúrate de tener Node.js, pnpm y MongoDB instalados.

---

¡Listo! Así puedes levantar y probar GanaTech fácilmente usando