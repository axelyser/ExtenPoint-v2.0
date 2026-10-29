# ExtenPoint

Prototipo académico local para hack.exe 2026, Reto 10. HTML, CSS y JavaScript moderno sin frameworks, bibliotecas externas ni compilación. Los nombres y registros de demostración son ficticios.

## Iniciar

Abre esta carpeta en Visual Studio Code. Desde la terminal de esta carpeta, con Node.js instalado:

```powershell
node serve.js
```

Visita http://127.0.0.1:4173. Para detenerlo, presiona Ctrl+C. También puedes usar Live Server de VS Code con `index.html`. Usa HTTP; abrir el HTML directamente con `file://` puede impedir cargar los módulos ES.

No se necesita `npm install`. Para comprobar la lógica:

```powershell
node --test tests/core.test.js
```

## Funciones

- Inicio y selección explícita de perfil de demostración, sin autenticación.
- Cinco estudiantes iniciales y formulario para registrar otros estudiantes ficticios.
- Actividades con ID estable, descripción, responsable, fecha, línea, tipo, modalidad, duración, estado y referencia de autorización.
- Reglas manuales provisionales con rol, referencia, límite opcional, evidencia requerida y observaciones. No se calculan equivalencias normativas automáticamente; el factor queda nulo.
- Asistencia manual con horas realizadas y propuestas separadas, evidencia y bloqueo de duplicados estudiante/actividad, incluso si el registro fue rechazado.
- Estados pendiente, validado en demo y rechazado; reapertura y bitácora de cambios con registro, actor de demostración y fecha.
- Validación de demo condicionada a referencia de evidencia y cantidades válidas. Es una revisión interna ficticia, no institucional.
- Panel con horas realizadas, propuestas registradas, pendientes, validadas, restantes, progreso, líneas, participación sociocomunitaria e historial filtrable.
- Control informativo del mínimo de 30 horas, tres líneas, 5 horas sociocomunitarias y máximos por línea. Exceder un máximo genera un requisito pendiente, sin ocultar ni recortar las horas cargadas.
- Almacenamiento versionado `extenpoint.v1`, escritura antes de actualizar la interfaz y manejo de fallos. Ante datos ilegibles se muestra una demo temporal y se bloquea la escritura hasta restablecer, sin sobrescribir silenciosamente los datos anteriores.
- Restablecimiento de datos ficticios con confirmación desde Inicio.
- Tablas con desplazamiento propio y diseño adaptable a celulares.

## Recorrido para el hackathon

1. Inicio → Entrar como organizador.
2. Crea una actividad, por ejemplo «Jornada ficticia», con línea Programa Educativo, duración 4, regla «Propuesta manual de 4 horas pendiente de revisión institucional», rol participante y evidencia «Informe final ficticio». La referencia de autorización puede quedar pendiente.
3. Asistencias → selecciona la actividad nueva y Lucía Benítez. Carga 4 horas realizadas, 4 propuestas y una referencia de informe ficticio.
4. Guarda: queda Pendiente, sin sumarse a las horas validadas.
5. Revisión interna → ubica esa actividad → Validar demo.
6. Mi extensión → Lucía: pasa de 8 a 12 horas validadas, quedan 6 pendientes y hay dos líneas con horas validadas.
7. Asistencias → intenta repetir Lucía en esa actividad: se bloquea el duplicado.
8. Recarga: la actividad y su participación permanecen. El perfil de acceso vuelve a Estudiante; los datos se conservan.

## Criterios y referencias aportadas

Se utilizó el archivo `Resumen_extension_FIUNA_para_IA.txt` facilitado por el usuario como contexto, con referencia a las resoluciones UNA 0353-00-2021 y FIUNA 0536-00-2024, Anexo III-I para estudiantes. No se consultaron los PDF originales ni se verificaron modificaciones normativas posteriores.

El resumen menciona el requisito FIUNA en el artículo 17, mientras el pedido lo menciona en el 16. El prototipo evita resolver esa discrepancia: presenta requisitos numéricos informativos y remite a revisión institucional. Topes usados por línea: 15, 15, 10, 10, 5, 10 y 10 horas; mínimo sociocomunitario de 5.

