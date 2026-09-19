import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return aiClient;
}

// API Route for AI Music Composition
app.post("/api/ai/compose-track", async (req, res) => {
  try {
    const { prompt, genre = "lofi", mood = "relaxing", tempo = 90, scale = "minor" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback procedural composer logic when API key is not configured
      return res.json({
        success: true,
        source: "fallback",
        composition: generateProceduralComposition(prompt, genre, mood, tempo, scale),
      });
    }

    const systemPrompt = `You are an expert music producer and composer specializing in generating structured music blueprints for an in-browser Web Audio synthesis engine.
Given a user prompt, genre, mood, target tempo (BPM), and scale, produce a JSON object describing the composition.
The Web Audio synthesizer supports:
- instruments: "synth_lead", "warm_pad", "sub_bass", "pluck", "piano", "flute_bell"
- drum tracks: "kick", "snare", "hihat", "clap"
- scales: "major", "minor", "dorian", "pentatonic", "oriental" (Phrygian dominant / Eastern)
- chords: Roman numerals or root note names (e.g. ["Am", "F", "C", "G"] or ["Dm", "Gm", "A7", "Dm"])
- melodyPattern: array of 16-32 note objects: { note: string (e.g. "A4", "C5", "E4", "G4", "rest"), step: number (0-15), duration: number (e.g. 0.5, 1, 2) }
- drumPattern: { kick: [0, 8], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14], clap: [4, 12] } (steps 0 to 15)
- bassPattern: [0, 4, 8, 10, 12] with root notes
The title and description should be appealing and poetic (in Uzbek if prompt is Uzbek, or English).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Create a music composition for: "${prompt || genre + ' ' + mood}". Genre: ${genre}, Mood: ${mood}, Target BPM: ${tempo}, Scale: ${scale}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            genre: { type: Type.STRING },
            mood: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            scale: { type: Type.STRING },
            rootKey: { type: Type.STRING },
            chordProgression: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            leadInstrument: { type: Type.STRING },
            melodyNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING },
                  step: { type: Type.INTEGER },
                  duration: { type: Type.NUMBER },
                },
                required: ["note", "step"],
              },
            },
            drumPattern: {
              type: Type.OBJECT,
              properties: {
                kick: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                snare: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                hihat: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                clap: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              },
            },
            bassPattern: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING },
                  step: { type: Type.INTEGER },
                },
                required: ["note", "step"],
              },
            },
            aestheticTheme: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "bpm", "genre", "melodyNotes", "drumPattern"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      source: "gemini",
      composition: parsed,
    });
  } catch (error: any) {
    console.error("AI Music generation error:", error);
    // Return fallback gracefully so client is never blocked
    const fallback = generateProceduralComposition(
      req.body.prompt || "",
      req.body.genre || "lofi",
      req.body.mood || "chill",
      req.body.tempo || 90,
      req.body.scale || "minor"
    );
    return res.json({
      success: true,
      source: "fallback_after_error",
      composition: fallback,
      errorNotice: error?.message,
    });
  }
});

function generateProceduralComposition(prompt: string, genre: string, mood: string, tempo: number, scale: string) {
  const titles = [
    "Toshkentning Yulduzli Tuni",
    "Sokin Shabadalar",
    "Koinot Sadosi",
    "Sharq Maromi",
    "Qalb Sadolari",
    "Tungi Orzular",
    "Elektron To'lqinlar",
    "Yozgi Shoshilish",
  ];
  const chosenTitle = titles[Math.floor(Math.random() * titles.length)] + (genre ? ` (${genre.toUpperCase()})` : "");
  
  return {
    title: chosenTitle,
    artist: "Ovoz Studio AI",
    genre: genre || "lofi",
    mood: mood || "chill",
    bpm: Number(tempo) || 90,
    scale: scale || "minor",
    rootKey: "A",
    chordProgression: ["Am", "F", "C", "G"],
    leadInstrument: "synth_lead",
    melodyNotes: [
      { note: "A4", step: 0, duration: 1 },
      { note: "C5", step: 2, duration: 1 },
      { note: "E5", step: 4, duration: 1.5 },
      { note: "D5", step: 7, duration: 0.5 },
      { note: "C5", step: 8, duration: 1 },
      { note: "B4", step: 10, duration: 1 },
      { note: "A4", step: 12, duration: 2 },
      { note: "E4", step: 15, duration: 0.5 },
    ],
    drumPattern: {
      kick: [0, 8, 10],
      snare: [4, 12],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      clap: [4, 12],
    },
    bassPattern: [
      { note: "A2", step: 0 },
      { note: "A2", step: 3 },
      { note: "F2", step: 4 },
      { note: "C2", step: 8 },
      { note: "G2", step: 12 },
    ],
    aestheticTheme: "ambient_purple",
    description: "Maxsus Web Audio sintezator yordamida yaratilgan yoqimli va ritmik musiqa kompozitsiyasi.",
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
