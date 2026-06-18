export interface GeneratedTrack {
    audioBase64: string;
    lyrics: string;
    mimeType: string;
}

export const generateRapTrack = async (
    prompt: string,
    modelName: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' = 'lyria-3-clip-preview'
): Promise<GeneratedTrack> => {
    const response = await fetch('/api/gemini/generate-rap-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelName })
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Stüdyo hatası: ${response.status}`);
    }
    return response.json();
};

export const chatWithCharacter = async (
    characterType: 'manager' | 'partner',
    characterName: string,
    playerStats: any,
    message: string,
    history: { role: 'user' | 'model', text: string }[] = []
): Promise<string> => {
    const response = await fetch('/api/gemini/chat-character', {
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
};
