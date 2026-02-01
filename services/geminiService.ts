
import { GoogleGenAI } from "@google/genai";

export const getTireInsights = async (tires: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise os seguintes dados de pneus de uma frota pesada e forneça 3 dicas rápidas de manutenção ou economia: ${JSON.stringify(tires)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um especialista em gestão de frotas pesadas focado em redução de custos com pneus.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao obter insights da IA:", error);
    return "Não foi possível carregar os insights da IA no momento.";
  }
};
