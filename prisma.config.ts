import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import adminRouter from "./api/admin";
import portfolioRouter from "./api/portfolio";
import uploadRouter from "./api/upload";
import { initializeAdminSettings } from "./services/adminService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Initialize admin settings
  try {
    await initializeAdminSettings("admin123");
  } catch (error) {
    console.log("Admin settings already initialized or error:", error);
  }

  // API Routes
  app.use("/api/admin", adminRouter);
  app.use("/api/portfolio", portfolioRouter);
  app.use("/api/upload", uploadRouter);

  // FIXED UPLOADS SERVING
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Serve the uploads directory directly
  // This is the most reliable way to serve media files with Range support
  app.use("/uploads", express.static(uploadsPath, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
    setHeaders: (res, p) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));

  console.log(`Serving uploads from: ${uploadsPath}`);

  // Serve frontend static files
  const staticPath = path.resolve(__dirname, process.env.NODE_ENV === "production" ? "public" : "../dist/public");
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
  }

  // SPA fallback
  app.get("*", (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return res.status(404).json({ error: "Not Found" });
    }
    
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend not built yet.");
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
