#!/usr/bin/env node
// Импорт приютов из priuts.json в таблицу shelters
import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import 'dotenv/config';
import { query } from './src/db.js';

const argv = process.argv.slice(2);
const fileArg = argv.find((a) => !a.startsWith('--')) || 'priuts.json';

async function loadJson(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', filePath);
  const content = await fs.readFile(abs, 'utf-8');
  return JSON.parse(content);
}

async function insertShelters(data) {
  const client = await query('SELECT 1'); // прогреваем подключение
  let inserted = 0;
  let skipped = 0;
  for (const item of data) {
    const r = item.record || {};
    const values = [
      r.name,
      r.address,
      r.phone,
      r.email,
      r.website,
      r.description,
      r.capacity,
      r.working_hours,
      r.can_adopt ?? true,
      r.region,
      r.status || 'active',
      r.inn,
    ];

    try {
      const res = await query(
        `
          INSERT INTO shelters
            (name, address, phone, email, website, description, capacity, working_hours, can_adopt, region, status, inn)
          VALUES
            ($1,   $2,      $3,    $4,    $5,      $6,          $7,       $8,             $9,         $10,    $11,   $12)
          ON CONFLICT DO NOTHING
          RETURNING id;
        `,
        values,
      );
      if (res.rowCount > 0) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      console.error(`Error inserting ${r.name}:`, err.message);
    }
  }
  return { inserted, skipped };
}

async function main() {
  try {
    const data = await loadJson(fileArg);
    if (!Array.isArray(data)) throw new Error('priuts.json must contain an array');
    const { inserted, skipped } = await insertShelters(data);
    console.log(`Done. Inserted: ${inserted}, skipped (duplicates?): ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
}

main();
