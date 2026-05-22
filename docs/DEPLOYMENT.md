# StayOS - VPS Deployment Guide

Deploy StayOS to `stayos.hoangtiendung.com` on a shared VPS.

| Item        | Value                          |
|-------------|--------------------------------|
| VPS IP      | 103.97.127.43                  |
| Domain      | stayos.hoangtiendung.com       |
| App port    | 3002                           |
| Repo        | github.com/dunghoangtien0504/StayOS |
| Process mgr | PM2                            |
| Web server  | Nginx (reverse proxy)          |

---

## ⚠️ Security First

- VPS password and API keys are **NEVER** committed to Git.
- `.gitignore` blocks all `.env*` files except `.env.example`.
- Credentials live in:
  - **Local dev:** `.env.local` (git-ignored)
  - **VPS:** `.env.production` (created manually on the server)
  - **CI/CD:** GitHub Actions Secrets

---

## Step 1 — GitHub Secrets

Go to: `Settings → Secrets and variables → Actions → New repository secret`

| Secret name    | Value          |
|----------------|----------------|
| `VPS_HOST`     | 103.97.127.43  |
| `VPS_USER`     | root           |
| `VPS_PASSWORD` | (VPS password) |

---

## Step 2 — First-time VPS Setup

SSH into the VPS:

```bash
ssh root@103.97.127.43
```

Run the automated setup script (installs Node 20, PM2, Nginx, Certbot,
clones the repo, builds, configures SSL):

```bash
mkdir -p /home/apps && cd /home/apps
git clone https://github.com/dunghoangtien0504/StayOS.git
bash StayOS/deploy/setup-vps.sh
```

The script pauses for you to create `.env.production` — see Step 3.

---

## Step 3 — Environment Variables on VPS

```bash
nano /home/apps/StayOS/.env.production
```

```env
NODE_ENV=production
PORT=3002
NEXT_PUBLIC_APP_URL=https://stayos.hoangtiendung.com

PANCAKE_API_KEY=your_pancake_access_token
PANCAKE_API_BASE=https://pages.fm/api
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 4 — Verify

```bash
pm2 status            # stayos should be "online"
pm2 logs stayos       # check for errors
curl -I https://stayos.hoangtiendung.com
```

Open: https://stayos.hoangtiendung.com

---

## Redeploying (after code changes)

**Automatic** — push to `main`, GitHub Actions deploys via SSH.

**Manual** — on the VPS:

```bash
bash /home/apps/StayOS/deploy/redeploy.sh
```

---

## Shared VPS Notes

This VPS also runs `aiagent.hoangtiendung.com`. Both apps coexist:

- Each app runs on its own port (StayOS = 3002).
- Nginx routes by `server_name` (domain) to the right port.
- PM2 manages both as separate processes (`pm2 list`).
- The StayOS Nginx config is a **separate file**
  (`/etc/nginx/sites-available/stayos`) — it does not touch the
  aiagent config.

---

## Troubleshooting

| Problem                    | Fix                                              |
|----------------------------|--------------------------------------------------|
| 502 Bad Gateway            | `pm2 restart stayos`, check `pm2 logs`           |
| SSL cert error             | `certbot renew --dry-run`                        |
| Port 3002 in use           | `lsof -i :3002` then kill, or change `PORT`      |
| Nginx won't reload         | `nginx -t` to see the config error              |
| Env vars not picked up     | rebuild + `pm2 restart stayos --update-env`      |

---

## File Reference

| File                          | Purpose                          |
|-------------------------------|----------------------------------|
| `.github/workflows/deploy.yml`| GitHub Actions auto-deploy       |
| `ecosystem.config.js`         | PM2 process definition           |
| `deploy/setup-vps.sh`         | One-time VPS provisioning        |
| `deploy/redeploy.sh`          | Quick manual redeploy            |
| `deploy/nginx.conf`           | Nginx reverse-proxy + SSL config |
| `.env.example`                | Env var template                |
