import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const searchNicheAPI = onCall(async (request) => {
  const keyword = request.data.keyword;
  
  if (!keyword || typeof keyword !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with one arguments "keyword".');
  }

  // TODO: Replace this mock implementation with a real HTTP call (e.g. to DataForSEO).
  
  // Wait to simulate network overhead
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Generate some pseudo-random mock data for the dashboard
  const hash = keyword.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  const pseudoRandom = Math.abs(hash) % 100;

  const searchVolume = 1000 + pseudoRandom * 300;
  const competition = 150 + pseudoRandom * 20;
  const averageBsr = 15000 + pseudoRandom * 800;
  const averagePrice = 12.99 + (pseudoRandom % 5);
  
  let nicheScore = Math.min(100, Math.max(0, Math.floor((searchVolume / 100) - (competition / 500) + (100000 / averageBsr))));
  if (nicheScore < 20) nicheScore += 40; 

  const competitors = Array.from({ length: 5 }).map((_, i) => ({
    id: `B0${Math.floor(10000000 + Math.random() * 90000000)}`,
    title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Ultimativer Ratgeber ${i + 1}`,
    author: `Max Mustermann ${i}`,
    bsr: averageBsr - 5000 + (Math.random() * 10000),
    price: averagePrice - 2 + (Math.random() * 4),
    reviews: 10 + Math.floor(Math.random() * 300),
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
    topCompetitors: competitors.sort((a, b) => a.bsr - b.bsr)
  };
});
