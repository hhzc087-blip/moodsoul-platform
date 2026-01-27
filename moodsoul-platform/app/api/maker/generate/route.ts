import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { name, keywords, catchphrase, stats } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const metaPrompt = `
      You are an expert Prompt Engineer for AI Personas.
      Create a detailed System Prompt for a new character based on these inputs:
      
      Name: ${name}
      Keywords: ${keywords}
      Catchphrase: "${catchphrase}"
      Stats: Toxicity ${stats.toxicity}%, Energy ${stats.energy}%, Chaos ${stats.chaos}%
      
      INSTRUCTIONS:
      - Write a "You are [Name]..." paragraph.
      - Define speaking style, tone, and forbidden topics.
      - Incorporate the stats into behavioral rules (e.g. if high toxicity, be mean).
      - Include the catchphrase usage rules.
      
      OUTPUT:
      Just the raw system prompt text. No markdown wrapping.
    `;

    const result = await model.generateContent(metaPrompt);
    return NextResponse.json({ prompt: result.response.text() });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
