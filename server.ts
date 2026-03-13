import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // POST /api/login
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@towertech.com" && password === "admin123") {
      res.json({ 
        success: true, 
        user: { email: "admin@towertech.com", name: "Admin User", role: "admin" } 
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // GET /api/flats
  app.get("/api/flats", async (req, res) => {
    try {
      const flats = await prisma.flat.findMany({
        include: { 
          resident: true, 
          wing: { include: { tower: true } } 
        },
        orderBy: [
          { wing: { name: 'asc' } },
          { number: 'asc' }
        ]
      });
      res.json(flats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // GET /api/residents
  app.get("/api/residents", async (req, res) => {
    try {
      const residents = await prisma.resident.findMany({
        include: { flat: true },
        orderBy: { name: 'asc' }
      });
      res.json(residents);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // GET /api/complaints
  app.get("/api/complaints", async (req, res) => {
    try {
      const complaints = await prisma.complaint.findMany({
        include: { resident: { include: { flat: true } } },
        orderBy: { id: 'desc' }
      });
      res.json(complaints);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // POST /api/add-resident
  app.post("/api/add-resident", async (req, res) => {
    const { name, email, phone, flatId } = req.body;
    try {
      const resident = await prisma.resident.create({
        data: { name, email, phone, flatId }
      });
      res.json({ success: true, resident });
    } catch (err) {
      console.error(err);
      res.status(400).json({ success: false, message: "Failed to add resident" });
    }
  });

  // POST /api/generate-bill
  app.post("/api/generate-bill", async (req, res) => {
    const { amount, month } = req.body;
    try {
      const residents = await prisma.resident.findMany();
      const bills = residents.map(r => ({
        residentId: r.id,
        amount: parseFloat(amount),
        month,
        status: 'UNPAID'
      }));

      await prisma.maintenanceBill.createMany({ data: bills });
      res.json({ success: true, message: `Bills generated for ${residents.length} residents` });
    } catch (err) {
      console.error(err);
      res.status(400).json({ success: false, message: "Failed to generate bills" });
    }
  });

  // GET /api/stats
  app.get("/api/stats", async (req, res) => {
    try {
      const totalFlats = await prisma.flat.count();
      const totalResidents = await prisma.resident.count();
      const totalComplaints = await prisma.complaint.count();
      res.json({ totalFlats, totalResidents, totalComplaints });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
