const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('should return 200 and serve the participant page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toMatch(/html/);
  });
});

describe('GET /health', () => {
  it('should return 200 and health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });
});
