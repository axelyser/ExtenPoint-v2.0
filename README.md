# ExtenPoint

**Tu extensión universitaria, en un solo lugar.**

ExtenPoint es un prototipo para hack.exe 2026 que conecta a estudiantes, organizadores y directivos de la Facultad de Ingeniería de la Universidad Nacional de Asunción (FIUNA). Reúne actividades, inscripción por QR, seguimiento de horas y un ranking semestral para incentivar la participación.

**[Abrir la demo](https://extenpoint-v20.vercel.app/)**

> Proyecto académico no oficial. Las cuentas y los datos de demostración son ficticios. La aprobación de actividades y la validación de horas dentro de la demo no constituyen acreditación institucional de FIUNA.

## Funciones por rol

| Rol | Funciones |
| --- | --- |
| Estudiante | Consulta su progreso e historial, descubre actividades, confirma su inscripción y ve sus horas y puesto en el ranking semestral. Puede compartir el QR de una actividad. |
| Organizador | Crea propuestas, consulta los inscritos de sus actividades, registra participaciones y asistencias, y revisa las horas. Puede reenviar propuestas rechazadas. |
| Directivo | Revisa las propuestas pendientes y las aprueba o rechaza con una observación. |

El inicio ofrece un único botón **Ingresar**. La cuenta determina el rol y los apartados disponibles. El servidor también comprueba los permisos de cada operación.

## Recorrido de una actividad

1. El organizador crea una propuesta con su regla provisional y la evidencia requerida.
2. El directivo revisa y aprueba o rechaza la propuesta.
3. Una actividad aprobada y abierta permite que el estudiante confirme su inscripción.
4. El organizador registra la participación y revisa las horas propuestas.
5. Las horas validadas en la demo aparecen en el progreso y el ranking correspondiente.

**Inscripción, asistencia y validación son pasos distintos.** Escanear un QR o inscribirse no concede horas automáticamente.

### Ranking semestral

- Top 10 y posición personal del estudiante.
- Solo suma horas validadas de actividades cuya fecha pertenece al semestre seleccionado.
- Primer semestre: enero a junio. Segundo semestre: julio a diciembre. Esta división es una decisión del prototipo.
- Las participaciones pendientes o rechazadas no suman.
- Los empates comparten puesto y la siguiente posición salta los lugares ocupados, por ejemplo: 1, 2, 2, 4.

La simulación incluye **750 estudiantes ficticios** y un primer puesto inicial de **10 horas**. Las horas de la demo son enteras. Estos valores no representan usuarios reales ni equivalencias oficiales de créditos.

El progreso acumulado hacia la referencia informativa de 30 horas se muestra por separado del ranking semestral. Los controles de líneas de acción y participación sociocomunitaria también son informativos.

### Inscripción por QR

Cada actividad aprobada tiene un QR estable generado automáticamente. El organizador puede descargarlo en SVG o copiar el enlace. El estudiante también puede compartirlo desde la ficha de la actividad.

Al escanearlo con la cámara del teléfono se abre una dirección como:

~~~text
https://extenpoint-v20.vercel.app/#actividad/ID
~~~

Si el estudiante todavía no inició sesión, la aplicación conserva la actividad y vuelve a ella después de autenticarlo. Supabase impide inscripciones duplicadas y bloquea nuevas inscripciones en actividades finalizadas. El estudiante consulta sus registros en **Mis inscripciones**.

El QR se genera en el navegador con una biblioteca incluida en el proyecto, sin enviar el enlace a un servicio externo. La aplicación no necesita acceso a la cámara.

## Probar la demo

Las credenciales de las cinco cuentas de prueba se entregan por separado en ACCESOS_DEMO.md, que no forma parte del repositorio:

- Dos estudiantes: Lucía y Mateo.
- Dos organizadores: Camila y Diego.
- Una cuenta directiva.

Los demás estudiantes son registros de simulación del ranking y no tienen una cuenta de acceso individual.

Para probar una inscripción, ingresa como estudiante, abre **Inscripciones**, elige una actividad disponible y pulsa **Confirmar mi inscripción**. Después consulta **Mis inscripciones** o comparte su QR.

El catálogo incluye actividades ficticias planificadas para noviembre y diciembre de 2026, como apoyo comunitario, reparación de computadoras, materiales digitales para escuelas, tutorías y eficiencia energética. Su disponibilidad puede cambiar durante las pruebas. Las seis actividades adicionales están descritas en [supabase/demoActivities.json](supabase/demoActivities.json).

## Ejecutar localmente

Requisitos: una versión moderna de Node.js con soporte de módulos ES y conexión a Internet para acceder a Supabase.

~~~powershell
git clone https://github.com/axelyser/ExtenPoint-v2.0.git
cd ExtenPoint-v2.0
node serve.js
~~~

Abre [http://127.0.0.1:4173](http://127.0.0.1:4173). No se requiere npm install ni una compilación del frontend.

Para ejecutar las pruebas de lógica:

~~~powershell
npm test
~~~

## Tecnología y estructura

Frontend estático con **HTML, CSS y JavaScript**, sin framework. **Supabase Auth** gestiona el acceso y **PostgreSQL** almacena los datos compartidos. El frontend se publica en **Vercel**.

~~~text
assets/       Imágenes y marca
css/          Estilos
js/           Interfaz, reglas, ranking, QR y conexión a Supabase
scripts/      Herramientas administrativas de terminal
supabase/     Esquema SQL, migración de inscripciones y catálogo de demo
tests/        Pruebas de lógica
index.html    Entrada de la aplicación
serve.js      Servidor local de desarrollo
~~~

### Datos y permisos

| Tabla | Contenido |
| --- | --- |
| epx_students | Perfiles de estudiantes. |
| epx_profiles | Relación con la cuenta Auth, rol y estudiante asociado. |
| epx_activities | Actividades, organizador propietario y aprobación. |
| epx_registrations | Inscripciones de estudiantes en actividades. |
| epx_participations | Participaciones, horas y estado de revisión. |
| epx_audit | Bitácora con actor autenticado y fecha del servidor. |

Las tablas tienen Row Level Security (RLS). Las funciones epx_state y epx_apply comprueban identidad, rol, propiedad y transiciones. Las operaciones de negocio pasan por funciones del servidor, con restricciones para evitar duplicados y comprobaciones de versión para detectar conflictos.

Los datos persisten entre dispositivos. **Actualizar datos** consulta el estado del servidor, al igual que volver a la pestaña. No hay una suscripción Realtime de actualización continua.

### Configuración

- [js/supabaseConfig.js](js/supabaseConfig.js): URL y clave pública del proyecto Supabase.
- [js/siteConfig.js](js/siteConfig.js): dominio público que utilizan los QR, incluso desde localhost.
- [supabase/schema.sql](supabase/schema.sql): esquema base.
- [supabase/002_qr_registrations.sql](supabase/002_qr_registrations.sql): migración de inscripciones, que se aplica después del esquema base al preparar una base nueva.

La base compartida de la demo ya tiene aplicada la migración. Publicar cambios del frontend no requiere volver a ejecutarla. Para usar otro proyecto Supabase también debes configurar sus cuentas Auth, perfiles y datos de prueba.

Las credenciales administrativas, claves service_role, contraseñas y archivos .env deben mantenerse fuera del frontend y del repositorio. La clave pública del navegador depende de los permisos y las comprobaciones del servidor.

### Crear cuentas de prueba

La herramienta [scripts/create-account.mjs](scripts/create-account.mjs) crea cuentas desde una terminal administrativa. Recibe el token mediante EXTENPOINT_PAT y obtiene las credenciales administrativas solo en memoria. Para una cuenta estudiantil, su registro debe existir previamente.

Ejemplos de argumentos, sin incluir credenciales administrativas:

~~~powershell
node scripts/create-account.mjs estudiante alumno@extenpoint.example.com DEMO-003 "Sofía Acosta"
node scripts/create-account.mjs organizador equipo@extenpoint.example.com "" "Equipo de demostración"
~~~

El script genera e imprime la contraseña o utiliza EXTENPOINT_ACCOUNT_PASSWORD si está definida. No es una herramienta para ejecutar desde la web. La interfaz no ofrece registro público ni recuperación de contraseña.

## Publicación en Vercel

El proyecto sirve archivos estáticos, sin paso de compilación. Vercel debe publicar la carpeta que contiene index.html. Con el repositorio conectado, los cambios enviados a la rama configurada generan un nuevo despliegue.

Si cambia el dominio público, actualiza js/siteConfig.js para que los nuevos QR apunten a la dirección correcta. Las rutas con # no necesitan reglas de reescritura.

## Alcance del prototipo

La demo incluye autenticación por roles, aprobación de actividades, inscripción por QR, revisión de horas, historial y ranking semestral. Las pruebas automatizadas cubren cálculos, duplicados, reglas numéricas, aprobaciones, semestres y generación de QR.

Como siguientes pasos quedan la carga de archivos de evidencia, QR de asistencia con vencimiento y una revisión institucional antes de utilizar el sistema con datos reales. Actualmente la evidencia se registra como una referencia de texto y las horas requieren revisión manual. El prototipo no emite certificados oficiales.

La biblioteca qrcode-generator incluida en js/vendor conserva su licencia MIT.
