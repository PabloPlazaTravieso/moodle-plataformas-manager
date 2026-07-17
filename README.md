# Moodle Plataformas Manager

Monorepo con dos proyectos independientes que trabajan juntos para gestionar una plataforma Moodle desde fuera:

## `moodle-plugin/`

Plugin de Moodle (`local_miplugin`) que expone la funcionalidad vía Web Services y añade una pequeña página de administración propia (registro de actividad + notas por curso, en *Site administration → Plugins → Local plugins → Mi Plugin*). Pensado para instalarse en `<moodle>/local/miplugin`.

Cubre de forma práctica las principales APIs de desarrollo de Moodle:

- **Web Services** — funciones propias (`local_miplugin_*`) más funciones core reutilizadas, todas agrupadas en el servicio "Gestor de plataformas Moodle"
- **Database API** — transacciones (`start_delegated_transaction`), JOIN entre tablas, `sql_like()` portable, y `get_recordset()` para conjuntos grandes
- **Upgrade API** — `db/install.xml` + `db/upgrade.php` para las tablas propias (`local_miplugin_notes`, `local_miplugin_log`)
- **Forms API** — formulario de notas (`classes/form/note_form.php`)
- **Output/Page API + Navigation** — página propia con renderer + plantillas Mustache, enlazada desde Site administration
- **Fragment API + JS/AMD** — borrar una nota sin recargar la página (`amd/src/notes.js`)
- **Access API** — capabilities granulares por función
- **Scheduled tasks** — limpieza automática de notas antiguas
- **Event observers** — el registro de actividad se rellena también cuando algo pasa directamente en Moodle (no solo a través de la app), escuchando `course_created` y `user_enrolment_created`
- **Privacy API** — `classes/privacy/provider.php` completo (export/delete) para las tablas propias
- **App móvil** — integración básica vía `db/mobile.php` (sin verificar en runtime, no hay app móvil corriendo en este entorno)

**Testing** en las 3 capas: PHPUnit (`tests/`), PHPCS con el estándar `moodle-cs`, y Behat (`tests/behat/notes.feature`) con navegador real.

## `platform-manager/`

Aplicación externa en Next.js que consume la API del plugin. No entra a Moodle directamente — todo pasa por el token guardado en el servidor de esta app.

Funcionalidades:

- **Dashboard** — info del sitio + gráficas de actividad reciente (a partir del registro de actividad del plugin)
- **Cursos** — crear/editar/borrar, resumen, imagen de portada, visibilidad (toggle rápido), fechas de inicio/fin, filtro por categoría, búsqueda
- **Categorías** — crear/borrar (con fallback automático de destino al borrar una categoría raíz)
- **Usuarios** — crear/editar/borrar, suspender/activar, roles visibles, página de detalle con sus cursos matriculados
- **Matriculaciones** — matricular/desmatricular con selector de rol real (Student, Teacher, Manager...)

Ver `platform-manager/.env.local.example` para la configuración necesaria (`MOODLE_URL`, `MOODLE_TOKEN`, credenciales de la app, etc.).

**Testing**: Vitest (`lib/__tests__/`) para la capa de serialización de parámetros hacia Moodle.

## Cómo se relacionan

`platform-manager` habla con Moodle exclusivamente a través de las funciones de Web Service que expone `moodle-plugin` (más algunas funciones core de Moodle reutilizadas). El token de acceso nunca sale del servidor de `platform-manager`.
