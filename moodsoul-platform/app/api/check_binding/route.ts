import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE ROLE KEY for admin access
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidUrl = (url: string | undefined) => url && url.startsWith('http') && url !== 'your_supabase_url';

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : 'https://placeholder-project.supabase.co';
const supabaseServiceKey = (envKey && envKey !== 'your_supabase_service_key') ? envKey : 'placeholder-key'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return NextResponse.json({ bound: false });
  }

  const { data } = await supabase
    .from('souls')
    .select('is_bound')
    .eq('device_id', deviceId)
    .single();

  return NextResponse.json({ bound: data?.is_bound || false });
}
