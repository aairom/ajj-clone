# 📧 Configuration Email pour le Formulaire de Contact

Ce guide explique comment configurer l'envoi d'emails depuis le formulaire de contact du site.

## 🔧 Configuration Gmail

### 1. Créer un Mot de Passe d'Application Gmail

Pour utiliser Gmail avec nodemailer, vous devez créer un **mot de passe d'application** (App Password) :

1. **Activez la validation en deux étapes** sur votre compte Gmail :
   - Allez sur https://myaccount.google.com/security
   - Cliquez sur "Validation en deux étapes"
   - Suivez les instructions pour l'activer

2. **Créez un mot de passe d'application** :
   - Retournez sur https://myaccount.google.com/security
   - Cliquez sur "Mots de passe des applications"
   - Sélectionnez "Autre (nom personnalisé)"
   - Entrez "Asnières Jujitsu Website"
   - Cliquez sur "Générer"
   - **Copiez le mot de passe de 16 caractères** (sans espaces)

### 2. Configurez le fichier .env

Éditez le fichier `.env` et ajoutez vos informations :

```env
# Email Configuration
EMAIL_USER=asnieresjujitsu@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application-16-caracteres
```

⚠️ **Important** : 
- Utilisez le mot de passe d'application, PAS votre mot de passe Gmail normal
- Ne partagez jamais ce fichier `.env` (il est déjà dans `.gitignore`)

### 3. Installez les dépendances

```bash
npm install
```

### 4. Redémarrez le serveur

```bash
npm start
```

## 🧪 Test du Formulaire

1. Ouvrez le site : `http://localhost:3000`
2. Allez à la section Contact
3. Remplissez le formulaire
4. Cliquez sur "Envoyer"
5. Vérifiez la boîte de réception de `asnieresjujitsu@gmail.com`

## 📝 Format de l'Email Reçu

Les emails reçus auront ce format :

```
Sujet: [Site Web AJJ] {Sujet du message}

Nouveau message depuis le site web

Nom: {Nom de l'utilisateur}
Email: {Email de l'utilisateur}
Sujet: {Sujet}

Message:
{Contenu du message}

Ce message a été envoyé depuis le formulaire de contact du site Asnières Jujitsu
```

L'email de l'utilisateur sera dans le champ "Reply-To", vous pouvez donc répondre directement.

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne commitez JAMAIS le fichier `.env`** avec vos vraies informations
2. **Utilisez un mot de passe d'application** dédié
3. **Révoquez le mot de passe** si vous pensez qu'il a été compromis
4. **Limitez les permissions** du compte email utilisé

### Rate Limiting

Le formulaire de contact est protégé par rate limiting :
- Maximum 100 requêtes par 15 minutes par IP
- Empêche le spam et les abus

## 🔄 Alternatives à Gmail

Si vous préférez utiliser un autre service email :

### Outlook/Hotmail

```javascript
const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

### SMTP Personnalisé

```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.votre-domaine.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

### SendGrid (Service Professionnel)

```bash
npm install @sendgrid/mail
```

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: 'asnieresjujitsu@gmail.com',
    from: 'noreply@votredomaine.com',
    subject: subject,
    html: htmlContent
};

await sgMail.send(msg);
```

## 🐛 Dépannage

### Erreur "Invalid login"

- Vérifiez que vous utilisez un mot de passe d'application, pas votre mot de passe Gmail
- Vérifiez que la validation en deux étapes est activée
- Vérifiez qu'il n'y a pas d'espaces dans le mot de passe

### Erreur "Connection timeout"

- Vérifiez votre connexion internet
- Vérifiez que le port 587 n'est pas bloqué par votre firewall
- Essayez avec `port: 465` et `secure: true`

### Les emails ne sont pas reçus

- Vérifiez le dossier spam
- Vérifiez que l'adresse `EMAIL_USER` est correcte
- Vérifiez les logs du serveur pour les erreurs

### Tester la configuration

Vous pouvez tester l'envoi d'email avec ce script :

```javascript
// test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'asnieresjujitsu@gmail.com',
    subject: 'Test Email',
    text: 'Ceci est un email de test'
}, (error, info) => {
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});
```

Exécutez : `node test-email.js`

## 📚 Ressources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

**Configuration créée par Bob**