import fs from 'fs';
import path from 'path';

const jsDir = './js';
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

let allOk = true;
for (const file of files) {
  const filePath = path.join(jsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    // Basic check for unclosed brackets or syntax flaws
    const replaced = content.replace(/from\s+['"]https:\/\/[^'"]+['"]/g, 'from "fs"');
    new Function(replaced);
    console.log(`[PASS] ${file}`);
  } catch (err) {
    console.error(`[FAIL] ${file}:`, err.message);
    allOk = false;
  }
}

if (allOk) {
  console.log('All JS modules passed syntax validation!');
}
