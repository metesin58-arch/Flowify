const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', '@capacitor-community', 'admob', 'ios', 'Sources', 'AdMobPlugin', 'Consent', 'ConsentExecutor.swift');

if (!fs.existsSync(targetFile)) {
  console.log(`[Patch AdMob] File not found: ${targetFile}. Skipping patch.`);
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');

console.log('[Patch AdMob] Patching ConsentExecutor.swift for new Google User Messaging Platform SDK...');

// Apply replacements
content = content.replace(/UMPRequestParameters/g, 'RequestParameters');
content = content.replace(/UMPDebugSettings/g, 'DebugSettings');
content = content.replace(/UMPDebugGeography/g, 'DebugGeography');
content = content.replace(/parameters\.tagForUnderAgeOfConsent/g, 'parameters.isTaggedForUnderAgeOfConsent');
content = content.replace(/UMPConsentInformation/g, 'ConsentInformation');
content = content.replace(/sharedInstance/g, 'shared');
content = content.replace(/UMPFormStatus/g, 'FormStatus');
content = content.replace(/UMPConsentForm/g, 'ConsentForm');
content = content.replace(/ConsentForm\.load\(completionHandler:/g, 'ConsentForm.load(with:');
content = content.replace(/UMPConsentStatus/g, 'ConsentStatus');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('[Patch AdMob] Patch completed successfully.');
