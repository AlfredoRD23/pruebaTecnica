const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    router.get('/reporte', async (req, res) => {
        try {
            const {
                fechaInicio,
                fechaFin,
                ejecutivoId,
                productoId,
                groupBy = 'ejecutivo'
            } = req.query;

            let query = `SELECT 
                IdEjecutivo,
                NombreEjecutivo,
                ${groupBy === 'producto' ? 'IdProducto, NombreProducto,' : ''}
                COUNT(DISTINCT IdCliente) as TotalClientes,
                SUM(TotalVisitas) as TotalVisitas,
                SUM(TotalVentas) as TotalVentas,
                SUM(MontoTotalVentas) as MontoTotalVentas,
                ROUND(AVG(TasaConversion), 2) as TasaConversion,
                ROUND(AVG(PromedioVentasPorCliente), 2) as PromedioVentasPorCliente,
                ROUND(AVG(TicketPromedio), 2) as TicketPromedio,
                ROUND(AVG(VentasPorCliente), 2) as VentasPorCliente
            FROM vw_reporte_crm
            WHERE 1=1`;

            const params = [];

            if (fechaInicio) {
                query += ' AND FechaVisita >= ?';
                params.push(fechaInicio);
            }
            if (fechaFin) {
                query += ' AND FechaVisita <= ?';
                params.push(fechaFin);
            }
            if (ejecutivoId) {
                query += ' AND IdEjecutivo = ?';
                params.push(ejecutivoId);
            }
            if (productoId) {
                query += ' AND IdProducto = ?';
                params.push(productoId);
            }

            if (groupBy === 'producto') {
                query += ' GROUP BY IdEjecutivo, NombreEjecutivo, IdProducto, NombreProducto';
            } else {
                query += ' GROUP BY IdEjecutivo, NombreEjecutivo';
            }

            query += ' ORDER BY MontoTotalVentas DESC';

            const connection = await pool.getConnection();
            try {
                console.log('Ejecutando consulta reporte:', query);
                console.log('Parametros:', params);
                const [results] = await connection.execute(query, params);

                // Asegurar que los valores acumulados sean números (evita concatenación de strings)
                const totales = results.reduce((acc, row) => {
                    acc.totalClientes += Number(row.TotalClientes) || 0;
                    acc.totalVisitas += Number(row.TotalVisitas) || 0;
                    acc.totalVentas += Number(row.TotalVentas) || 0;
                    acc.montoTotal += Number(row.MontoTotalVentas) || 0;
                    return acc;
                }, { 
                    totalClientes: 0, 
                    totalVisitas: 0, 
                    totalVentas: 0, 
                    montoTotal: 0 
                });

                // Guardar promedios como números (no strings) para facilitar formateo en el cliente
                totales.tasaConversionPromedio = totales.totalVisitas ?
                    Number(((totales.totalVentas / totales.totalVisitas) * 100).toFixed(2)) : 0;
                totales.ticketPromedioGeneral = totales.totalVentas ?
                    Number((totales.montoTotal / totales.totalVentas).toFixed(2)) : 0;
                totales.ventasPorClientePromedio = totales.totalClientes ?
                    Number((totales.totalVentas / totales.totalClientes).toFixed(2)) : 0;

                res.json({
                    filtros: {
                        fechaInicio: fechaInicio || 'todos',
                        fechaFin: fechaFin || 'todos',
                        ejecutivoId: ejecutivoId || 'todos',
                        productoId: productoId || 'todos',
                        agrupadoPor: groupBy
                    },
                    totales,
                    detalle: results
                });
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error en reporte:', error);
            res.status(500).json({ 
                error: 'Error generando reporte', 
                details: error.message 
            });
        }
    });

    return router;
};