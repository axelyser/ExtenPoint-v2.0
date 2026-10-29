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

Todavía faltan generación/escaneo de QR, sesiones de asistencia con vencimiento, carga de archivos de evidencia y adopción institucional. La aprobación y validación de demo siguen sin ser autorización ni acreditación oficial de FIUNA. El mínimo de 30 horas y las líneas de acción son controles informativos del progreso acumulado; no son el objetivo del ranking semestral.

La comprobación de navegador también incluyó la restauración de sesión del organizador y la creación de una actividad pendiente mediante el formulario conectado a Supabase. Se confirmó el mensaje de guardado y la ficha devuelta desde el servidor.

