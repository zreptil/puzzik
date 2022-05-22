const {version} = require('../package.json');
const {resolve, relative} = require('path');
const {writeFileSync} = require('fs');

const file = resolve(__dirname, '..', 'src', 'environments', 'version.ts');
const date = Date.now();
writeFileSync(file,
  `// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
export const version = {
  number: '${version}',
  date: ${date}
};
`, {encoding: 'utf-8'});

console.log(`Wrote version info ${version} to ${relative(resolve(__dirname, '..'), file)}`);
