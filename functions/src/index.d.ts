export declare const searchNicheAPI: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    keyword: string;
    metrics: {
        searchVolume: number;
        averageBsr: number;
        competition: number;
        averagePrice: number;
        nicheScore: number;
    };
    topCompetitors: {
        id: string;
        title: string;
        author: string;
        bsr: number;
        price: number;
        reviews: number;
        rating: number;
        url: string;
    }[];
}>, unknown>;
//# sourceMappingURL=index.d.ts.map