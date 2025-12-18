# Asnières Jujitsu - Site Web

Site web moderne pour le club de Jujitsu Brésilien d'Asnières, développé en HTML, CSS et JavaScript avec un panneau d'administration intégré.

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

### Panneau d'Administration
- **Authentification sécurisée** - Accès protégé par login/mot de passe
- **Gestion des actualités** - Créer, modifier et supprimer des articles
- **Gestion du calendrier** - Ajouter et gérer les événements
- **Interface intuitive** - Tableau de bord facile à utiliser
- **Stockage local** - Données sauvegardées dans le navigateur

## 📁 Structure du Projet

```
ajj-clone/
├── index.html              # Page principale
├── css/
│   └── style.css          # Styles du site
├── js/
│   └── main.js            # JavaScript principal
├── admin/
│   ├── login.html         # Page de connexion admin
│   ├── login.js           # Logique de connexion
│   ├── dashboard.html     # Tableau de bord admin
│   ├── dashboard.js       # Logique du dashboard
│   └── admin-style.css    # Styles de l'admin
├── images/                # Dossier pour les images
├── data/                  # Dossier pour les données
└── README.md             # Ce fichier
```

## 🔧 Installation et Utilisation

### Installation Simple

1. **Téléchargez ou clonez le projet**
   ```bash
   git clone [url-du-repo]
   cd ajj-clone
   ```

2. **Ouvrez le site**
   - Double-cliquez sur `index.html` pour ouvrir le site dans votre navigateur
   - Ou utilisez un serveur local (recommandé) :
     ```bash
     # Avec Python 3
     python -m http.server 8000
     
     # Avec Node.js (http-server)
     npx http-server
     ```

3. **Accédez au site**
   - Site public : `http://localhost:8000/index.html`
   - Administration : `http://localhost:8000/admin/login.html`

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

### Pour un Environnement de Production

**⚠️ IMPORTANT :** Ce système utilise le stockage local du navigateur et une authentification basique. Pour un site en production, vous devez :

1. **Implémenter un backend sécurisé**
   - Utilisez PHP, Node.js, Python, etc.
   - Stockez les données dans une base de données (MySQL, PostgreSQL, MongoDB)
   - Implémentez une vraie authentification avec hash de mot de passe

2. **Sécuriser l'authentification**
   - Utilisez des tokens JWT ou des sessions serveur
   - Implémentez HTTPS
   - Ajoutez une protection CSRF

3. **Protéger le dossier admin**
   - Utilisez `.htaccess` (Apache) ou configuration nginx
   - Ajoutez une authentification HTTP basique en plus

4. **Sauvegarder les données**
   - Mettez en place des backups réguliers
   - Utilisez un système de versioning

## 🌐 Déploiement

### Hébergement Statique (Version Actuelle)
Vous pouvez héberger ce site sur :
- **GitHub Pages** (gratuit)
- **Netlify** (gratuit)
- **Vercel** (gratuit)
- **Firebase Hosting** (gratuit)

### Avec Backend (Recommandé pour Production)
- **Hébergement partagé** avec PHP/MySQL
- **VPS** (OVH, DigitalOcean, etc.)
- **Services cloud** (AWS, Google Cloud, Azure)

## 📱 Compatibilité

- ✅ Chrome (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Edge (dernières versions)
- ✅ Mobile (iOS Safari, Chrome Android)

## 🛠️ Technologies Utilisées

- **HTML5** - Structure
- **CSS3** - Styles et animations
- **JavaScript (Vanilla)** - Interactivité
- **Font Awesome** - Icônes
- **LocalStorage API** - Stockage des données

## 📄 Licence

Ce projet est fourni tel quel pour le club Asnières Jujitsu.

## 🤝 Support

Pour toute question ou problème :
1. Consultez ce README
2. Vérifiez la console du navigateur (F12) pour les erreurs
3. Contactez le développeur

## 🔄 Mises à Jour Futures

Fonctionnalités suggérées :
- [ ] Backend avec base de données
- [ ] Upload d'images directement depuis l'admin
- [ ] Gestion des membres
- [ ] Système de réservation de cours
- [ ] Newsletter
- [ ] Galerie photos
- [ ] Blog
- [ ] Multilingue (FR/EN)

## 📞 Contact Développeur

Pour des modifications ou améliorations, contactez le développeur du site.

---

**Dernière mise à jour :** Décembre 2024