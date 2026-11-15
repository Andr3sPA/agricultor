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

## Productos e inventario

El corte inicial permite que un productor autenticado guarde y edite sus propios
registros privados: nombre, categoría, cantidad, unidad, precio por unidad en
pesos enteros COP y municipio/localidad. La cantidad determina el estado:
cero significa agotado y un valor mayor significa disponible. Las categorías,
unidades y el significado del precio por unidad son hipótesis provisionales
documentadas en `PLAN.md`. Los productos no son públicos; no hay pedidos,
decremento por ventas, fotos ni integración con Cloudinary en este corte.

## Comprobaciones

```bash
npm run db:generate
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm test
```

`npm run db:generate` genera el cliente Prisma sin conectarse a la base.
Las pruebas unitarias de roles, validación y autorización de productos no
requieren credenciales. `npm test` ejecuta la prueba HTTP de producción y necesita
que se corra `npm run build` antes. El build requiere `AUTH_SECRET` y
`DATABASE_URL`, pero no ejecuta consultas ni migraciones.
