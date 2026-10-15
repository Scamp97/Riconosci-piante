import express from "express";
import multer from "multer";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(express.static("public"));

app.post("/api/identify", upload.single("image"), async (req, res) => {
  console.log("richiesta di identificazione ricevuta");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Seleziona prima una foto." });
    }

    const imageBase64 = req.file.buffer.toString("base64");

    const response = await fetch(
      "https://api.plant.id/v3/identification",
      {
        method: "POST",
        headers: {
          "Api-Key": process.env.PLANT_ID_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          images: [imageBase64],
          similar_images: false
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Il servizio di identificazione ha restituito un errore."
      });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Errore del server durante l’analisi." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server avviato");
});
