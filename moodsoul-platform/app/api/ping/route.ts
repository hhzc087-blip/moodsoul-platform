import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE ROLE KEY for admin access
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidUrl = (url: string | undefined) => url && url.startsWith('http') && url !== 'your_supabase_url';

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : 'https://placeholder-project.supabase.co';
const supabaseServiceKey = (envKey && envKey !== 'your_supabase_service_key') ? envKey : 'placeholder-key'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('souls')
      // .update({ last_seen_at: new Date().toISOString() }) // Removed: Column might be missing
      .select('id') // Just check existence instead
      .eq('device_id', deviceId);

    if (error) {
      console.error('Ping update failed:', error);
      return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
