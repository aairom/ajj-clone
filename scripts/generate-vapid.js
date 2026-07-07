#!/usr/bin/env node
/**
 * generate-vapid.js
 * Run once: node scripts/generate-vapid.js
 * Appends the VAPID keys to your .env file (or prints them to paste manually).
 */
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const keys = webpush.generateVAPIDKeys();
const envPath = path.join(__dirname, '..', '.env');

const lines = [
    `VAPID_PUBLIC_KEY=${keys.publicKey}`,
    `VAPID_PRIVATE_KEY=${keys.privateKey}`,
    `VAPID_SUBJECT=mailto:asnieresjujitsu@gmail.com`
];

console.log('\n🔑 VAPID Keys generated:');
lines.forEach(l => console.log('  ' + l));

if (fs.existsSync(envPath)) {
    const current = fs.readFileSync(envPath, 'utf8');
    if (current.includes('VAPID_PUBLIC_KEY=') && !current.includes('VAPID_PUBLIC_KEY=\n') && !current.match(/VAPID_PUBLIC_KEY=\s*\n/)) {
        console.log('\n⚠️  VAPID keys already set in .env — not overwriting.');
        console.log('   Delete the VAPID_* lines in .env and re-run if you want new keys.\n');
    } else {
        // Append or replace empty VAPID lines
        let updated = current;
        if (current.includes('VAPID_PUBLIC_KEY=')) {
            updated = updated.replace(/VAPID_PUBLIC_KEY=.*/, `VAPID_PUBLIC_KEY=${keys.publicKey}`);
            updated = updated.replace(/VAPID_PRIVATE_KEY=.*/, `VAPID_PRIVATE_KEY=${keys.privateKey}`);
        } else {
            updated += '\n' + lines.join('\n') + '\n';
        }
        fs.writeFileSync(envPath, updated);
        console.log('\n✅ Keys written to .env\n');
    }
} else {
    fs.writeFileSync(envPath, lines.join('\n') + '\n');
    console.log('\n✅ .env created with VAPID keys\n');
}

// Made with Bob
