import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';

const alice = { email: 'alice@example.com', password: 'Alice123!' };
const bob = { email: 'bob@example.com', password: 'Bob123!' };

async function loginAgent(creds: { email: string; password: string }) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send(creds).expect(200);
  return agent;
}

afterAll(async () => {
  await pool.query("DELETE FROM inquiries WHERE subject LIKE 'TEST-%'");
  await pool.end();
});

describe('Authentication', () => {
  it('returns 401 when no cookie is sent', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Validation', () => {
  it('returns 400 with field errors when data is missing', async () => {
    const agent = await loginAgent(alice);
    const res = await agent.post('/api/inquiries').send({ customer_name: '', contact: '', subject: '', description: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.customer_name).toBeDefined();
  });

  it('returns 400 for a non-numeric id', async () => {
    const agent = await loginAgent(alice);
    const res = await agent.get('/api/inquiries/abc');
    expect(res.status).toBe(400);
  });
});

describe('Access rule', () => {
  it('returns 404 when another staff member opens my inquiry', async () => {
    const a = await loginAgent(alice);
    const created = await a.post('/api/inquiries').send({
      customer_name: 'Test Customer',
      contact: '0700000001',
      subject: 'TEST-access',
      description: 'Ownership test',
    });
    expect(created.status).toBe(201);

    const b = await loginAgent(bob);
    const res = await b.get(`/api/inquiries/${created.body.inquiry.id}`);
    expect(res.status).toBe(404);
  });
});

describe('Status rules', () => {
  it('rejects New to Resolved with 409 and rejects a stale version', async () => {
    const a = await loginAgent(alice);
    const created = await a.post('/api/inquiries').send({
      customer_name: 'Test Customer',
      contact: '0700000002',
      subject: 'TEST-status',
      description: 'Status test',
    });
    const { id, version } = created.body.inquiry;

    const bad = await a.patch(`/api/inquiries/${id}/status`).send({ status: 'Resolved', version });
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe('INVALID_TRANSITION');

    const ok = await a.patch(`/api/inquiries/${id}/status`).send({ status: 'In Progress', version });
    expect(ok.status).toBe(200);

    const stale = await a.patch(`/api/inquiries/${id}/status`).send({ status: 'Resolved', version });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_VERSION');
  });
});