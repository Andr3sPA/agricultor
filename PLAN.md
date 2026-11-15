# Plan de plataforma agrícola

## Objetivo y alcance

Construir una plataforma de comercialización agrícola para comunidades rurales de Colombia, dirigida a personas con distintos niveles de experiencia tecnológica y con conectividad limitada. El producto debe facilitar que productores publiquen cosechas, que compradores encuentren oferta y soliciten pedidos, y que comerciantes, asociaciones y administradores participen con permisos claros.

Este documento conserva el roadmap y registra el estado real del repositorio. La primera entrega de identidad implementa solo una base de cuenta y permisos; no implementa el producto agrícola completo. Pagos en línea, logística, precios de referencia, facturación y verificación de identidad no se consideran requisitos confirmados; deben definirse antes de incorporarlos.

## Estado observado del repositorio

- El repositorio ya tiene un scaffold de Next.js App Router, TypeScript, Tailwind CSS y ESLint, una portada neutral en español, scripts de lint/tipos y CI para lint, tipos y build.
- `.gitignore` excluye `.env*`. Las credenciales se revisaron sin mostrar ni registrar valores; no se ha conectado a Neon ni a servicios de correo o imágenes.
- Se inició la primera parte de identidad/permisos: autenticación por correo y contraseña, sesiones persistidas, roles básicos y migración versionada. Esta entrega no implementa perfiles comerciales, asociaciones, catálogo, pedidos ni sincronización offline.

## Progreso de fundaciones e identidad

- **Hecho:** scaffold mínimo de Next.js 16.4.6, React 19.3, TypeScript, Tailwind CSS 4 y ESLint; scripts `lint` y `typecheck`; página inicial provisional en español sin flujos de producto; documentación de desarrollo básica; CI de lint, tipos y build.
- **Hecho:** dependencias instaladas limpiamente con `npm ci` y una caché npm aislada; se regeneró el lockfile tras detectar que el primer intento había dejado entradas transitivas incompletas.
- **Verificado desde una instalación limpia:** `npm ci`, `npm run lint`, `npm run typecheck` y `npm run build` finalizan correctamente; el build de Next.js 16.4.6 prerenderiza `/` y `/_not-found` como rutas estáticas.
- **Hecho en una rama de seguimiento basada en `main`:** prueba smoke con `node:test` que inicia el servidor de producción y valida el estado HTTP, el idioma español y el texto provisional de la portada; CI ejecuta `npm test` después del build.
- **Verificado en la rama de seguimiento:** `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` pasan; la prueba smoke pasa (1/1). La portada es únicamente un scaffold técnico provisional, no el producto agrícola terminado.
- **Nota técnica:** se mantiene ESLint 9.39.5 porque los plugins incluidos por `eslint-config-next` aceptan ESLint hasta la versión 9 y npm marca ESLint 9 como fuera de soporte. La versión 10 actual produce pares de dependencias inválidos con esos plugins; revisar la actualización del stack cuando Next la soporte o aprobar otro linter.
- **Pendiente por decisiones/configuración:** confirmar la gestión de acceso/credenciales a Neon y las decisiones de producto antes de añadir Prisma, esquema o migraciones. No se configura ni prueba Neon, Cloudinary o Brevo en esta fase.
- **Seguimiento de variables (solo nombres):** la coordinación informó `AUTH_SECRET`, `API_KEY_BREVO`, `DATABASE_URL`, `BREVO_SENDER_EMAIL`, `COUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME` y `CLOUDINARY_URL` a partir del adjunto; no se leyó ni copió el archivo ni sus valores. `COUDINARY_API_KEY` parece tener una errata frente a `CLOUDINARY`; confirmar el nombre correcto antes de documentarlo como configuración o integrarlo. No se ha añadido ninguna de estas variables a la aplicación.
- **Hipótesis provisional por falta de respuesta:** se asume para el diseño que una cuenta puede tener varios roles (por ejemplo, productor y comprador). Es solo una hipótesis flexible para revisar, no una decisión confirmada ni autorización para definir permisos, autenticación o flujos.
- **Siguiente bloqueo de implementación:** antes de crear modelos de cuenta/rol o autenticación, falta confirmar proveedor/mecanismo de autenticación y las reglas de asignación, alcance y administración de roles. También falta confirmar el acceso/configuración de Neon para esquema y migraciones. La portada no da por terminado el resto del producto.

