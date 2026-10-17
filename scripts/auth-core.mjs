import crypto from "crypto";
import fs from "fs";
import path from "path";

export const FIXED_SALT = Buffer.from("devmanus-fb-extension-salt-2026", "utf-8");
export const PBKDF2_ITERATIONS = 100000;
export const TAMPER_MESSAGE = "ai use karne se koi developer nahi ban jata ladle";

// Normalize text files to prevent false positive hash mismatch between Windows (CRLF) and Mac/Linux (LF)
export function normalizeBuffer(buffer, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const textExtensions = [".ts", ".tsx", ".js", ".mjs", ".json", ".css", ".html", ".md", ".txt"];
  if (textExtensions.includes(ext)) {
    const text = buffer.toString("utf-8").replace(/\r\n/g, "\n");
    return Buffer.from(text, "utf-8");
  }
  return buffer;
}

export function computeFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  const normalized = normalizeBuffer(content, filePath);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function derivePasswordVerifier(password) {
  const hash = crypto.pbkdf2Sync(password, FIXED_SALT, PBKDF2_ITERATIONS, 32, "sha256");
  return hash.toString("hex");
}

export function encryptVault(dataObj, password) {
  const key = crypto.pbkdf2Sync(password, FIXED_SALT, PBKDF2_ITERATIONS, 32, "sha256");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  const plaintext = Buffer.from(JSON.stringify(dataObj), "utf-8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex")
  };
}

export function decryptVault(vaultObj, password) {
  try {
    const key = crypto.pbkdf2Sync(password, FIXED_SALT, PBKDF2_ITERATIONS, 32, "sha256");
    const iv = Buffer.from(vaultObj.iv, "hex");
    const tag = Buffer.from(vaultObj.tag, "hex");
    const encrypted = Buffer.from(vaultObj.data, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf-8"));
  } catch (err) {
    throw new Error(`Decryption failed: Invalid author password! ${TAMPER_MESSAGE}`);
  }
}

export function generateKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1"
  });

  return {
    publicKeyJwk: publicKey.export({ format: "jwk" }),
    privateKeyJwk: privateKey.export({ format: "jwk" })
  };
}

// Collect all relevant files in project for integrity checking
export function collectProtectedFiles(projectRoot) {
  const protectedPaths = [];
  const srcDir = path.join(projectRoot, "src");

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, "/");

      // Skip generated security manifests and vaults
      if (
        entry.name === "integrity-manifest.json" ||
        entry.name === "vault.enc.json" ||
        entry.name === "author-public.json" ||
        entry.name === "auth-config.json"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Include source files, scripts, and key configuration files
        if (
          entry.name.endsWith(".ts") ||
          entry.name.endsWith(".tsx") ||
          entry.name.endsWith(".js") ||
          entry.name.endsWith(".json") ||
          entry.name.endsWith(".css") ||
          entry.name.endsWith(".html")
        ) {
          protectedPaths.push(relPath);
        }
      }
    }
  }

  walk(srcDir);

  // Also include root manifest and config
  const rootFiles = ["manifest.json", "vite.config.ts", "package.json"];
  for (const rf of rootFiles) {
    const full = path.join(projectRoot, rf);
    if (fs.existsSync(full)) {
      protectedPaths.push(rf);
    }
  }

  protectedPaths.sort();
  return protectedPaths;
}

export function buildManifest(projectRoot) {
  const files = collectProtectedFiles(projectRoot);
  const fileHashMap = {};
  const sortedPairs = [];

  for (const relPath of files) {
    const fullPath = path.join(projectRoot, relPath);
    const hash = computeFileHash(fullPath);
    fileHashMap[relPath] = hash;
    sortedPairs.push(`${relPath}:${hash}`);
  }

  const rootHash = crypto.createHash("sha256").update(sortedPairs.join("\n")).digest("hex");

  return {
    fileHashMap,
    rootHash,
    fileCount: files.length
  };
}

export function signDigest(rootHash, privateKeyJwk) {
  const privateKey = crypto.createPrivateKey({ key: privateKeyJwk, format: "jwk" });
  const sign = crypto.createSign("SHA256");
  sign.update(Buffer.from(rootHash, "utf-8"));
  sign.end();
  return sign.sign(privateKey).toString("hex");
}

export function verifyDigest(rootHash, signatureHex, publicKeyJwk) {
  try {
    const publicKey = crypto.createPublicKey({ key: publicKeyJwk, format: "jwk" });
    const verify = crypto.createVerify("SHA256");
    verify.update(Buffer.from(rootHash, "utf-8"));
    verify.end();
    return verify.verify(publicKey, Buffer.from(signatureHex, "hex"));
  } catch (err) {
    return false;
  }
}
