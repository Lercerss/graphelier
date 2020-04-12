import { graphelierNews } from './HttpClient';

export default class NewsService {
    static getArticleClusters = (timestamp: string, direction: string, quantity: number = 10) => {
        return graphelierNews.get(`/news_clusters/${timestamp}?direction=${direction}&quantity=${quantity}`);
    };
}
