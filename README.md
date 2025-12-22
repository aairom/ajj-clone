# Asnières Jujitsu - Site Web

Site web moderne pour le club de Jujitsu Traditionnel d'Asnières, développé en HTML, CSS et JavaScript avec un panneau d'administration intégré.

## 🚀 Fonctionnalités

### Site Public
- **Page d'accueil** avec présentation du club
- **Section Actualités** - Affichage dynamique des dernières nouvelles
- **Le Club** - Présentation de l'histoire et de la philosophie
- **Horaires** - Planning des cours de la semaine
- **Calendrier** - Événements à venir (stages, compétitions, etc.)
- **Tarifs** - Différentes formules d'abonnement
- **Contact** - Formulaire de contact et informations pratiques
- **Design responsive** - Compatible mobile, tablette et desktop
- **Navigation fluide** - Smooth scrolling et menu mobile

### Panneau d'Administration Sécurisé
- **Authentification JWT** - Système d'authentification moderne avec tokens
- **Base de données SQLite** - Stockage sécurisé des données
- **API RESTful** - Backend Node.js/Express
- **Gestion des actualités** - Créer, modifier et supprimer des articles
- **Gestion du calendrier** - Ajouter et gérer les événements
- **📸 Upload d'images** - Téléchargement direct avec génération automatique de miniatures ✅
- **Interface intuitive** - Tableau de bord facile à utiliser
- **Sécurité renforcée** - Hash bcrypt, rate limiting, protection CSRF

### 🎯 Fonctionnalités Avancées (En Développement)
- ✅ **Upload d'images** - Système complet de gestion d'images
- ⏳ **Réservation de cours** - Système de réservation en ligne
- ⏳ **Newsletter** - Gestion des abonnés et campagnes email
- ⏳ **Galerie photos** - Albums et galeries d'images
- ⏳ **Notifications push** - Notifications en temps réel
- ⏳ **Blog** - Système de blog complet avec commentaires

## 📁 Structure du Projet

```
ajj-clone/
├── index.html              # Page principale
├── server.js               # Serveur Express
├── package.json            # Dépendances Node.js
├── .env                    # Configuration (ne pas commiter)
├── .env.example            # Template de configuration
├── css/
│   └── style.css          # Styles du site
├── js/
│   └── main.js            # JavaScript principal
├── admin/
│   ├── login.html         # Page de connexion admin
│   ├── login.js           # Logique de connexion (API)
│   ├── dashboard.html     # Tableau de bord admin
│   ├── dashboard.js       # Logique du dashboard (API)
│   └── admin-style.css    # Styles de l'admin
├── routes/
│   ├── auth.js            # Routes d'authentification
│   ├── news.js            # Routes actualités
│   └── calendar.js        # Routes calendrier
├── middleware/
│   └── auth.js            # Middleware JWT
├── scripts/
│   └── init-db.js         # Initialisation base de données
├── data/
│   └── admin.db           # Base de données SQLite
├── images/                # Dossier pour les images
├── SETUP.md               # Guide d'installation détaillé
├── README-SECURE-LOGIN.md # Documentation système sécurisé
└── README.md              # Ce fichier
```

## 🔧 Installation et Utilisation

### Prérequis
- **Node.js** v18.x ou v20.x (LTS recommandé)
- **npm** (inclus avec Node.js)

⚠️ **Important:** Node.js v24+ n'est pas encore compatible avec better-sqlite3. Utilisez Node.js v20 LTS.

### Installation

1. **Clonez le projet**
   ```bash
   git clone [url-du-repo]
   cd ajj-clone
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Configurez l'environnement**
   ```bash
   cp .env.example .env
   ```
   Éditez `.env` et changez le `JWT_SECRET` (obligatoire en production)

4. **Initialisez la base de données**
   ```bash
   npm run init-db
   ```

5. **Démarrez le serveur**
   ```bash
   npm start
   ```
   Ou en mode développement avec auto-reload:
   ```bash
   npm run dev
   ```

6. **Accédez au site**
   - Site public : `http://localhost:3000/`
   - Administration : `http://localhost:3000/admin/login.html`

### Identifiants par Défaut

**⚠️ IMPORTANT : Changez ces identifiants en production !**

- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`

## 📝 Guide d'Utilisation de l'Administration

### Connexion
1. Cliquez sur l'icône cadenas dans le menu ou allez sur `/admin/login.html`
2. Entrez les identifiants
3. Vous serez redirigé vers le tableau de bord

### Gestion des Actualités
1. Dans l'onglet "Actualités"
2. Remplissez le formulaire :
   - Titre de l'actualité
   - Contenu
   - Date de publication
   - URL d'image (optionnel)
3. Cliquez sur "Publier"
4. L'actualité apparaît immédiatement sur le site

**Modifier une actualité :**
- Cliquez sur "Modifier" dans la liste
- Modifiez les champs
- Cliquez sur "Mettre à jour"

**Supprimer une actualité :**
- Cliquez sur "Supprimer"
- Confirmez la suppression

### Gestion du Calendrier
1. Dans l'onglet "Calendrier"
2. Remplissez le formulaire :
   - Titre de l'événement
   - Description
   - Date
3. Cliquez sur "Ajouter"
4. L'événement apparaît sur le site

**Modifier/Supprimer :** Même processus que pour les actualités

## 🎨 Personnalisation

### Couleurs
Modifiez les variables CSS dans `css/style.css` :

```css
:root {
    --primary-color: #1a1a2e;      /* Couleur principale */
    --secondary-color: #16213e;     /* Couleur secondaire */
    --accent-color: #e94560;        /* Couleur d'accent */
    --light-color: #f1f1f1;         /* Couleur claire */
}
```

### Contenu
- **Horaires** : Modifiez directement dans `index.html` (section `#horaires`)
- **Tarifs** : Modifiez dans `index.html` (section `#tarifs`)
- **Informations de contact** : Modifiez dans `index.html` (section `#contact`)
- **Logo et images** : Ajoutez vos images dans le dossier `images/`

### Textes
Tous les textes sont modifiables directement dans `index.html`. Recherchez les sections par leur ID :
- `#accueil` - Page d'accueil
- `#club` - Présentation du club
- `#contact` - Informations de contact

## 🔒 Sécurité

### Fonctionnalités de Sécurité Implémentées

✅ **Authentification JWT** - Tokens sécurisés avec expiration
✅ **Hash bcrypt** - Mots de passe hashés (10 rounds)
✅ **Rate Limiting** - Protection contre les attaques par force brute
✅ **SQL Injection** - Protection via prepared statements
✅ **Base de données locale** - SQLite avec données chiffrées
✅ **Variables d'environnement** - Configuration sécurisée via .env

### Pour un Environnement de Production

**⚠️ IMPORTANT :** Avant de déployer en production :

1. **Changez le JWT_SECRET**
   ```bash
   # Générez un secret fort
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Mettez à jour `.env` avec le secret généré

2. **Changez les identifiants par défaut**
   - Connectez-vous immédiatement après l'installation
   - Utilisez l'endpoint `/api/auth/change-password`

3. **Configurez HTTPS**
   - Utilisez un reverse proxy (nginx, Apache)
   - Obtenez un certificat SSL (Let's Encrypt gratuit)

4. **Sécurisez la base de données**
   ```bash
   chmod 600 data/admin.db
   ```

5. **Configurez les backups**
   - Sauvegardez régulièrement `data/admin.db`
   - Utilisez un système de versioning

6. **Mettez à jour NODE_ENV**
   ```env
   NODE_ENV=production
   ```

## 🌐 Déploiement

### Options de Déploiement

Le site peut être déployé de plusieurs façons :

1. **🐳 Docker** (Recommandé) - Déploiement conteneurisé
2. **☸️ Kubernetes** - Orchestration pour production
3. **🖥️ Serveur Traditionnel** - Installation directe

### 🐳 Déploiement Docker

**Quick Start avec Docker Compose:**

```bash
# Cloner et configurer
git clone <repository-url>
cd ajj-clone
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer l'application
docker-compose up -d

# Initialiser la base de données
docker-compose exec app npm run init-db
```

**Accès:** http://localhost:3000

**Commandes utiles:**
```bash
# Voir les logs
docker-compose logs -f app

# Arrêter
docker-compose down

# Rebuild après modifications
docker-compose up -d --build
```

### ☸️ Déploiement Kubernetes

**Prérequis:** Cluster Kubernetes et kubectl configuré

```bash
# Build et push l'image
docker build -t your-registry/ajj-app:v1.0.0 .
docker push your-registry/ajj-app:v1.0.0

# Déployer avec kubectl
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/persistentvolume.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Ou avec Kustomize
kubectl apply -k k8s/

