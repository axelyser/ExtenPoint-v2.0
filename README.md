# ExtenPoint · Supabase

Prototipo no oficial para hack.exe 2026. HTML, CSS y JavaScript sin frameworks ni dependencias de navegador. La base compartida está configurada en el proyecto Supabase ExtenPoint, referencia tbmjazskjxrgwofztazt.

## Iniciar

Abre esta carpeta en VS Code y ejecuta:

~~~powershell
node serve.js
~~~

Visita http://127.0.0.1:4173. No necesita npm install. Requiere Internet para acceder a Supabase. Para las pruebas locales: node --test tests/*.test.js.

## Cuentas y permisos

Las credenciales están en el archivo ACCESOS_DEMO.md entregado por separado. Hay cinco cuentas ficticias con contraseña: Lucía y Mateo como estudiantes, Camila y Diego como organizadores y una cuenta directiva. Los otros estudiantes son registros para la demostración del ranking y no tienen cuenta Auth individual.

| Rol | Función |
| --- | --- |
| Estudiante | Consulta su propio historial, progreso y posición en el ranking semestral. No puede registrar ni validar horas ni aprobar actividades. |
| Organizador | Crea actividades pendientes, registra estudiantes, gestiona asistencias y revisión de horas de las actividades que le pertenecen. Puede reenviar sus actividades rechazadas. |
| Directivo | Consulta las actividades y aprueba o rechaza las pendientes con una observación. No registra asistencias ni modifica horas. |

El rol procede de epx_profiles y no del selector, correo escrito ni metadatos editables de Auth. No existe ya el cambio libre de perfil de la fase local. Para cambiar de rol, cierra sesión e ingresa con la otra cuenta.

## Datos y flujos

Se cargaron 750 estudiantes, seis actividades y 2.239 participaciones ficticias. Se conservaron las reglas y colores actuales: primer puesto sintético de 10 horas, horas enteras y ranking por año/semestre. Son datos de demo, no equivalencias oficiales.

1. Organizador: crea una actividad y deja su regla provisional y evidencia requerida. Se guarda pendiente en Supabase.
2. Directivo: inicia otra sesión, pulsa Actualizar datos, revisa la actividad y aprueba o rechaza con observación.
3. Organizador: actualiza, selecciona una actividad propia aprobada y registra una participación pendiente.
4. Organizador: revisa la evidencia y valida en demo o rechaza. El registro queda en bitácora con actor y fecha del servidor.
5. Estudiante: actualiza y consulta las horas de su perfil y del semestre. Las pendientes o rechazadas no suman al ranking.

Actualizar datos vuelve a consultar el servidor; también se consulta al regresar a la pestaña. No hay suscripción Realtime ni actualización continua automática. Los datos están compartidos y son persistentes entre dispositivos, pero cada sesión debe recargar o actualizar para consultar cambios recientes. No se publicaron archivos de la web en un hosting.

No se ofrece un botón para borrar la base compartida. La sesión Auth se guarda localmente para restaurar el acceso; los registros académicos se leen y escriben en PostgreSQL, no en el localStorage de la fase anterior. Los datos locales anteriores permanecen en su clave original y no se importan automáticamente al proyecto remoto. La nube se inicializó con el conjunto canónico de demostración.

## Organización de la base

| Tabla | Contenido |
| --- | --- |
| epx_students | Estudiantes con ID estable y datos de perfil. |
| epx_profiles | Enlace a auth.users, rol y estudiante asociado cuando corresponde. |
| epx_activities | Actividades, regla provisional, aprobación y organizador propietario. |
| epx_participations | Enlace estudiante/actividad, horas y estado de revisión. |
| epx_audit | Bitácora del servidor con actor autenticado y fecha. |

