import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai@0.11.3/+esm";

let genAI;

export function initializeGenAI(apiKey) {
  if (!apiKey) throw new Error("API Key is required");

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    return true;
  } catch (error) {
    console.error("API initialization failed:", error);
    throw error;
  }
}

export async function generateStorySegment(prompt) {
  if (!genAI) throw new Error("AI not initialized");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Story generation failed:", error);
    throw error;
  }
}
