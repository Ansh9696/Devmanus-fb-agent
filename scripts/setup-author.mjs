import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateKeys,
  encryptVault,
  derivePasswordVerifier,
  buildManifest,
  signDigest,
  TAMPER_MESSAGE
} from "./auth-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Accept password from command line arg, env var, or default
const password = process.argv[2] || process.env.AUTHOR_PASSWORD || "Devmanus@2026";

console.log("=================================================================");
console.log("🛡️  DEVMANUS AUTHOR CODE-PROTECTION & INTEGRITY SETUP");
console.log("=================================================================");
console.log(`Setting up Author Master Password and Cryptographic Vault...`);

const securityDir = path.join(projectRoot, "src", "security");
if (!fs.existsSync(securityDir)) {
  fs.mkdirSync(securityDir, { recursive: true });
}

// 1. Generate ECDSA P-256 Keypair
const { publicKeyJwk, privateKeyJwk } = generateKeys();

// 2. Encrypt Private Key with author master password using AES-256-GCM
const vault = encryptVault({ privateKeyJwk }, password);
fs.writeFileSync(
  path.join(securityDir, "vault.enc.json"),
  JSON.stringify(vault, null, 2),
  "utf-8"
);

// 3. Save Public Key (safe to be public in git repo)
fs.writeFileSync(
  path.join(securityDir, "author-public.json"),
  JSON.stringify(publicKeyJwk, null, 2),
  "utf-8"
);

// 4. Save PBKDF2 Password Verifier for browser UI unlock
const verifier = derivePasswordVerifier(password);
fs.writeFileSync(
  path.join(securityDir, "auth-config.json"),
  JSON.stringify({
    verifier,
    author: "Devmanus Authorized Author",
    tamperMessage: TAMPER_MESSAGE,
    updatedAt: new Date().toISOString()
  }, null, 2),
  "utf-8"
);

// 5. Compute project file hashes and sign manifest
const manifest = buildManifest(projectRoot);
const signature = signDigest(manifest.rootHash, privateKeyJwk);

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

// 6. Save AUTHOR_PASSWORD to .env.local (gitignored) for seamless local author builds
const envLocalPath = path.join(projectRoot, ".env.local");
let envContent = "";
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, "utf-8");
}
if (!envContent.includes("AUTHOR_PASSWORD=")) {
  envContent += `\nAUTHOR_PASSWORD="${password}"\n`;
} else {
  envContent = envContent.replace(/AUTHOR_PASSWORD=.*(\r?\n|$)/, `AUTHOR_PASSWORD="${password}"$1`);
}
fs.writeFileSync(envLocalPath, envContent.trim() + "\n", "utf-8");

console.log("✅ Author Public Key saved: src/security/author-public.json");
console.log("✅ Encrypted Vault saved:   src/security/vault.enc.json");
console.log("✅ Auth Config saved:       src/security/auth-config.json");
console.log("✅ Integrity Manifest:      src/security/integrity-manifest.json");
console.log("✅ Local Password saved:    .env.local (Protected / Gitignored)");
console.log("-----------------------------------------------------------------");
console.log(`🔑 Master Password configured: ${password}`);
console.log(`Protected Files Count: ${manifest.fileCount}`);
console.log(`Root Digest: ${manifest.rootHash}`);
console.log("=================================================================");
console.log("🎉 Protection initialized! Any unauthorized modifications without");
console.log("the master password will immediately lock down the extension with:");
console.log(`"${TAMPER_MESSAGE}"`);
console.log("=================================================================");
