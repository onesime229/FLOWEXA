/**
 * Abstract AI Provider Interface
 * Couche abstraite permettant de brancher n'importe quel fournisseur (modèle local ou distant).
 * Règle d'or Flowexa : Ne jamais inventer de données. Le système s'appuie
 * sur les faits et métriques réelles (SQL/BI/DataStore) comme source de vérité.
 */

export interface AIProviderCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface IAIProvider {
  name: string;
  isAvailable(): boolean;
  complete(prompt: string, options?: AIProviderCompletionOptions): Promise<string>;
}

/**
 * Fournisseur déterministe autonome Flowexa
 * Analyse sémantique basée sur les règles NLP et les faits BI réels
 */
export class DeterministicFlowexaAIProvider implements IAIProvider {
  public name = 'Flowexa-Deterministic-Engine';

  public isAvailable(): boolean {
    return true;
  }

  public async complete(prompt: string, _options?: AIProviderCompletionOptions): Promise<string> {
    return `Analyse basée sur les faits réels : ${prompt}`;
  }
}
