const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/HomePageView.tsx',
  'src/components/MyServersPageView.tsx',
  'src/components/BillingPageView.tsx',
  'src/components/PurchasePlanModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('await fetch("/api') || content.includes('await fetch(`/api')) {
    if (!content.includes('import { apiFetch }')) {
       // Just insert it after the first import
       content = content.replace(/import /, 'import { apiFetch } from "../lib/api";\nimport ');
    }
    content = content.replace(/await fetch\(/g, 'await apiFetch(');
    fs.writeFileSync(file, content);
  }
}