Todas las actividades y cantidades iniciales se identifican como propuestas manuales provisionales. No representan equivalencias oficiales verificadas, aunque algunas participaciones tengan el estado ficticio Validado en demo. Ni alcanzar los umbrales ni presentar una referencia de informe acredita oficialmente la extensión. Se requiere revisar categorías, roles, límites por evento y línea, autorizaciones, evidencia e informe final con la instancia competente.

## Arquitectura

- `js/storage.js`: persistencia, validación del estado y datos iniciales. Puede sustituirse por un repositorio remoto.
- `js/data.js`: creación de estudiantes, actividades, participaciones y revisión.
- `js/extensionRules.js`: validación numérica, líneas, máximos y cálculos derivados de las participaciones.
- `js/app.js`: navegación, formularios y presentación; escapa contenido antes de generar HTML.
- `css/style.css`: estilos y puntos de adaptación.
- `tests/core.test.js`: pruebas sin dependencias con el ejecutor de Node.
- `serve.js`: servidor de desarrollo local; no es un backend de datos.

## Pruebas ejecutadas

Cinco pruebas automáticas aprobadas con Node.js:

1. Crear actividad, registrar, validar, consultar totales, bloquear duplicado y serializar/recargar.
2. Rechazar, validar repetidamente y reabrir sin duplicar las horas.
3. Rechazar cantidades negativas o inválidas, roles incompatibles, exceso de duración/límite y validación sin referencia de evidencia.
4. Mínimo sociocomunitario, máximos por línea y requisitos informativos.
5. Alta de estudiante, lectura corrupta/incompatible, error de escritura y duplicados almacenados.

Prueba de interfaz realizada en el navegador: navegación, creación de «Jornada ficticia QA», asistencia pendiente, bloqueo de duplicado, validación, bitácora, actualización de Lucía a 12 horas, recarga con persistencia y vista de 390 × 844. Sin errores de JavaScript registrados por el navegador durante ese recorrido. La vista móvil es una emulación de tamaño; no se probó en un teléfono físico.

No se probó una publicación real en GitHub Pages. Las rutas son relativas y la aplicación no necesita backend ni compilación, por lo que está preparada para ese alojamiento. No se ejecutó automáticamente todo el catálogo de escalas normativas.

## Publicar en GitHub Pages

No se creó repositorio remoto ni se publicaron cambios.

1. Copia el contenido de esta carpeta a la raíz de un repositorio de GitHub, conservando `.nojekyll` y las subcarpetas.
2. Confirma y sube los archivos a la rama `main` cuando decidas publicarlos.
3. En el repositorio: Settings → Pages → Deploy from a branch → `main` y `/(root)` → Save.
4. Abre la URL proporcionada por GitHub Pages y repite el recorrido de demostración. Si el proyecto está en una subcarpeta, muévelo a la raíz o a `docs` y elige esa carpeta como origen.

Los datos guardados en localhost no se transfieren al dominio de GitHub Pages. Cambiar el origen o el puerto utiliza otro almacenamiento.

## Limitaciones y siguiente fase QR

Los datos son de un solo navegador. No hay sincronización, autenticación, permisos reales, copias de seguridad, subida de evidencias ni certificados. El organizador registra referencias de evidencia como texto; el prototipo no comprueba el contenido documental. No hay rankings, medallas ni notificaciones.

Para un QR real entre dispositivos hacen falta:

- API y base de datos compartida con estudiantes, actividades y participaciones.
- Identidad autenticada y autorización de organizadores en el servidor.
- Restricción única de estudiante/actividad aplicada en la base de datos.
- Sesiones de asistencia con token firmado o aleatorio, vencimiento y políticas contra reutilización o registros fuera de horario.
- QR que apunte a una URL HTTPS de la actividad/sesión; el escaneo debe registrar en el servidor y el panel consultar los datos compartidos.
- Revisión institucional de reglas y documentos, permisos de evidencia y bitácora persistente.

Generar una imagen QR sin ese flujo no resuelve el requisito multidispositivo. Esta entrega completa la base manual local de la fase 1.
