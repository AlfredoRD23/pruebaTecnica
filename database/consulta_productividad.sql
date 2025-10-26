-- Consulta para Análisis de Productividad por Ejecutivo
-- Parte 1 del proyecto CRM Banco de Reservas

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
ORDER BY MontoTotalVentas DESC, TasaConversion DESC;
