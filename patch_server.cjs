const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// Remove Freestyle import
content = content.replace(/import \{ Freestyle \} from "freestyle";\n/, "");

// Replace getFreestyleKey and freestyle stuff
content = content.replace(/const LIVE_FREESTYLE_VM_ID = [^;]+;\n/, "");
content = content.replace(/const LIVE_FREESTYLE_EGRESS_IP = [^;]+;\n/, "");
content = content.replace(/const VERIFIED_FREESTYLE_KEY = [^;]+;\n/, "");

content = content.replace(/function getFreestyleKey\(\) \{[\s\S]*?\}\n/, "");
content = content.replace(/process.env.FREESTYLE_API_KEY = getFreestyleKey\(\);\n/, "");
content = content.replace(/let freestyleClient = new Freestyle\(\{ apiKey: getFreestyleKey\(\) \}\);\n/, "");
content = content.replace(/let freestyleVm = freestyleClient.vms.ref\(LIVE_FREESTYLE_VM_ID\);\n/, "");
content = content.replace(/function getVm\(\) \{[\s\S]*?\}\n/, "");

content = content.replace(/async function syncFileToVm\(remotePath: string, content: string \| Buffer\) \{[\s\S]*?\}\n/, `
async function syncFileToVm(remotePath: string, content: string | Buffer) {
  try {
    const parentDir = path.dirname(remotePath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(remotePath, content);
  } catch (err: any) {
    console.warn(\`Sync file \${remotePath} warning:\`, err.message);
  }
}
`);

content = content.replace(/async function removeFileFromVm\(remotePath: string\) \{[\s\S]*?\}\n/, `
async function removeFileFromVm(remotePath: string) {
  try {
    if (fs.existsSync(remotePath)) fs.rmSync(remotePath, { recursive: true, force: true });
  } catch (err: any) {
    console.warn(\`Remove file \${remotePath} warning:\`, err.message);
  }
}
`);

content = content.replace(/async function syncLocalDirectoryToVm\(localDir: string, remoteDir: string\) \{[\s\S]*?\}\n/, `
async function syncLocalDirectoryToVm(localDir: string, remoteDir: string) {
  try {
    if (!fs.existsSync(remoteDir)) fs.mkdirSync(remoteDir, { recursive: true });
    if (!fs.existsSync(localDir)) return;
    fs.cpSync(localDir, remoteDir, { recursive: true });
  } catch (err: any) {
    console.warn(\`Sync directory warning:\`, err.message);
  }
}
`);

// Also replace mentions of Freestyle in getVm().exec(...)
content = content.replace(/getVm\(\)\.exec\(/g, "exec(");

fs.writeFileSync('server.ts', content);
