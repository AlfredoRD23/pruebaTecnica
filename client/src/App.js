import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [productividad, setProductividad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductividad();
  }, []);

  const fetchProductividad = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/productividad');
      setProductividad(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos de productividad');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = () => {
    return productividad.reduce((totales, ejecutivo) => ({
      totalVisitas: totales.totalVisitas + ejecutivo.totalVisitas,
      totalVentas: totales.totalVentas + ejecutivo.totalVentas,
      montoTotal: totales.montoTotal + ejecutivo.montoTotalVentas
    }), { totalVisitas: 0, totalVentas: 0, montoTotal: 0 });
  };

  const totales = calcularTotales();

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Cargando datos de productividad...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>CRM Banco de Reservas</h1>
        <p>Análisis de Productividad Comercial por Ejecutivo</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totales.totalVisitas}</div>
          <div className="stat-label">Total Visitas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totales.totalVentas}</div>
          <div className="stat-label">Total Ventas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totales.montoTotal.toLocaleString()}</div>
          <div className="stat-label">Monto Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{productividad.length}</div>
          <div className="stat-label">Ejecutivos</div>
        </div>
      </div>

      <div className="card">
        <h2>Ranking de Productividad por Ejecutivo</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ejecutivo</th>
                <th>Visitas</th>
                <th>Ventas</th>
                <th>Monto Total</th>
                <th>Tasa Conversión</th>
                <th>Promedio por Visita</th>
                <th>Ticket Promedio</th>
              </tr>
            </thead>
            <tbody>
              {productividad.map((ejecutivo, index) => (
                <tr key={ejecutivo.idEjecutivo}>
                  <td>
                    <strong>{ejecutivo.nombreCompleto}</strong>
                    <div className="metric">#{index + 1}</div>
                  </td>
                  <td>{ejecutivo.totalVisitas}</td>
                  <td>{ejecutivo.totalVentas}</td>
                  <td>${ejecutivo.montoTotalVentas.toLocaleString()}</td>
                  <td>{ejecutivo.tasaConversion}%</td>
                  <td>${ejecutivo.promedioVentaPorVisita.toLocaleString()}</td>
                  <td>${ejecutivo.ticketPromedio.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
