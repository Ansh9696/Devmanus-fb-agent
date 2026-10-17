import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildManifest,
  verifyDigest,
  TAMPER_MESSAGE
} from "./auth-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const securityDir = path.join(projectRoot, "src", "security");

export function runIntegrityCheck() {
  const manifestPath = path.join(securityDir, "integrity-manifest.json");
  const pubKeyPath = path.join(securityDir, "author-public.json");

  if (!fs.existsSync(manifestPath) || !fs.existsSync(pubKeyPath)) {
    return {
      valid: false,
      reason: "Security files missing. Codebase has been tampered with.",
      tamperMessage: TAMPER_MESSAGE
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const publicKeyJwk = JSON.parse(fs.readFileSync(pubKeyPath, "utf-8"));

  // 1. Verify ECDSA signature of recorded rootHash
  const isSigValid = verifyDigest(manifest.rootHash, manifest.signature, publicKeyJwk);
  if (!isSigValid) {
    return {
      valid: false,
      reason: "Cryptographic signature mismatch! Signature was forged or invalidated.",
      tamperMessage: TAMPER_MESSAGE
    };
  }

  // 2. Scan current workspace and compare hashes
  const current = buildManifest(projectRoot);
  const modifiedFiles = [];

  for (const [relPath, origHash] of Object.entries(manifest.files)) {
    const curHash = current.fileHashMap[relPath];
    if (!curHash) {
      modifiedFiles.push(`${relPath} (DELETED / MISSING)`);
    } else if (curHash !== origHash) {
      modifiedFiles.push(`${relPath} (MODIFIED)`);
    }
  }

  // Check for any newly added unauthorized files in protected dirs
  for (const relPath of Object.keys(current.fileHashMap)) {
    if (!manifest.files[relPath]) {
      modifiedFiles.push(`${relPath} (UNAUTHORIZED NEW FILE)`);
    }
  }

  if (modifiedFiles.length > 0 || current.rootHash !== manifest.rootHash) {
    return {
      valid: false,
      reason: `Unauthorized changes detected in ${modifiedFiles.length} file(s)`,
      modifiedFiles,
      tamperMessage: TAMPER_MESSAGE
    };
  }

  return { valid: true };
}

// If run directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log("🔍 Checking code integrity against author cryptographic signature...");
  const result = runIntegrityCheck();

  if (!result.valid) {
    console.error("=================================================================");
    console.error("🚨 SECURITY ALERT: UNAUTHORIZED CODE MODIFICATION DETECTED!");
    console.error("=================================================================");
    console.error(`Reason: ${result.reason}`);
    if (result.modifiedFiles?.length) {
      console.error("\nTampered files:");
      result.modifiedFiles.forEach((f) => console.error(`  - ${f}`));
    }
    console.error("\n-----------------------------------------------------------------");
    console.error(`❌ "${result.tamperMessage}"`);
    console.error("=================================================================");
    process.exit(1);
  } else {
    console.log("✅ Code integrity verified! All files match author signature.");
  }
}
