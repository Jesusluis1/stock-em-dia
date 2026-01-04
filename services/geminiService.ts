
import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export async function getStockInsights(products: Product[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const stockSummary = products.map(p => ({
      name: p.name,
      stock: p.stock,
      min: p.minStock,
      price: p.price
    }));

    const prompt = `Analise este inventário de uma loja em Angola: ${JSON.stringify(stockSummary)}.
    Forneça 3 conselhos estratégicos super curtos (máximo 15 palavras cada).
    Foque em:
    1. Produtos para repor urgente (abaixo do mínimo).
    2. Sugestão de promoção para o que está parado.
    3. Uma dica de gestão financeira em Kwanzas (AOA).
    Use um tom motivador e profissional.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é o 'Stock em Dia IA', um consultor especialista no mercado retalhista de Angola. Seu objetivo é ajudar pequenos comerciantes a prosperar garantindo que o seu stock esteja sempre equilibrado.",
        temperature: 0.8,
      },
    });

    return response.text || "Continue com o bom trabalho na gestão do seu stock!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha o controlo das suas vendas para garantir lucros no final do mês.";
  }
}
