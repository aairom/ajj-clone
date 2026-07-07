# 🗺️ Features Roadmap — Asnières Jujitsu

---

## ✅ Completed

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

### Phase 3 — Newsletter

- Abonnement public avec vérification email
- Création de campagnes (Quill WYSIWYG)
- Envoi groupé via nodemailer
- Lien de désabonnement
- Statistiques d'ouverture

### Phase 4 — Galerie photos publique

- Albums classés par événement / saison
- Lightbox au clic
- Upload en masse depuis l'admin

### Phase 5 — Notifications push

- Web Push API + Service Worker
- Envoi depuis l'admin
- Historique des notifications

### Phase 6 — Blog

- Articles avec slug, catégories, statut draft/publié
- Commentaires avec modération
- RSS feed

---

## 📊 Statut

| Phase | Fonctionnalité | Statut |
|-------|---------------|--------|
| 0 | Tarifs dynamiques | ✅ v2.5 |
| 1 | Upload d'images (Images tab) | ✅ v2.1 |
| 1b | Images dans Actualités & Calendrier | ✅ v3.0 |
| 2 | Réservation de cours | ⚪ |
| 3 | Newsletter | ⚪ |
| 4 | Galerie photos publique | ⚪ |
| 5 | Notifications push | ⚪ |
| 6 | Blog | ⚪ |

---

*Made with ❤️ by Bob — last updated Juillet 2026 (v3.0)*
