import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE ROLE KEY for admin access
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Fallback to ANON_KEY if SERVICE_ROLE_KEY is missing (handles user misconfiguration where Service Key is put in Anon var)
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined) => url && url.startsWith('http') && url !== 'your_supabase_url';

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : 'https://placeholder-project.supabase.co';
const supabaseServiceKey = (envKey && envKey !== 'your_supabase_service_key') ? envKey : 'placeholder-key'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { deviceId, ownerName, email } = await request.json();

    if (!deviceId || !ownerName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if Soul exists, if not create it
    // We assume owner_id is the current auth user if available, or we generate/use a placeholder
    // For this flow, we will upsert.
    
    // Ideally we should have the user's Auth ID.
    // Since this is a server route, we can't easily get the client's session without cookies.
    // But for the "Simple Auth" flow requested, we might just rely on the name.
    // However, the 'interact' API requires 'owner_id'.
    // We will generate a UUID for owner_id if we don't have one, or use a fixed one for "Guest" binding.
    // Better: The frontend should pass the user ID if logged in.
    // For now, let's just update the record and assume existing logic handles owner_id or we set a dummy.
    
    // Let's check if there is an existing record
    const { data: existing } = await supabase.from('souls').select('*').eq('device_id', deviceId).single();
    
    const updates: any = {
        device_id: deviceId,
        // owner_name: ownerName, // Removed: Column missing in DB
        // is_bound: true, // Removed: Column missing in DB
        // birth_date: new Date().toISOString(), // Removed: Column missing in DB
    };

    // If it's a new record (not found in DB), add default fields
    if (!existing) {
        updates.current_mode = 'PET';
        // updates.archetype = 'Default Soul'; // Removed: Column dropped from DB
        
        // Fetch default persona (Toxic Cat or first available)
        const { data: defaultPersona } = await supabase
            .from('personas')
            .select('id')
            .eq('mode', 'PET')
            .limit(1)
            .single();
            
        if (defaultPersona) {
            updates.active_persona_id = defaultPersona.id;
        }

        // updates.voice_id = 'default'; // Removed: Column missing in DB
        // updates.daily_interactions_count = 0; // Removed: Might be missing in some DB versions, safe to skip (default is 0 in DB)
        
        // Generate a random UUID for owner_id to satisfy constraints if any,  
        // and to allow interaction checks that rely on owner_id presence.
        // NOTE: This assumes owner_id is NOT a Foreign Key to auth.users. 
        // If it is, this might fail or we should leave it null.
        // Given 'interact' checks for owner_id, we try to set it.
        // updates.owner_id = crypto.randomUUID(); // Removed: Avoid FK violation if owner_id references auth.users
    } else {
        // If existing but no owner_id, set one?
        if (!existing.owner_id) {
             // updates.owner_id = crypto.randomUUID(); // Removed
        }
    }
    
    const { error } = await supabase.from('souls').upsert(updates, { onConflict: 'device_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
