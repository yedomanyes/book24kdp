export interface Competitor {
  id: string;
  title: string;
  author: string;
  bsr: number;
  price: number;
  reviews: number;
  rating: number;
  url: string;
}

export interface NicheMetrics {
  searchVolume: number;
  averageBsr: number;
  competition: number;
  averagePrice: number;
  nicheScore: number;
}

export interface NicheResult {
  keyword: string;
  metrics: NicheMetrics;
  topCompetitors: Competitor[];
  aiAnalysis?: string;
}

/**
 * Simulates a delay for API calls.
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * MOCK SERVICE for Niche Finder.
 * In a real environment, this will call our backend/Firebase Function, 
 * which in turn calls DataForSEO/Keepa to fetch real Amazon data.
 */
export async function searchNiche(keyword: string): Promise<NicheResult> {
  await delay(2500); // Simulate network latency (2.5s)

  // Generate some semi-random but realistic looking mock data based on the keyword length
  const hash = keyword.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  const pseudoRandom = Math.abs(hash) % 100;

  const searchVolume = 500 + pseudoRandom * 120;
  const competition = 100 + pseudoRandom * 40;
  
  // Good BSR is low. If search volume is high and competition is low, score should be high.
  const averageBsr = 20000 + pseudoRandom * 500;
  const averagePrice = 9.99 + (pseudoRandom % 10);
  
  // Basic mock formula for niche score
  let nicheScore = Math.min(100, Math.max(0, Math.floor((searchVolume / 100) - (competition / 500) + (100000 / averageBsr))));
  
  if (nicheScore < 20) nicheScore += 30; // Boost extremely low mock scores for better UI display

  const competitors: Competitor[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `B0${Math.floor(10000000 + Math.random() * 90000000)}`,
    title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Ultimativer Ratgeber ${i + 1}`,
    author: `Max Mustermann ${i}`,
    bsr: averageBsr - 5000 + (Math.random() * 10000),
    price: averagePrice - 2 + (Math.random() * 4),
    reviews: 10 + Math.floor(Math.random() * 200),
    rating: 3.5 + Math.random() * 1.5,
    url: '#'
  }));

  return {
    keyword,
    metrics: {
      searchVolume,
      averageBsr: Math.floor(averageBsr),
      competition,
      averagePrice: Number(averagePrice.toFixed(2)),
      nicheScore
    },
    topCompetitors: competitors.sort((a, b) => a.bsr - b.bsr) // Sort by best BSR
  };
}