## Requisitos

### Funcionales recibidos

- Perfiles y permisos para productores, compradores, comerciantes, administradores y asociaciones.
- Publicación y gestión de productos agrícolas e inventario; catálogo y búsqueda para compradores; flujo de pedidos.
- Enlaces compartibles para productos/ofertas y distribución por redes sociales.
- Notificaciones a usuarios.
- Interfaz en español natural de Colombia, priorizando teléfonos y personas con baja familiaridad digital.
- Funcionamiento útil en condiciones de conectividad intermitente.

### No funcionales recibidos

- Una experiencia mobile-first, de baja fricción y bajo consumo de datos.
- Seguridad y privacidad adecuadas para datos personales, roles e inventario.
- Pruebas unitarias, de integración, autorización, concurrencia, funcionamiento offline y E2E.
- Next.js App Router, TypeScript y Tailwind son tecnologías posibles; Neon PostgreSQL y Prisma son el punto de partida; Brevo y Cloudinary son servicios disponibles esperados. La selección y configuración final debe verificarse antes de implementarlos.

### Decisiones de producto pendientes

Resolver con las personas responsables del producto, antes de cerrar los flujos y el esquema:

1. ¿Se confirma que un usuario pueda tener varios roles? ¿Quién puede crear asociaciones, aprobar su verificación y administrar sus miembros?
2. ¿Los comerciantes publican oferta propia, compran, o ambas cosas? ¿Qué operaciones puede hacer cada rol?
3. ¿Qué unidades, cantidades mínimas, disponibilidad por temporada y ubicaciones se necesitan?
4. ¿Cuándo se compromete el inventario: al solicitar, al aceptar un pedido o en otro momento? ¿Qué estados y reglas de cancelación aplican?
5. ¿Cómo se acuerdan entrega/recogida, precio final, contacto y pago? No se presume pago en línea.
6. ¿Qué información de un producto o productor puede ver cualquier persona que abra un enlace compartido?
7. ¿Qué canales y tipos de notificación son prioritarios? ¿Se requiere correo, SMS, WhatsApp u otro canal?
8. ¿Qué restricciones de privacidad, conservación de datos y tratamiento de información personal deben adoptarse para Colombia?
9. ¿Qué alcance offline se espera y qué dispositivos/navegadores deben soportarse?

## Arquitectura propuesta

### Stack inicial

- **Aplicación web:** Next.js App Router + TypeScript, con vistas renderizadas en servidor para el catálogo público y pantallas autenticadas para operaciones. Tailwind CSS para una interfaz adaptable y consistente.
- **Backend:** Server Actions para mutaciones iniciadas por formularios y componentes de la aplicación, con autorización y validación en servidor. Route Handlers para webhooks de proveedores, endpoints explícitos de integración y vistas/operaciones compartibles que necesiten una URL HTTP estable. No se recomienda agregar tRPC inicialmente: para un cliente web del mismo Next.js añadiría una capa y contratos duplicados sin una necesidad confirmada de varios clientes/API pública.
- **Persistencia:** PostgreSQL administrado en Neon; Prisma como ORM y migraciones versionadas. Usar conexión apropiada para ejecución serverless y conexión directa para tareas de migración, según la configuración recomendada vigente de Neon/Prisma.
- **Imágenes:** Cloudinary para carga y transformación de imágenes. La autorización de carga debe emitirse desde el servidor; limitar formatos, tamaño y cantidad, y persistir identificadores/URLs y metadatos necesarios, nunca secretos del proveedor en el navegador.
- **Correo/notificaciones:** Brevo como opción de entrega de correo transaccional, desacoplada mediante un servicio interno. Registrar estado e intentos de entrega sin guardar más datos personales de los necesarios.
- **Despliegue:** Vercel está previsto, con Next.js y Neon, entornos separados, migraciones controladas y secretos en el gestor de configuración del entorno.

### Límites y flujo de datos

