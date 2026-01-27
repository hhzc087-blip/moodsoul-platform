import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { persona, input } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Construct the prompt with the tuning parameters
    // This logic mimics the real device but allows for rapid testing
    const systemPrompt = `
      ${persona.base_prompt_template || "You are a helpful assistant."}
      
      PERSONALITY PARAMETERS:
      - Toxicity: ${persona.toxicity_level}/100
      - Energy: ${persona.energy_level}/100
      - Chaos: ${persona.chaos_level}/100
      
      INSTRUCTION:
      Respond to the user input below. Adjust your tone based on the parameters above.
      - High Toxicity: Be mean, roast the user.
      - High Energy: Use caps, exclamation marks, be hyper.
      - High Chaos: Be random, unpredictable.
      
      USER INPUT: "${input}"
      
      RESPONSE (Text only):
    `;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
