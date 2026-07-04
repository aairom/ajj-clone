# ⚡ Quickstart — Asnières Jujitsu

Get the site running locally in under 5 minutes.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v20 LTS |
| npm | bundled with Node.js |
| Podman or Docker | optional — for containerised run |

> ⚠️ Node.js v24+ is not yet compatible with `better-sqlite3`. Use Node.js **v20 LTS**.

---

## Option A — Run locally (Node.js)

### 1 — Clone & install

```bash
git clone <repo-url> ajj-clone
cd ajj-clone
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### 3 — Initialise the database

```bash
npm run init-db
```

### 4 — Start (detached)

```bash
./scripts/START.sh
```

The script runs the server in the background and prints the URL:

```
http://localhost:3000
http://localhost:3000/admin/login.html
```

Default credentials (change immediately after first login):
- **Username:** `admin`  **Password:** `admin123`

### 5 — Stop

```bash
./scripts/STOP.sh
```

---

## Option B — Run with Docker / Podman

Image: `ajj-app:latest` — **244 MB**, multi-stage Alpine, non-root.

```bash
# Build
podman build -t ajj-app:latest .
# or: docker build -t ajj-app:latest .

# Run
mkdir -p data uploads logs
podman run -d --name ajj-app -p 3000:3000 \
  -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data:Z \
  -v $(pwd)/uploads:/app/uploads:Z \
  ajj-app:latest

# Init DB
podman exec ajj-app node scripts/init-db.js
```

Access at `http://localhost:3000`.

Stop & remove:

```bash
podman rm -f ajj-app
```

---

## Quick reference

| Action | Command |
|--------|---------|
| Start (detached) | `./scripts/START.sh` |
| Stop | `./scripts/STOP.sh` |
| Dev mode (auto-reload) | `npm run dev` |
| Reset database | `rm data/admin.db && npm run init-db` |
| View logs | `tail -f server.log` |
| Build container | `podman build -t ajj-app:latest .` |

---

## Next steps

- [`Docs/Architecture.md`](Architecture.md) — system & deployment diagrams
- [`Docs/SETUP.md`](SETUP.md) — full installation details
- [`Docs/EMAIL-SETUP.md`](EMAIL-SETUP.md) — configure the contact form
