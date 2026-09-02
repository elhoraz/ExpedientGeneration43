// lib/gamification.ts
import { SupabaseClient } from "@supabase/supabase-js";
/**
 * Mengembalikan gelar kehormatan berdasarkan jumlah poin prestise.
 */
export function getGelar(points: number): string {
    if (points >= 1000) return 'Pilar Utama';
    if (points >= 600)  return 'Visioner';
    if (points >= 300)  return 'Intelektual';
    if (points >= 100)  return 'Penggerak';
    return 'Perintis';
}

/**
 * Mengembalikan warna gradient badge berdasarkan jumlah poin prestise.
 */
export function getBadgeColor(points: number): string {
    if (points >= 1000) return 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'; // Gold
    if (points >= 600)  return 'linear-gradient(135deg, #E5E4E2 0%, #BFC1C2 100%)'; // Platinum
    if (points >= 300)  return 'linear-gradient(135deg, #b87333 0%, #cd7f32 100%)'; // Bronze
    if (points >= 100)  return 'linear-gradient(135deg, #4A4A4A 0%, #2A2A2A 100%)'; // Dark Steel
    return 'linear-gradient(135deg, #222 0%, #111 100%)'; // Base
}

/**
 * Mengembalikan icon font-awesome berdasarkan gelar
 */
export function getGelarIcon(points: number): string {
    if (points >= 1000) return 'fa-solid fa-crown';
    if (points >= 600)  return 'fa-solid fa-star';
    if (points >= 300)  return 'fa-solid fa-medal';
    if (points >= 100)  return 'fa-solid fa-shield-halved';
    return 'fa-solid fa-seedling';
}

/**
 * Menambahkan poin prestise ke pengguna dan mencatat log.
 * Mengembalikan true jika berhasil ditambah, false jika kena limit harian/lifetime.
 */
export async function addPrestise(
  supabase: SupabaseClient,
  userId: string,
  activityName: string,
  points: number
): Promise<boolean> {
  // Pengecekan limitasi (Anti-spam)
  if (activityName === 'LOGIN_DAILY') {
    // Check if user already got points today
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('prestise_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_name', activityName)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    if (error || (count && count > 0)) {
      return false; // Sudah dapat poin login hari ini
    }
  }

  if (activityName === 'GUESTBOOK_ENTRY') {
    const { count, error } = await supabase
      .from('prestise_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_name', activityName);

    if (error || (count && count > 0)) {
      return false; // Sudah pernah dapat poin buku tamu
    }
  }

  // Catat ke log
  const { error: insertError } = await supabase.from('prestise_logs').insert([
    {
      user_id: userId,
      activity_name: activityName,
      points: points,
    }
  ]);

  if (insertError) return false;

  // Tambahkan ke total user di profil secara atomik (Mencegah Race Condition)
  const { error: rpcError } = await (supabase as any).rpc('increment_prestise', {
    user_id: userId,
    amount: points,
  });

  if (rpcError) {
    // Fallback jika RPC mengalami kendala sementara
    const { data: profile } = await supabase
      .from('profiles')
      .select('prestise_points')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ prestise_points: (profile.prestise_points || 0) + points })
        .eq('id', userId);
    }
  }

  return true;
}
