const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// Replace child_process import
content = content.replace(
  'import { spawn, exec, execSync, ChildProcess } from "child_process";',
  'import { spawn, exec as cp_exec, execSync, ChildProcess } from "child_process";\nimport { promisify } from "util";\nconst exec = promisify(cp_exec);'
);

fs.writeFileSync('server.ts', content);
