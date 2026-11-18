# Plan de plataforma agrícola

## Objetivo y alcance

Construir una plataforma de comercialización agrícola para comunidades rurales de Colombia, dirigida a personas con distintos niveles de experiencia tecnológica y con conectividad limitada. El producto debe facilitar que productores publiquen cosechas, que compradores encuentren oferta y soliciten pedidos, y que comerciantes, asociaciones y administradores participen con permisos claros.

Este documento conserva el roadmap y registra el estado real del repositorio. La primera entrega de identidad implementa una base de cuenta y permisos; los cortes de productos y catálogo agregan captura privada y publicación explícita, y el flujo básico de pedidos permite solicitar y decidir pedidos. El catálogo enlaza cada producto publicado y disponible a su solicitud por ID y ofrece una vista compartible por producto con metadatos de vista previa limitados a los campos públicos. Pagos en línea, logística, precios de referencia, facturación y verificación de identidad no se consideran requisitos confirmados; deben definirse antes de incorporarlos.

## Evaluación de precios SIPSA (16 de noviembre de 2026)

**Decisión: no integrar todavía.** No se muestran precios de ejemplo ni se cambia el flujo de pedidos. El primer intento de consulta del servicio no entregó una respuesta SOAP utilizable en más de 60 segundos y se detuvo; por tanto, no se verificaron registros, volumen, latencia ni disponibilidad sostenida.