El navegador se comunica con la aplicación Next.js; el servidor valida sesión, rol, entrada y reglas de negocio antes de consultar Prisma/PostgreSQL o invocar proveedores. El cliente no recibe acceso directo a la base de datos ni secretos de Brevo/Cloudinary. Las operaciones de inventario y pedido que dependan entre sí se realizan en transacciones de base de datos. Webhooks se validan y procesan de forma idempotente.

### Estructura de carpetas propuesta

La estructura es una guía para iniciar el repositorio vacío; no representa archivos ya existentes.

```text
src/
  app/
    (public)/                 # Inicio, catálogo y páginas compartidas
    (auth)/                   # Inicio/cierre de sesión
    (dashboard)/              # Áreas según permisos
    api/                      # Route Handlers y webhooks
  components/                 # Componentes de interfaz reutilizables
  features/
    auth/
    catalog/
    inventory/
    orders/
    notifications/
    organizations/
  lib/
    auth/                     # Sesión y políticas de autorización
    db/                       # Cliente Prisma
    validation/               # Esquemas de entrada
    integrations/              # Adaptadores Brevo y Cloudinary
  server/
    actions/                  # Mutaciones de interfaz
    services/                 # Casos de uso y reglas de negocio
prisma/
  schema.prisma
  migrations/
tests/
  unit/
  integration/
  e2e/
```

Mantener la lógica de negocio en servicios del servidor reutilizables por Server Actions, Route Handlers y pruebas; no duplicar reglas en componentes.

## Modelo de datos inicial

Entidades candidatas, sujetas a las decisiones pendientes:

- **User**, **Role** y **UserRole**: identidad, estado de cuenta y asignación de uno o más roles con restricciones en servidor.
- **ProducerProfile**: datos públicos/comerciales necesarios para la oferta, separados de los datos privados de cuenta.
- **Organization** (asociación) y **OrganizationMember**: asociación y relación de usuarios con ella; definir si existen permisos jerárquicos.
- **Product**: nombre, descripción, categoría, unidad, origen/ubicación aproximada, imágenes y estado de publicación.
- **InventoryItem** o inventario asociado al producto/oferta: cantidad disponible, unidad, versión y marcas de actualización.
- **Order** y **OrderItem**: comprador, vendedor, líneas con cantidad y copia inmutable del precio/unidad acordados, estado y marcas de tiempo.
- **InventoryMovement**: registro auditable de ajustes, reservas, confirmaciones y liberaciones.
- **ShareLink** (o slug público): referencia opaca/estable a contenido publicable, con vigencia o revocación si el producto lo requiere.
- **Notification** y **NotificationAttempt**: destinatario, tipo, referencia, estado e intentos acotados de entrega.
- **AuditEvent**: operaciones sensibles, actor y entidad afectada, sin incluir credenciales o contenido innecesario.

Aplicar claves foráneas, restricciones de cantidades y estados, índices para filtros del catálogo/pedidos y marcas de tiempo. Evitar almacenar información personal que no se requiera para operar. No añadir tablas de pagos, transporte o facturación hasta confirmar esos casos.

## Identidad, autorización y flujo de pedidos

- Better Auth administra creación, lectura, vencimiento y revocación de sesiones en servidor; el adaptador Prisma las persiste en PostgreSQL. La política y el alcance son provisionales y requieren revisión.
- Comprobar autorización en cada caso de uso/Server Action/Route Handler; ocultar botones en la interfaz es solo una ayuda de UX, no control de acceso.
- Definir reglas explícitas por rol y organización, y probar tanto acceso permitido como denegado. No confiar en un `role` enviado por el cliente.
- Propuesta inicial de pedido: el comprador envía una solicitud; el vendedor la acepta o rechaza. La aceptación confirma el inventario de forma atómica; si ya no hay stock suficiente, rechazar la confirmación y devolver un resultado explicable. El pedido conserva una instantánea del precio y la unidad mostrados al solicitar. Esta política requiere aprobación del producto.
- Usar clave de idempotencia o protección equivalente para reintentos de creación/confirmación; limitar transacciones y revisar conflictos de escritura. Definir cancelaciones y liberación de inventario junto con el flujo final.

