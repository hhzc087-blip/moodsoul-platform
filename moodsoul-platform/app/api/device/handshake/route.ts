import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role for upserting without RLS restrictions initially)
// NOTE: In a real production app, ensure this key is secure.
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Fallback to ANON_KEY if SERVICE_ROLE_KEY is missing (handles user misconfiguration where Service Key is put in Anon var)
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined) => url && url.startsWith('http') && url !== 'your_supabase_url';

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : 'https://placeholder-project.supabase.co';
const supabaseServiceKey = (envKey && envKey !== 'your_supabase_service_key') ? envKey : 'placeholder-key'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { deviceId, token } = await request.json();

    if (!deviceId || !token) {
      return NextResponse.json({ error: "Missing deviceId or token" }, { status: 400 });
    }

    // 1. Check if device exists
    const { data: existingDevice, error: fetchError } = await supabase
      .from('souls')
      .select('owner_id, pairing_token')
      .eq('device_id', deviceId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error("DB Error", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let isBound = false;

    if (existingDevice) {
      // Device exists
      if (existingDevice.owner_id) {
        isBound = true;
      } else {
        // Not bound. Update token if it changed (e.g., factory reset)
        await supabase
          .from('souls')
          .update({ pairing_token: token, last_seen_at: new Date().toISOString() })
          .eq('device_id', deviceId);
      }
    } else {
      // New Device. Create record.
      const { error: insertError } = await supabase
        .from('souls')
        .insert({
          device_id: deviceId,
          pairing_token: token,
          current_mode: 'PET',
          archetype: 'Default Soul',
          voice_id: 'default',
          last_seen_at: new Date().toISOString()
        });
      
      if (insertError) {
         console.error("Insert Error", insertError);
         return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      bound: isBound,
      message: isBound ? "Device already bound" : "Ready to bind"
    });

  } catch (error) {
    console.error("Handshake Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
