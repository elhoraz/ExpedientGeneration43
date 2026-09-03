/**
 * Safely resolves avatar URL regardless of how it was stored:
 * 1. Full external URL (http:// or https://)
 * 2. Supabase Storage public URL
 * 3. Relative local path (/uploads/profiles/...)
 * 4. Plain filename from storage bucket
 * 5. Empty / null / placeholder
 */
export function getAvatarUrl(
  foto_profil?: string | null,
  fallbackName: string = "A"
): string {
  if (!foto_profil || foto_profil === "default.webp" || foto_profil === "null" || foto_profil.trim() === "") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=d4af37&color=000&bold=true`;
  }

  const trimmed = foto_profil.trim();

  // If already a full URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If relative path
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Bare filename stored in Supabase profile-photos bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dodcwulqgrhqpbldrlik.supabase.co";
  return `${supabaseUrl}/storage/v1/object/public/profile-photos/${trimmed}`;
}