## Experiencia mobile-first y modo offline

- Empezar por pantallas de teléfono, controles grandes, navegación corta, etiquetas comprensibles, formularios con pocos campos por paso, mensajes de error accionables y formatos locales. Validar comprensión con usuarios rurales; “español colombiano” no debe basarse en estereotipos.
- Reducir transferencia inicial: paginación, carga diferida de imágenes, tamaños responsivos y compresión; evitar descargar catálogos completos.
- Propuesta realista: PWA con recursos estáticos/cache de aplicación y, si el producto lo aprueba, lectura de páginas/productos consultados recientemente. Permitir preparar borradores locales y sincronizarlos cuando vuelva la red, mostrando claramente pendiente/error/confirmado.
- No afirmar que pedidos, stock o disponibilidad están confirmados mientras el dispositivo está desconectado. Las escrituras se validan en servidor al sincronizar; resolver conflictos de manera explícita y nunca sobrescribir cambios de inventario silenciosamente. Determinar retención, borrado y protección de borradores locales.
- No almacenar credenciales, datos sensibles o tokens de sesión en cachés accesibles a scripts; excluir respuestas privadas y mutaciones del caché offline hasta diseñar controles y pruebas específicos.

## Enlaces, imágenes e integraciones

- Los enlaces compartibles deben abrir una vista pública intencionalmente limitada, con metadatos de vista previa (Open Graph) adecuados y sin exponer datos de contacto/personales salvo autorización expresa.
- Validar que el objeto siga publicado y que la persona propietaria pueda revocar/actualizar su publicación. Usar identificadores no enumerables cuando corresponda y protección contra scraping/abuso.
- Cloudinary: validar autorización, tipo MIME real, tamaño y límites; usar transformaciones para miniaturas y formatos adecuados; evitar contenido ejecutable.
- Brevo: preferir correo transaccional solo después de confirmar canal, consentimiento y contenido. Implementar reintentos acotados y observabilidad; no exponer llaves del proveedor.
- Definir comportamiento degradado ante indisponibilidad de proveedores: el pedido principal no debe perderse por una falla de notificación o carga de vista previa.
- No se proponen integraciones de pago ni conexiones de prueba en esta fase.

## Seguridad, privacidad y operación

- Validación de entradas en servidor, consultas parametrizadas mediante Prisma y controles de acceso por objeto (por ejemplo, impedir modificar producto/pedido de otro productor).
- Cookies seguras y protección CSRF según el mecanismo de sesión; protección contra abuso con límites de solicitudes en rutas de autenticación, escritura, búsqueda y creación de enlaces.
- Validar firma/origen de webhooks, hacerlos idempotentes y guardar solo el resultado necesario.
- No incluir secretos en el repositorio, documentos, logs, errores al usuario o código del cliente. Mantener `.env` local ignorado y gestionar secretos fuera del repositorio; documentar únicamente nombres de variables cuando sean confirmados.
- Minimización, acceso, corrección y eliminación/retención de datos deben definirse con responsables de privacidad conforme a obligaciones aplicables en Colombia; este plan no sustituye revisión legal.
- Registrar eventos operativos y de auditoría sin contraseñas, tokens, datos de pago ni contenido privado innecesario. Definir respaldo, restauración, alertas, retención y respuesta a incidentes antes del lanzamiento.

## Estrategia de pruebas y calidad

- **Unitarias:** validadores, permisos, transiciones de pedido, cálculo de cantidades y reglas de publicación.
- **Integración:** servicios contra PostgreSQL de prueba, restricciones de esquema, transacciones y persistencia de pedidos/inventario; adaptadores de integraciones con dobles controlados, sin llamadas reales a proveedores en CI.
- **Autorización:** matriz rol/operación/propietario/organización; cubrir accesos prohibidos y acceso directo a endpoints.
- **Concurrencia:** dos solicitudes simultáneas que compiten por las últimas unidades; el resultado no puede vender más stock que el disponible. Cubrir idempotencia y reintentos.
- **Offline/sincronización:** recursos cacheables, lectura sin red según alcance aprobado, borradores, reconexión, duplicados, conflictos y estados visibles para el usuario.
- **E2E:** recorridos principales de productor (publicar/actualizar oferta), comprador (buscar/compartir/solicitar pedido) y vendedor (aceptar/rechazar), incluyendo teléfono y permisos.
- **Calidad continua:** TypeScript estricto, lint, formato y migraciones reproducibles; CI ejecuta validaciones y pruebas sin secretos de producción.
- Probar rendimiento y accesibilidad en dispositivos modestos y red limitada. Definir métricas y umbrales concretos tras acordar dispositivos, volúmenes y nivel de servicio.