Los IDs y relaciones se almacenan en columnas con claves primarias y foráneas; los campos de formulario permanecen en JSONB con restricciones. Hay una restricción única estudiante/actividad. RLS está activado en las cinco tablas. Las tablas de negocio no aceptan escrituras directas desde el navegador; las funciones epx_state y epx_apply comprueban identidad, rol, propiedad y transiciones. epx_apply ejecuta una operación en una transacción, verifica conflictos con la versión leída y genera su propia bitácora. Las referencias de evidencia ajenas se ocultan a las cuentas estudiantiles; los nombres ficticios y horas usados en el ranking son visibles para cuentas autenticadas.

El esquema aplicado se entrega en supabase/schema.sql. La configuración pública del navegador está en js/supabaseConfig.js. El token personal de administración y la clave service_role no están guardados en el proyecto ni en el ZIP.

## Crear más cuentas

Desde una terminal administrativa puedes usar scripts/create-account.mjs. El token se suministra por la variable EXTENPOINT_PAT y se elimina del entorno al terminar. El script obtiene la credencial administrativa solo en memoria, crea la cuenta confirmada sin enviar correo y asigna un rol. Si es estudiante, debe existir primero el registro creado desde el panel organizador.

Ejemplo de argumentos sin credenciales administrativas:

~~~powershell
node scripts/create-account.mjs estudiante alumno@extenpoint.example.com DEMO-003 "Sofía Acosta"
node scripts/create-account.mjs organizador equipo@extenpoint.example.com "" "Equipo de demostración"
~~~

La herramienta genera e imprime la contraseña de la nueva cuenta, o usa EXTENPOINT_ACCOUNT_PASSWORD si la defines. Estas son herramientas de terminal, no archivos para ejecutar desde la web. La gestión de cuentas y recuperación de contraseña no se ha incorporado a la interfaz. No hay registro público que pueda asignarse por sí mismo el rol directivo.

## Validación realizada

- Dieciséis pruebas unitarias de lógica aprobadas: cálculos, duplicados, reglas numéricas, aprobaciones, migraciones y semestres.
- Pruebas reales contra Supabase con las cinco cuentas: acceso, lectura compartida, bloqueo anónimo, lectura del perfil propio, creación pendiente, aprobación exclusiva del directivo, conflicto de actualización, pertenencia de actividades, duplicados en la base, revisión de participaciones, consulta desde otra sesión de estudiante y rechazo/reenvío con bitácora.
- Verificación de inicio de sesión desde el navegador y consulta del panel estudiantil.

Las pruebas remotas usan registros QA propios que se eliminan al finalizar, conservando los datos de demo. No se probó en un teléfono físico ni se desplegó en GitHub Pages durante esta actualización.

## GitHub Pages y siguiente etapa

Puedes publicar el contenido de esta carpeta desde main y /(root) en Settings → Pages de GitHub; las rutas son relativas y no hay compilación. Publicar el frontend no requiere el token administrativo: solo la URL y clave pública ya configuradas. Distribuye las cuentas de demo por separado si quieres controlar quién utiliza el organizador y el directivo.

La inscripción por QR ya está implementada. Todavía faltan QR de asistencia con vencimiento, carga de archivos de evidencia y adopción institucional. La aprobación y validación de demo siguen sin ser autorización ni acreditación oficial de FIUNA. El mínimo de 30 horas y las líneas de acción son controles informativos del progreso acumulado; no son el objetivo del ranking semestral.

La comprobación de navegador también incluyó la restauración de sesión del organizador y la creación de una actividad pendiente mediante el formulario conectado a Supabase. Se confirmó el mensaje de guardado y la ficha devuelta desde el servidor.



## Inscripción por QR automático

Cada actividad aprobada tiene un QR estable generado automáticamente en su ficha del organizador. No se necesita pulsar un botón para generarlo. El organizador puede descargar el SVG, imprimirlo, copiar el enlace y abrir la lista de inscritos. Los QR no se generan para actividades pendientes o rechazadas.

