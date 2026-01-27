import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { deviceId, token, userId } = await request.json();

    if (!deviceId || !token || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Token matches DB
    const { data: device, error: fetchError } = await supabase
      .from('souls')
      .select('pairing_token, owner_id')
      .eq('device_id', deviceId)
      .single();

    if (fetchError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.owner_id) {
        // Optional: Allow re-binding if user confirms? For now, block.
        // Or if owner_id is same as userId, just success.
        if (device.owner_id === userId) {
            return NextResponse.json({ success: true, message: "Already owned" });
        }
        return NextResponse.json({ error: "Device is already owned by someone else" }, { status: 403 });
    }

    if (device.pairing_token !== token) {
      return NextResponse.json({ error: "Invalid Pairing Token" }, { status: 401 });
    }

    // 2. Claim Device
    const { error: updateError } = await supabase
      .from('souls')
      .update({ owner_id: userId, pairing_token: null }) // Clear token after bind? Or keep for re-auth? Let's keep it null for security so it can't be reused.
      .eq('device_id', deviceId);

    if (updateError) {
        return NextResponse.json({ error: "Failed to claim device" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Claim Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
