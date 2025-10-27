require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const productividadRouter = require('./routes/productividad');

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
  } catch (err) {
    console.error('Error creando pool de MySQL:', err);
  }
};


 

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  await initDB();
});
