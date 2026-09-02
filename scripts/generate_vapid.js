const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

const envContent = `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_SUBJECT=mailto:admin@expedientgeneration.com\n`;

fs.appendFileSync(path.join(__dirname, '.env.local'), envContent);
console.log('VAPID Keys generated and appended to .env.local');
