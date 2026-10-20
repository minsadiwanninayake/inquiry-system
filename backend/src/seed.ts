import bcrypt from 'bcrypt';
import { pool } from './db';

async function main() {
  const users = [
    { email: 'admin@example.com', name: 'Admin User', role: 'admin', password: 'Admin123!' },
    { email: 'alice@example.com', name: 'Alice Staff', role: 'staff', password: 'Alice123!' },
    { email: 'bob@example.com', name: 'Bob Staff', role: 'staff', password: 'Bob123!' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.email, hash, u.name, u.role]
    );
  }

  console.log('Seed done');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});