El destino público configurado es https://extenpoint-v20.vercel.app/ y se puede modificar en js/siteConfig.js. Una URL usa #actividad/ID, por lo que no necesita reglas de reescritura en Vercel. Al escanear con la cámara habitual del celular se abre esa ficha. Si falta sesión, el destino se conserva durante el inicio de sesión y luego se vuelve a la actividad para confirmar. No se pide permiso de cámara dentro de la aplicación ni se suben imágenes del celular.

Solo estudiantes autenticados pueden confirmar su propia inscripción. Supabase comprueba aprobación y que el estado sea planificada o en curso. Una actividad finalizada rechaza nuevas inscripciones. La restricción única de estudiante/actividad impide duplicados, incluso en solicitudes simultáneas. La repetición devuelve la inscripción existente. No crea asistencias, no modifica horas y no cambia el ranking.

El estudiante tiene Mis inscripciones y un listado de actividades abiertas. El organizador ve solamente las inscripciones de sus actividades; un estudiante ve solo las suyas. El directivo puede consultar las inscripciones desde los datos autorizados del servidor. La inscripción queda en la bitácora como un evento diferente de la revisión de horas.

La migración supabase/002_qr_registrations.sql ya fue aplicada al proyecto compartido. Para reconstruir la base, aplica primero schema.sql y después 002_qr_registrations.sql. No hace falta volver a ejecutarla al publicar los archivos en Vercel. Para que un teléfono use el nuevo flujo público, sube primero estos cambios al repositorio y espera el despliegue de Vercel.

Se dejó la actividad ficticia aprobada y abierta «Taller de apoyo escolar · Demo QR» como ejemplo. Está asignada al primer organizador de demo. La biblioteca qrcode-generator 1.4.4 está incluida localmente en js/vendor con licencia MIT; no se envían enlaces ni datos de estudiantes a servicios externos para generar QR.

Validación de esta versión: dieciocho pruebas unitarias aprobadas y decodificación de un QR con un lector independiente. Pruebas reales de Supabase: bloqueo antes de aprobar, cuentas y actividades inválidas, cierre por estado finalizada, inscripción concurrente sin duplicados, persistencia, listado visible solo al titular y organizador propietario y ausencia de cambios en participaciones u horas.

En navegador también se verificó el recorrido sin sesión → inicio de sesión → retorno a la actividad → confirmación → Mis inscripciones, con los apartados exclusivos de organizador y directivo ocultos para el estudiante. La actividad de ejemplo conserva las inscripciones ficticias de las pruebas para demostrar el listado.


Se comprobó además la lista de dos inscritos desde la cuenta organizadora y la descarga SVG desde la interfaz. El archivo descargado se decodificó con un lector independiente y contenía exactamente el dominio público y el ID de la actividad de ejemplo. No se probó una cámara física ni el despliegue de esta versión en Vercel.


## Acceso único y actividades abiertas de prueba

El inicio ofrece un único botón Ingresar y el formulario no precarga un correo según un rol elegido. Supabase identifica el rol de la cuenta al autenticarla y dirige al panel correspondiente. Si ya existe una sesión, el botón abre su panel.

Se agregaron seis actividades ficticias aprobadas y planificadas, con fechas de noviembre y diciembre de 2026: Jornada de apoyo comunitario, Clínica de reparación de computadoras, Materiales digitales para escuelas, Tutorías de física y matemáticas, Encuentro de tecnología y comunidad y Campaña de eficiencia energética. Cuatro pertenecen a la primera cuenta organizadora y dos a la segunda. El catálogo de ejemplo está en supabase/demoActivities.json; los registros ya fueron cargados en la base compartida sin inscribir a los estudiantes ni asignar horas.

Verificación: dieciocho pruebas unitarias aprobadas. En navegador se comprobó el botón único, las seis actividades como No inscrito para Mateo y la ficha de una de ellas con el botón Confirmar mi inscripción y su QR para compartir. La inscripción de prueba no se confirmó, para dejar las actividades disponibles para probar manualmente.