# Initialiser la base
POD=$(kubectl get pods -n ajj-jujitsu -l app=ajj-app -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n ajj-jujitsu $POD -- npm run init-db
```

**Fonctionnalités Kubernetes:**
- ✅ Auto-scaling (HPA) - 2 à 10 pods
- ✅ Health checks et readiness probes
- ✅ Rolling updates sans downtime
- ✅ Persistent storage pour SQLite
- ✅ Ingress avec TLS/SSL

### 🖥️ Déploiement Serveur Traditionnel

**Pour VPS/Cloud (OVH, DigitalOcean, AWS EC2, etc.):**

1. Installez Node.js v20 LTS
2. Clonez le projet
3. Configurez `.env` avec des valeurs de production
4. Installez les dépendances: `npm install`
5. Initialisez la base: `npm run init-db`
6. Utilisez PM2 pour la gestion du processus:
   ```bash
   npm install -g pm2
   pm2 start server.js --name ajj-admin
   pm2 save
   pm2 startup
   ```
7. Configurez nginx comme reverse proxy

### 📚 Documentation Complète

- **[DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)** - Guide complet Docker & Kubernetes
- **[SETUP.md](SETUP.md)** - Installation et configuration détaillée
- **[EMAIL-SETUP.md](EMAIL-SETUP.md)** - Configuration email pour formulaire de contact
- **[IMAGE-UPLOAD-GUIDE.md](IMAGE-UPLOAD-GUIDE.md)** - Guide système d'upload d'images
- **[FEATURES-ROADMAP.md](FEATURES-ROADMAP.md)** - Feuille de route des fonctionnalités

## 📱 Compatibilité

- ✅ Chrome (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Edge (dernières versions)
- ✅ Mobile (iOS Safari, Chrome Android)

## 🛠️ Technologies Utilisées

### Frontend
- **HTML5** - Structure
- **CSS3** - Styles et animations
- **JavaScript (Vanilla)** - Interactivité
- **Font Awesome** - Icônes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** (better-sqlite3) - Base de données
- **bcrypt** - Hash de mots de passe
- **jsonwebtoken** - Authentification JWT
- **express-rate-limit** - Protection rate limiting
- **dotenv** - Gestion variables d'environnement
- **nodemailer** - Envoi d'emails
- **multer** - Upload de fichiers
- **sharp** - Traitement d'images
- **uuid** - Génération d'identifiants uniques

## 📄 Licence

Ce projet est fourni tel quel pour le club Asnières Jujitsu.

## 🤝 Support

Pour toute question ou problème :
1. Consultez ce README
2. Vérifiez la console du navigateur (F12) pour les erreurs
3. Contactez le développeur

## 🔄 Mises à Jour Récentes

### Version 2.0 (Décembre 2024)
- ✅ Backend Node.js/Express implémenté
- ✅ Base de données SQLite
- ✅ Authentification JWT sécurisée
- ✅ API RESTful complète
- ✅ Rate limiting et sécurité renforcée

### Fonctionnalités Futures Suggérées
- [ ] Upload d'images directement depuis l'admin
- [ ] Gestion des membres
- [ ] Système de réservation de cours
- [ ] Newsletter
- [ ] Galerie photos
- [ ] Blog
- [ ] Multilingue (FR/EN)
- [ ] Notifications push

## 📞 Contact Développeur

Pour des modifications ou améliorations, contactez le développeur du site.

## 📚 Documentation Complémentaire

- **[SETUP.md](SETUP.md)** - Guide d'installation détaillé
- **[README-SECURE-LOGIN.md](README-SECURE-LOGIN.md)** - Documentation du système d'authentification
- **[.env.example](.env.example)** - Template de configuration

## 🐛 Dépannage

### Problèmes d'installation

**Erreur avec better-sqlite3:**
- Assurez-vous d'utiliser Node.js v18 ou v20 (pas v24+)
- Installez les outils de build: `xcode-select --install` (macOS)

**Le serveur ne démarre pas:**
- Vérifiez que le port 3000 n'est pas utilisé
- Vérifiez que `.env` existe et contient JWT_SECRET

**Erreurs de base de données:**
- Supprimez `data/admin.db` et relancez `npm run init-db`
- Vérifiez les permissions du dossier `data/`

---

**Dernière mise à jour :** Décembre 2024 - Version 2.0 (Système sécurisé avec backend)