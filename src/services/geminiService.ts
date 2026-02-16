import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Vite-এ এনভায়রনমেন্ট ভেরিয়েবল এভাবেই কল করতে হয়
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const getStyleRecommendation = async (description: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a futuristic AI hair stylist for "NEON CUTS". A client describes their style as: "${description}". Recommend a haircut or grooming style that would suit them. Keep it brief, futuristic, and professional. Mention one of our categories: Hair, Beard, or Spa.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Our neural links are currently busy. Please consult our human stylists upon arrival!";
  }
};

export const estimateCustomService = async (description: string) => {
  try {
    // JSON রেসপন্স পাওয়ার জন্য কনফিগ
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `A client wants a custom grooming service described as: "${description}". 
      As a futuristic salon AI, generate a cool name for this service and estimate a price in Indian Rupees (INR). 
      The price should be a multiple of 50, ranging from 400 to 5000 depending on complexity.
      Return JSON with keys: name, price, estimatedDuration, description.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Custom Estimation Error:", error);
    return null;
  }
};
