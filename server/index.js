const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`
};

let connection;

const initDB = async () => {
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conectado a Oracle Database');
  } catch (err) {
    console.error('Error conectando a Oracle:', err);
  }
};

app.get('/api/productividad', async (req, res) => {
  try {
    if (!connection) {
      await initDB();
    }

    const query = `
      SELECT 
        e.IdEjecutivo,
        e.Nombre || ' ' || e.Apellido AS NombreCompleto,
        COUNT(DISTINCT v.IdVisita) AS TotalVisitas,
        COUNT(DISTINCT ve.IdVenta) AS TotalVentas,
        NVL(SUM(ve.Monto), 0) AS MontoTotalVentas,
        CASE 
          WHEN COUNT(DISTINCT v.IdVisita) > 0 THEN 
            ROUND((COUNT(DISTINCT ve.IdVenta) / COUNT(DISTINCT v.IdVisita)) * 100, 2)
          ELSE 0 
        END AS TasaConversion,
        CASE 
          WHEN COUNT(DISTINCT v.IdVisita) > 0 THEN 
            ROUND(NVL(SUM(ve.Monto), 0) / COUNT(DISTINCT v.IdVisita), 2)
          ELSE 0 
        END AS PromedioVentaPorVisita,
        CASE 
          WHEN COUNT(DISTINCT ve.IdVenta) > 0 THEN 
            ROUND(NVL(SUM(ve.Monto), 0) / COUNT(DISTINCT ve.IdVenta), 2)
          ELSE 0 
        END AS TicketPromedio
      FROM Ejecutivos e
      LEFT JOIN Visitas v ON e.IdEjecutivo = v.IdEjecutivo
      LEFT JOIN Ventas ve ON v.IdCliente = ve.IdCliente 
        AND ve.FechaVenta >= v.FechaVisita
        AND ve.FechaVenta <= v.FechaVisita + 30
      LEFT JOIN Producto p ON ve.IdProducto = p.IdProducto
      LEFT JOIN TipoProducto tp ON p.IdTipoProducto = tp.IdTipoProducto
      WHERE v.FechaVisita >= ADD_MONTHS(SYSDATE, -12)
      GROUP BY e.IdEjecutivo, e.Nombre, e.Apellido
      ORDER BY MontoTotalVentas DESC, TasaConversion DESC
    `;

    const result = await connection.execute(query);
    
    const data = result.rows.map(row => ({
      idEjecutivo: row[0],
      nombreCompleto: row[1],
      totalVisitas: row[2],
      totalVentas: row[3],
      montoTotalVentas: row[4],
      tasaConversion: row[5],
      promedioVentaPorVisita: row[6],
      ticketPromedio: row[7]
    }));

    res.json(data);
  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/ejecutivos', async (req, res) => {
  try {
    if (!connection) {
      await initDB();
    }

    const query = 'SELECT IdEjecutivo, Nombre, Apellido FROM Ejecutivos ORDER BY Nombre';
    const result = await connection.execute(query);
    
    const data = result.rows.map(row => ({
      idEjecutivo: row[0],
      nombre: row[1],
      apellido: row[2]
    }));

    res.json(data);
  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  initDB();
});
