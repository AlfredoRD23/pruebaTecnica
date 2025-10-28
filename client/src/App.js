import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [view, setView] = useState("productividad");

  const [productividad, setProductividad] = useState([]);
  const [loadingProd, setLoadingProd] = useState(false);
  const [errorProd, setErrorProd] = useState(null);

  const [reporte, setReporte] = useState({ detalle: [], totales: {} });
  const [loadingRep, setLoadingRep] = useState(false);
  const [errorRep, setErrorRep] = useState(null);

  const [ejecutivos, setEjecutivos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    ejecutivoId: "",
    productoId: "",
    groupBy: "ejecutivo",
  });

  useEffect(() => {
    fetchProductividad();
    fetchEjecutivos();
    fetchProductos();
  }, []);

  const fetchProductividad = async () => {
    try {
      setLoadingProd(true);
      const { data } = await axios.get("/api/productividad");
      setProductividad(data);
      setErrorProd(null);
    } catch (err) {
      setErrorProd("Error al cargar productividad");
    } finally {
      setLoadingProd(false);
    }
  };

  const fetchEjecutivos = async () => {
    try {
      const { data } = await axios.get("/api/ejecutivos");
      setEjecutivos(data);
    } catch (err) {
      console.error("No se pudieron obtener ejecutivos", err);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data } = await axios.get("/api/productos");
      setProductos(data);
    } catch (err) {
      console.error("No se pudieron obtener productos", err);
    }
  };

  const formatoMoneda = (valor) =>
    Number(valor ?? 0).toLocaleString("es-DO", {
      style: "currency",
      currency: "DOP",
    });

  // Convierte valores que pueden venir como strings con símbolos o comas a número seguro
  const safeNumber = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return v;
    // eliminar todo lo que no sea dígito, signo menos, o punto decimal
    const cleaned = String(v).replace(/[^0-9.-]+/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const formatoPorcentaje = (valor) => `${safeNumber(valor).toFixed(2)}%`;

  const calcularTotales = () => {
    return productividad.reduce(
      (totales, ejecutivo) => ({
        totalVisitas: totales.totalVisitas + safeNumber(ejecutivo.totalVisitas ?? 0),
        totalVentas: totales.totalVentas + safeNumber(ejecutivo.totalVentas ?? 0),
        montoTotal: totales.montoTotal + safeNumber(ejecutivo.montoTotalVentas ?? 0),
      }),
      { totalVisitas: 0, totalVentas: 0, montoTotal: 0 }
    );
  };

  const totalesProd = calcularTotales();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const runReporte = async () => {
    try {
      setLoadingRep(true);
      setErrorRep(null);
      const params = {};
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
      if (filters.fechaFin) params.fechaFin = filters.fechaFin;
      if (filters.ejecutivoId) params.ejecutivoId = filters.ejecutivoId;
      if (filters.productoId) params.productoId = filters.productoId;
      if (filters.groupBy) params.groupBy = filters.groupBy;
      const { data } = await axios.get("/api/reporte", { params });
      setReporte(data);
    } catch (err) {
      const detail =
        err?.response?.data?.details ||
        err?.message ||
        "Error generando reporte";
      setErrorRep(detail);
    } finally {
      setLoadingRep(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>CRM Banco de Reservas</h1>
        <p>Análisis Comercial</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${view === "productividad" ? "active" : ""}`}
          onClick={() => setView("productividad")}
        >
          Productividad
        </button>
        <button
          className={`tab-btn ${view === "reporte" ? "active" : ""}`}
          onClick={() => setView("reporte")}
        >
          Reporte Parametrizado
        </button>
      </div>

      {view === "productividad" && (
        <>
          {loadingProd ? (
            <div className="loading">Cargando datos de productividad...</div>
          ) : (
            <>
              {errorProd && <div className="error">{errorProd}</div>}

              <div className="stats-grid">
                <StatCard valor={totalesProd.totalVisitas} titulo="Total Visitas" />
                <StatCard valor={totalesProd.totalVentas} titulo="Total Ventas" />
                <StatCard valor={formatoMoneda(totalesProd.montoTotal)} titulo="Monto Total" />
                <StatCard valor={productividad.length} titulo="Ejecutivos" />
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
                      {productividad.map((e, i) => (
                        <tr key={e.IdEjecutivo ?? i}>
                          <td>
                            <strong>{e.nombreCompleto ?? "N/A"}</strong>
                            <div className="metric">#{i + 1}</div>
                          </td>
                          <td>{Number(e.totalVisitas ?? 0)}</td>
                          <td>{Number(e.totalVentas ?? 0)}</td>
                          <td>{formatoMoneda(e.montoTotalVentas)}</td>
                          <td>{formatoPorcentaje(e.tasaConversion)}</td>
                          <td>{formatoMoneda(e.promedioVentaPorVisita)}</td>
                          <td>{formatoMoneda(e.ticketPromedio)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {view === "reporte" && (
        <div className="card">
          <h2>Reporte Parametrizado</h2>
          <div className="filters">
            <label>
              Fecha inicio:
              <input
                type="date"
                name="fechaInicio"
                value={filters.fechaInicio}
                onChange={handleFilterChange}
              />
            </label>
            <label>
              Fecha fin:
              <input
                type="date"
                name="fechaFin"
                value={filters.fechaFin}
                onChange={handleFilterChange}
              />
            </label>
            <label>
              Ejecutivo:
              <select
                name="ejecutivoId"
                value={filters.ejecutivoId}
                onChange={handleFilterChange}
              >
                <option value="">Todos</option>
                {ejecutivos.map((e) => (
                  <option key={e.IdEjecutivo} value={e.IdEjecutivo}>
                    {e.Nombre} {e.Apellido}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Producto:
              <select
                name="productoId"
                value={filters.productoId}
                onChange={handleFilterChange}
              >
                <option value="">Todos</option>
                {productos.map((p) => (
                  <option key={p.IdProducto} value={p.IdProducto}>
                    {p.NombreProducto}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Agrupar por:
              <select
                name="groupBy"
                value={filters.groupBy}
                onChange={handleFilterChange}
              >
                <option value="ejecutivo">Ejecutivo</option>
                <option value="producto">Producto</option>
              </select>
            </label>

            <button className="btn-primary" onClick={runReporte}>
              Generar
            </button>
          </div>

          {loadingRep && <div className="loading">Generando reporte...</div>}
          {errorRep && <div className="error">{errorRep}</div>}

          {!loadingRep && reporte && (
            <>
              <div className="stats-grid">
                <StatCard valor={Number(reporte.totales?.totalVisitas ?? 0)} titulo="Total Visitas" />
                <StatCard valor={Number(reporte.totales?.totalVentas ?? 0)} titulo="Total Ventas" />
                <StatCard valor={formatoMoneda(reporte.totales?.montoTotal)} titulo="Monto Total" />
                <StatCard valor={formatoPorcentaje(reporte.totales?.tasaConversionPromedio)} titulo="Tasa Conversión (%)" />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Ejecutivo</th>
                      {filters.groupBy === "producto" && <th>Producto</th>}
                      <th>Clientes</th>
                      <th>Visitas</th>
                      <th>Ventas</th>
                      <th>Monto Total</th>
                      <th>Tasa Conv.</th>
                      <th>Ticket Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.detalle?.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.NombreEjecutivo ?? r.IdEjecutivo}</td>
                        {filters.groupBy === "producto" && <td>{r.NombreProducto}</td>}
                        <td>{r.TotalClientes}</td>
                        <td>{r.TotalVisitas}</td>
                        <td>{r.TotalVentas}</td>
                        <td>{formatoMoneda(r.MontoTotalVentas)}</td>
                        <td>{formatoPorcentaje(r.TasaConversion)}</td>
                        <td>{formatoMoneda(r.TicketPromedio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ valor, titulo }) => (
  <div className="stat-card">
    <div className="stat-value">{valor}</div>
    <div className="stat-label">{titulo}</div>
  </div>
);

export default App;
