import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedVectors } from "../types";

// Initialize Gemini Client
// NOTE: In a real production app, this should be proxied through a backend.
// For this frontend-only demo, we use the env variable directly.
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVectorsFromConcepts = async (
  topicA: string,
  topicB: string,
  dimensions: number = 5
): Promise<GeneratedVectors | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const prompt = `Generate two hypothetical ${dimensions}-dimensional semantic feature vectors for the concepts "${topicA}" and "${topicB}". 
    The vectors should mathematically represent the semantic meaning of these words in a latent space (values between -1 and 1).
    Provide a brief reasoning for why they are similar or different.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vectorA: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: `${dimensions}-dimensional vector for the first concept`,
            },
            vectorB: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: `${dimensions}-dimensional vector for the second concept`,
            },
            reasoning: {
              type: Type.STRING,
              description: "Short explanation of the relationship",
            },
          },
          required: ["vectorA", "vectorB", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text);
    return {
      vectorA: data.vectorA,
      vectorB: data.vectorB,
      topicA,
      topicB,
      reasoning: data.reasoning,
    };
  } catch (error) {
    console.error("Error generating vectors:", error);
    return null;
  }
};

export const explainSimilarityResult = async (
  vecA: number[],
  vecB: number[],
  similarity: number
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Unable to connect to AI for explanation.";

  try {
    const prompt = `
      I have calculated the Cosine Similarity between two vectors.
      Vector A: [${vecA.slice(0, 5).join(", ")}${vecA.length > 5 ? "..." : ""}]
      Vector B: [${vecB.slice(0, 5).join(", ")}${vecB.length > 5 ? "..." : ""}]
      Cosine Similarity Score: ${similarity.toFixed(4)}
      
      Explain what this score implies geometrically (angle) and generally (relationship strength). 
      Keep it concise (under 3 sentences) and easy to understand for a student.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Error explaining similarity:", error);
    return "Error generating explanation.";
  }
};
