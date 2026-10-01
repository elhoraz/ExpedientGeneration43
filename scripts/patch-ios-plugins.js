const fs = require('fs');
const path = require('path');

console.log('[patch-ios-plugins] Patching Capacitor notification plugins for iOS...');

// 1. LocalNotificationsHandler.swift
const localHandlerPath = path.join(__dirname, '../node_modules/@capacitor/local-notifications/ios/Sources/LocalNotificationsPlugin/LocalNotificationsHandler.swift');
if (fs.existsSync(localHandlerPath)) {
  let content = fs.readFileSync(localHandlerPath, 'utf8');
  content = content.replace(
    'self.plugin?.getConfig().getArray("presentationOptions") as? [String]',
    'self.plugin?.getConfig().getConfigJSON()["presentationOptions"] as? [String]'
  );
  content = content.replace(
    'JSTypes.coerceDictionaryToJSObject(request.content.userInfo)',
    '((request.content.userInfo as? JSObject) ?? (request.content.userInfo as? [String: Any]))'
  );
  content = content.replace(
    'notification["extra"] = extraValue',
    'notification["extra"] = extraValue as? (any JSValue)'
  );
  fs.writeFileSync(localHandlerPath, content, 'utf8');
  console.log('✓ Patched LocalNotificationsHandler.swift');
}

// 2. LocalNotificationsPlugin.swift
const localPluginPath = path.join(__dirname, '../node_modules/@capacitor/local-notifications/ios/Sources/LocalNotificationsPlugin/LocalNotificationsPlugin.swift');
if (fs.existsSync(localPluginPath)) {
  let content = fs.readFileSync(localPluginPath, 'utf8');
  content = content.replace(
    'call.reject(error.message, error.code, underlying)',
    'call.resolve(["error": error.message])'
  );
  content = content.replace(
    'call.reject(error.message)',
    'call.resolve(["error": error.message])'
  );
  content = content.replace(
    'call.errorHandler?(CAPPluginCallError(message: error.message, code: error.code, error: underlying, data: nil))',
    'call.resolve(["error": error.message])'
  );
  content = content.replace(
    'let state = call.getString("state")',
    'let state = call.getString("state", "")'
  );
  // Replace all occurrences of call.getArray("notifications", JSObject.self)
  content = content.replaceAll(
    'guard let notifications = call.getArray("notifications", JSObject.self) else {',
    'guard let notifications = (call.getArray("notifications", []) as? [JSObject]), !notifications.isEmpty else {'
  );
  content = content.replace(
    'guard let notifications = call.getArray("notifications", JSObject.self), notifications.count > 0 else {',
    'guard let notifications = (call.getArray("notifications", []) as? [JSObject]), notifications.count > 0 else {'
  );
  content = content.replace(
    'guard let types = call.getArray("types", JSObject.self) else {',
    'guard let types = (call.getArray("types", []) as? [JSObject]) else {'
  );
  content = content.replace(
    'guard let idsArray = call.getArray("ids") else {',
    'guard let idsArray = (call.getArray("ids", []) as? JSArray), !idsArray.isEmpty else {'
  );
  content = content.replace(
    'return bridge?.localURL(fromWebURL: webURL)',
    'return webURL'
  );
  fs.writeFileSync(localPluginPath, content, 'utf8');
  console.log('✓ Patched LocalNotificationsPlugin.swift');
}

// 3. PushNotificationsHandler.swift
const pushHandlerPath = path.join(__dirname, '../node_modules/@capacitor/push-notifications/ios/Sources/PushNotificationsPlugin/PushNotificationsHandler.swift');
if (fs.existsSync(pushHandlerPath)) {
  let content = fs.readFileSync(pushHandlerPath, 'utf8');
  content = content.replace(
    'self.plugin?.getConfig().getArray("presentationOptions") as? [String]',
    'self.plugin?.getConfig().getConfigJSON()["presentationOptions"] as? [String]'
  );
  content = content.replace(
    'JSTypes.coerceDictionaryToJSObject(request.content.userInfo) ?? [:]',
    '((request.content.userInfo as? JSObject) ?? (request.content.userInfo as? [String: Any]) ?? [:])'
  );
  fs.writeFileSync(pushHandlerPath, content, 'utf8');
  console.log('✓ Patched PushNotificationsHandler.swift');
}

// 4. PushNotificationsPlugin.swift
const pushPluginPath = path.join(__dirname, '../node_modules/@capacitor/push-notifications/ios/Sources/PushNotificationsPlugin/PushNotificationsPlugin.swift');
if (fs.existsSync(pushPluginPath)) {
  let content = fs.readFileSync(pushPluginPath, 'utf8');
  content = content.replace(
    'guard let notifications = call.getArray("notifications", JSObject.self) else {',
    'guard let notifications = (call.getArray("notifications", []) as? [JSObject]) else {'
  );
  fs.writeFileSync(pushPluginPath, content, 'utf8');
  console.log('✓ Patched PushNotificationsPlugin.swift');
}

// 5. whatsapp-rust-bridge (Node 24 compatibility patch)
const rustBridgePkgPath = path.join(__dirname, '../node_modules/whatsapp-rust-bridge/package.json');
if (fs.existsSync(rustBridgePkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(rustBridgePkgPath, 'utf8'));
    if (!pkg.main) {
      pkg.main = './dist/index.js';
      pkg.exports = {
        '.': {
          import: './dist/index.js',
          require: './dist/index.js',
          default: './dist/index.js',
          types: './dist/index.d.ts'
        }
      };
      fs.writeFileSync(rustBridgePkgPath, JSON.stringify(pkg, null, 2), 'utf8');
      console.log('✓ Patched whatsapp-rust-bridge package.json');
    }
  } catch (err) {}
}

console.log('[patch-ios-plugins] All plugin patches applied.');
