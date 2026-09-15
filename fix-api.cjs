const fs = require('fs');

const file = 'src/lib/api.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  if (secret && !headers.has("x-vps-api-secret") && !headers.has("Authorization")) {
    headers.set("x-vps-api-secret", secret);
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vps_auth_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", \`Bearer \${token}\`);
    }
  }

  return fetch(url, {`;

content = content.replace(`  if (secret && !headers.has("x-vps-api-secret") && !headers.has("Authorization")) {
    headers.set("x-vps-api-secret", secret);
  }

  return fetch(url, {`, replacement);

fs.writeFileSync(file, content);
