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

El esquema y su migración inicial están versionados, pero no se aplican
automáticamente. Antes de desplegar una migración, verifica que `DATABASE_URL`
apunte al entorno previsto y que exista un respaldo adecuado.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm test
```

`npm test` levanta la compilación de producción y comprueba la respuesta HTTP de la portada; ejecuta `npm run build` antes.

El scaffold no necesita credenciales ni servicios externos para estas comprobaciones. No se han configurado todavía base de datos, autenticación ni integraciones.
