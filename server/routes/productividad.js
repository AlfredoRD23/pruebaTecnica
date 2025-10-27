const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  const withConnection = (handler) => async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await handler(req, res, connection);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      if (connection) connection.release();
    }
  };

  router.get('/ejecutivos', withConnection(async (req, res, connection) => {
    const [rows] = await connection.execute(`
      SELECT IdEjecutivo, Nombre, Apellido
      FROM Ejecutivos
      ORDER BY Nombre
    `);
    res.json(rows);
  }));

  router.get('/productividad', withConnection(async (req, res, connection) => {
    const [rows] = await connection.execute(`
      SELECT 
        e.IdEjecutivo,
        CONCAT(e.Nombre, ' ', e.Apellido) AS nombreCompleto,
        COUNT(DISTINCT v.IdVisita) AS totalVisitas,
        COUNT(DISTINCT ve.IdVenta) AS totalVentas,
        COALESCE(SUM(ve.Monto), 0) AS montoTotalVentas,
        CASE 
          WHEN COUNT(DISTINCT v.IdVisita) > 0 
          THEN ROUND((COUNT(DISTINCT ve.IdVenta)/COUNT(DISTINCT v.IdVisita))*100,2)
          ELSE 0
        END AS tasaConversion,
        CASE
          WHEN COUNT(DISTINCT v.IdVisita) > 0
          THEN ROUND(COALESCE(SUM(ve.Monto),0)/COUNT(DISTINCT v.IdVisita),2)
          ELSE 0
        END AS promedioVentaPorVisita,
        CASE
          WHEN COUNT(DISTINCT ve.IdVenta) > 0
          THEN ROUND(COALESCE(SUM(ve.Monto),0)/COUNT(DISTINCT ve.IdVenta),2)
          ELSE 0
        END AS ticketPromedio
      FROM Ejecutivos e
      LEFT JOIN Visitas v ON e.IdEjecutivo = v.IdEjecutivo
      LEFT JOIN Ventas ve ON v.IdCliente = ve.IdCliente
        AND ve.FechaVenta BETWEEN v.FechaVisita AND DATE_ADD(v.FechaVisita, INTERVAL 30 DAY)
      WHERE v.FechaVisita >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY e.IdEjecutivo, e.Nombre, e.Apellido
      ORDER BY montoTotalVentas DESC, tasaConversion DESC
    `);
    res.json(rows);
  }));

  return router;
};
