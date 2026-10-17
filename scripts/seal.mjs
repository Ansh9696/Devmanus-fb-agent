import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import {
  decryptVault,
  buildManifest,
  signDigest,
  TAMPER_MESSAGE
} from "./auth-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const securityDir = path.join(projectRoot, "src", "security");

// Helper to load .env.local if present
function loadEnvLocal() {
  const envLocalPath = path.join(projectRoot, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^AUTHOR_PASSWORD=["']?(.*?)["']?$/);
      if (match) return match[1].trim();
    }
  }
  return null;
}

async function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question("🔐 Enter Author Master Password to seal and sign repository: ", (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  console.log("=================================================================");
  console.log("🛡️  DEVMANUS AUTHOR CODE-SIGNING & SEALING UTILITY");
  console.log("=================================================================");

  const vaultPath = path.join(securityDir, "vault.enc.json");
  if (!fs.existsSync(vaultPath)) {
    console.error("❌ Error: Vault not found. Run `npm run auth:setup` first.");
    process.exit(1);
  }

  const vaultObj = JSON.parse(fs.readFileSync(vaultPath, "utf-8"));
  
  // Try CLI arg -> env var -> .env.local -> prompt
  let password = process.argv[2] || process.env.AUTHOR_PASSWORD || loadEnvLocal();
  if (!password) {
    password = await promptPassword();
  }

  if (!password) {
    console.error(`\n❌ Error: Password required!\n${TAMPER_MESSAGE}\n`);
    process.exit(1);
  }

  let decrypted;
  try {
    decrypted = decryptVault(vaultObj, password);
  } catch (err) {
    console.error(`\n❌ AUTHORIZATION REJECTED: Invalid Master Password!`);
    console.error(`🚨 ${TAMPER_MESSAGE}\n`);
    process.exit(1);
  }

  console.log("🔓 Author credentials authenticated successfully.");
  console.log("🔍 Scanning codebase and computing cryptographic digests...");

  const manifest = buildManifest(projectRoot);
  const signature = signDigest(manifest.rootHash, decrypted.privateKeyJwk);

  const integrityManifest = {
    timestamp: Date.now(),
    author: "Devmanus Authorized Author",
    fileCount: manifest.fileCount,
    rootHash: manifest.rootHash,
    files: manifest.fileHashMap,
    signature
  };

  fs.writeFileSync(
    path.join(securityDir, "integrity-manifest.json"),
    JSON.stringify(integrityManifest, null, 2),
    "utf-8"
  );

  console.log(`✅ Scanned & Hashed: ${manifest.fileCount} protected files`);
  console.log(`✅ Root Digest:      ${manifest.rootHash}`);
  console.log(`✅ Cryptographic Signature updated in src/security/integrity-manifest.json`);
  console.log("-----------------------------------------------------------------");
  console.log("🎉 SUCCESS: Repository sealed! Safe to commit and push to GitHub.");
  console.log("Any external modification without your password will break execution.");
  console.log("=================================================================");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
