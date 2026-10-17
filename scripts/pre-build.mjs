import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runIntegrityCheck } from "./verify.mjs";
import { decryptVault, buildManifest, signDigest, TAMPER_MESSAGE } from "./auth-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const securityDir = path.join(projectRoot, "src", "security");

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

const check = runIntegrityCheck();

if (!check.valid) {
  // Check if authorized author is building locally with .env.local password
  const password = process.env.AUTHOR_PASSWORD || loadEnvLocal();
  const vaultPath = path.join(securityDir, "vault.enc.json");

  let autoSealed = false;

  if (password && fs.existsSync(vaultPath)) {
    try {
      const vaultObj = JSON.parse(fs.readFileSync(vaultPath, "utf-8"));
      const decrypted = decryptVault(vaultObj, password);
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

      console.log("🔓 [Author Auto-Sign] Code modified by authorized owner. Sealed with valid credentials.");
      autoSealed = true;
    } catch {
      autoSealed = false;
    }
  }

  if (!autoSealed) {
    console.error("\n=================================================================");
    console.error("🚨 UNAUTHORIZED CODE MODIFICATION DETECTED!");
    console.error("=================================================================");
    console.error(`Reason: ${check.reason}`);
    if (check.modifiedFiles?.length) {
      console.error("\nModified/Unauthorized files:");
      check.modifiedFiles.forEach((f) => console.error(`  - ${f}`));
    }
    console.error("\n-----------------------------------------------------------------");
    console.error(`❌ "${TAMPER_MESSAGE}"`);
    console.error("=================================================================\n");

    // Exit and block build
    process.exit(1);
  }
} else {
  console.log("✅ [Devmanus Guard] Integrity check passed. Ready to build.");
}