## Fases verificables

Los nombres bajo “áreas/archivos” son destinos propuestos porque no hay estructura de aplicación existente.

| Fase | Trabajo y dependencias | Áreas/archivos propuestos | Criterios de aceptación verificables |
|---|---|---|---|
| 0. Descubrimiento y decisiones | Validar roles, flujo y estados de pedido, unidades, publicación, pagos/contacto, offline, canales, datos y criterios de lanzamiento. Depende de responsables de producto y usuarios de prueba. | `PLAN.md`; especificación aprobada en la ubicación que acuerde el equipo. | Cada decisión de producto pendiente tiene responsable y resolución; alcance y exclusiones quedan aprobados antes de cerrar esquema y UX. |
| 1. Fundaciones técnicas | Crear Next.js/TypeScript/Tailwind, calidad/CI, configuración segura, Prisma/Neon, migraciones iniciales y entornos. | `package.json`, `src/app/`, `src/lib/db/`, `prisma/`, configuración de CI y variables documentadas sin valores. | Aplicación ejecuta en desarrollo; CI valida tipos/lint/build; migraciones se aplican y revierten en una base no productiva cuando se aprueben configuración y esquema; no hay secretos en el repositorio. |
| 2. Cuenta, perfiles y permisos | **Primer corte implementado:** cuenta con correo/contraseña, sesión, ruta privada, roles globales y auto-adopción limitada. **Pendiente:** perfiles comerciales, membresías/organizaciones, aprobación de roles privilegiados y matriz de permisos final. | `src/features/auth/`, `src/lib/auth/`, modelos Prisma y pruebas de autorización. | Pruebas demuestran denegación de roles privilegiados al input público; página privada redirige sin sesión; roles se consultan en servidor. La aprobación de producto sigue pendiente. |
| 3. Productos e inventario | Crear/editar/publicar ofertas, fotos, disponibilidad, unidades y catálogo consultable con filtros y paginación. Requiere identidad/permisos. | `src/features/catalog/`, `src/features/inventory/`, `src/server/services/`, integraciones Cloudinary y pruebas. | Productor autorizado administra su oferta; otros usuarios no pueden modificarla; páginas del catálogo solo muestran datos publicados; límites/validación de imágenes se hacen cumplir. |
| 4. Descubrimiento y compartición | Diseñar búsqueda móvil, vista de producto y enlaces públicos con metadatos y datos permitidos. Requiere política aprobada de privacidad y fase 3. | `src/app/(public)/`, `src/features/catalog/`, Route Handlers/metadatos y pruebas E2E. | Un enlace compartido funciona sin sesión, muestra solo campos aprobados, deja de ofrecer contenido retirado y presenta una vista utilizable en teléfono. |
| 5. Pedidos y notificaciones | Implementar estados acordados, solicitudes/decisiones, consistencia de inventario, historial e integración Brevo si se confirma. Requiere fase 3 y decisiones de fase 0. | `src/features/orders/`, `src/features/notifications/`, `src/server/services/`, webhooks/Route Handlers y pruebas de integración/concurrencia. | Transiciones no autorizadas se rechazan; confirmaciones concurrentes no exceden stock; reintentos no duplican pedidos; falla de notificación no pierde el pedido. |
| 6. PWA y sincronización | Añadir cache/borradores/sincronización conforme al alcance validado y accesibilidad en red intermitente. Requiere flujos de catálogo/pedido estables y reglas explícitas de conflicto. | `src/app/`, componentes offline, almacenamiento local acotado y pruebas offline/E2E. | Casos offline acordados funcionan en dispositivos objetivo; la UI diferencia pendiente de confirmado; conflictos no alteran stock en silencio; datos sensibles quedan fuera de caché. |
| 7. Endurecimiento y piloto | Completar pruebas, accesibilidad, rendimiento, seguridad, respaldo/restauración, monitoreo, manuales y piloto con usuarios. Requiere fases 1–6. | `tests/`, configuración de despliegue/observabilidad, documentación operativa y guía de usuario. | Recorridos E2E y controles acordados pasan; no hay bloqueos críticos de seguridad/accesibilidad; restauración y procedimiento de incidentes se ensayan; piloto obtiene aprobación de responsables y usuarios. |

