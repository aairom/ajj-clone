# 🗺️ Features Roadmap — Asnières Jujitsu

---

## ✅ Completed

### v4.0 — Newsletter, Galerie, Push Notifications, Blog (Juillet 2026)

- **Newsletter** — Formulaire public d'abonnement + page admin complète (abonnés, campagnes, envoi Quill WYSIWYG via nodemailer)
- **Galerie photos** — Albums publics avec lightbox + gestion admin des albums + sélecteur d'images existantes
- **Notifications Push** — Service Worker (`sw.js`), abonnement/désabonnement public, envoi admin via Web Push API (VAPID), historique
- **Blog** — Articles avec slug, catégories, statut draft/publié, vues, prévisualisation homepage ; pages publiques `Pages/blog.html` et `Pages/blog-post.html` ; commentaires avec modération admin

**Nouveaux endpoints API :**
- `POST/GET /api/newsletter/subscribe|unsubscribe|subscribers|campaigns`
- `GET/POST/PUT/DELETE /api/gallery/albums[/:id[/images]]`
- `GET/POST/DELETE /api/push/vapid-public-key|subscribe|unsubscribe|send|notifications`
- `GET/POST/PUT/DELETE /api/blog/posts|categories|comments`

**Script :** `node scripts/generate-vapid.js` pour initialiser les clés VAPID dans `.env`

---

### v3.0 — Images dans Actualités & Calendrier (Juillet 2026)

- **Widget image unifié** dans les onglets Actualités et Calendrier : URL externe ou upload direct
- Champ `image` ajouté à la table `calendar_events` (ALTER TABLE)
- Route `POST /api/calendar` et `PUT /api/calendar/:id` acceptent et stockent l'image
- Aperçu instantané dans le formulaire admin ; pré-chargé à l'édition
- Carrousels horizontaux (scroll-snap) pour Actualités et Calendrier sur la page publique
- Images rendues dans les cartes publiques avec `object-fit: cover`

**Bugfixes inclus :**
- `loadNews()` / `loadCalendar()` lisaient `localStorage` au lieu de l'API
- Filtre date calendrier : comparaison UTC incorrecte excluait les événements du jour
- Galerie images admin : crash `Too many parameter values` sur la requête count
- Structure HTML dashboard : onglet Images imbriqué dans `<tbody>` du calendrier
- `API_URL` hardcodé → `/api` relatif dans `dashboard.js` et `login.js`
- Rate limiter : fichiers statiques hors quota ; limite API portée à 500 req/15min

---

### v2.5 — Tarifs dynamiques (Juillet 2026)

- Table `prices` en SQLite, seed automatique de 4 entrées
- `GET /api/prices` (public), `PUT /api/prices/:id` (protégé)
- Onglet **Tarifs** dans l'admin — mise à jour en temps réel

---

### v2.1–v2.4 — Fondations (Décembre 2025 → Juillet 2026)

- Backend Node.js/Express, SQLite, JWT, API RESTful complète
- Upload d'images (multer + sharp), miniatures automatiques, catégorisation
- Éditeur WYSIWYG Quill.js pour actualités et événements
- Image Docker/Podman multi-stage Alpine, 244 MB, non-root
- Restructuration projet (`Docs/`, `scripts/`, `Pages/`)

---

## ⏳ Pending

### Phase 2 — Réservation de cours

- CRUD des cours (jour, heure, niveau, places max)
- Formulaire public de réservation
- Gestion des réservations dans l'admin (confirmer / annuler)
- Email de confirmation automatique

### Phase 7 — RSS Feed Blog

- Endpoint `GET /api/blog/rss.xml`
- Autodiscovery dans `<head>` des pages blog

### Phase 8 — Statistiques Newsletter

- Taux d'ouverture (pixel de tracking)
- Graphique d'évolution des abonnés

---

## 📊 Statut

| Phase | Fonctionnalité | Statut |
|-------|---------------|--------|
| 0 | Tarifs dynamiques | ✅ v2.5 |
| 1 | Upload d'images (Images tab) | ✅ v2.1 |
| 1b | Images dans Actualités & Calendrier | ✅ v3.0 |
| 2 | Réservation de cours | ⚪ |
| 3 | Newsletter | ✅ v4.0 |
| 4 | Galerie photos publique | ✅ v4.0 |
| 5 | Notifications push | ✅ v4.0 |
| 6 | Blog | ✅ v4.0 |
| 7 | RSS Feed Blog | ⚪ |
| 8 | Statistiques Newsletter | ⚪ |

---

*Made with ❤️ by Bob — last updated Juillet 2026 (v4.0)*
