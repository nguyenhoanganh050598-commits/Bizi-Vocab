import { GoogleGenAI, Type } from "@google/genai";
import { Level, Word } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWords(level: Level, count: number = 5): Promise<Word[]> {
  const prompt = `Generate ${count} vocabulary words for English level ${level}. 
  For each word, provide:
  1. The word itself
  2. Vietnamese meaning
  3. IPA pronunciation
  4. Word family (related words)
  5. Part of speech
  6. English definition`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            vietnameseMeaning: { type: Type.STRING },
            ipa: { type: Type.STRING },
            wordFamily: { type: Type.ARRAY, items: { type: Type.STRING } },
            partOfSpeech: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
          required: ["word", "vietnameseMeaning", "ipa", "definition"],
        },
      },
    },
  });

  const words = JSON.parse(response.text || "[]");
  return words.map((w: any) => ({ ...w, level }));
}

export async function generateExercise(words: Word[]) {
  const prompt = `Create a matching exercise for these words: ${words.map(w => w.word).join(", ")}. 
  Provide 5 multiple choice questions where the student must match the word to its Vietnamese meaning.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["question", "options", "correctAnswer"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
}
