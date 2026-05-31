
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import cookieParser from "cookie-parser";
import { GoogleGenAI, Modality } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json());

  // --- GEMINI REAL SERVER INTERACTION ENDPOINTS ---
  let aiClient: any = null;
  function getGeminiClient(): any {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  app.post("/api/gemini/generate-interactive-track", async (req, res) => {
    const { prompt, theme, playerName } = req.body;
    try {
      const ai = getGeminiClient();
      const model = "gemini-3.5-flash";
      
      const systemInstruction = `Sen profesyonel bir Türk rap prodüktörü ve lirik yazarı (Ghostwriter) yapay zekasın. Oyuncu için tamamen özgün, sanatsal kalitesi çok yüksek, kafiyeleri sağlam, Türkçe sokak/drill/trap jargonu içeren rap şarkı sözleri ve bu şarkıya özel ritim/synthesizer/drum sequencer parametrelerini üretebilirsin.
      
Sana verilen şarkı konusuna ve tarz temasına bağlı kalarak, oyuncunun takma adını şarkı sözlerinde zekice geçir.
Sözlerde [Intro] (Giriş), [Chorus] (Koro), [Verse 1], [Verse 2] ve [Outro] (Çıkış) bölümleri olsun.

Kesinlikle sadece geçerli bir JSON objesi geriye dönmelisin. Ekstra açıklama veya markdown kesmeleri (\`\`\`json) ekleme. JSON yapısı tam olarak şu şekilde olmalıdır:
{
  "lyrics": "Ürettiğin rap şarkı sözleri. Bölümler arasına \\n satır satır boşluklar koy.",
  "preset": {
    "bpm": 120,
    "bassStyle": "heavy-drill",
    "chordProgression": [57, 53, 52, 55],
    "hihatStyle": "trap-rolls",
    "melodySpeed": 1
  }
}`;

      const generateResult = await ai.models.generateContent({
        model: model,
        contents: [
          { text: `Lütfen şu detaylara sahip Türkçe Rap parçasını oluştur: Konu: ${prompt || 'Sokaklar'}, Tarz Teması: ${theme || 'Sokak Çetesi'}, Sanatçı Adı: ${playerName || 'Rapçi'}. Çıktı sadece saf JSON formatında olmalıdır.` }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const responseText = generateResult.text || "";
      const resultData = JSON.parse(responseText);
      res.json(resultData);
    } catch (error: any) {
      console.error("Gemini Interactive Track Error:", error);
      res.json({
        lyrics: `[Chorus]\nHat hattı kesildi yine de ritmimiz yolda\n${playerName || 'Rapçi'} sahnede punchlarla hep en solda\nGecenin karanlığında ararız yolumuzu\nYapay zeka bile çözemez sokağın kodunu!\n\n[Verse 1]\nSokaklar bizim elimizde mikrofon bir silah gibi\nSözlerim akar deler geçer derin bir nehir gibi\nZorluklar bizi yıldırmaz daha da sertleştirir\nHer hecede bu mahalle tek vücut birleşir`,
        preset: {
          bpm: 115,
          bassStyle: "smooth-trap",
          chordProgression: [57, 53, 52, 55],
          hihatStyle: "trap-rolls",
          melodySpeed: 1
        }
      });
    }
  });

  app.post("/api/gemini/generate-rap-track", async (req, res) => {
    const { prompt, modelName = 'lyria-3-clip-preview' } = req.body;
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContentStream({
        model: modelName,
        contents: [
          { text: `Create a professional rap track. Theme: ${prompt}. Style: Modern energetic Turkish Rap.` }
        ],
        config: {
          responseModalities: [Modality.AUDIO]
        }
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      res.json({ audioBase64, lyrics, mimeType });
    } catch (error: any) {
      console.error("Gemini Rap Track Error:", error);
      res.status(500).json({ error: error.message || 'Bir stüdyo hatası oluştu' });
    }
  });

  app.post("/api/gemini/chat-character", async (req, res) => {
    const { characterType, characterName, playerStats, message, history = [] } = req.body;
    try {
      const ai = getGeminiClient();
      const model = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: characterType === 'manager' 
            ? `Sen ${characterName} isimli bir rap menajerisin. Oyuncunun menajeri olarak ona kariyer tavsiyeleri veriyorsun. 
               Oyuncunun istatistikleri: ${JSON.stringify(playerStats)}. 
               Kısa, öz ve sokak ağzıyla (Türkçe Rap jargonuna uygun) konuş. 
               Oyuncunun şarkıları hakkında yorum yap, bir sonraki adımda ne yapması gerektiğini söyle (konser ver, stüdyoya gir, antrenman yap vb.).`
            : `Sen ${characterName} isimli birisin ve oyuncunun sevgilisisin. 
               Oyuncunun istatistikleri: ${JSON.stringify(playerStats)}. 
               Onunla flört et, ona destek ol, bazen kıskançlık yap veya şımarıklık yap. 
               Kısa, samimi ve modern bir dille konuş. Rap kariyerini destekle ama bazen ona vakit ayırmasını iste.`
        }
      });

      const response = await model;
      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Gemini Character Chat Error:", error);
      res.status(500).json({ error: error.message || 'Karakter ile bağlantı kurulamadı' });
    }
  });

  // API Proxy for iTunes
  app.get("/api/music", async (req, res) => {
    const { term, limit = '25' } = req.query;

    if (!term) {
      return res.status(400).json({ error: 'Arama terimi (term) gereklidir.' });
    }

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term as string)}&media=music&entity=song&limit=${limit}&country=TR&lang=tr_tr`;

    try {
      const response = await fetch(itunesUrl);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: `iTunes API hatası: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Proxy Hatası:", error);
      res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
  });

  // --- IN-MEMORY REAL-TIME LOBBY VOICE ROUTING SYSTEM ---
  const voiceRooms: {
    [roomId: string]: {
      lastActive: number,
      speakers: {
        [uid: string]: {
          name: string,
          lastActive: number,
          chunks: { ts: number; data: string }[]
        }
      }
    }
  } = {};

  setInterval(() => {
    const now = Date.now();
    for (const roomId in voiceRooms) {
      const r = voiceRooms[roomId];
      for (const uid in r.speakers) {
        if (now - r.speakers[uid].lastActive > 15000) {
          delete r.speakers[uid];
        }
      }
      if (Object.keys(r.speakers).length === 0 && now - r.lastActive > 60000) {
        delete voiceRooms[roomId];
      }
    }
  }, 10000);

  app.post("/api/lobby-voice/push", (req, res) => {
    const { roomId, uid, name, chunk, ts } = req.body;
    if (!roomId || !uid || !chunk) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    if (!voiceRooms[roomId]) {
      voiceRooms[roomId] = {
        lastActive: Date.now(),
        speakers: {}
      };
    }

    const room = voiceRooms[roomId];
    room.lastActive = Date.now();

    if (!room.speakers[uid]) {
      room.speakers[uid] = {
        name: name || "Bilinmeyen MC",
        lastActive: Date.now(),
        chunks: []
      };
    }

    const spk = room.speakers[uid];
    spk.name = name || "Bilinmeyen MC";
    spk.lastActive = Date.now();
    spk.chunks.push({ ts: ts || Date.now(), data: chunk });

    if (spk.chunks.length > 15) {
      spk.chunks.shift();
    }

    res.json({ success: true });
  });

  app.post("/api/lobby-voice/poll", (req, res) => {
    const { roomId, myUid, lastSeenTimestamps } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "Missing roomId" });
    }

    const room = voiceRooms[roomId];
    if (!room) {
      return res.json({ speakers: {}, activeSpeakers: [] });
    }

    const now = Date.now();
    const resultSpeakers: { [uid: string]: { name: string; chunks: { ts: number; data: string }[] } } = {};
    const activeSpeakersList: { speakerUid: string; speakerName: string }[] = [];

    for (const uid in room.speakers) {
      const sp = room.speakers[uid];
      if (now - sp.lastActive < 5000) {
        activeSpeakersList.push({ speakerUid: uid, speakerName: sp.name });

        if (uid !== myUid) {
          const lSeen = (lastSeenTimestamps && lastSeenTimestamps[uid]) || 0;
          const freshChunks = sp.chunks.filter(c => c.ts > lSeen);
          if (freshChunks.length > 0) {
            resultSpeakers[uid] = {
              name: sp.name,
              chunks: freshChunks
            };
          }
        }
      }
    }

    res.json({
      speakers: resultSpeakers,
      activeSpeakers: activeSpeakersList
    });
  });

  // --- SPOTIFY OAUTH ---
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = `${process.env.APP_URL || 'http://localhost:3000'}/auth/spotify/callback`;

  app.get("/api/auth/spotify/url", (req, res) => {
    const scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative";
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID!,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state,
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get("/auth/spotify/callback", async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send("Code missing");
    }

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: REDIRECT_URI,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64"),
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: 'spotify',
                  accessToken: '${access_token}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Spotify bağlantısı başarılı. Bu pencere otomatik olarak kapanacaktır.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Spotify Auth Error:", error.response?.data || error.message);
      res.status(500).send("Spotify Authentication Failed");
    }
  });

  // API to fetch Spotify Playlists
  app.get("/api/spotify/playlists", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({ error: "Access token missing" });
    }

    try {
      const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Spotify API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch playlists" });
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
