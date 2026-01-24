
import { SongTrack, GameSequence, TriviaQuestion } from '../types';

// Primary: Netlify Function (Avoids CORS/Mixed Content on Production)
const PROXY_API_URL = '/.netlify/functions/getMusic';
// Fallback: Direct iTunes API (Works locally or if proxy is down)
const DIRECT_API_URL = 'https://itunes.apple.com/search';

// --- HELPERS ---

const shuffle = <T>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

// --- CORE FETCHER (PROXY + FALLBACK) ---
const fetchFromProxy = async (term: string, limit: number = 25): Promise<SongTrack[]> => {
    // Validation
    if (!term || term.trim() === '') return [];

    let rawData: any = null;

    // 1. Attempt Proxy Fetch
    try {
        const url = `${PROXY_API_URL}?term=${encodeURIComponent(term)}&limit=${limit}`;
        const response = await fetch(url);

        if (response.ok) {
            rawData = await response.json();
        } else {
            throw new Error(`Proxy returned ${response.status}`);
        }
    } catch (proxyError) {
        console.warn("Proxy unavailable, switching to Direct API...", proxyError);
        
        // 2. Fallback to Direct API
        try {
            const url = `${DIRECT_API_URL}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}&country=TR&lang=tr_tr`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`Direct API returned ${response.status}`);
            rawData = await response.json();
        } catch (directError) {
            console.error("Music Fetch Failed completely:", directError);
            return [];
        }
    }

    if (!rawData || !rawData.results || rawData.resultCount === 0) return [];

    // Data Mapping
    return rawData.results
        .filter((item: any) => 
            item.wrapperType === 'track' && 
            item.kind === 'song' && 
            item.previewUrl && 
            item.artworkUrl100
        )
        .map((item: any) => ({
            trackId: item.trackId,
            artistName: item.artistName,
            trackName: item.trackName,
            releaseYear: new Date(item.releaseDate).getFullYear(),
            // Ensure HTTPS
            previewUrl: item.previewUrl.replace('http:', 'https:'),
            // High Quality Artwork
            artworkUrl100: item.artworkUrl100.replace('http:', 'https:').replace('100x100', '600x600')
        }));
};

// --- EXPORTED SERVICES ---

export const fetchSongs = async (): Promise<SongTrack[]> => {
    // Structured search terms to enforce variety and quality in random games
    // strict: true means we filter results to ensure artistName contains the query
    const searchOptions = [
        { query: 'turkce rap', strict: false },
        { query: 'turkish hip hop', strict: false },
        { query: 'sagopa kajmer', strict: true },
        { query: 'ceza', strict: true },
        { query: 'motive', strict: true },
        { query: 'uzi', strict: true },
        { query: 'sefo', strict: true },
        { query: 'lvbel c5', strict: true },
        { query: 'cakal', strict: true },
        { query: 'blok3', strict: true },
        { query: 'sehinsah', strict: true },
        { query: 'khontkar', strict: true },
        { query: 'allame', strict: true },
        { query: 'hidra', strict: true },
        { query: 'ati242', strict: true },
        { query: 'gazapizm', strict: true }
    ];

    const randomOption = searchOptions[Math.floor(Math.random() * searchOptions.length)];
    
    // Fetch 50 to have enough pool for filtering
    let songs = await fetchFromProxy(randomOption.query, 60);

    // STRICT FILTERING LOGIC
    if (randomOption.strict) {
        songs = songs.filter(s => s.artistName.toLowerCase().includes(randomOption.query.toLowerCase()));
    }

    // Fallback if filtering killed too many results
    if (songs.length < 5) {
        console.warn("Low results after filter, fetching general hits...");
        songs = await fetchFromProxy('turkce rap hits', 50);
    }

    return shuffle(songs);
};

export const searchSongs = async (query: string, limit: number = 30, strictArtistMatch: boolean = false): Promise<SongTrack[]> => {
    let songs = await fetchFromProxy(query, limit);
    
    if (strictArtistMatch) {
        // Only allow songs where the artist name explicitly includes the query string
        // This prevents "Song (feat. Artist)" from appearing if the user wanted "Artist" main tracks
        songs = songs.filter(s => s.artistName.toLowerCase().includes(query.toLowerCase()));
    }
    
    return songs;
};

// --- GAME HELPERS ---

export const generateGameSequence = (sourceSongs: SongTrack[]): GameSequence | null => {
    if (!sourceSongs || sourceSongs.length < 5) return null;
    
    // Deduplicate by TrackID
    const unique = Array.from(new Map(sourceSongs.map(s => [s.trackId, s])).values());
    
    if (unique.length < 5) return null;

    const pool = shuffle(unique);
    return {
        startSong: pool[0],
        targetSongs: pool.slice(1, 21)
    };
};

export const generateTriviaQuestions = (sourceSongs: SongTrack[], count: number = 10): TriviaQuestion[] => {
    if (!sourceSongs || sourceSongs.length < 4) return [];

    const unique = Array.from(new Map(sourceSongs.map(s => [s.trackId, s])).values());
    if (unique.length < 4) return [];

    const questions: TriviaQuestion[] = [];
    const pool = shuffle(unique);
    const maxQ = Math.min(count, pool.length);

    for (let i = 0; i < maxQ; i++) {
        const correct = pool[i];
        const others = pool.filter(s => s.trackId !== correct.trackId);
        
        if (others.length >= 3) {
            const wrongs = shuffle(others).slice(0, 3);
            questions.push({
                correctSong: correct,
                options: shuffle([correct, ...wrongs])
            });
        }
    }

    return questions;
};
