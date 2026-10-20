import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function main() {
  const file = path.join(process.cwd(), 'migrations', '001_init.sql');
  const sql = fs.readFileSync(file, 'utf8');
  await pool.query(sql);
  console.log('Migration done');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});