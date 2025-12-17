import React from 'react';
import { VectorResult } from '../types';

interface FormulaBlockProps {
  result: VectorResult;
}

export const FormulaBlock: React.FC<FormulaBlockProps> = ({ result }) => {
  return (
    <div className="bg-slate-900 text-slate-50 p-6 rounded-xl font-mono text-sm shadow-inner overflow-x-auto">
      <div className="mb-4 text-slate-400 uppercase text-xs tracking-wider font-semibold">Mathematical Breakdown</div>
      
      {/* Formula */}
      <div className="flex items-center space-x-2 mb-4 text-lg">
        <span>cos(θ) = </span>
        <div className="flex flex-col items-center">
          <span className="border-b border-slate-500 pb-1 mb-1 px-2">A · B</span>
          <span className="px-2">||A|| ||B||</span>
        </div>
        <span> = </span>
        <div className="flex flex-col items-center text-blue-300">
          <span className="border-b border-slate-500 pb-1 mb-1 px-2">{result.dotProduct.toFixed(4)}</span>
          <span className="px-2">{result.magnitudeA.toFixed(4)} × {result.magnitudeB.toFixed(4)}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2 text-slate-300">
        <p><span className="text-pink-400">Step 1 (Dot Product):</span> ∑(Ai × Bi) = {result.dotProduct.toFixed(4)}</p>
        <p><span className="text-blue-400">Step 2 (Magnitude A):</span> √∑(Ai²) = {result.magnitudeA.toFixed(4)}</p>
        <p><span className="text-blue-400">Step 3 (Magnitude B):</span> √∑(Bi²) = {result.magnitudeB.toFixed(4)}</p>
        <p><span className="text-green-400 font-bold">Result:</span> {result.dotProduct.toFixed(4)} / {(result.magnitudeA * result.magnitudeB).toFixed(4)} ≈ {result.cosineSimilarity.toFixed(6)}</p>
      </div>
    </div>
  );
};
