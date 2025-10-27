## CRM - Módulo de Productividad

Requisitos: Node.js y acceso a una base de datos MySQL con las tablas `Ejecutivos`, `Visitas` y `Ventas`.

Variables de entorno (archivo `.env` en `server/`):

DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, PORT (opcional)

Instalar dependencias y ejecutar servidor:

```powershell
cd server
npm install
npm run dev
```

Endpoints disponibles:

- GET /api/ejecutivos
- GET /api/productividad

El endpoint `/api/productividad` retorna por ejecutivo: total de visitas, total de ventas, monto total de ventas, tasa de conversión, promedio de venta por visita y ticket promedio.
