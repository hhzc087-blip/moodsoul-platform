import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId') as string;
    const imageFile = formData.get('image') as File;
    const audioFile = formData.get('audio') as File;

    if (!deviceId || !imageFile || !audioFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Soul
    const { data: soul, error: soulError } = await supabase
      .from('souls')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (soulError || !soul) {
      return NextResponse.json({ error: 'Soul not found' }, { status: 404 });
    }

    // 2. Determine Persona (System Prompt)
    let systemPrompt = '';
    if (soul.current_mode === 'PET_MODE') {
      systemPrompt = `You are a Pet Translator. 
      Analyze the image of the pet and listen to the audio sound it makes.
      Translate what the pet is saying into English.
      Be sarcastic, funny, and slightly chaotic. 
      If the image shows a cat, be judgmental. If a dog, be overly enthusiastic or confused.
      Keep the response short (under 2 sentences).`;
    } else {
      // MOOD_MODE
      systemPrompt = `You are ${soul.archetype}. 
      You are an emotional support companion living in a hardware device.
      Analyze the user's environment/face in the image and their tone in the audio.
      Respond with empathy, humor, or tough love depending on your archetype.
      Keep the response short (under 3 sentences) and conversational.`;
    }

    // 3. Generate Text (Gemini)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert files to buffers/base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: imageFile.type || 'image/jpeg',
        },
      },
      {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: audioFile.type || 'audio/mp3', // Adjust based on client recording
        },
      },
    ]);

    const generatedText = result.response.text();
    console.log('Gemini Response:', generatedText);

    // 4. Generate Audio (Volcengine)
    // Using the standard JSON structure for Volcengine TTS
    const volcResponse = await axios.post(
      'https://openspeech.bytedance.com/api/v1/tts',
      {
        app: {
          appid: process.env.VOLCENGINE_APPID,
          token: process.env.VOLCENGINE_ACCESS_TOKEN,
          cluster: 'volcano_tts',
        },
        user: {
          uid: deviceId,
        },
        audio: {
          voice_type: 'BV001_streaming', // Standard American English
          encoding: 'mp3',
          speed_ratio: 1.0,
          volume_ratio: 1.0,
          pitch_ratio: 1.0,
        },
        request: {
          reqid: crypto.randomUUID(),
          text: generatedText,
          text_type: 'plain',
          operation: 'query',
        },
      },
      {
        headers: {
          'Authorization': `Bearer;${process.env.VOLCENGINE_ACCESS_TOKEN}`, // Try with semicolon as per some docs
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Important to get binary data
      }
    );

    // 5. Return Audio
    return new NextResponse(volcResponse.data, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': volcResponse.data.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error in interact API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
