const fs = require('fs');
const path = require('path');

console.log('[patch-ios-plugins] Pinning Capacitor SPM dependencies to exact 8.0.0...');

// 1. Lock SPM dependency in @capacitor/local-notifications/Package.swift
const localPkgPath = path.join(__dirname, '../node_modules/@capacitor/local-notifications/Package.swift');
if (fs.existsSync(localPkgPath)) {
  let content = fs.readFileSync(localPkgPath, 'utf8');
  content = content.replace(/from:\s*"8\.0\.0"/g, 'exact: "8.0.0"');
  fs.writeFileSync(localPkgPath, content, 'utf8');
  console.log('✓ Pinned @capacitor/local-notifications/Package.swift to exact 8.0.0');
}

// 2. Lock SPM dependency in @capacitor/push-notifications/Package.swift
const pushPkgPath = path.join(__dirname, '../node_modules/@capacitor/push-notifications/Package.swift');
if (fs.existsSync(pushPkgPath)) {
  let content = fs.readFileSync(pushPkgPath, 'utf8');
  content = content.replace(/from:\s*"8\.0\.0"/g, 'exact: "8.0.0"');
  fs.writeFileSync(pushPkgPath, content, 'utf8');
  console.log('✓ Pinned @capacitor/push-notifications/Package.swift to exact 8.0.0');
}

console.log('[patch-ios-plugins] SPM pinning complete.');
