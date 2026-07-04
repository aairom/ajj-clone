# ⚡ Quickstart — Asnières Jujitsu

Get the site running locally in under 5 minutes.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v14 or higher |
| npm | bundled with Node.js |

## 1 — Clone & install

```bash
git clone <repo-url> ajj-clone
cd ajj-clone
npm install
```

## 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

## 3 — Initialise the database

```bash
npm run init-db
```

## 4 — Start (detached)

```bash
./START.sh
```

The script prints the URL and runs the server in the background. Default:
```
http://localhost:3000
```

Admin panel:
```
http://localhost:3000/admin/login.html
```

Default credentials (change immediately after first login):
- **Username:** `admin`
- **Password:** `admin123`

## 5 — Stop

```bash
./STOP.sh
```

---

## Quick reference

| Action | Command |
|--------|---------|
| Start (detached) | `./START.sh` |
| Stop | `./STOP.sh` |
| Dev mode (auto-reload) | `npm run dev` |
| Reset database | `rm data/admin.db && npm run init-db` |
| View logs | `tail -f server.log` |

---

## Next steps

- Read [`Docs/SETUP.md`](SETUP.md) for full installation details
- Read [`Docs/DOCKER-DEPLOYMENT.md`](DOCKER-DEPLOYMENT.md) for Docker / Kubernetes
- Read [`Docs/EMAIL-SETUP.md`](EMAIL-SETUP.md) to configure the contact form
- See [`Docs/Architecture.md`](Architecture.md) for system diagrams
