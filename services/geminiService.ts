
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly for GoogleGenAI initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStyleRecommendation = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a futuristic AI hair stylist for "NEON CUTS". A client describes their style as: "${description}". Recommend a haircut or grooming style that would suit them. Keep it brief, futuristic, and professional. Mention one of our categories: Hair, Beard, or Spa.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Our neural links are currently busy. Please consult our human stylists upon arrival!";
  }
};

export const estimateCustomService = async (description: string) => {
  try {
    // Fix: Using gemini-3-pro-preview for complex structured JSON generation as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `A client wants a custom grooming service described as: "${description}". 
      As a futuristic salon AI, generate a cool name for this service and estimate a price in Indian Rupees (INR). 
      The price should be a multiple of 50, ranging from 400 to 5000 depending on complexity.
      Return the result in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A cool, futuristic name for the custom service." },
            price: { type: Type.NUMBER, description: "Estimated price in INR." },
            estimatedDuration: { type: Type.STRING, description: "Duration in minutes, e.g., '60 mins'." },
            description: { type: Type.STRING, description: "A brief, futuristic description of the custom protocol." }
          },
          required: ["name", "price", "estimatedDuration", "description"]
        }
      }
    });
    
    // Fix: Using .trim() for safer JSON parsing from GenerateContentResponse
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Custom Estimation Error:", error);
    return null;
  }
};
