import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const appJsonPath = 'app.json';
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const version = packageJson.version;
const [major = '0', minor = '0', patch = '0'] = version.split('.');
const versionCode =
  (Number.parseInt(major, 10) || 0) * 10000 +
  (Number.parseInt(minor, 10) || 0) * 100 +
  (Number.parseInt(patch, 10) || 0);

appJson.expo.version = version;
appJson.expo.android = {
  ...(appJson.expo.android ?? {}),
  versionCode,
};

fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
console.log(`${version} (${versionCode})`);
