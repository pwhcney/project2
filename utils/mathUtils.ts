import { VectorResult } from '../types';

export const parseVectorString = (input: string): number[] => {
  return input
    .split(/[\s,]+/) // Split by comma, whitespace, or both
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
};

export const calculateCosineSimilarity = (vecA: number[], vecB: number[]): VectorResult | null => {
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return null;
  }

  let dotProduct = 0;
  let sumSqA = 0;
  let sumSqB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    sumSqA += vecA[i] * vecA[i];
    sumSqB += vecB[i] * vecB[i];
  }

  const magnitudeA = Math.sqrt(sumSqA);
  const magnitudeB = Math.sqrt(sumSqB);

  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return {
      dotProduct,
      magnitudeA,
      magnitudeB,
      cosineSimilarity: 0,
      angleDegrees: 0,
      dimensions: vecA.length
    };
  }

  const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);
  
  // Clamping value between -1 and 1 to handle potential floating point errors
  const clampedSimilarity = Math.max(-1, Math.min(1, cosineSimilarity));
  const angleRadians = Math.acos(clampedSimilarity);
  const angleDegrees = angleRadians * (180 / Math.PI);

  return {
    dotProduct,
    magnitudeA,
    magnitudeB,
    cosineSimilarity: clampedSimilarity,
    angleDegrees,
    dimensions: vecA.length
  };
};