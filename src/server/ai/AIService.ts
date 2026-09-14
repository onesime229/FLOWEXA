import { DataStore } from '../dataStore';
import { NaturalLanguageSearchService } from './NaturalLanguageSearchService';
import { RecommendationService } from './RecommendationService';
import { InsightService } from './InsightService';
import { PredictionService } from './PredictionService';
import { AssistantService } from './AssistantService';
import { IAIProvider, DeterministicFlowexaAIProvider } from './providers/AIProvider';

export class AIService {
  public search: NaturalLanguageSearchService;
  public recommendations: RecommendationService;
  public insights: InsightService;
  public predictions: PredictionService;
  public assistant: AssistantService;
  private provider: IAIProvider;

  constructor(store: DataStore, customProvider?: IAIProvider) {
    this.provider = customProvider || new DeterministicFlowexaAIProvider();
    this.search = new NaturalLanguageSearchService(store);
    this.recommendations = new RecommendationService(store);
    this.insights = new InsightService(store);
    this.predictions = new PredictionService(store);
    this.assistant = new AssistantService(store);
  }

  public getProviderName(): string {
    return this.provider.name;
  }
}
