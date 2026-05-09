# Sistema de Seguridad UTA — Sprint 1

**Universidad Técnica de Ambato | FISEI | Ingeniería en Software**

## Arquitectura

```
App Móvil (React Native)          Panel Admin (React Web)
        │                                   │
        └──────────── API Gateway :8090 ────┘
                      (YARP Reverse Proxy)
                   ┌──────┬──────┬──────┐
                   │      │      │      │
               Msvc-A  Msvc-B  Msvc-C  WS
               :8081   :8082   :8083   /ws
             Usuarios Alertas  Zonas
              + JWT   + WS     + Geo
               SQL-A   SQL-B   SQL-C
```

## Requisitos previos

- Docker Desktop instalado y corriendo
- .NET 8 SDK (para desarrollo local sin Docker)
- Node.js 18+ (para frontend y admin-panel)

## Levantar todo el sistema

```bash
git clone <url-repo>
cd uta-seguridad
docker-compose up --build
```

Primera vez: tarda ~3-5 minutos mientras descarga imágenes SQL Server y compila .NET.

## Credenciales de prueba

| Usuario | Correo | Contraseña | Rol |
|---|---|---|---|
| Martin Palacios | m.palacios@uta.edu.ec | Admin2026! | Administrador |
| Juan P. Paredes | j.paredes@uta.edu.ec | Guardia2026! | Guardia (Zona B) |
| David Pérez | d.perez@uta.edu.ec | Guardia2026! | Guardia (Zona D) |
| Guardia Prueba | guardia3@uta.edu.ec | Guardia2026! | Guardia (Zona A) |
| Abel Chiriboga | a.chiriboga@uta.edu.ec | Est2026! | Estudiante (Zona A) |
| Sheyla Pacha | s.pacha@uta.edu.ec | Est2026! | Estudiante (Zona C) |
| Ana Torres | a.torres@uta.edu.ec | Doc2026! | Docente (Zona A) |
| Rosa Molina | r.molina@uta.edu.ec | Doc2026! | Docente (Zona C) |

## Endpoints principales

Todos los endpoints pasan por el **API Gateway en :8090**

### Autenticación
```
POST http://localhost:8090/api/auth/login
Body: { "correo": "...", "password": "..." }
→ Devuelve JWT token
```

### Usuarios (requiere rol Administrador)
```
GET  http://localhost:8090/api/usuarios?pagina=1&tamaño=10&rol=Guardia
PUT  http://localhost:8090/api/usuarios/{id}/rol
     Body: { "nuevoRol": "Guardia" }
PATCH http://localhost:8090/api/usuarios/{id}/estado
     Body: { "nuevoEstado": "Activo" }
```

### Alertas (requiere JWT)
```
POST  http://localhost:8090/api/alertas
      Body: { "latitud": -1.234, "longitud": -78.678, "motivo": "Robo" }
GET   http://localhost:8090/api/alertas?zona=Zona A&estado=Activa
PATCH http://localhost:8090/api/alertas/{id}/asumir
POST  http://localhost:8090/api/alertas/{id}/cerrar
```

### Zonas GeoJSON
```
GET  http://localhost:8090/api/zonas
POST http://localhost:8090/api/zonas  (solo Admin)
PUT  http://localhost:8090/api/zonas/{id}
GET  http://localhost:8090/api/zonas/punto?lat=-1.234&lon=-78.678
```

### WebSocket
```
ws://localhost:8090/ws?token=<JWT>
```
El cliente se conecta con su JWT. Los guardias reciben notificaciones de nuevas alertas,
asunciones y cierres en tiempo real.

## Swagger (modo desarrollo)
- MicroservicioA: http://localhost:8081/swagger
- MicroservicioB: http://localhost:8082/swagger
- MicroservicioC: http://localhost:8083/swagger

## Estructura del repositorio

```
uta-seguridad/
├── src/
│   ├── MicroservicioA/     ← Usuarios, Roles, Auth JWT (Martin)
│   ├── MicroservicioB/     ← Alertas, WebSocket broadcast (Juan Pablo)
│   ├── MicroservicioC/     ← Zonas GeoJSON, Geolocalización (David)
│   └── ApiGateway/         ← YARP Reverse Proxy (Martin)
├── frontend/               ← App React Native (Abel)
├── admin-panel/            ← Panel React web (Sheyla)
├── docs/
├── docker-compose.yml
└── README.md
```

## Ramas de trabajo recomendadas

```bash
git checkout -b feature/microservicio-a-martin
git checkout -b feature/microservicio-b-juan
git checkout -b feature/microservicio-c-david
git checkout -b feature/app-movil-abel
git checkout -b feature/admin-panel-sheyla
```

## Roles válidos del sistema
`Estudiante` | `Docente` | `PersonalAdministrativo` | `Guardia` | `Administrador`

## Notas importantes

- **Sin Firebase**: toda la comunicación en tiempo real usa WebSockets nativos de .NET 8
- **JWT compartido**: los 3 microservicios validan el mismo token, emitido por Microservicio A
- **Migraciones automáticas**: cada microservicio crea y migra su BD al arrancar
- **GPS recomendado**: usar `expo-location` en React Native (más simple, sin SDKs pesados)