## Riesgos principales y mitigación

| Riesgo | Consecuencia | Mitigación y señal de verificación |
|---|---|---|
| Conectividad inestable o teléfonos modestos | Abandono, datos agotados o operaciones que parecen haberse perdido. | Medir en redes/dispositivos objetivo; páginas ligeras, reintentos visibles y alcance offline acotado; pruebas de desconexión y reconexión. |
| Inventario desactualizado y pedidos simultáneos | Sobreventa o pérdida de confianza. | Fuente de verdad en servidor, transacciones/condiciones de actualización, historial de movimientos y pruebas concurrentes. |
| Roles y pertenencia a asociaciones ambiguos | Exposición o modificación de datos ajenos. | Resolver matriz de permisos en fase 0; autorización por objeto en servidor; pruebas negativas para cada operación. |
| Compartición pública filtra información | Riesgo de privacidad y seguridad para productores. | Lista explícita de campos públicos, minimización, revocación y pruebas de respuesta pública antes de activar enlaces. |
| Costos, límites o indisponibilidad de terceros | Imágenes/notificaciones fallidas o costos inesperados. | Cuotas y presupuestos, límites de carga, adaptadores, reintentos acotados, alertas y degradación sin perder pedidos. |
| Sincronización duplica o contradice escrituras | Pedidos duplicados, estado confuso o stock incorrecto. | Idempotencia, servidor como autoridad, conflictos explicables y pruebas de reintento/concurrencia. |
| Producto no coincide con prácticas locales | Baja adopción o flujos que no se pueden completar. | Investigación con productores/compradores de las comunidades objetivo y piloto antes del lanzamiento amplio. |
| Repositorio sin aplicación ni documentación | Decisiones erróneas al asumir dependencias, despliegue o requisitos no observados. | Tratar el plan como propuesta, validar con responsables en fase 0 y no presentar elementos propuestos como existentes. |

## Criterio de salida de planificación

La autenticación y el esquema de roles de este primer corte están listos para revisión técnica; las decisiones provisionales siguen abiertas a revisión. Antes de completar la fase 2 hace falta acordar verificación/recuperación de cuenta, perfiles y el proceso confiable para asociación/administrador. No se han implementado catálogo, pedidos ni sincronización offline. La siguiente fase de implementación es el perfil comercial mínimo y el proceso aprobado para otorgar roles privilegiados; después se podrá iniciar catálogo/inventario, sujeto a las decisiones de producto pendientes.

### Fuentes técnicas consultadas

- [Autenticación en Next.js](https://nextjs.org/docs/app/guides/authentication): recomienda una biblioteca para autenticación, sesiones y autorización.
- [Integración de Better Auth con Next.js](https://www.better-auth.com/docs/integrations/next): documenta Route Handlers, Server Components y la integración Next.js 16 (`proxy`).
- [Better Auth con Prisma](https://www.better-auth.com/docs/adapters/prisma): documenta Prisma 6 y Prisma 7; el adaptador actual no soporta Prisma 8.
- [Correo y contraseña en Better Auth](https://www.better-auth.com/docs/authentication/email-password): define el flujo, validaciones y requisitos de verificación/correo.
- [Límites de solicitudes en Better Auth](https://www.better-auth.com/docs/concepts/rate-limit): documenta el rate limiting integrado y el almacenamiento para serverless.
- [Prisma con Neon](https://www.prisma.io/docs/orm/v6/overview/databases/neon): documenta el adaptador serverless y la recomendación de conexión agrupada para ejecución serverless.
