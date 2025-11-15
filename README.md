#  Sistema de Monitoreo de Sonidos Respiratorios - API REST

API RESTful para el manejo, analisis y monitoreo de sonidos respiratorios, para el sistema IoT portátil orientado a la detección de enfermedades como asma y bronquitis en niños.

##  Tecnologias utilizadas

- Node.js + Express.js
- MongoDB Atlas (almacenamiento en la nube)
- Mongoose (ODM para MongoDB)
- JWT (autenticación)
- Multer (subida de archivos)
- FFmpeg (conversión de audios)
- Postman (para pruebas de endpoints)


## Estructura de carpetas
src/
  ── analysis/     Módulos que procesan los sonidos respiratorios (.wav)
  ── config/       Conexión a la base de datos MongoDB Atlas
  ── controllers/  Acciones específicas según cada ruta (guardar, consultar, procesar)
  ── middleware/   Funciones que protegen rutas con tokens o validan roles
  ── models/       Esquemas de Mongoose: paciente, usuario, medición, alerta, reporte, usuario.
  ── routes/       Rutas expuestas por la API para acceder a funcionalidades
convertir_wav.js   Script que convierte archivos .wav a formato mono/44.1kHz
server.js          Archivo principal que lanza el servidor Express
.env               Variables como puerto, URI de MongoDB, clave secreta JWT




##  Autenticación

La API usa JWT (JSON Web Tokens) para proteger rutas sensibles.  
Los usuarios deben iniciar sesión para acceder a la mayoría de funcionalidades.

- Login: `POST /api/auth/login`
- Registro: `POST /api/auth/registrar`
- Las rutas protegidas requieren un token como: `Authorization: Bearer TU_TOKEN`



##  Endpoints principales (resumen)

-  **Usuarios**:
  - `POST /api/auth/registrar`
  - `POST /api/auth/login`
  - `GET /api/auth/perfil`

-  **Pacientes**:
  - `POST /api/pacientes`
  - `GET /api/pacientes`
  - `GET /api/pacientes/:id`
  - `GET /api/pacientes/:id/resumen`

-  **Mediciones**:
  - `POST /api/mediciones`
  - `GET /api/mediciones/paciente/:pacienteId/historial`
  - `GET /api/mediciones/paciente/:pacienteId/estadisticas`

-  **Análisis de audio (.wav)**:
  - `POST /api/analysis/detect-file`

-  **Alertas médicas**:
  - `POST /api/alertas`
  - `GET /api/alertas/paciente/:pacienteId`
  - `PATCH /api/alertas/:alertaId/leida`

-  **Reportes clínicos**:
  - `POST /api/reportes`
  - `GET /api/reportes/paciente/:pacienteId`

-  **Dispositivos IoT**:
  - `POST /api/dispositivos`



##  Pruebas con Postman

Para probar esta API se hace uso de Postman:

1. Inicia sesión (`/auth/login`) con un médico o familiar.
2. Copiar el token recibido y añadirlo en la pestaña `Authorization > Bearer Token`.
3. Probar cualquier endpoint protegido: `/pacientes`, `/mediciones`, `/alertas`, etc.

Uso del script `convertir_wav.js` para convertir tus audios al formato aceptado por el sistema: mono, 44.1kHz, 16 bits.



##  Progreso actual de la API

| Modulo                        | Estado   | Descripción                                                                |
------------------------------------------------------------------------------------------------------------------------|
| Registro/Login               |  Hecho    | Usuarios pueden registrarse e iniciar sesión con rol (médico, familiar).   |
| Gestión de pacientes         |  Hecho    | Médicos pueden crear y consultar pacientes.                                |
| Medición de síntomas         |  Hecho    | Se puede guardar la frecuencia, sibilancias, roncus, audio.                |
| Análisis de audios           |  Hecho    | Se permite subir audios `.wav` y clasificarlos automáticamente.            |
| Alertas médicas              |  Hecho    | Se generan manualmente por ahora.                                          |
| Reportes clínicos            |  Hecho    | Médicos pueden generar reportes vinculados a pacientes.                    |
| Dispositivos IoT             |  Hecho    | Se pueden registrar dispositivos como `ESP32_SAM_001`.                     |
| Resumen clínico              |  Hecho    | Endpoint `/pacientes/:id/resumen` que genera una vista rápida del caso.    |
| Autenticación con JWT        |  Hecho    | Rutas protegidas con token.                                                |



