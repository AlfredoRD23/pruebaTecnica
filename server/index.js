require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const productividadRouter = require('./routes/productividad');
const ventasRouter = require('./routes/ventas');
const path = require('path');
const fs = require('fs');
const reporteRouter = require('./routes/reporte');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let pool;
const initDB = async () => {
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE, 
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  console.log('Pool de MySQL creado ✅');
  app.use('/api', productividadRouter(pool));
  app.use('/api', ventasRouter(pool));
  app.use('/api', reporteRouter(pool));
    try {
      const viewPath = path.join(__dirname, '..', 'database', 'vw_reporte_crm.sql');
      if (fs.existsSync(viewPath)) {
        const sql = fs.readFileSync(viewPath, 'utf8');
        await pool.query(sql);
        console.log('Vista vw_reporte_crm creada/actualizada');
      } else {
        console.warn('No se encontró el archivo vw_reporte_crm.sql');
      }
    } catch (err) {
      console.error('No se pudo crear la vista vw_reporte_crm:', err.message);
    }
  } catch (err) {
    console.error('Error creando pool de MySQL:', err);
  }
};


 

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  await initDB();
});
