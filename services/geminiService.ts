export interface GeneratedTrack {
    audioBase64: string;
    lyrics: string;
    mimeType: string;
}

export const generateRapTrack = async (
    prompt: string,
    modelName: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' = 'lyria-3-clip-preview'
): Promise<GeneratedTrack> => {
    // Return a mocked offline response instantly
    return {
        audioBase64: "",
        lyrics: `[Intro]\nYo, mikrofon kontrol, bire iki...\n\n[Verse 1]\nYeni parçamız yolda, ritimler kafamda\nKendi tarzımı kurdum bu dar sokakta\nSözlerim ağır gelir, punchlar havada\nFlowify efsanesi şimdi sahnede!\n\n[Outro]\nBarış, sevgi ve hiphop. Outro.`,
        mimeType: "audio/mp3"
    };
};

const MANAGER_REPLIES = [
    "yeni albüm anlaşması için plak şirketiyle görüşüyorum, bütçeyi yüksek tutmaya çalışacağım!",
    "sosyal medyadaki takipçi artışımız harika gidiyor, yeni bir single patlatmanın tam zamanı.",
    "konser tekliflerini değerlendiriyorum, yakında büyük bir turne planlayabiliriz.",
    "unutma, her zaman lirik kalitesini yüksek tutmalısın. sokaklar seni dinliyor.",
    "sponsorluk anlaşmaları için birkaç büyük markayla masadayım, yakında güzel haberler gelecek.",
    "bütçemizi doğru yönetmeliyiz, stüdyo masrafları artıyor ama senin flowların her şeye değer!"
];

const PARTNER_REPLIES = [
    "bugün stüdyoda çok çalıştın, seninle gurur duyuyorum sevgilim.",
    "şarkını radyoda duydum, nakaratı dilimden düşmüyor!",
    "bu akşam güzel bir yemek yiyelim mi? biraz dinlenmeyi hak ettin.",
    "sahnede gerçekten parlıyorsun, en büyük hayranın benim.",
    "flowların gün geçtikçe daha da sertleşiyor, yeraltı sahnesi yakında tamamen senin olacak.",
    "yanında olduğum her an seninle daha çok gurur duyuyorum."
];

export const chatWithCharacter = async (
    characterType: 'manager' | 'partner',
    characterName: string,
    playerStats: any,
    message: string,
    history: { role: 'user' | 'model', text: string }[] = []
): Promise<string> => {
    // Completely offline simulated delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const pool = characterType === 'manager' ? MANAGER_REPLIES : PARTNER_REPLIES;
    const randomReply = pool[Math.floor(Math.random() * pool.length)];
    return randomReply;
};
