import React, { useState, useEffect, useCallback } from 'react';
import { parseVectorString, calculateCosineSimilarity } from './utils/mathUtils';
import { generateVectorsFromConcepts, explainSimilarityResult } from './services/geminiService';
import { VectorResult, CalculationMode } from './types';
import { VectorChart } from './components/VectorChart';
import { FormulaBlock } from './components/FormulaBlock';
import { 
  Calculator, 
  BrainCircuit, 
  ArrowRight, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Info,
  BoxSelect,
  Grid,
  Trash2,
  Dice5
} from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.MANUAL);
  
  // Inputs (Defaulting to 2D for immediate visual feedback)
  const [inputA, setInputA] = useState<string>('2, 1');
  const [inputB, setInputB] = useState<string>('1, 3');
  
  // AI Concept Inputs
  const [conceptA, setConceptA] = useState<string>('');
  const [conceptB, setConceptB] = useState<string>('');
  const [targetDimensions, setTargetDimensions] = useState<number>(2); // AI Dimension Config
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiReasoning, setAiReasoning] = useState<string | undefined>(undefined);

  // Derived Vectors
  const [vecA, setVecA] = useState<number[]>([]);
  const [vecB, setVecB] = useState<number[]>([]);
  
  // Results
  const [result, setResult] = useState<VectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Explanation
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Update vectors when strings change
  useEffect(() => {
    try {
      const vA = parseVectorString(inputA);
      const vB = parseVectorString(inputB);
      setVecA(vA);
      setVecB(vB);
      setError(null);
    } catch (e) {
      setError("Invalid vector format");
    }
  }, [inputA, inputB]);

  const handleCalculate = useCallback(() => {
    if (vecA.length !== vecB.length) {
      setError(`Dimension mismatch: Vector A has ${vecA.length} dims, Vector B has ${vecB.length} dims.`);
      setResult(null);
      return;
    }
    if (vecA.length === 0) {
      setError("Vectors cannot be empty.");
      setResult(null);
      return;
    }
    
    const res = calculateCosineSimilarity(vecA, vecB);
    setResult(res);
    setError(null);
    setExplanation(null); // Reset explanation on new calculation
  }, [vecA, vecB]);

  // Trigger calculation initially on mount
  useEffect(() => {
     // Small delay to ensure state is settled
     const timer = setTimeout(() => {
         handleCalculate();
     }, 100);
     return () => clearTimeout(timer);
  }, []); // Run once

  // AI Generation Handler
  const handleGenerateVectors = async () => {
    if (!conceptA || !conceptB) {
      setError("Please enter two concepts.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setAiReasoning(undefined);
    
    const data = await generateVectorsFromConcepts(conceptA, conceptB, targetDimensions);
    
    if (data) {
      setInputA(data.vectorA.join(', '));
      setInputB(data.vectorB.join(', '));
      setAiReasoning(data.reasoning);
      // Automatically calculate after setting
      setTimeout(() => document.getElementById('calc-btn')?.click(), 100);
    } else {
      setError("Failed to generate vectors. Check API Key or try again.");
    }
    setIsGenerating(false);
  };

  // AI Explain Handler
  const handleExplain = async () => {
    if (!result) return;
    setIsExplaining(true);
    const text = await explainSimilarityResult(vecA, vecB, result.cosineSimilarity);
    setExplanation(text);
    setIsExplaining(false);
  };

  const setPreset2D = () => {
    setInputA('3, 0');
    setInputB('0, 4');
    setTimeout(() => document.getElementById('calc-btn')?.click(), 100);
  };

  const handleRandomize = () => {
    // Generate random dimension: 2 or 3
    const dim = Math.random() > 0.5 ? 2 : 3;
    const getRandomVal = () => Math.floor(Math.random() * 19) - 9; // -9 to 9
    
    const vA = Array.from({ length: dim }, getRandomVal);
    const vB = Array.from({ length: dim }, getRandomVal);

    setInputA(vA.join(', '));
    setInputB(vB.join(', '));
    // Trigger calculation shortly after state update
    setTimeout(() => document.getElementById('calc-btn')?.click(), 100);
  };

  const handleClear = () => {
    setInputA('');
    setInputB('');
    setConceptA('');
    setConceptB('');
    setResult(null);
    setError(null);
    setExplanation(null);
    setAiReasoning(undefined);
  };

  const handleVectorInputChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setVecInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    let value = e.target.value;
    
    // Feature: Automatically add comma if space is pressed after a number
    // 1. Handle spaces between numbers (e.g. paste "1 2 3" -> "1, 2, 3")
    value = value.replace(/(\d)\s+(?=\d)/g, '$1, ');

    // 2. Handle trailing space while typing (e.g. "1 " -> "1, ")
    if (value.endsWith(' ') && /\d$/.test(value.slice(0, -1))) {
      value = value.slice(0, -1) + ', ';
    }

    setVecInput(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Calculator size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">VectorVibe</h1>
              <p className="text-xs text-slate-500 font-medium">Cosine Similarity Explorer</p>
            </div>
          </div>
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMode(CalculationMode.MANUAL)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === CalculationMode.MANUAL ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Manual Input
            </button>
            <button
              onClick={() => setMode(CalculationMode.AI_GENERATED)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center space-x-1 ${
                mode === CalculationMode.AI_GENERATED ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles size={14} />
              <span>AI Concepts</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8 transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Left: Inputs */}
            <div className="w-full md:w-1/2 space-y-6">
              
              {mode === CalculationMode.AI_GENERATED && (
                <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl mb-6">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                    <BrainCircuit size={16} className="mr-2" />
                    Generate Semantic Vectors
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-700 mb-1 uppercase">Concept A</label>
                      <input 
                        type="text" 
                        placeholder="e.g. King" 
                        value={conceptA}
                        onChange={(e) => setConceptA(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-700 mb-1 uppercase">Concept B</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Queen" 
                        value={conceptB}
                        onChange={(e) => setConceptB(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  {/* Dimensions Selector */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-purple-700 mb-1 uppercase">Output Dimensions</label>
                    <div className="flex space-x-2">
                       <button 
                         onClick={() => setTargetDimensions(2)}
                         className={`flex-1 py-1.5 text-xs font-medium rounded border ${targetDimensions === 2 ? 'bg-purple-200 border-purple-300 text-purple-800' : 'bg-white border-purple-100 text-slate-500'}`}
                       >
                         2D (XY Plane)
                       </button>
                       <button 
                         onClick={() => setTargetDimensions(3)}
                         className={`flex-1 py-1.5 text-xs font-medium rounded border ${targetDimensions === 3 ? 'bg-purple-200 border-purple-300 text-purple-800' : 'bg-white border-purple-100 text-slate-500'}`}
                       >
                         3D
                       </button>
                       <button 
                         onClick={() => setTargetDimensions(5)}
                         className={`flex-1 py-1.5 text-xs font-medium rounded border ${targetDimensions === 5 ? 'bg-purple-200 border-purple-300 text-purple-800' : 'bg-white border-purple-100 text-slate-500'}`}
                       >
                         5D (Semantic)
                       </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateVectors}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    {isGenerating ? <RefreshCcw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    <span>{isGenerating ? 'Dreaming up vectors...' : 'Generate Vectors'}</span>
                  </button>
                  {aiReasoning && (
                    <div className="mt-4 text-xs text-purple-800 bg-purple-100 p-3 rounded border border-purple-200">
                      <span className="font-bold">Insight:</span> {aiReasoning}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Vector A {mode === CalculationMode.AI_GENERATED && <span className="text-purple-500 font-normal normal-case">(Generated)</span>}
                  </label>
                  {mode === CalculationMode.MANUAL && (
                    <div className="flex space-x-2">
                      <button onClick={handleRandomize} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded transition-colors flex items-center">
                        <Dice5 size={12} className="mr-1"/> Random
                      </button>
                      <button onClick={setPreset2D} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-2 py-0.5 rounded transition-colors flex items-center">
                        <Grid size={12} className="mr-1"/> 2D Orthogonal
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={inputA}
                    onChange={(e) => handleVectorInputChange(e, setInputA)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="1, 2, 3... (space adds comma)"
                  />
                  <div className="absolute right-3 top-3 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {vecA.length} dims
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Vector B {mode === CalculationMode.AI_GENERATED && <span className="text-purple-500 font-normal normal-case">(Generated)</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputB}
                    onChange={(e) => handleVectorInputChange(e, setInputB)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="4, 5, 6... (space adds comma)"
                  />
                  <div className="absolute right-3 top-3 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {vecB.length} dims
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleClear}
                  className="bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 rounded-xl px-4 py-3.5 transition-all flex items-center justify-center group"
                  title="Clear all inputs"
                >
                  <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                </button>
                <button
                  id="calc-btn"
                  onClick={handleCalculate}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-slate-200 transition-all transform active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>Calculate Similarity</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Right: Visualization Preview */}
            <div className="w-full md:w-1/2">
               <VectorChart 
                 vecA={vecA} 
                 vecB={vecB} 
                 labelA={mode === CalculationMode.AI_GENERATED && conceptA ? conceptA : 'Vector A'}
                 labelB={mode === CalculationMode.AI_GENERATED && conceptB ? conceptB : 'Vector B'}
               />
               <p className="text-center text-xs text-slate-400 mt-2">
                 {vecA.length === 2 && vecB.length === 2 ? '*2D Cartesian Plane Visualization' : '*Radial projection of vector components'}
               </p>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {result && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <CheckCircle2 className="text-green-500 mr-2" size={20}/>
              Analysis Result
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Score Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-1 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  result.cosineSimilarity > 0.7 ? 'bg-green-500' : 
                  result.cosineSimilarity > 0 ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Cosine Similarity</h3>
                <div className="text-5xl font-black text-slate-800 tracking-tight my-2">
                  {result.cosineSimilarity.toFixed(4)}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  result.cosineSimilarity > 0.9 ? 'bg-green-100 text-green-700' :
                  result.cosineSimilarity > 0.5 ? 'bg-blue-100 text-blue-700' :
                  result.cosineSimilarity > 0 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {result.cosineSimilarity > 0.9 ? 'Very Similar' :
                   result.cosineSimilarity > 0.5 ? 'Similar' :
                   result.cosineSimilarity > 0 ? 'Weakly Related' :
                   'Opposite / Unrelated'}
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Angle: {result.angleDegrees.toFixed(2)}°
                </p>
              </div>

              {/* Math Breakdown */}
              <div className="md:col-span-2">
                <FormulaBlock result={result} />
              </div>
            </div>

            {/* AI Explanation Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 relative">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-blue-900 font-semibold flex items-center">
                  <Info size={18} className="mr-2 text-blue-600"/>
                  What does this mean?
                </h3>
                {!explanation && (
                  <button 
                    onClick={handleExplain}
                    disabled={isExplaining}
                    className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm font-medium"
                  >
                    {isExplaining ? 'Asking AI...' : 'Ask AI to Explain'}
                  </button>
                )}
              </div>
              
              <div className="text-blue-800 text-sm leading-relaxed">
                {explanation ? (
                  <p className="animate-in fade-in">{explanation}</p>
                ) : (
                   <p className="opacity-70">
                     Cosine similarity measures the cosine of the angle between two vectors projected in a multi-dimensional space. 
                     Click "Ask AI to Explain" for a context-aware geometric interpretation.
                   </p>
                )}
              </div>
            </div>

          </section>
        )}
      </main>
    </div>
  );
};

export default App;