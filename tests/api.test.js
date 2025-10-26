const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = require('../server');

describe('API endpoints', () => {
  test('GET /api/articles returns array', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/articles creates article', async () => {
    const newArticle = { title: 'Test Article', excerpt: 'Testing create', image: '', url: '#' };
    const res = await request(app).post('/api/articles').send(newArticle);
    expect([201, 200]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(newArticle.title);

    // cleanup: remove the created article from articles.json
    const filePath = path.join(__dirname, '..', 'data', 'articles.json');
    const articles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const filtered = articles.filter(a => a.title !== newArticle.title || a.excerpt !== newArticle.excerpt);
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
  });
});
