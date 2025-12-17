export interface VectorResult {
  dotProduct: number;
  magnitudeA: number;
  magnitudeB: number;
  cosineSimilarity: number;
  angleDegrees: number;
  dimensions: number;
}

export interface GeneratedVectors {
  vectorA: number[];
  vectorB: number[];
  topicA: string;
  topicB: string;
  reasoning?: string;
}

export enum CalculationMode {
  MANUAL = 'MANUAL',
  AI_GENERATED = 'AI_GENERATED'
}
