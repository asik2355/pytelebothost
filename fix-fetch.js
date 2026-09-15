const fs = require('fs');

const file = 'src/components/ServerControlPanelView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not exists
if (!content.includes('import { apiFetch }')) {
  content = content.replace('import { useState', 'import { apiFetch } from "../lib/api";\nimport { useState');
}

// Replace fetch(...) with apiFetch(...)
content = content.replace(/await fetch\(/g, 'await apiFetch(');
// Also handle the one non-await fetch(filePath)
content = content.replace(/fetch\(filePath\)/g, 'apiFetch(filePath)');

fs.writeFileSync(file, content);
