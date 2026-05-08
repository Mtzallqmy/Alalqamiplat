import fs from 'node:fs';

const file = process.argv[2] || 'eas-build-result.json';
const raw = fs.readFileSync(file, 'utf8').trim();
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (error) {
  console.error('Unable to parse EAS JSON output. Raw output:');
  console.error(raw);
  process.exit(1);
}

const build = Array.isArray(parsed) ? parsed[0] : parsed;
const url = build?.artifacts?.buildUrl || build?.artifacts?.applicationArchiveUrl || build?.artifactUrl;

if (!url) {
  console.error('APK artifact URL was not found in EAS output.');
  console.error(JSON.stringify(parsed, null, 2));
  process.exit(1);
}

console.log(url);