- La [página del servicio web de DANE](https://www.dane.gov.co/index.php/estadisticas-por-tema/agropecuario/sistema-de-informacion-de-precios-sipsa/servicio-web-para-consulta-de-la-base-de-datos-de-sipsa) y la [guía técnica](https://www.dane.gov.co/files/investigaciones/agropecuario/sipsa/DANE-webservice-SIPSA.pdf) indican que los datos mayoristas diarios y semanales se pueden consultar desde las 2:00 p. m. del día correspondiente; los mensuales, desde el día 8. La guía describe SOAP 1.2 sobre HTTP. El [WSDL](https://appweb.dane.gov.co/sipsaWS/SrvSipsaUpraBeanService?WSDL) y su esquema responden, pero ello no demuestra que las operaciones de datos estén disponibles.
- La operación `promediosSipsaCiudad` documenta producto, ciudad, fecha de captura y precio promedio, pero no identifica mercado mayorista ni unidad de venta. `promediosSipsaParcial` expone producto, municipio, fuente y campos `*Kg`; la guía los describe como cantidades recolectadas en kilogramos, no como precio. No se pudo validar qué productos, mercados, unidades o fechas están disponibles hoy ni cómo se relacionan los códigos de recolección con unidades legibles.
- La ficha de SIPSA_P en [datos.gov.co](https://www.datos.gov.co/d/gkqq-k3k5) describe cobertura dinámica de mercados mayoristas representativos y ocho grupos de alimentos, y reporta licencia **Creative Commons Atribución-CompartirIgual 4.0** (`CC BY-SA 4.0`) con DANE como editor. Sus descargas enlazadas son bases mensuales de 2013–2024; la ficha no es una API de datos y no confirma que esa licencia ni las reglas de atribución rijan también para el servicio SOAP. La página del servicio y la guía SOAP no publican una licencia ni condiciones específicas de reutilización. No se presupone que los términos de la ficha histórica se extiendan al endpoint.
- La documentación consultada no indica credenciales para SOAP; no se pudo confirmar su necesidad mediante una consulta exitosa. La licencia/atribución aplicable al endpoint y la disponibilidad operativa siguen sin verificarse.

**Bloqueo para retomar:** DANE debe confirmar las condiciones de reutilización/atribución del servicio SOAP y debe poder completarse una consulta de datos reproducible que permita validar precio, unidad, producto, mercado y fecha. Hasta entonces, no integrar, cachear ni etiquetar estos datos como precio de finca o precio local. Si se reabre el corte, presentar únicamente observaciones mayoristas verificadas, con origen, fecha y unidad explícitos, y ajustar la caché a la frecuencia oficial.

### Comparación de fuentes para precios agrícolas (16 de noviembre de 2026)

**Decisión: no integrar todavía una API de precios.** DANE sigue siendo la referencia más pertinente para Colombia, pero la consulta pública no confirmó una API actual con condiciones de reutilización claras. SIPSA-P mide precios de venta **mayorista**, no precios pagados en finca; no deben presentarse como equivalentes.

- El [tablero oficial de precios mayoristas de SIPSA](https://appindices.dane.gov.co/sipsa/) describe cotizaciones en mercados mayoristas, normalmente en $/kg, con excepciones por unidad para huevos y bocadillo y por litro para aceites, jugos y vinagre. Es un punto de consulta útil para usuarios, no una API documentada para integrar.
- La [ficha SIPSA-P en datos.gov.co](https://www.datos.gov.co/d/gkqq-k3k5) cataloga una descarga histórica mensual de 2013–2024 y señala licencia CC BY-SA 4.0 en sus metadatos. El catálogo consultado proporciona archivos ZIP históricos; no es una tabla consultable por SoQL ni un feed actual. Esa licencia de la ficha no resuelve los términos del servicio SOAP ni autoriza a extenderla a ese endpoint.
- El [boletín de leche cruda en finca](https://www.dane.gov.co/index.php/estadisticas-por-tema/agropecuario/sistema-de-informacion-de-precios-sipsa/boletin-mensual-precios-de-leche-cruda-en-finca) confirma que DANE publica una referencia mensual específica para leche pagada en finca, con boletín y anexo XLSX. Es más pertinente para ese producto, pero no ofrece un feed en tiempo real ni representa otros cultivos.
- **yfinance no es una fuente adecuada para el catálogo agrícola local:** [su ficha de PyPI](https://pypi.org/project/yfinance/) dice que no está afiliada ni respaldada por Yahoo, que su API está destinada a uso personal y remite a los [términos de Yahoo](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html), que restringen la extracción automatizada sin permiso previo y la reutilización comercial. Además, cotizaciones bursátiles o futuros de materias primas no equivalen a precios observados de productos frescos por mercado, municipio y unidad en Colombia. Que una biblioteca sea gratuita no implica que los datos sean reutilizables.

**Siguiente paso:** mantener los precios fuera del flujo de pedidos; se puede enlazar el tablero de DANE como consulta externa. Antes de integrar precios mayoristas actuales, pedir a DANE confirmación de licencia/atribución y acceso reproducible a una operación del servicio con producto, mercado, fecha y unidad verificables. Como alternativa acotada, evaluar por separado un visor de datos históricos SIPSA-P descargados con la licencia indicada, mostrando periodo, mercado y unidad y sin presentarlos como precios vigentes. No hacen falta claves para esta recomendación; no se probó acceso autenticado ni se consultó ningún servicio con credenciales.

## Estado observado del repositorio

- El repositorio ya tiene un scaffold de Next.js App Router, TypeScript, Tailwind CSS y ESLint, una portada neutral en español, scripts de lint/tipos y CI para lint, tipos, pruebas y build. CI también aplica las migraciones a un servicio PostgreSQL efímero y ejecuta la suite de integración de pedidos contra ese servicio.
- El conversor privado de unidades agrícolas permite invertir los controles de origen y destino con una acción accesible; el resultado anterior se limpia al intercambiar.
- `.gitignore` excluye `.env*`. Las credenciales se revisaron sin mostrar ni registrar valores; no se ha conectado a Neon ni a servicios de correo o imágenes.
- Se inició la primera parte de identidad/permisos: autenticación por correo y contraseña, sesiones persistidas, roles básicos y migración versionada. Los cortes de productos y catálogo agregan captura privada y publicación explícita bajo una hipótesis de visibilidad pendiente de revisión; el flujo básico de pedidos está implementado. No se implementan perfiles comerciales, asociaciones ni sincronización offline. El primer corte offline posterior solo ofrece un shell estático genérico, sin cachear catálogo ni datos privados.

## Estado del hardening accesible

- **Hecho en la rama de hardening:** se añadió un indicador global de foco visible para teclado; los errores de cantidad del pedido ahora indican el campo inválido y asocian el texto del error; los mensajes de resultado de roles y pedidos distinguen errores anunciados como alertas de éxitos anunciados como estados.
- **Auditoría de flujos existentes:** registro, inicio, producto y filtros de catálogo tienen etiquetas asociadas; los encabezados de catálogo, productos y pedidos siguen una jerarquía coherente; los colores de texto y controles observados conservan contraste suficiente en sus fondos claros; el aviso offline se anuncia como estado. En la revisión anterior no se encontraron animaciones/transiciones que requirieran una regla adicional de movimiento reducido.
- **Mejora mobile-first de páginas públicas y autenticación:** catálogo y detalle usan menos margen en teléfono; campos, acciones y enlaces de navegación tienen al menos 48 px de alto. El filtro de municipio explica qué escribir, los resultados vacíos por filtros permiten volver al catálogo completo y la consulta tiene estados anunciados de carga y error con reintento. Registro, inicio y recuperación mantienen enlaces claros para volver al inicio; los formularios anuncian cuándo están procesando.
- **Verificación del corte de UX (17 de noviembre de 2026):** `npm run lint`, `npm run typecheck`, `npm run test:unit` (54 pruebas), `npm run build` y `npm test` (12 pruebas smoke/offline) pasan. La portada, el catálogo y las cuatro vistas de autenticación respondieron HTTP 200 en el sitio público consultado; el catálogo no tenía productos públicos para probar un detalle. En el worktree no se configuró `TEST_DATABASE_URL`: se probaron las rutas sin enviar formularios y el estado de error del catálogo con un PostgreSQL local intencionalmente inaccesible; no se ejecutaron pruebas que requieran base ni se crearon datos. La recuperación no envió correos.
- **Verificado tras los cambios:** `npm run lint`, `npm run typecheck`, `npm run test:unit` (14/14), `npm test` (9/9, incluidas las comprobaciones smoke de producción) y `npm run build` pasan. Prisma Client se generó con una URL local sin servicio y la carga dotenv dirigida a un archivo inexistente; no se hicieron llamadas a Neon ni a otros servicios.
- **E2E del pedido:** CI instala Chromium y ejecuta `tests/order-request.e2e.ts` contra el servidor de producción construido y el PostgreSQL 16 efímero del job. El recorrido crea un comprador mediante la autenticación real, abre el enlace de solicitud sin iniciar sesión y comprueba que, después de autenticarse, vuelve al formulario del producto. La ruta de retorno solo admite solicitudes internas de producto, no destinos arbitrarios. Luego comprueba que la clave oculta de idempotencia está en la solicitud HTTP de Server Action, reenvía exactamente el POST capturado y consulta PostgreSQL para verificar un único pedido, historial y reserva de inventario. También verifica la aceptación y el rechazo: cancelar la confirmación de rechazo deja el pedido pendiente; confirmarlo registra el historial, muestra el estado a ambas cuentas y libera la reserva. La app selecciona el adaptador PostgreSQL directo solo si `TEST_DATABASE_URL` apunta a una base local cuyo nombre comienza por `agricultor_test`; el adaptador Neon se conserva en los demás casos. **Límites:** no cubre descubrimiento del catálogo, dispositivos/navegadores adicionales ni un recorrido móvil; el servicio PostgreSQL local no se ejecuta en esta máquina.

## Panel de gestión del productor

- **Implementado:** `/mi-cuenta` muestra a productores autenticados un resumen móvil de productos publicados y agotados, y pedidos recibidos pendientes, aceptados y rechazados. Cada bloque enlaza a las gestiones ya existentes y ofrece un próximo paso cuando no hay registros; las demás cuentas conservan sus perfiles y enlaces actuales.
- **Mejora de cuenta y pedidos:** los compradores tienen accesos directos al catálogo y a sus solicitudes; ambas vistas de pedidos orientan a su siguiente paso cuando no hay registros. El seguimiento distingue la respuesta del productor de la respuesta propia del productor, y mantiene únicamente los estados existentes (pendiente, aceptado y rechazado).
- **Accesibilidad y acceso:** los estados conservan etiquetas textuales además del color; el seguimiento marca un paso actual solo mientras espera respuesta. La prueba E2E comprueba los redireccionamientos de `/mi-cuenta` y `/mi-cuenta/pedidos` sin sesión, la restricción de gestión de productos para compradores y las etiquetas de seguimiento apropiadas para cada rol. No cambia el esquema ni amplía la gestión de pedidos.
- **Acceso y consultas:** el servidor exige sesión y rol de productor antes de mostrar los conteos; las consultas agregadas filtran por `ownerId` para productos y `producerId` para pedidos, y solo devuelven cantidades por estado, sin datos de compradores ni filas individuales. El conteo de agotados usa cantidad disponible igual a cero e incluye productos privados o retirados, porque el esquema no limita esa condición a productos publicados.
- **Límites:** el esquema permite derivar estos conteos de estado, pero no permite afirmar ventas, ingresos, tendencias por periodo ni actividad futura; el panel no los muestra. La disponibilidad cero representa agotado independientemente de publicación, como en la gestión actual de productos.
- **PostgreSQL:** CI ejecuta `src/features/orders/orders.integration.test.ts` contra un servicio PostgreSQL 16 efímero por job, con health check, base `agricultor_test` local y migraciones aplicadas únicamente a ese servicio descartable. La suite cubre persistencia de pedidos, reserva/liberación/consumo de inventario y concurrencia por la última unidad. No se conectó ni escribió en producción. La integración no se ejecutó localmente en este entorno porque no hay `psql` ni daemon de Docker disponible.

## Progreso de fundaciones e identidad

- **Hecho:** scaffold mínimo de Next.js 16.4.6, React 19.3, TypeScript, Tailwind CSS 4 y ESLint; scripts `lint` y `typecheck`; página inicial provisional en español sin flujos de producto; documentación de desarrollo básica; CI de lint, tipos y build.
- **Hecho:** dependencias instaladas limpiamente con `npm ci` y una caché npm aislada; se regeneró el lockfile tras detectar que el primer intento había dejado entradas transitivas incompletas.
- **Verificado desde una instalación limpia:** `npm ci`, `npm run lint`, `npm run typecheck` y `npm run build` finalizan correctamente; el build de Next.js 16.4.6 prerenderiza `/` y `/_not-found` como rutas estáticas.
- **Hecho en una rama de seguimiento basada en `main`:** prueba smoke con `node:test` que inicia el servidor de producción y valida el estado HTTP, el idioma español y el texto provisional de la portada; CI ejecuta `npm test` después del build.
- **Verificado en la rama de seguimiento:** `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` pasan; la prueba smoke pasa (1/1). La portada es únicamente un scaffold técnico provisional, no el producto agrícola terminado.
- **Nota técnica:** se mantiene ESLint 9.39.5 porque los plugins incluidos por `eslint-config-next` aceptan ESLint hasta la versión 9 y npm marca ESLint 9 como fuera de soporte. La versión 10 actual produce pares de dependencias inválidos con esos plugins; revisar la actualización del stack cuando Next la soporte o aprobar otro linter.
- **Identidad ya presente en `main`:** Better Auth con Prisma/PostgreSQL, sesiones validadas en servidor y roles múltiples; el registro asigna comprador y solo permite agregar productor o comerciante desde una acción autenticada. Asociación y administrador no se autoasignan; su proceso de aprobación sigue pendiente.
- **Mejora del flujo móvil de cuenta:** el registro y las solicitudes de recuperación evitan capitalización automática en el correo y el registro/restablecimiento explican el mínimo de contraseña. El restablecimiento sin token ofrece volver a solicitar el enlace o iniciar sesión; si las contraseñas no coinciden, ambos campos anuncian el error y quedan marcados como inválidos. La prueba smoke cubre estos estados sin crear cuentas ni enviar correo.
- **Hipótesis provisional de identidad heredada:** se mantiene por ahora el supuesto de roles múltiples; es flexible y sigue sujeto a revisión de producto.
- **Seguimiento de variables (solo nombres):** el proyecto requiere `AUTH_SECRET` y `DATABASE_URL`; la errata observada `COUDINARY_API_KEY` debe aclararse antes de integrar Cloudinary. No se copian valores ni se configura el proveedor en este corte.
- **Alcance pequeño de productos/inventario:** productores autenticados pueden crear y editar sus propios registros privados con nombre, categoría, cantidad, unidad, precio COP y municipio/localidad. La lectura y escritura filtran por propietario en servidor. El estado no se guarda por separado: cantidad mayor que cero significa disponible y cero significa agotado. No se publica el producto ni se decrementa inventario por ventas.
- **Hipótesis de visibilidad pública pendiente de revisión:** la vista web del catálogo muestra solo registros cuya persona propietaria publicó explícitamente y cuya cantidad es mayor que cero. Los campos propuestos para exposición son nombre, categoría, cantidad/unidad, precio COP por unidad y municipio; se excluyen teléfono, correo, dirección precisa e identificadores/datos privados del productor. La migración agrega `isPublished` con valor por defecto `false`; solo el productor propietario puede publicar o retirar. Esto no es una política aprobada ni una decisión confirmada.
- **Hipótesis provisionales de producto:** categorías iniciales (frutas, hortalizas, tubérculos, granos/cereales, otro); unidades iniciales (kg, unidad, arroba, bulto, canastilla); el precio en pesos enteros COP corresponde a una unidad de medida; cantidad admite hasta tres decimales; municipio/localidad es texto libre. No son taxonomía, unidades ni formatos aprobados: confirmar con usuarios antes de ampliar el flujo.
- **Verificado en el corte privado de productos:** el cliente Prisma se genera y el esquema valida sin conexión; 5 pruebas nuevas cubren campos, cantidades, permisos de productor/propietario y estado derivado. No se conectó ni escribió en Neon y no hay base PostgreSQL local desechable disponible para probar la migración.
- **Preview de Vercel pendiente:** el check de Vercel falló, pero no se pudieron consultar sus logs porque el CLI no tiene credenciales configuradas en este entorno. No se modificó configuración ni se leyeron valores de secretos; no es posible confirmar si falta alguna variable. El build local de producción sí pasa con placeholders locales.
- **Prueba de integración en CI:** las migraciones se aplican y las pruebas de pedidos/concurrencia se ejecutan contra el PostgreSQL efímero del job; esto no prueba ni requiere acceso a Neon o producción. Localmente no hay `psql` ni daemon de Docker disponible para una base PostgreSQL desechable.
- **Integraciones excluidas:** no se habilitan verificación ni recuperación de correo (Brevo queda fuera) ni fotos (Cloudinary queda fuera hasta aclarar la errata y diseñar carga segura).
- **Validación local del flujo de pedidos:** el script `npm run test:unit` incluye las pruebas existentes de validación, permisos y transiciones de pedidos; pasan las 24 pruebas unitarias, junto con lint, typecheck, build de producción con placeholders locales y smoke HTTP. La prueba PostgreSQL se omite si no se configura `TEST_DATABASE_URL` para una base desechable local.
- **Integración real/concurrencia en CI:** la suite existente se ejecuta en CI con un servicio PostgreSQL efímero; localmente puede omitirse sin `TEST_DATABASE_URL`. En este entorno no hay `psql` ni daemon de Docker, así que no se ejecutó contra una base local. No se usaron datos reales ni se conectó a una base remota.
- **Integración catálogo-pedido:** los PR #5 (catálogo) y #6 (pedidos) ya están fusionados en `main`. Este corte añade a cada producto publicado y disponible un enlace accesible a `/catalogo/[productId]/pedido`; la proyección pública expone solo el ID requerido y los campos públicos aprobados. Los productos privados/retirados o agotados siguen excluidos tanto del catálogo como de la acción de solicitud. No se modifican pagos, contacto, notificaciones ni funcionamiento offline.
- **Incremento de filtros y paginación del catálogo:** la página pública permite filtrar opcionalmente por una categoría ya existente y por municipio (coincidencia exacta sin distinguir mayúsculas), mediante `categoria` y `municipio`; `pagina` conserva los filtros en enlaces de navegación y usa 12 productos por página. Se mantiene el orden por actualización y la consulta limita filas a productos publicados con cantidad positiva; la proyección pública sigue excluyendo datos privados. Hipótesis técnica por validar: ese tamaño de página y la comparación exacta del municipio son suficientes para el uso inicial. No se agregan categorías, búsqueda libre, mapas, pedidos nuevos, notificaciones, roles ni capacidades offline.
- **Enlaces compartibles de productos:** cada producto publicado con cantidad positiva tiene una ruta estable `/catalogo/[productId]`, con acción de compartir/copiar enlace y fallback accesible cuando Web Share no está disponible. Los metadatos Open Graph/Twitter se generan solo con nombre, categoría, cantidad/unidad, precio y municipio, los mismos campos del catálogo; no exponen contacto/identidad del productor, dirección precisa ni ID de propietario. La vista no consulta pedidos ni modifica datos y no publica mediante cuentas conectadas. La política de visibilidad pública sigue siendo una hipótesis pendiente de aprobación.
- **Primer corte offline seguro:** se añade un manifest y un service worker propio compatible con el stack instalado (Next.js 16.4.6 y TypeScript 5; no se añade plugin ni dependencia). En la instalación se guarda una única respuesta HTML estática generada dentro del worker, sin hacer `fetch` ni cachear respuestas del servidor. Solo las navegaciones GET exactas a `/` y `/catalogo`, sin query string, se intentan en red y reciben esa pantalla genérica tras un fallo de red. La pantalla no contiene productos ni stock y avisa que se necesita conexión para solicitar.
- **Privacidad y límites offline:** no se cachean páginas/RSC, assets descargados, catálogo, autenticación, `/mi-cuenta`, pedidos, APIs, mutaciones ni URLs con query. No se envían cookies para el único objeto cacheado (shell sintético con `credentials: omit`), no se cachean respuestas de red y la política rechaza `Set-Cookie`. La caché contiene una sola pantalla y al activar una versión nueva se elimina la caché antigua de este shell. El indicador visible advierte que disponibilidad puede estar desactualizada y que las solicitudes no se guardan ni confirman offline. El registro inicial requiere conexión. No hay lectura de catálogo offline ni borradores/sincronización.
- **Pruebas offline:** se agregan pruebas de allowlist/exclusiones y de fallback de navegación con fallo de red; `npm test` también comprueba en producción que se sirven el worker y el manifest. La prueba de fallback verifica la política en Node, no sustituye pruebas de navegador/dispositivo.
- **Validación local de este corte:** `npm ci` terminó correctamente (525 paquetes; npm reportó 8 vulnerabilidades moderadas y un aviso de engine para `@prisma/streams-local@0.1.11`, que pide Node 22; este proyecto corre con Node 20.20.2). Versiones instaladas: Next.js 16.4.6 y TypeScript 5.9.3. Pasaron `npm run db:generate` (Prisma Client 7.10.1), `npx prisma validate`, `npm run lint`, `npm run typecheck`, `npm run test:unit` (10/10), `npm run build` y `npm test` (5/5: 3 pruebas de política offline y 2 smoke HTTP de producción). El build y Prisma usaron solo el URL/secreto placeholder del proceso local; no se conectó a ninguna base. No se ejecutó integración/concurrencia PostgreSQL por no disponer de una base descartable.

## Decisiones provisionales de productos, inventario y catálogo

El corte de gestión captura datos privados para que el productor administre su oferta. El pequeño catálogo de solo lectura es una hipótesis de producto que debe revisarse antes de considerarla política aprobada.

1. **Campos mínimos:** nombre, categoría, cantidad disponible, unidad de medida, precio entero en COP por unidad de medida y municipio/localidad en texto libre.
2. **Taxonomía y unidades:** las opciones de categoría y unidad son una lista inicial técnica para hacer el formulario consistente; requieren validación con productores y comerciantes. No añadir nuevas opciones sin confirmar necesidad.
3. **Disponibilidad:** se deriva de la cantidad guardada (mayor que cero: disponible; cero: agotado), evitando un estado independiente que pueda contradecir el inventario.
4. **Propiedad:** toda consulta y mutación se limita al usuario autenticado; las acciones de producto requieren rol productor. No hay decremento por pedidos, que quedan fuera de alcance.
5. **Imágenes:** no se guarda ni carga fotografía. No integrar Cloudinary hasta aclarar la errata observada en la variable `COUDINARY_API_KEY` y diseñar carga segura.
6. **Hipótesis de catálogo público (pendiente):** solo mostrar productos publicados explícitamente y con cantidad mayor que cero; exponer nombre, categoría, cantidad/unidad, precio COP y municipio. No exponer contacto ni dirección precisa. Los registros existentes y los nuevos comienzan privados; publicar/retirar exige sesión, rol productor y propiedad verificada en servidor. Esta visibilidad no está confirmada por responsables de producto o usuarios.

## Requisitos

### Funcionales recibidos

- Perfiles y permisos para productores, compradores, comerciantes, administradores y asociaciones.
- Publicación y gestión de productos agrícolas e inventario; catálogo y búsqueda para compradores; flujo de pedidos.
- Enlaces compartibles para productos/ofertas y distribución por redes sociales.
- **Propuesta recibida, aún por validar:** que cada productor pueda conectar sus activos autorizados de Facebook e Instagram para gestionar publicaciones y conversaciones desde Agricultor. Compartir un enlace en redes y publicar mediante una cuenta conectada son capacidades diferentes.
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
10. Para Meta, ¿qué cuentas/canales y operaciones se necesitan primero: publicar en Pages, publicar en Instagram, responder mensajes de Facebook/Instagram, moderar comentarios u otras? ¿Qué contenido puede cruzarse entre canales?
11. ¿Cuánto tiempo conservar conversaciones y publicaciones externas, quién puede verlas dentro de Agricultor y cómo se desconecta/revoca una cuenta?

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
- **Order**: comprador, productor, producto opcional, instantánea de nombre/cantidad/unidad/precio, estado y marcas de tiempo. El corte actual admite una unidad de producto por pedido.
- **OrderHistory**: eventos de solicitud, aceptación y rechazo con actor/estado/fecha; no registra datos de contacto.
- **InventoryMovement**: registro auditable de ajustes, reservas, confirmaciones y liberaciones.
- **ShareLink** (o slug público): referencia opaca/estable a contenido publicable, con vigencia o revocación si el producto lo requiere.
- **Notification** y **NotificationAttempt**: destinatario, tipo, referencia, estado e intentos acotados de entrega.
- **AuditEvent**: operaciones sensibles, actor y entidad afectada, sin incluir credenciales o contenido innecesario.

Aplicar claves foráneas, restricciones de cantidades y estados, índices para filtros del catálogo/pedidos y marcas de tiempo. Evitar almacenar información personal que no se requiera para operar. No añadir tablas de pagos, transporte o facturación hasta confirmar esos casos.

## Identidad, autorización y flujo de pedidos

- Better Auth administra creación, lectura, vencimiento y revocación de sesiones en servidor; el adaptador Prisma las persiste en PostgreSQL. La política y el alcance son provisionales y requieren revisión.
- Comprobar autorización en cada caso de uso/Server Action/Route Handler; ocultar botones en la interfaz es solo una ayuda de UX, no control de acceso.
- Definir reglas explícitas por rol y organización, y probar tanto acceso permitido como denegado. No confiar en un `role` enviado por el cliente.
- Hipótesis inicial de pedido: al solicitar, el comprador mueve cantidad libre a reservada mediante una actualización condicional atómica. El productor la acepta (consume reserva) o rechaza (libera reserva); los cambios de estado e inventario se confirman juntos. El pedido conserva una instantánea del producto. La regla de reservar al solicitar requiere aprobación del producto.
- **Idempotencia implementada para pedidos:** cada formulario de solicitud recibe en el servidor una clave opaca, persistida con unicidad por comprador. Repetirla con el mismo producto y cantidad normalizada devuelve el pedido existente sin volver a reservar inventario ni duplicar historial; reutilizarla con otros datos falla sin efectos. Las decisiones repetidas con el mismo estado responden éxito sin volver a modificar inventario ni historial; una decisión contraria sigue rechazándose. Pruebas PostgreSQL cubren reintentos y solicitudes concurrentes. Esto no define cancelaciones ni sus reglas de liberación de inventario, que siguen pendientes junto con el flujo final.

## Experiencia mobile-first y modo offline

- Empezar por pantallas de teléfono, controles grandes, navegación corta, etiquetas comprensibles, formularios con pocos campos por paso, mensajes de error accionables y formatos locales. Validar comprensión con usuarios rurales; “español colombiano” no debe basarse en estereotipos.
- Reducir transferencia inicial: paginación, carga diferida de imágenes, tamaños responsivos y compresión; evitar descargar catálogos completos.
- **Implementado (primer corte):** service worker y manifest sin plugin, shell HTML sintético independiente de datos, con fallback solo para navegaciones GET exactas a `/` y `/catalogo` sin query. El shell informa que no hay productos ni cantidades offline y requiere conexión para solicitar. Los archivos estáticos descargados y las páginas/respuestas dinámicas no se cachean en esta fase.
- **Pendiente de decisión y diseño:** evaluar, con pruebas específicas de privacidad, una política separada para lectura de catálogo público y recursos estáticos; solo habilitarla si puede demostrarse la exclusión de cookies y respuestas sensibles. No se ofrece lectura de productos recientes en este corte. Borradores y sincronización requieren aprobación, protección local, retención y reglas explícitas de conflicto antes de implementarse.
- No afirmar que pedidos, stock o disponibilidad están confirmados mientras el dispositivo está desconectado. Las escrituras se validan en servidor al sincronizar; resolver conflictos de manera explícita y nunca sobrescribir cambios de inventario silenciosamente. Determinar retención, borrado y protección de borradores locales.
- No almacenar credenciales, datos sensibles o tokens de sesión en cachés accesibles a scripts; excluir respuestas privadas y mutaciones del caché offline hasta diseñar controles y pruebas específicos.

## Enlaces, imágenes e integraciones

- Los enlaces compartibles deben abrir una vista pública intencionalmente limitada, con metadatos de vista previa (Open Graph) adecuados y sin exponer datos de contacto/personales salvo autorización expresa.
- Validar que el objeto siga publicado y que la persona propietaria pueda revocar/actualizar su publicación. Usar identificadores no enumerables cuando corresponda y protección contra scraping/abuso.
- Cloudinary: validar autorización, tipo MIME real, tamaño y límites; usar transformaciones para miniaturas y formatos adecuados; evitar contenido ejecutable.
- Brevo: preferir correo transaccional solo después de confirmar canal, consentimiento y contenido. Implementar reintentos acotados y observabilidad; no exponer llaves del proveedor.
- Definir comportamiento degradado ante indisponibilidad de proveedores: el pedido principal no debe perderse por una falla de notificación o carga de vista previa.
- No se proponen integraciones de pago ni conexiones de prueba en esta fase.

## Integración social con Meta (propuesta; no implementada)

El objetivo solicitado es que una persona productora gestione desde Agricultor publicaciones y mensajes de activos de Facebook/Instagram que controla. La API puede ofrecer publicación en una Facebook Page, publicación en una cuenta profesional de Instagram y acceso a conversaciones compatibles de Messenger/Instagram Messaging; son productos, permisos y flujos independientes. No se conectó Meta, no se creó ni configuró una Meta App y no se verificó ninguna cuenta. La selección de login, el alcance funcional y la política de datos siguen pendientes de validación.

### Capacidades y condiciones verificadas en la documentación oficial

- **Facebook:** Pages API permite publicar texto/enlaces y medios en una Facebook Page y consultar sus publicaciones; la documentación de Posts contempla actualizar y eliminar una publicación, pero una aplicación solo puede actualizar publicaciones creadas por esa misma aplicación. El usuario que autoriza necesita tareas de Page apropiadas, como `CREATE_CONTENT` para publicar; los endpoints y permisos solicitados dependen de la operación. Esto no es una API para publicar en perfiles personales.
- **Instagram:** se requiere una cuenta profesional (Business o Creator), no una cuenta personal. Content Publishing API soporta publicaciones de contenido como imágenes, videos, Reels y carruseles, sujeto a las restricciones de cada endpoint/formato; por ejemplo, imágenes JPEG y un límite de 100 publicaciones API en una ventana móvil de 24 horas. Los medios publicados deben estar disponibles para que Meta pueda obtenerlos. No prometer Stories, funciones de la aplicación Instagram ni formatos/ediciones sin confirmar la elegibilidad del endpoint elegido.
- **Mensajes:** Messenger Platform y la API de mensajes de Instagram ofrecen conversaciones de una Facebook Page o cuenta profesional elegible, con lectura/recepción y respuestas según permisos y políticas. La persona debe iniciar la conversación; la ventana estándar suele ser de 24 horas y las excepciones están sujetas a casos de uso/tags permitidos. No es una herramienta para iniciar mensajes arbitrarios, campañas no solicitadas ni leer cualquier cuenta o conversación. En el flujo de Instagram Messaging documentado para Pages, la cuenta profesional está conectada a una Facebook Page; Instagram API dispone también de otros modos de login, así que debe probarse el modo compatible con las operaciones que finalmente se aprueben.
- **Cuenta y conexión:** Facebook publica como una Page administrada por la persona que autoriza. Instagram requiere Business/Creator; el modo Instagram Login/Unified Login puede no requerir Page para algunas capacidades, mientras Facebook Login e Instagram Messaging con Page requieren la vinculación y permisos de la Page. La descripción actual de Meta recomienda Unified Login para nuevas integraciones y exige un portfolio comercial para ese modo; la elección entre Unified Login, Instagram Login y Facebook Login for Business queda pendiente de una prueba de capacidades, no se fija en este plan.
- **Permisos mínimos a evaluar por función y modo de login** (solicitar únicamente los necesarios, no todos por defecto):
  - Publicar/leer contenido de Page: `pages_manage_posts`, `pages_read_engagement`; para administración de interacciones puede aplicar `pages_manage_engagement`, y para publicar video puede aplicar `publish_video`. Meta también exige las tareas de Page pertinentes.
  - Publicar Instagram con Facebook Login: `instagram_basic`, `instagram_content_publish` y `pages_read_engagement`; con Instagram Login: `instagram_business_basic`, `instagram_business_content_publish`.
  - Mensajes de Facebook: `pages_show_list` y `pages_messaging`; el usuario debe tener la tarea `MESSAGING` en la Page.
  - Mensajes de Instagram con el flujo Page-linked documentado: `instagram_basic`, `instagram_manage_messages` y `pages_manage_metadata`; revisar la matriz oficial por endpoint/login antes de implementar. Con Instagram Login, los nombres documentados incluyen `instagram_business_basic` e `instagram_business_manage_messages`.
- **Acceso de prueba y producción:** Standard Access sirve para desarrollo/pruebas y activos propios o administrados, dentro de sus límites. Para atender cuentas de personas sin rol en la app se requiere el nivel de acceso avanzado y App Review para permisos/funciones; Meta indica que Business Verification también es necesaria para el Advanced Access de Instagram cuando se atienden cuentas externas. La aprobación se solicita por cada permiso/función que la aplicación realmente use. No asumir aprobación automática ni disponibilidad de todas las funciones antes del review.
- **Tokens:** OAuth requiere redirect URI configurado y protección `state`; el código de autorización es de un solo uso y válido por una hora. En el flujo de Instagram Login documentado, el token inicial es de corta duración (una hora), intercambiable por un token de larga duración (60 días) que se puede renovar antes de vencer. Los tokens de Facebook/Page tienen reglas distintas según el flujo y no se debe asumir una duración fija o ausencia de vencimiento; diseñar manejo de expiración, renovación/reautorización y revocación. Ningún token debe exponerse al navegador, logs, repositorio o caché offline.
- **Webhooks de mensajes:** requieren endpoint HTTPS público con TLS válido, configuración del producto Webhooks en el App Dashboard, suscripción al objeto/campos aplicables e instalación/autorización para el activo. Implementar verificación de suscripción, validación de firma, idempotencia y respuesta oportuna (Meta pide responder a eventos en cinco segundos o menos); los eventos no son un archivo histórico, por lo que guardar solo lo que el producto necesite y acuerde.
- **Verificación inicial implementada:** `GET /api/meta/webhook` comprueba `hub.mode=subscribe` y `META_WEBHOOK_VERIFY_TOKEN`, y devuelve `hub.challenge` únicamente cuando el token coincide. Cuando esta versión esté desplegada en el dominio de producción, se puede registrar `https://<dominio-de-producción>/api/meta/webhook` como URL de devolución de llamada y verificar/guardar el cambio en Meta. Esto no recibe ni procesa notificaciones (`POST`), valida firmas, persiste eventos ni ofrece inbox; por tanto, todavía no se deben suscribir campos de eventos ni conectar cuentas de productores. Completar primero el inbox/retención y la seguridad del endpoint `POST`.

### Prerrequisitos del programador y nombres de configuración

Antes de implementar conexiones reales, el programador debe crear/configurar una Meta App y productos/login de Meta, registrar el redirect URI y un webhook HTTPS público, y conectar **cuentas de prueba autorizadas**: una Page con tareas adecuadas y, para Instagram, una cuenta Business/Creator con la vinculación a Page si el modo/mensajes elegido la requiere. Añadir testers/roles de prueba y completar una prueba OAuth, publicación, mensajería y webhook con esos activos antes de abrir acceso externo. Antes de servir a otras personas, solicitar el App Review/Advanced Access y completar Business Verification cuando Meta lo requiera.

Nombres de configuración a definir solo en el gestor de secretos del entorno, nunca valores en este plan:

- `META_APP_ID`
- `META_APP_SECRET` (solo servidor)
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_GRAPH_API_VERSION` (versión soportada elegida al implementar)

El redirect URI y la URL HTTPS del webhook son configuración pública de la aplicación, no credenciales. Los tokens individuales de usuario/Page deben obtenerse por el OAuth consentido y persistirse cifrados del lado servidor; no pedir al programador que comparta tokens manuales ni usar tokens de una persona para conectar las cuentas de productores. No se requieren valores de credenciales para planificar este trabajo.

### Secuencia propuesta, sujeta a validación

1. **Cerrar alcance y modelo de uso:** acordar qué redes, tipos de contenido, operaciones de mensajes/comentarios, relación con producto/catálogo, acceso por rol, retención y desconexión ofrecer. Definir qué significa gestionar una publicación existente por canal; no sincronizar automáticamente contenido entre redes.
2. **Preparar Meta y prueba autorizada:** crear Meta App, configurar login, redirect URI, productos y webhook; conectar activos de prueba autorizados y verificar permisos/tareas. Mantener acceso de prueba Standard mientras la función se desarrolla.
3. **Conectar cuentas con OAuth seguro:** autorización explícita por cada productor, `state` anti-CSRF, callback validado en servidor, intercambio de códigos y gestión de alcance/expiración/revocación. Persistir solo IDs, tipo de activo, propietario interno, permisos concedidos, fechas necesarias y token cifrado.
4. **Publicaciones, de forma incremental:** empezar por una operación confirmada en una Page o Instagram profesional; mapear contenido explícitamente, validar medios y restricciones/rate limit, mostrar resultado/error externo y conservar el ID/permalink mínimo necesario. No declarar éxito local si Meta rechaza la publicación.
5. **Inbox y webhooks:** solo si se confirma esa necesidad, suscribirse a eventos de mensajes, validar y deduplicar notificaciones, asociar cada activo/conversación a su propietario, ofrecer respuestas dentro de las ventanas autorizadas y dejar registro mínimo. Diseñar retención, borrado y controles de acceso para contenido de terceros.
6. **Acceso externo y operación:** completar review/verificación requerida antes de habilitar a productores sin rol de la app; probar expiración/revocación, permisos denegados, desconexión, duplicados, límites, caída de Meta, privacidad y recuperación operativa.

La conexión a Meta requiere red y no se incluye en el modo offline. Las publicaciones ya existentes en Facebook/Instagram no deben suponerse editables: por ejemplo, la Pages API limita la actualización a posts hechos por esa app. La lista, moderación, edición, borrado, analíticas, programación, sincronización y bandeja unificada se validarán función por función con documentación actual y cuentas de prueba; no forman una promesa conjunta de compatibilidad.

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

## Herramientas útiles para sumar gradualmente

Estas ideas requieren validación con productores y compradores; no son promesas de cobertura, precisión ni disponibilidad. Los puntos 1–4 siguen siendo propuestas; el seguimiento de pedidos del punto 5 tiene un primer corte acotado descrito allí. Priorizar pantallas ligeras que funcionen en teléfono, muestren fecha/fuente y expliquen claramente los límites de los datos.

1. **Referencia de precios mayoristas (primer MVP):** consultar por alimento, unidad de medida, mercado/plaza o municipio y fecha de actualización; mostrar valor y unidad publicados, nombre del mercado, fuente y fecha, con aviso visible si no hay dato reciente. Priorizar el [SIPSA del DANE](https://www.dane.gov.co/index.php/estadisticas-por-tema/agropecuario/sistema-de-informacion-de-precios-sipsa), que ofrece boletines diarios de precios mayoristas, otras publicaciones periódicas y un servicio web de consulta de su base/tablero. Esto sería una **referencia diaria o periódica**, nunca una cotización en tiempo real ni una garantía de precio pagado en finca o comercio local. Antes de automatizar, comprobar acceso técnico al servicio, cobertura efectiva por producto/unidad/mercado/fecha, frecuencia y rezago de actualización, formato, licencia/términos de uso, atribución, cuotas y si se requieren API keys u otras credenciales. Agronet u otra fuente oficial sería alternativa únicamente tras verificar los mismos puntos. No prometer cobertura ni crear credenciales hasta completar esa revisión. Depende de mapear la taxonomía y unidades del catálogo a los datos oficiales y acordar reglas de vigencia, caché y ausencia de observaciones.
2. **Calculadora sencilla de costos y margen:** permitir que productor o comprador ingrese costos relevantes y compare un precio de referencia o precio propio por una unidad equivalente; mostrar el cálculo y sus supuestos, no asesoría financiera ni rentabilidad garantizada. Empezar como cálculo local sin guardar datos privados. Depende de validar unidades/conversiones y acordar qué costos entran (producción, empaque, transporte u otros); la integración de precios es opcional, no requisito para una primera versión.
3. **Clima y alertas de contexto:** mostrar pronóstico para un municipio elegido y, solo si se justifica, avisos por condiciones relevantes para cultivos seleccionados. Evaluar primero IDEAM u otra fuente oficial: disponibilidad de API/datos descargables, cobertura, resolución, actualización, términos/licencia, cuotas y credenciales requeridas deben verificarse antes de diseñar integración. Depende de ubicación/cultivos elegidos y reglas comprensibles para alertas; no prometer precisión local ni agregar canales de notificación hasta acordarlos por separado.
4. **Calendario agrícola por región y cultivo:** calendario informativo de labores/temporadas basado en fuentes agrícolas confiables y validado localmente; dejar claro que fechas varían por clima, altura y práctica regional. Depende de acordar cultivos y municipios iniciales, revisar fuentes como Agrosavia/ICA y su reutilización, y validar recomendaciones con productores. Puede iniciar como contenido curado/versionado, sin API externa.
5. **Seguimiento claro del pedido — primer corte implementado:** la pantalla de pedidos muestra a compradores y productores una cronología accesible con la solicitud enviada y la respuesta (pendiente, aceptada o rechazada), usando el historial existente y mostrando los próximos pasos apropiados para cada rol. La prueba E2E recorre la solicitud del comprador, la respuesta del productor y el seguimiento actualizado en ambas cuentas. No añade cancelaciones, pagos, entrega ni nuevos estados logísticos; la aplicación informa que no gestiona la entrega ni el pago. No se envían avisos fuera de la aplicación.

## Fases verificables

Los nombres bajo “áreas/archivos” son destinos propuestos porque no hay estructura de aplicación existente.

| Fase | Trabajo y dependencias | Áreas/archivos propuestos | Criterios de aceptación verificables |
|---|---|---|---|
| 0. Descubrimiento y decisiones | Validar roles, flujo y estados de pedido, unidades, publicación, pagos/contacto, offline, canales, datos y criterios de lanzamiento. Depende de responsables de producto y usuarios de prueba. | `PLAN.md`; especificación aprobada en la ubicación que acuerde el equipo. | Cada decisión de producto pendiente tiene responsable y resolución; alcance y exclusiones quedan aprobados antes de cerrar esquema y UX. |
| 1. Fundaciones técnicas | Crear Next.js/TypeScript/Tailwind, calidad/CI, configuración segura, Prisma/Neon, migraciones iniciales y entornos. | `package.json`, `src/app/`, `src/lib/db/`, `prisma/`, configuración de CI y variables documentadas sin valores. | Aplicación ejecuta en desarrollo; CI valida tipos/lint/build; migraciones se aplican y revierten en una base no productiva cuando se aprueben configuración y esquema; no hay secretos en el repositorio. |
| 2. Cuenta, perfiles y permisos | **Primer corte implementado:** cuenta con correo/contraseña, sesión, ruta privada, roles globales y auto-adopción limitada. **Pendiente:** perfiles comerciales, membresías/organizaciones, aprobación de roles privilegiados y matriz de permisos final. | `src/features/auth/`, `src/lib/auth/`, modelos Prisma y pruebas de autorización. | Pruebas demuestran denegación de roles privilegiados al input público; página privada redirige sin sesión; roles se consultan en servidor. La aprobación de producto sigue pendiente. |
| 3. Productos e inventario | **Primer corte implementado:** crear/editar registros privados de producto e inventario para productores, filtrados por propietario. **Corte actual:** estado explícito de publicación con valor seguro privado. **Pendiente:** fotografía, filtros, historial y reglas de inventario. Requiere identidad/permisos. | `src/features/products/`, rutas privadas de cuenta, Prisma/migración y pruebas de autorización/validación. | Productor autorizado crea y edita sus propios registros; comprador sin rol y otro propietario reciben denegación; cantidad cero se muestra agotada y positiva disponible; ningún registro nuevo se publica por defecto. |
| 4. Descubrimiento y compartición | **Hipótesis implementada para revisión:** página web de catálogo de solo lectura sin sesión, limitada a productos publicados y con cantidad positiva, con campos mínimos propuestos. Incluye filtros opcionales por categorías existentes, municipio y paginación de 12 productos; añade rutas estables compartibles por producto, acción de compartir/copiar y metadatos Open Graph/Twitter con campos permitidos. La política de visibilidad requiere aprobación antes de considerarse definitiva; el tamaño de página y la coincidencia exacta del municipio quedan por validar. | `src/app/catalogo/`, `src/features/catalog/`, proyección pública y pruebas de privacidad/estado, query, paginación y metadatos. | Registros privados/retirados/agotados no aparecen; la vista y los metadatos exponen solo nombre, categoría, cantidad/unidad, precio y municipio, sin contacto/identidad del productor ni dirección precisa; publicar/retirar requiere sesión, rol productor y propietario; la vista es utilizable en teléfono. |
| 5. Pedidos y notificaciones | Implementar estados acordados, solicitudes/decisiones, consistencia de inventario, historial e integración Brevo si se confirma. Requiere fase 3 y decisiones de fase 0. | `src/features/orders/`, `src/features/notifications/`, `src/server/services/`, webhooks/Route Handlers y pruebas de integración/concurrencia. | Transiciones no autorizadas se rechazan; confirmaciones concurrentes no exceden stock; reintentos de una solicitud con la misma clave no duplican pedidos y repetir una decisión idéntica no duplica efectos; falla de notificación no pierde el pedido. |
| 6. PWA y sincronización | **Primer corte implementado:** shell estático y fallback acotado a las rutas públicas exactas `/` y `/catalogo`; indicador de conexión. No guarda catálogo ni escrituras. Futuro caché de catálogo/borradores/sincronización requiere aprobación y controles demostrables. | `public/sw.js`, `public/offline-policy.js`, `src/components/offline-status.tsx`, `src/app/` y pruebas de política offline. | El shell genérico se muestra ante fallo de red solo en rutas admitidas; catálogo/productos, datos privados y mutaciones no se cachean; no se solicita ni confirma offline. Las futuras capacidades necesitan pruebas en navegadores/dispositivos objetivo y reglas explícitas. |
| 6 bis. Integración social Meta (propuesta; no implementada) | Validar alcance/privacidad en fase 0; requiere identidad/autorización de fases 2–4 y configuración Meta. Secuencia: Meta App y activos de prueba autorizados; OAuth y vinculación de cuenta; publicar por canal de forma incremental; añadir mensajes/webhooks solo si se aprueba; App Review/Advanced Access y Business Verification antes del acceso externo cuando Meta lo exija. | `src/features/integrations/meta/`, Route Handlers OAuth/webhooks, persistencia cifrada mínima, interfaz del productor y pruebas unitarias/integración con dobles; rutas tentativas que no representan código existente. | Solo el propietario autorizado conecta/desconecta sus activos; secretos/tokens no llegan al cliente ni a logs/caché; permisos y capacidades denegados se manejan sin éxito falso; eventos son verificados e idempotentes; límites/ventanas se respetan; cuentas de prueba pasan y App Review/verificaciones aplicables se completan antes de usuarios externos. |
| 7. Endurecimiento y piloto | Completar pruebas, accesibilidad, rendimiento, seguridad, respaldo/restauración, monitoreo, manuales y piloto con usuarios. Requiere fases 1–6. | `tests/`, configuración de despliegue/observabilidad, documentación operativa y guía de usuario. | Recorridos E2E y controles acordados pasan; no hay bloqueos críticos de seguridad/accesibilidad; restauración y procedimiento de incidentes se ensayan; piloto obtiene aprobación de responsables y usuarios. |

## Riesgos principales y mitigación

| Riesgo | Consecuencia | Mitigación y señal de verificación |
|---|---|---|
| Conectividad inestable o teléfonos modestos | Abandono, datos agotados o operaciones que parecen haberse perdido. | Medir en redes/dispositivos objetivo; páginas ligeras, reintentos visibles y alcance offline acotado; pruebas de desconexión y reconexión. |
| Inventario desactualizado y pedidos simultáneos | Sobreventa o pérdida de confianza. | Fuente de verdad en servidor, transacciones/condiciones de actualización, historial de movimientos y pruebas concurrentes. |
| Roles y pertenencia a asociaciones ambiguos | Exposición o modificación de datos ajenos. | Resolver matriz de permisos en fase 0; autorización por objeto en servidor; pruebas negativas para cada operación. |
| Compartición pública filtra información | Riesgo de privacidad y seguridad para productores. | Lista explícita de campos públicos, minimización, revocación y pruebas de respuesta pública antes de activar enlaces. |
| Costos, límites o indisponibilidad de terceros | Imágenes/notificaciones fallidas o costos inesperados. | Cuotas y presupuestos, límites de carga, adaptadores, reintentos acotados, alertas y degradación sin perder pedidos. |
| Cambios de permisos, límites o revisión de Meta | Una función social puede fallar, quedar limitada a pruebas o no recibir acceso avanzado. | Separar adaptador de Meta, permisos mínimos, OAuth revocable, pruebas con activos autorizados, estados de error visibles y no habilitar cuentas externas hasta aprobación/validación vigente. |
| Sincronización duplica o contradice escrituras | Pedidos duplicados, estado confuso o stock incorrecto. | Idempotencia, servidor como autoridad, conflictos explicables y pruebas de reintento/concurrencia. |
| Producto no coincide con prácticas locales | Baja adopción o flujos que no se pueden completar. | Investigación con productores/compradores de las comunidades objetivo y piloto antes del lanzamiento amplio. |
| Repositorio sin aplicación ni documentación | Decisiones erróneas al asumir dependencias, despliegue o requisitos no observados. | Tratar el plan como propuesta, validar con responsables en fase 0 y no presentar elementos propuestos como existentes. |

## Criterio de salida de planificación

La autenticación, los roles, la captura privada inicial de producto/inventario, un catálogo público bajo hipótesis, el flujo de pedidos con reintentos idempotentes de creación y decisión, y un shell estático offline acotado están implementados. La integración enlaza cada oferta pública y disponible a su solicitud; la visibilidad pública y las demás decisiones provisionales siguen abiertas. Antes de ampliar la fase 2 hacen falta verificación/recuperación de cuenta, perfiles y el proceso confiable para asociación/administrador. La taxonomía, unidades y política de publicación requieren validación. No se implementan caché del catálogo, borradores, operaciones ni sincronización offline.

### Fuentes técnicas consultadas

- [Autenticación en Next.js](https://nextjs.org/docs/app/guides/authentication): recomienda una biblioteca para autenticación, sesiones y autorización.
- [Integración de Better Auth con Next.js](https://www.better-auth.com/docs/integrations/next): documenta Route Handlers, Server Components y la integración Next.js 16 (`proxy`).
- [Better Auth con Prisma](https://www.better-auth.com/docs/adapters/prisma): documenta Prisma 6 y Prisma 7; el adaptador actual no soporta Prisma 8.
- [Correo y contraseña en Better Auth](https://www.better-auth.com/docs/authentication/email-password): define el flujo, validaciones y requisitos de verificación/correo.
- [Límites de solicitudes en Better Auth](https://www.better-auth.com/docs/concepts/rate-limit): documenta el rate limiting integrado y el almacenamiento para serverless.
- [Prisma con Neon](https://www.prisma.io/docs/orm/v6/overview/databases/neon): documenta el adaptador serverless y la recomendación de conexión agrupada para ejecución serverless.
- [Instagram Platform overview](https://developers.facebook.com/documentation/instagram-platform/overview): modos de login, requisitos de cuenta profesional, permisos, niveles de acceso, revisión y tokens.
- [Instagram Content Publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing): requisitos, permisos, formatos/endpoints y límite de publicación.
- [Meta Pages API: Posts](https://developers.facebook.com/documentation/pages-api/posts): publicación/lectura/edición/borrado de publicaciones de Page y permisos/tareas.
- [Instagram Messaging: Get started](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/get-started/): cuenta/Page, permisos, token Page, conversaciones y webhooks.
- [Messenger Platform: Get started](https://developers.facebook.com/documentation/business-messaging/messenger-platform/get-started): Page access token, permisos y respuesta a conversaciones iniciadas por clientes.
- [Messenger Platform: Send messages](https://developers.facebook.com/documentation/business-messaging/messenger-platform/send-messages): ventana estándar, tipos de mensajes y restricciones a mensajes salientes.
- [Meta Webhooks for Messenger Platform](https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks): endpoint HTTPS, suscripciones, verificación y requisitos temporales de respuesta.
- [Meta access tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens): tipos de token, token de Page y uso seguro.
- [Business Login for Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login): scopes, OAuth, configuración y token de 60 días.
- [App Review process](https://developers.facebook.com/documentation/resp-plat-initiatives/individual-processes/app-review): requisitos de revisión para personas sin rol de app/negocio.
- [Instagram Messaging App Review](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/app-review): requisitos de review para mensajería de Instagram.
