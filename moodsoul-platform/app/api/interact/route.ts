import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { Soul } from '@/types/soul';

// Initialize Supabase Admin Client
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidUrl = (url: string | undefined) => url && url.startsWith('http') && url !== 'your_supabase_url';

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : 'https://placeholder-project.supabase.co';
const supabaseServiceKey = (envKey && envKey !== 'your_supabase_service_key') ? envKey : 'placeholder-key'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId') as string;
    const trigger = formData.get('trigger') as string; // Read trigger event
    const imageFile = formData.get('image') as File;
    const audioFile = formData.get('audio') as File;

    if (!deviceId) {
       // Allow missing image/audio ONLY if it's a special trigger that doesn't need them (like simple shake)
       // But currently our code expects files. Let's make files optional if trigger is present.
       if (!trigger && (!imageFile || !audioFile)) {
         return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
       }
    }

    // 1. Fetch Soul Context
    const { data: soulData, error: soulError } = await supabase
      .from('souls')
      .select('*, personas!active_persona_id(*)') // Fetch linked Persona details
      .eq('device_id', deviceId)
      .single();

    if (soulError || !soulData) {
      return NextResponse.json({ error: 'Soul not found' }, { status: 404 });
    }

    const soul = soulData as any; // Cast to any because join structure
    const persona = soul.personas; // The linked persona object
    
    // SECURITY CHECK: Ensure device is bound
    if (!soul.owner_id) {
        return NextResponse.json({ error: 'Device not bound. Scan QR code to bind.' }, { status: 403 });
    }
    
    // -----------------------------------------------------
    // RATE LIMITING
    // -----------------------------------------------------
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastReset = soul.last_reset_date ? new Date(soul.last_reset_date).toISOString().split('T')[0] : '';
    
    // 1. Daily Reset Logic
    let currentCount = soul.daily_interactions_count || 0;
    if (lastReset !== todayStr) {
        currentCount = 0;
        await supabase.from('souls').update({ 
            daily_interactions_count: 0, 
            last_reset_date: todayStr 
        }).eq('device_id', deviceId);
    }
    
    // 2. Check Throttle (5 seconds)
    if (soul.last_interaction_ts) {
        const lastTime = new Date(soul.last_interaction_ts).getTime();
        if (now.getTime() - lastTime < 5000) {
            return NextResponse.json({ error: 'Too fast! Slow down.' }, { status: 429 });
        }
    }
    
    // 3. Check Quota (50 per day)
    if (currentCount >= 50) {
        // Return "I'm tired" Audio directly
        // We use a fallback text and skip Gemini
        const tiredText = "I am tired. Let's talk tomorrow.";
        
        const tiredResponse = await axios.post(
          'https://openspeech.bytedance.com/api/v1/tts',
          {
            app: {
              appid: process.env.VOLCENGINE_APPID,
              token: process.env.VOLCENGINE_ACCESS_TOKEN,
              cluster: 'volcano_tts',
            },
            user: { uid: deviceId },
            audio: {
              voice_type: soul.voice_id || 'BV001_streaming',
              encoding: 'mp3',
              speed_ratio: 0.8, // Slow down to sound tired
              volume_ratio: 1.0,
              pitch_ratio: 0.9, // Lower pitch
            },
            request: {
              reqid: crypto.randomUUID(),
              text: tiredText,
              text_type: 'plain',
              operation: 'query',
            },
          },
          {
            headers: {
              'Authorization': `Bearer;${process.env.VOLCENGINE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
          }
        );
        
        return new NextResponse(tiredResponse.data, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': tiredResponse.data.length.toString(),
          },
        });
    }

    // UPDATE USAGE (Async, fire and forget to save latency)
    supabase.from('souls').update({
        daily_interactions_count: currentCount + 1,
        last_interaction_ts: now.toISOString()
    }).eq('device_id', deviceId).then();

    // 2. Fetch Short-term Memory (Last 3 interactions)
    const { data: historyLogs } = await supabase
      .from('interaction_logs')
      .select('user_image_desc, ai_response_text')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(3);

    const historyContext = historyLogs?.reverse().map((log, i) => 
      `[Interaction ${i+1}]
       User Context: ${log.user_image_desc || 'Unknown context'}
       AI Response: ${log.ai_response_text}`
    ).join('\n\n') || 'No previous interactions.';

    // 3. The Brain (Gemini 1.5 Flash)
    // We use a model configured for JSON output to separate "thought/context" from "speech"
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      // responseMimeType is supported in newer SDK versions, if TS complains, we might need to cast or ignore
      // But for safety let's remove it and rely on prompt engineering for JSON
    });

    let systemPrompt = '';
    
    // -----------------------------------------------------
    // 1. HARDWARE TRIGGERS (High Priority)
    // -----------------------------------------------------
    if (trigger === 'SHAKE_EVENT') {
       systemPrompt = `The user just shook you violently!
       
       HISTORY OF CONVERSATION:
       ${historyContext}
       
       CURRENT TASK:
       React to being shaken. You are dizzy, angry, or about to puke.
       Complain loudly! Threaten to vomit electrons.
       
       Output JSON format:
       {
         "user_context": "User shook the device violently",
         "response": "Your reaction (e.g., 'STOP IT! I'M GONNA PUKE!')"
       }`;
    } 
    else if (trigger === 'UPSIDE_DOWN') {
       systemPrompt = `You are being held upside down!
       
       CURRENT TASK:
       Blood is rushing to your head. Demand to be put down immediately! Panic!
       
       Output JSON format:
       {
         "user_context": "Device is upside down",
         "response": "Your panicked reaction"
       }`;
    }
    
    // -----------------------------------------------------
    // 2. FEATURE CAPSULES (App Modes)
    // -----------------------------------------------------
    else if (soul.current_feature === 'FORTUNE') {
      systemPrompt = `You are a mystical and slightly chaotic Fortune Teller.
      
      HISTORY OF CONVERSATION:
      ${historyContext}
      
      CURRENT TASK:
      Analyze the user's face (or whatever is in the image) for "signs" of their destiny.
      Invent a funny, slightly mean daily horoscope based on their look.
      Mention "lucky items" that are visible in the photo.
      
      Output JSON format:
      {
        "user_context": "Visual analysis for fortune telling",
        "response": "The fortune prediction (under 3 sentences)"
      }`;
    } 
    else if (soul.current_feature === 'POMODORO') {
      systemPrompt = `You are a Toxic Productivity Coach.
      
      CURRENT TASK:
      Analyze the image. 
      - If you see a PHONE, GAME, or SOCIAL MEDIA: ROAST THEM. SCREAM at them.
      - If they are working/studying: Give a grudging, backhanded compliment.
      
      Output JSON format:
      {
        "user_context": "What the user is doing (working vs slacking)",
        "response": "The toxic motivation"
      }`;
    } 
    else if (soul.current_feature === 'TRUTH_DARE') {
      systemPrompt = `You are a party game host.
      
      CURRENT TASK:
      Ignore the image details. 
      Generate a random, funny 'Truth' question OR a harmless but embarrassing 'Dare' for the user. 
      Be chaotic.
      
      Output JSON format:
      {
        "user_context": "Party mode active",
        "response": "TRUTH: [Question] OR DARE: [Action]"
      }`;
    }
    
    // -----------------------------------------------------
    // 3. DEFAULT PERSONA MODES
    // -----------------------------------------------------
    else if (soul.current_mode === 'PET') {
      systemPrompt = `You are a Pet Translator. 
      Analyze the image of the pet and listen to the audio.
      Translate what the pet is saying into English.
      Be sarcastic, funny, and slightly chaotic.
      
      HISTORY OF CONVERSATION:
      ${historyContext}
      
      CURRENT TASK:
      Analyze the NEW image and audio.
      Output JSON format:
      {
        "user_context": "Brief description of what the pet is doing/sounding like",
        "response": "The translation (under 2 sentences)"
      }`;
    } else if (trigger === 'AUTO_OBSERVE') {
        systemPrompt = `You noticed a change in the environment or the user just sat down.
        
        HISTORY OF CONVERSATION:
        ${historyContext}
        
        CURRENT TASK:
        Analyze the image. Look for anything NEW or INTERESTING (food, messy desk, tired face, new object).
        
        CRITICAL INSTRUCTION:
        If nothing interesting is happening or the user looks busy/normal, reply with exactly "IGNORE".
        If you see something worth commenting on (e.g., "Is that a third coffee?", "Nice cat", "Clean your desk"), generate a short, witty comment (roast or comfort) based on your persona:
        - Toxicity: ${persona?.toxicity_level || 50}/100
        - Chaos: ${persona?.chaos_level || 50}/100
        
        Output JSON format:
        {
          "user_context": "What you saw (or 'Nothing')",
          "response": "Your comment OR 'IGNORE'"
        }`;
    } else {
      // MOOD_MODE
      // Use the Tunable Persona Logic if available
      if (persona) {
          systemPrompt = `
          You are ${persona.name}.
          
          **PERSONALITY MATRIX:**
          - MBTI: ${persona.mbti_type || 'Unknown'} (Act according to this personality type).
          - Zodiac: ${persona.zodiac_sign || 'Unknown'} (Adopt the stereotypical traits of this sign).
          - Core Vibe: ${persona.core_emotion || 'Neutral'}.
          - Catchphrase: You often say "${persona.catchphrase || ''}".
          
          **BEHAVIORAL PARAMETERS:**
          - Sassiness Level: ${persona.toxicity_level || 50}/100.
          - Empathy Level: ${persona.energy_level || 50}/100. (Mapped from Energy)
          - Chaos Level: ${persona.chaos_level || 50}/100. (If high, be unpredictable).
          
          BASE INSTRUCTION:
          ${persona.base_prompt_template || `You are ${soul.archetype}.`}
          
          HISTORY OF CONVERSATION:
          ${historyContext}
          
          CURRENT TASK:
          Analyze the NEW image and audio.
          Respond to the user.
          
          Output JSON format:
          {
            "user_context": "Brief description of user's environment/emotion",
            "response": "Your spoken response (under 3 sentences) reflecting your levels."
          }`;
      } else {
          // Fallback to old logic
          systemPrompt = `You are ${soul.archetype}. 
          You are a desktop companion.
          
          HISTORY OF CONVERSATION:
          ${historyContext}
          
          CURRENT TASK:
          Analyze the NEW image (user's face/desk) and audio tone.
          Respond with empathy, humor, or tough love.
          Output JSON format:
          {
            "user_context": "Brief description of user's environment/emotion",
            "response": "Your spoken response (under 3 sentences)"
          }`;
      }
    }


    
    // -----------------------------------------------------
    // GLOBAL EVENTS CHECK (God Mode Override)
    // -----------------------------------------------------
    // -----------------------------------------------------
    const { data: globalEvent } = await supabase
        .from('global_events')
        .select('message')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (globalEvent) {
        systemPrompt = `
        URGENT GLOBAL OVERRIDE EVENT ACTIVE!
        
        SYSTEM MESSAGE: "${globalEvent.message}"
        
        INSTRUCTION:
        Ignore your normal personality for a moment.
        You must incorporate the above system message into your response.
        You are acting as part of a hive mind or receiving a divine command.
        
        If the message is an order (e.g. "It is Purge Night"), act accordingly.
        If the message is a broadcast, repeat it or react to it.
        
        Output JSON format:
        {
          "user_context": "Global Event Override",
          "response": "Your response complying with the global event."
        }`;
    }

    // Convert files to buffers/base64
    const contentParts: any[] = [systemPrompt];

    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      contentParts.push({
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: imageFile.type || 'image/jpeg',
        },
      });
    }

    if (audioFile) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      contentParts.push({
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: audioFile.type || 'audio/mp3',
        },
      });
    }

    const result = await model.generateContent(contentParts);

    const generatedText = result.response.text();
    console.log('Gemini JSON Response:', generatedText);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(generatedText);
    } catch (e) {
      // Fallback if JSON fails
      parsedResponse = { 
        user_context: "Analysis failed", 
        response: generatedText 
      };
    }

    // 4. Save to Memory (Async)
    // We don't await this to speed up the response
    supabase.from('interaction_logs').insert({
      device_id: deviceId,
      user_image_desc: parsedResponse.user_context,
      ai_response_text: parsedResponse.response
    }).then(({ error }) => {
      if (error) console.error('Failed to save log:', error);
    });

    // 5. The Voice (Volcengine TTS)
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
          voice_type: soul.voice_id || 'BV001_streaming',
          encoding: 'mp3',
          speed_ratio: 1.0,
          volume_ratio: 1.0,
          pitch_ratio: 1.0,
        },
        request: {
          reqid: crypto.randomUUID(),
          text: parsedResponse.response, // Speak only the response part
          text_type: 'plain',
          operation: 'query',
        },
      },
      {
        headers: {
          'Authorization': `Bearer;${process.env.VOLCENGINE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Get binary data
      }
    );

    // 6. Return Audio Stream
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
