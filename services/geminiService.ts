const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface GeneratedTrack {
    audioBase64: string;
    lyrics: string;
    mimeType: string;
}

export const generateRapTrack = async (
    prompt: string,
    modelName: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' = 'lyria-3-clip-preview'
): Promise<GeneratedTrack> => {
    if (BACKEND_URL) {
        const response = await fetch(`${BACKEND_URL}/api/gemini/generate-rap-track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, modelName })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Stüdyo hatası: ${response.status}`);
        }
        return response.json();
    } else {
        // Direct call in Standalone Mode
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            throw new Error("Rap şarkısı üretimi için Gemini API Anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin.");
        }

        try {
            // Attempt direct call using Google GenAI REST Endpoint (assuming Lyria or similar modality-based audio gen)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Create a professional rap track. Theme: ${prompt}. Style: Modern energetic Turkish Rap.` }] }],
                    config: {
                        responseModalities: ["AUDIO"]
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Direct audio gen failed with status: ${response.status}`);
            }

            const data = await response.json();
            let audioBase64 = "";
            let lyrics = "";
            
            const parts = data.candidates?.[0]?.content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData?.data) {
                        audioBase64 = part.inlineData.data;
                    }
                    if (part.text) {
                        lyrics = part.text;
                    }
                }
            }

            if (!lyrics) lyrics = `[Verse]\nTema: ${prompt}\n(Doğrudan üretilen parça)`;

            return {
                audioBase64,
                lyrics,
                mimeType: "audio/wav"
            };
        } catch (error) {
            console.warn("Direct Lyria call failed, using fallback lyrics generation via gemini-3.5-flash...", error);
            
            // Fallback: Generate lyrics using gemini-3.5-flash
            const flashUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const promptText = `Sen profesyonel bir Türk rap prodüktörü ve lirik yazarı yapay zekasın. Oyuncu için tamamen özgün, sanatsal kalitesi çok yüksek rap şarkı sözleri üretebilirsin. Lütfen şu konu üzerine Türkçe Rap şarkı sözü oluştur: ${prompt}. Giriş (Intro), Nakarat (Chorus), Verse 1, Verse 2 ve Çıkış (Outro) bölümleri içersin. Sadece rap sözlerini dön.`;
            
            const response = await fetch(flashUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Şarkı sözü üretme hatası: ${response.status}`);
            }

            const data = await response.json();
            const generatedLyrics = data.candidates?.[0]?.content?.parts?.[0]?.text || `[Verse]\nTema: ${prompt}\n(Varsayılan rap sözleri yüklendi)`;

            // Tiny 1-second silence WAV file in base64 to avoid player crashes
            const placeholderAudioBase64 = "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

            return {
                audioBase64: placeholderAudioBase64,
                lyrics: generatedLyrics,
                mimeType: "audio/wav"
            };
        }
    }
};

export const chatWithCharacter = async (
    characterType: 'manager' | 'partner',
    characterName: string,
    playerStats: any,
    message: string,
    history: { role: 'user' | 'model', text: string }[] = []
): Promise<string> => {
    if (BACKEND_URL) {
        const response = await fetch(`${BACKEND_URL}/api/gemini/chat-character`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterType, characterName, playerStats, message, history })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Karakter hatası: ${response.status}`);
        }
        const data = await response.json();
        return data.reply;
    } else {
        // Direct call in Standalone Mode
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            throw new Error("Yapay zeka sohbeti için Gemini API Anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin.");
        }
        
        const systemInstructionText = characterType === 'manager' 
            ? `Sen ${characterName} isimli bir rap menajerisin. Oyuncunun menajeri olarak ona kariyer tavsiyeleri veriyorsun. Oyuncunun istatistikleri: ${JSON.stringify(playerStats)}. Kısa, öz ve sokak ağzıyla (Türkçe Rap jargonuna uygun) konuş. Oyuncunun şarkıları hakkında yorum yap, bir sonraki adımda ne yapması gerektiğini söyle (konser ver, stüdyoya gir, antrenman yap vb.).`
            : `Sen ${characterName} isimli birisin ve oyuncunun sevgilisisin. Oyuncunun istatistikleri: ${JSON.stringify(playerStats)}. Onunla flört et, ona destek ol, bazen kıskançlık yap veya şımarıklık yap. Kısa, samimi ve modern bir dille konuş. Rap kariyerini destekle ama bazen ona vakit ayırmasını iste.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const contents = [
            ...history.map(h => ({
                role: h.role === 'model' ? 'model' : 'user',
                parts: [{ text: h.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                systemInstruction: {
                    parts: [{ text: systemInstructionText }]
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Yapay zeka hatası: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Bağlantıda bir sorun var...";
    }
};
