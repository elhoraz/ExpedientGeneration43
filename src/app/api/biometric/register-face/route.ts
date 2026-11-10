import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { face_data } = body;

    if (!face_data || !Array.isArray(face_data)) {
      return NextResponse.json({ error: 'Invalid face data format' }, { status: 400 });
    }

    // Convert array to JSON string to store in DB
    const faceDataString = JSON.stringify(face_data);

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('user_face_data')
      .upsert({
        user_id: user.id,
        face_data: faceDataString,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // Also log this security event
    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      action: 'Registrasi Wajah Biometrik',
      details: 'Pengguna mendaftarkan ulang profil biometrik wajah ke sistem.'
    }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Face registration error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
