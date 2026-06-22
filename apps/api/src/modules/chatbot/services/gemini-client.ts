import { GoogleGenerativeAI } from '@google/generative-ai';

function createModel(apiKey: string, modelName: string) {
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: modelName });
}

export async function geminiEmbedText(
  apiKey: string,
  modelName: string,
  text: string,
): Promise<number[]> {
  const model = createModel(apiKey, modelName);
  const result = await model.embedContent(text);
  const values = result.embedding?.values;
  if (!values?.length) {
    throw new Error('Empty embedding from Gemini');
  }
  return [...values];
}

export async function geminiGenerateText(
  apiKey: string,
  modelName: string,
  prompt: string,
): Promise<string> {
  const model = createModel(apiKey, modelName);
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
