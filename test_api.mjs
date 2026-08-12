// Test minimal express and then full app middleware
import express from 'express';

// Test 1: Minimal server
const app1 = express();
app1.get('/', (req, res) => res.json({ ok: true }));
const s1 = app1.listen(3002, async () => {
  process.stdout.write('Test 1: Minimal server started\n');
  try {
    const r = await fetch('http://localhost:3002/');
    const t = await r.text();
    process.stdout.write('Test 1: ' + r.status + ' ' + t + '\n');
  } catch(e) {
    process.stdout.write('Test 1 error: ' + e.message + '\n');
  }
  s1.close();

  // Test 2: Full app
  process.stdout.write('Test 2: Importing full app...\n');
  try {
    const app2 = (await import('./app.js')).default;
    const s2 = app2.listen(3003, async () => {
      process.stdout.write('Test 2: Full app started\n');
      try {
        const r = await fetch('http://localhost:3003/');
        const t = await r.text();
        process.stdout.write('Test 2: / -> ' + r.status + ' ' + t + '\n');
      } catch(e) {
        process.stdout.write('Test 2 / error: ' + e.message + '\n');
      }

      try {
        const r = await fetch('http://localhost:3003/v1/auth/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username:'testuser',email:'test@test.com',password:'123456'})
        });
        const t = await r.text();
        process.stdout.write('Test 2: register -> ' + r.status + ' ' + t + '\n');
      } catch(e) {
        process.stdout.write('Test 2 register error: ' + e.message + '\n');
      }
      s2.close();
    });
  } catch(e) {
    process.stdout.write('Test 2 import error: ' + e.message + '\n');
  }
});
