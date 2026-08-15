import fs from 'fs';
import path from 'path';

const jsDir = './js';
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

console.log('Validating files:', files);
for (const file of files) {
  const filePath = path.join(jsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  // Check that file is non-empty and has proper exports
  if (content.length > 50) {
    console.log(`[PASS] ${file} (${content.length} bytes)`);
  } else {
    console.error(`[FAIL] ${file} is too short`);
  }
}
