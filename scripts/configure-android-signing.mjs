import fs from 'node:fs';

const keystoreBase64 = process.env.ANDROID_KEYSTORE_BASE64;
if (!keystoreBase64) {
  console.log('ANDROID_KEYSTORE_* secrets are not configured; using the template debug signature.');
  process.exit(0);
}

const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
const keyAlias = process.env.ANDROID_KEY_ALIAS;
const keyPassword = process.env.ANDROID_KEY_PASSWORD;
if (!storePassword || !keyAlias || !keyPassword) {
  throw new Error('Set ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS and ANDROID_KEY_PASSWORD together.');
}

const keystoreName = 'local-home-inventory-release.keystore';
const keystorePath = `android/app/${keystoreName}`;
fs.writeFileSync(keystorePath, Buffer.from(keystoreBase64, 'base64'));
fs.appendFileSync('android/gradle.properties', `\nMYAPP_UPLOAD_STORE_FILE=${keystoreName}\nMYAPP_UPLOAD_STORE_PASSWORD=${storePassword}\nMYAPP_UPLOAD_KEY_ALIAS=${keyAlias}\nMYAPP_UPLOAD_KEY_PASSWORD=${keyPassword}\n`);

const buildGradlePath = 'android/app/build.gradle';
let gradle = fs.readFileSync(buildGradlePath, 'utf8');
if (!gradle.includes('storeFile file(MYAPP_UPLOAD_STORE_FILE)')) {
  const signingConfigsPattern = /(    signingConfigs \{\n        debug \{[\s\S]*?        \}\n)(    \}\n    buildTypes \{)/;
  const releaseSigningConfig = `        release {\n            storeFile file(MYAPP_UPLOAD_STORE_FILE)\n            storePassword MYAPP_UPLOAD_STORE_PASSWORD\n            keyAlias MYAPP_UPLOAD_KEY_ALIAS\n            keyPassword MYAPP_UPLOAD_KEY_PASSWORD\n        }\n`;
  const updated = gradle.replace(signingConfigsPattern, `$1${releaseSigningConfig}$2`);
  if (updated === gradle) throw new Error('Could not add the release signing config.');
  gradle = updated;
}

const releasePattern = /(    buildTypes \{[\s\S]*?        release \{[\s\S]*?)            signingConfig signingConfigs\.debug/;
const signedGradle = gradle.replace(releasePattern, '$1            signingConfig signingConfigs.release');
if (signedGradle === gradle) throw new Error('Could not switch the release build type to the release signing config.');
fs.writeFileSync(buildGradlePath, signedGradle);
console.log('Custom Android release signing is configured.');
