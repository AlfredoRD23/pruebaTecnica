require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

const parseCSV = (filePath) => new Promise((resolve, reject) => {
  const rows = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true, trim: true }))
    .on('error', error => reject(error))
    .on('data', row => rows.push(row))
    .on('end', () => resolve(rows));
});

const parseXLSX = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const rows = [];
  const headers = [];
  worksheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1);
    if (rowNumber === 1) {
      values.forEach(h => headers.push(String(h).trim()));
    } else {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? String(values[i]).trim() : '';
      });
      rows.push(obj);
    }
  });
  return rows;
};

const validateRow = async (connection, r) => {
  const errors = [];
  const out = {
    IdVenta: r.IdVenta ? String(r.IdVenta).trim() : null,
    IdCliente: r.IdCliente ? String(r.IdCliente).trim() : null,
    FechaVenta: r.FechaVenta ? String(r.FechaVenta).trim() : null,
    Monto: r.Monto ? String(r.Monto).trim() : null,
    NombreProducto: r.NombreProducto ? String(r.NombreProducto).trim() : null
  };
  if (!out.IdCliente) errors.push('IdCliente requerido');
  if (!out.FechaVenta) errors.push('FechaVenta requerida');
  if (!out.Monto) errors.push('Monto requerido');
  if (!out.NombreProducto) errors.push('NombreProducto requerido');
  const montoNum = parseFloat(out.Monto);
  if (isNaN(montoNum) || montoNum < 0) errors.push('Monto inválido');
  const date = new Date(out.FechaVenta);
  if (isNaN(date.getTime())) errors.push('FechaVenta inválida');
  else out.FechaVenta = date.toISOString().slice(0,10);
  out.Monto = montoNum;

  if (errors.length === 0) {
    try {
      const [rows] = await connection.execute(
        'SELECT IdProducto FROM Producto WHERE NombreProducto = ?',
        [out.NombreProducto]
      );
      if (rows.length === 0) {
        errors.push(`Producto no encontrado: ${out.NombreProducto}`);
      } else {
        out.IdProducto = rows[0].IdProducto;
      }
    } catch (err) {
      errors.push(`Error buscando producto: ${err.message}`);
    }
  }

  return { out, errors };
};

const main = async () => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Uso: node importVentas.js <ruta-al-archivo.csv|xlsx>');
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error('Archivo no encontrado:', filePath);
    process.exit(1);
  }
  const ext = path.extname(filePath).toLowerCase();
  let rows = [];
  if (ext === '.csv' || ext === '.txt') rows = await parseCSV(filePath);
  else if (ext === '.xlsx' || ext === '.xls') rows = await parseXLSX(filePath);
  else {
    console.error('Formato no soportado. Use .csv o .xlsx');
    process.exit(1);
  }

  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 5
  });

  const summary = { imported: 0, skipped: 0, errors: [] };
  const connection = await pool.getConnection();
  try {
    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await connection.beginTransaction();
      try {
        for (let j = 0; j < batch.length; j++) {
          const raw = batch[j];
          const { out, errors } = await validateRow(connection, raw);
          if (errors.length) {
            summary.errors.push({ line: i + j + 1, reason: errors.join('; ') });
            summary.skipped += 1;
            continue;
          }
          if (out.IdVenta) {
            const q = `INSERT INTO Ventas (IdVenta, IdCliente, IdProducto, FechaVenta, Monto) 
                      VALUES (?, ?, ?, ?, ?) 
                      ON DUPLICATE KEY UPDATE 
                      IdCliente=VALUES(IdCliente), 
                      IdProducto=VALUES(IdProducto),
                      FechaVenta=VALUES(FechaVenta), 
                      Monto=VALUES(Monto)`;
            await connection.execute(q, [out.IdVenta, out.IdCliente, out.IdProducto, out.FechaVenta, out.Monto]);
            summary.imported += 1;
          } else {
            const [exist] = await connection.execute(
              'SELECT IdVenta FROM Ventas WHERE IdCliente = ? AND IdProducto = ? AND FechaVenta = ? AND Monto = ? LIMIT 1',
              [out.IdCliente, out.IdProducto, out.FechaVenta, out.Monto]
            );
            if (exist.length > 0) {
              summary.skipped += 1;
              continue;
            }
            const q2 = 'INSERT INTO Ventas (IdCliente, IdProducto, FechaVenta, Monto) VALUES (?, ?, ?, ?)';
            await connection.execute(q2, [out.IdCliente, out.IdProducto, out.FechaVenta, out.Monto]);
            summary.imported += 1;
          }
        }
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        summary.errors.push({ batchStart: i + 1, reason: String(err.message) });
      }
    }
  } finally {
    connection.release();
    await pool.end();
  }

  console.log('Resumen:', summary);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
