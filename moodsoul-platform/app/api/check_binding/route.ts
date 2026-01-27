import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
