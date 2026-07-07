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
| View logs | `tail -f logs/server.log` |
| Build container | `podman build -t ajj-app:latest .` |

---

## Admin dashboard tabs

| Tab | Description |
|-----|-------------|
| **Actualités** | Créer / modifier / supprimer les articles (Quill WYSIWYG) + image |
| **Calendrier** | Gérer les événements (Quill WYSIWYG) + image |
| **Images** | Upload multiple, miniatures automatiques, catégorisation, galerie |
| **Tarifs** | Mettre à jour les prix affichés sur la page publique |
| **Newsletter** | Gérer les abonnés, créer et envoyer des campagnes email |
| **Galerie** | Créer des albums, y ajouter des images depuis la médiathèque |
| **Notifications** | Envoyer des notifications push à tous les abonnés + historique |
| **Blog** | Créer/modifier des articles, gérer les catégories, modérer les commentaires |

---

## Activer les notifications push

1. Générer les clés VAPID :
   ```bash
   node scripts/generate-vapid.js
   ```
2. Les clés sont automatiquement ajoutées au fichier `.env`
3. Redémarrer le serveur
4. Un bouton 🔔 apparaît sur le site public pour les visiteurs

---

## Next steps

- [`Docs/Architecture.md`](Architecture.md) — system & deployment diagrams, DB schema
- [`Docs/SETUP.md`](SETUP.md) — full installation details
- [`Docs/IMAGE-UPLOAD-GUIDE.md`](IMAGE-UPLOAD-GUIDE.md) — image upload API reference
- [`Docs/EMAIL-SETUP.md`](EMAIL-SETUP.md) — configure the contact form

---

*Made with ❤️ by Bob — last updated Juillet 2026 (v4.0)*
