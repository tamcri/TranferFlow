import { GoogleGenAI, Type } from "@google/genai";
import { TransferItem, AIAnalysisResult } from "../types";

const apiKey = import.meta.env["VITE_GEMINI_API_KEY"] as string;

const ai = new GoogleGenAI({ apiKey });



export const generateItemDescription = async (brand: string, category: string, quantity: number): Promise<string> => {
  try {
    const prompt = `
      Sei un assistente per manager di negozi di abbigliamento.
      Scrivi una breve descrizione professionale (massimo 20 parole) per un lotto di merce da trasferire ad un altro negozio.
      Dettagli:
      Brand: ${brand}
      Categoria: ${category}
      Quantità: ${quantity}
      
      La descrizione deve essere persuasiva ma onesta. In Italiano.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Descrizione non disponibile.";
  } catch (error) {
    console.error("Errore generazione descrizione:", error);
    return "Impossibile generare descrizione al momento.";
  }
};

export const analyzeMarketTrends = async (items: TransferItem[]): Promise<AIAnalysisResult | null> => {
  try {
    if (!items || items.length === 0) return null;

    const itemsSummary = items.slice(0, 50).map(i => 
      `${i.brand} ${i.category} (${i.gender})`
    ).join(', ');

    const prompt = `
      Analizza il seguente inventario di un negozio di abbigliamento:
      ${itemsSummary}
      
      Fornisci un output JSON con:
      - summary: una breve panoramica (max 1 frasi).
      - trendingCategory: il brand o categoria più ricorrente.
      - suggestion: un breve consiglio strategico.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            trendingCategory: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
          required: ["summary", "trendingCategory", "suggestion"],
        },
      },
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text) as AIAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Errore analisi AI:", error);
    return null;
  }
};