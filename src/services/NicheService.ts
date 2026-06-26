import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

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

export async function searchNiche(keyword: string): Promise<NicheResult> {
  const searchNicheAPI = httpsCallable<{ keyword: string }, NicheResult>(functions, 'searchNicheAPI');
  
  try {
    const result = await searchNicheAPI({ keyword });
    return result.data;
  } catch (error) {
    console.error("Error calling searchNicheAPI:", error);
    throw error;
  }
}
