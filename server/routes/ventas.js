const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const ExcelJS = require('exceljs');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

module.exports = (pool) => {
  const router = express.Router();

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

  const validateRow = (r) => {
    const errors = [];
    const out = {
      IdVenta: r.IdVenta ? String(r.IdVenta).trim() : null,
      IdCliente: r.IdCliente ? String(r.IdCliente).trim() : null,
      FechaVenta: r.FechaVenta ? String(r.FechaVenta).trim() : null,
      Monto: r.Monto ? String(r.Monto).trim() : null,
      Producto: r.Producto ? String(r.Producto).trim() : null
    };
    if (!out.IdCliente) errors.push('IdCliente requerido');
    if (!out.FechaVenta) errors.push('FechaVenta requerida');
    if (!out.Monto) errors.push('Monto requerido');
    if (!out.Producto) errors.push('Producto requerido');
    const montoNum = parseFloat(out.Monto);
    if (isNaN(montoNum) || montoNum < 0) errors.push('Monto inválido');
    const date = new Date(out.FechaVenta);
    if (isNaN(date.getTime())) errors.push('FechaVenta inválida');
    else out.FechaVenta = date.toISOString().slice(0,10);
    out.Monto = montoNum;
    return { out, errors };
  };

  router.post('/ventas/import', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido en campo file' });
    const filePath = req.file.path;
    let rows = [];
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.csv' || ext === '.txt') rows = await parseCSV(filePath);
      else if (ext === '.xlsx' || ext === '.xls') rows = await parseXLSX(filePath);
      else return res.status(400).json({ error: 'Formato no soportado. Enviar .csv o .xlsx' });

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
              const { out, errors } = validateRow(raw);
              if (errors.length) {
                summary.errors.push({ line: i + j + 1, reason: errors.join('; ') });
                summary.skipped += 1;
                continue;
              }
              if (out.IdVenta) {
                const q = `INSERT INTO Ventas (IdVenta, IdCliente, FechaVenta, Monto, Producto) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE IdCliente=VALUES(IdCliente), FechaVenta=VALUES(FechaVenta), Monto=VALUES(Monto), Producto=VALUES(Producto)`;
                await connection.execute(q, [out.IdVenta, out.IdCliente, out.FechaVenta, out.Monto, out.Producto]);
                summary.imported += 1;
              } else {
                const [exist] = await connection.execute('SELECT IdVenta FROM Ventas WHERE IdCliente = ? AND FechaVenta = ? AND Producto = ? AND Monto = ? LIMIT 1', [out.IdCliente, out.FechaVenta, out.Producto, out.Monto]);
                if (exist.length > 0) {
                  summary.skipped += 1;
                  continue;
                }
                const q2 = 'INSERT INTO Ventas (IdCliente, FechaVenta, Monto, Producto) VALUES (?, ?, ?, ?)';
                await connection.execute(q2, [out.IdCliente, out.FechaVenta, out.Monto, out.Producto]);
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
      }

      fs.unlink(filePath, () => {});
      res.json(summary);
    } catch (err) {
      fs.unlink(filePath, () => {});
      res.status(500).json({ error: String(err.message) });
    }
  });

  return router;
};
