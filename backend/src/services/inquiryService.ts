import { pool } from '../db';
import { AuthUser } from '../middleware/auth';

const allowedTransitions: Record<string, string[]> = {
  New: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['In Progress'],
};

export function canTransition(from: string, to: string) {
  return (allowedTransitions[from] || []).includes(to);
}

export async function listInquiries(
  user: AuthUser,
  filters: { status?: string; q?: string; page: number }
) {
  const limit = 20;
  const offset = (filters.page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (user.role !== 'admin') {
    params.push(user.id);
    where.push(`created_by = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(
      `(customer_name ILIKE $${params.length} OR subject ILIKE $${params.length} OR contact ILIKE $${params.length})`
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM inquiries ${whereSql}
     ORDER BY updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows;
}

export async function getInquiry(user: AuthUser, id: number) {
  const params: any[] = [id];
  let sql = 'SELECT * FROM inquiries WHERE id = $1';
  if (user.role !== 'admin') {
    params.push(user.id);
    sql += ' AND created_by = $2';
  }
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

export async function findRecentDuplicate(
  userId: number,
  contact: string,
  subject: string
) {
  const result = await pool.query(
    `SELECT id FROM inquiries
     WHERE created_by = $1 AND lower(contact) = lower($2) AND lower(subject) = lower($3)
       AND created_at > now() - interval '10 minutes'
     LIMIT 1`,
    [userId, contact, subject]
  );
  return result.rows[0] || null;
}

export async function createInquiry(
  userId: number,
  data: { customer_name: string; contact: string; subject: string; description: string }
) {
  const result = await pool.query(
    `INSERT INTO inquiries (customer_name, contact, subject, description, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.customer_name, data.contact, data.subject, data.description, userId]
  );
  return result.rows[0];
}

export async function updateStatus(id: number, status: string, version: number) {
  const result = await pool.query(
    `UPDATE inquiries SET status = $1, version = version + 1, updated_at = now()
     WHERE id = $2 AND version = $3 RETURNING *`,
    [status, id, version]
  );
  return result.rows[0] || null;
}