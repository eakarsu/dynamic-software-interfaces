const fs = require('node:fs');

describe('server entry hardening', () => {
  it('server exposes a health endpoint', () => {
    const body = fs.readFileSync(__dirname + '/../server.js', 'utf8');
    expect(body.includes('/api/health')).toBe(true);
  });

  it('no hard-coded secret fallback in server entry', () => {
    const body = fs.readFileSync(__dirname + '/../server.js', 'utf8');
    expect(/process\.env\.(JWT_SECRET|SESSION_SECRET)\s*\|\|\s*['"][^'"]+['"]/.test(body)).toBe(false);
  });
});
