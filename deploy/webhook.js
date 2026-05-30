// Simple deploy webhook — runs on VPS port 9001
// Start: node /home/apps/StayOS/deploy/webhook.js &
// Or via PM2: pm2 start /home/apps/StayOS/deploy/webhook.js --name stayos-webhook

const http = require('http');
const { execSync } = require('child_process');

const SECRET = process.env.WEBHOOK_SECRET || 'stayos-deploy-2026';
const PORT = 9001;
const APP_DIR = '/home/apps/StayOS';

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      if (payload.secret !== SECRET) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      res.writeHead(200);
      res.end('Deploy started');

      // Run deploy async
      setTimeout(() => {
        try {
          console.log('[webhook] Pulling latest code...');
          execSync(`cd ${APP_DIR} && git pull origin main`, { stdio: 'inherit' });
          console.log('[webhook] Installing deps...');
          execSync(`cd ${APP_DIR} && npm ci --production=false`, { stdio: 'inherit' });
          console.log('[webhook] Building...');
          execSync(`cd ${APP_DIR} && NODE_ENV=production npm run build`, { stdio: 'inherit' });
          console.log('[webhook] Restarting PM2...');
          execSync(`pm2 restart stayos || pm2 start ${APP_DIR}/ecosystem.config.js`, { stdio: 'inherit' });
          execSync('pm2 save', { stdio: 'inherit' });
          console.log('[webhook] Deploy complete!');
        } catch (err) {
          console.error('[webhook] Deploy failed:', err.message);
        }
      }, 100);

    } catch (e) {
      res.writeHead(400);
      res.end('Bad request');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[webhook] Listening on port ${PORT}`);
});
