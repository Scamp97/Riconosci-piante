import express from "express";
import multer from "multer";

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(express.static("public"));

app.post("/api/identify", upload.single("image"), async (req, res) => {
  console.log("Richiesta di identificazione ricevuta");

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Foto mancante." });
    }

    const apiKey = process.env.PLANT_ID_API_KEY;
    if (!apiKey) {
      console.error("Manca la variabile PLANT_ID_API_KEY");
      return res.status(500).json({ error: "Configurazione API mancante." });
    }

    const response = await fetch(
      "https://api.plant.id/v3/identification",
      {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          images: [req.file.buffer.toString("base64")],
          health: "all"
        })
      }
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Risposta API non valida:", text);
      return res.status(502).json({
        error: "Il servizio di identificazione ha restituito una risposta non valida."
      });
    }

    if (!response.ok) {
      console.error("Errore API:", response.status, data);
      return res.status(response.status).json({
        error: data.error || "Il servizio di identificazione ha restituito un errore."
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Errore server:", error);
    return res.status(500).json({
      error: "Errore del server durante l’analisi."
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server avviato");
});
