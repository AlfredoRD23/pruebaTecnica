CREATE OR REPLACE VIEW vw_reporte_crm AS
SELECT 
  e.IdEjecutivo,
  CONCAT(e.Nombre, ' ', e.Apellido) AS NombreEjecutivo,
  c.IdCliente,
  CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
  p.IdProducto,
  p.NombreProducto,
  COUNT(DISTINCT v.IdVisita) AS TotalVisitas,
  COUNT(DISTINCT ven.IdVenta) AS TotalVentas,
  COALESCE(SUM(ven.Monto), 0) AS MontoTotalVentas,
  CASE WHEN COUNT(DISTINCT v.IdVisita) > 0 THEN ROUND((COUNT(DISTINCT ven.IdVenta)/COUNT(DISTINCT v.IdVisita))*100,2) ELSE 0 END AS TasaConversion,
  COALESCE(ROUND(SUM(ven.Monto)/NULLIF(COUNT(DISTINCT c.IdCliente),0),2),0) AS PromedioVentasPorCliente,
  COALESCE(ROUND(SUM(ven.Monto)/NULLIF(COUNT(DISTINCT ven.IdVenta),0),2),0) AS TicketPromedio,
  COALESCE(ROUND(COUNT(DISTINCT ven.IdVenta)/NULLIF(COUNT(DISTINCT c.IdCliente),0),2),0) AS VentasPorCliente,
  DATE(v.FechaVisita) AS FechaVisita,
  DATE(ven.FechaVenta) AS FechaVenta
FROM Ejecutivos e
LEFT JOIN Visitas v ON e.IdEjecutivo = v.IdEjecutivo
LEFT JOIN Clientes c ON v.IdCliente = c.IdCliente
LEFT JOIN Ventas ven ON c.IdCliente = ven.IdCliente
  AND ven.FechaVenta BETWEEN v.FechaVisita AND DATE_ADD(v.FechaVisita, INTERVAL 30 DAY)
LEFT JOIN Producto p ON ven.IdProducto = p.IdProducto
GROUP BY e.IdEjecutivo, e.Nombre, e.Apellido, c.IdCliente, c.Nombre, c.Apellido, p.IdProducto, p.NombreProducto, DATE(v.FechaVisita), DATE(ven.FechaVenta);
