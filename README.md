# Moodle Plataformas Manager

Monorepo con dos proyectos independientes que trabajan juntos para gestionar una plataforma Moodle desde fuera:

## `moodle-plugin/`

Plugin de Moodle (`local_miplugin`) que expone la funcionalidad vía Web Services y añade una pequeña página de administración propia (registro de actividad + notas por curso). Pensado para instalarse en `<moodle>/local/miplugin`.

Incluye ejemplos prácticos de las principales APIs de desarrollo de Moodle: Web Services, Database API (transacciones, JOIN, recordsets), Forms API, Output/Page API + Navigation, Access API (capabilities), Fragment API + JS/AMD, y una integración básica (sin verificar en runtime) con la app móvil.

## `platform-manager/`

Aplicación externa en Next.js que consume la API del plugin: dashboard, gestión de cursos (con imagen de portada), usuarios y matriculaciones. Ver `platform-manager/.env.local.example` para la configuración necesaria.

## Cómo se relacionan

`platform-manager` habla con Moodle exclusivamente a través de las funciones de Web Service que expone `moodle-plugin` (más algunas funciones core de Moodle reutilizadas). El token de acceso nunca sale del servidor de `platform-manager`.
