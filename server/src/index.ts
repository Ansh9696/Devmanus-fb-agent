import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

// Auto-detect extension dist directory (supports local npm dev and Docker container paths)
const candidateDistPaths = [
  path.resolve(__dirname, "../../dist"),
  path.resolve(__dirname, "../dist"),
  path.resolve(__dirname, "./dist"),
  path.resolve(process.cwd(), "dist"),
  path.resolve(process.cwd(), "../dist")
];
const distPath = candidateDistPaths.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, "manifest.json")));

app.disable("x-powered-by");
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith("chrome-extension://")) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "150kb" }));

// Configure and serve dist folder if present
if (distPath) {
  app.use("/dist", express.static(distPath));

  const distAssets = path.join(distPath, "assets");
  if (fs.existsSync(distAssets)) {
    app.use("/assets", express.static(distAssets));
  }

  app.get("/sidepanel", (_req, res) => {
    const sidepanelHtml = path.join(distPath, "src/sidepanel/index.html");
    if (fs.existsSync(sidepanelHtml)) {
      return res.sendFile(sidepanelHtml);
    }
    return res.status(404).send("Sidepanel HTML not found in dist. Run 'npm run build'.");
  });

  app.get("/api/extension/status", (_req, res) => {
    try {
      const manifestRaw = fs.readFileSync(path.join(distPath, "manifest.json"), "utf8");
      const manifest = JSON.parse(manifestRaw);
      return res.json({
        ok: true,
        configured: true,
        distPath,
        name: manifest.name,
        version: manifest.version,
        sidepanelPreview: "/sidepanel",
        distAssets: "/dist/manifest.json"
      });
    } catch {
      return res.json({ ok: false, configured: false, error: "Failed to read manifest.json" });
    }
  });
}

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "devmanus-local-backend",
    extensionConfigured: Boolean(distPath),
    distPath: distPath || null,
    sidepanelPreview: distPath ? "/sidepanel" : null
  });
});

app.get("/api/cron/info", (_req, res) => {
  res.json({
    interval: "Configurable in sidepanel (Default: 3 hours)",
    mechanism: "Chrome MV3 Alarms (chrome.alarms) & Devmanus background worker",
    postTargets: [
      "DevOps, SRE, and Platform Engineering Jobs",
      "Job support , proxy interviews and trainings for US candidate s",
      "Data Engineer proxy support",
      "Data Engineer & Devops Job Support",
      "DevOps(Docker + Kubernetes) Group",
      "IT Job Support & Interview Proxy",
      "SAP projects , training, proxy, job support.",
      "Interview Proxy & Support | Data Engineer | Data Analyst | Java Full Stack"
    ]
  });
});

app.listen(port, host, () => {
  console.log(`✓ Devmanus local server running at http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`);
  if (distPath) {
    console.log(`✓ Extension dist detected: ${distPath}`);
    console.log(`✓ Sidepanel preview available at: http://127.0.0.1:${port}/sidepanel`);
  }
});