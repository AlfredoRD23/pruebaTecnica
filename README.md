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

Importar ventas (ETL)

Desde la API se puede subir un archivo CSV o XLSX al endpoint:

- POST /api/ventas/import (multipart/form-data, campo `file`)

También existe un script CLI para cargas batch:

```powershell
cd 'c:\Users\avalenzuela\Desktop\CRM BANRESERVAS\pruebaTecnica\server'
node scripts/importVentas.js "..\database\example_ventas.csv"
```

El script y el endpoint realizan validaciones básicas y usan las variables de entorno para conectarse a MySQL.

El endpoint `/api/productividad` retorna por ejecutivo: total de visitas, total de ventas, monto total de ventas, tasa de conversión, promedio de venta por visita y ticket promedio.
