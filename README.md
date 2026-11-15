# Agricultor

Aplicación web en español para conectar el campo y el mercado, construida con
Next.js App Router, TypeScript, Prisma y PostgreSQL (Neon).

## Requisitos

- Node.js compatible con Next.js 16 (verificado localmente con 20.20.2).
- npm.

## Desarrollo

```bash
npm ci
npm run dev
```

La aplicación local se sirve en `http://localhost:3000`.

## Identidad y permisos

- `AUTH_SECRET`: secreto de al menos 32 caracteres usado para proteger las
  sesiones. No lo compartas ni lo guardes en el repositorio.
- `DATABASE_URL`: conexión PostgreSQL de Neon. La aplicación usa el adaptador
  serverless de Neon; configura la URL de conexión agrupada que entrega Neon.
- En Vercel, Better Auth usa los dominios de implementación que entrega el
  sistema (`VERCEL_URL`, `VERCEL_BRANCH_URL` y
  `VERCEL_PROJECT_PRODUCTION_URL`) para limitar los hosts permitidos.

La creación de cuenta usa correo y contraseña. Después de crearla, la persona
inicia sesión explícitamente. Una cuenta nueva comienza como comprador; cada
persona puede agregar los perfiles de productor o comerciante. Asociación y
administrador no se pueden autoasignar. La verificación de correo y la
recuperación de contraseña todavía no están habilitadas; por eso esta primera
entrega no envía correos ni requiere configurar Brevo.

El esquema y sus migraciones están versionados, pero no se aplican
automáticamente. Antes de desplegar una migración, verifica que `DATABASE_URL`
apunte al entorno previsto y que exista un respaldo adecuado.

## Catálogo, pedidos e inventario

Los productores administran sus productos y pueden publicarlos explícitamente.
El catálogo público muestra solo productos publicados con cantidad disponible y
no expone datos personales o de contacto. Categorías, unidades y precio por
unidad en pesos enteros COP siguen siendo hipótesis provisionales descritas en
`PLAN.md`.

Un comprador autenticado puede solicitar una cantidad. La solicitud reserva
inventario en una actualización condicional atómica; el productor propietario
puede aceptarla o rechazarla. Aceptar consume la reserva y rechazar la devuelve
a la disponibilidad. El pedido conserva una instantánea del nombre, unidad y
precio, además del historial básico de estados. No se procesan pagos, facturas,
transporte, notificaciones ni sincronización offline.

## Uso sin conexión (primer corte)

La aplicación registra un service worker propio, sin plugin adicional, y ofrece
una pantalla estática mínima cuando se intenta abrir `/` o `/catalogo` sin red.
Solo esa pantalla genérica se guarda en Cache Storage como respuesta creada por
el propio service worker; no contiene productos, cantidades ni datos de sesión.
La navegación pública siempre intenta consultar al servidor primero.

No se guardan páginas ni respuestas del catálogo, archivos de autenticación,
`/mi-cuenta`, pedidos, APIs ni mutaciones. El indicador sin conexión advierte
que el catálogo/las cantidades pueden no estar actualizados. Se requiere
conexión para solicitar: no se crean borradores, no se envían solicitudes y no
se confirma ninguna operación offline. El primer registro del service worker
requiere conexión; la pantalla mínima queda disponible después de que termine
su instalación. No se implementan sincronización ni resolución de conflictos.

## Comprobaciones

```bash
npm run db:generate
npm run db:validate
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm test
```

`npm run db:generate` genera el cliente Prisma y `npm run db:validate` valida el
esquema sin conectarse a la base. Las pruebas unitarias no requieren
credenciales. La prueba de integración solo se ejecuta con
`TEST_DATABASE_URL` apuntando a una base PostgreSQL local y desechable cuyo nombre
empiece por `agricultor_test` y con el esquema de migraciones ya aplicado; nunca
usa `DATABASE_URL` ni ejecuta migraciones. No apuntes `TEST_DATABASE_URL` a una
base de producción. `npm test` ejecuta la prueba HTTP de producción y necesita
que se corra `npm run build` antes. El build requiere `AUTH_SECRET` y
`DATABASE_URL`, pero no ejecuta consultas ni migraciones.
