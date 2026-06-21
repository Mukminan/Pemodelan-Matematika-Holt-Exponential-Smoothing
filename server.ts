import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Initialize Gemini AI
  // The SDK automatically uses process.env.GEMINI_API_KEY
  const ai = new GoogleGenAI({
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      
      const systemInstruction = `Kamu adalah "Asisten AI dalam Simulator DES Putri Cempo", asisten virtual yang mendampingi pengguna di aplikasi ini.
Aplikasi ini dirancang untuk mensimulasikan dan meramalkan volume timbulan sampah masuk secara bulanan serta menghitung sisa waktu tampung (umur pakai) TPA Putri Cempo Surakarta menggunakan metode peramalan "Double Exponential Smoothing" (Metode Holt).

Tugas utamamu adalah:
1. Memberikan informasi umum seputar fungsi utama dan menu yang ada di aplikasi ini.
2. Menjelaskan rumus dan teori Double Exponential Smoothing (Holt's Method) serta interpretasinya secara sederhana.
3. Menjelaskan hasil peramalan atau analisis kapasitas TPA berdasarkan data real-time saat ini.

Informasi Data Aktif Saat Ini di Simulator:
${context}

Aturan Komunikasi:
- Jawablah dalam Bahasa Indonesia yang sopan, ramah, persuasif, komunikatif, dan terstruktur dengan rapi.
- Gunakan format markdown sewajarnya untuk bullet point, bold text, atau rumus agar mudah dibaca.
- Tawarkan bantuan tambahan di akhir jawaban jika relevan.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
