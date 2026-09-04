/**
 * Safely resolves avatar URL regardless of how it was stored:
 * 1. Full external URL (http:// or https://)
 * 2. Corrupted prefixes like `/uploads/profiles/https://...` (auto-healed)
 * 3. Supabase Storage public URL
 * 4. Relative local path (/uploads/profiles/... or /images/...)
 * 5. Legacy CodeIgniter local filename (expedient_xxx.jpg)
 * 6. Bare filename in Supabase profile-photos bucket
 * 7. Empty / null / placeholder (falls back to UI-Avatars)
 */
export function getAvatarUrl(
  foto_profil?: string | null,
  fallbackName: string = "A"
): string {
  const name = fallbackName && fallbackName.trim() !== "" ? fallbackName.trim() : "A";
  const safeFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4af37&color=000&bold=true`;

  if (!foto_profil || foto_profil === "default.webp" || foto_profil === "null" || foto_profil.trim() === "") {
    return safeFallback;
  }

  const trimmed = foto_profil.trim();

  // If corrupted prefix exists e.g. /uploads/profiles/https://... or .../https://...
  if (trimmed.includes("https://")) {
    return trimmed.substring(trimmed.indexOf("https://"));
  }
  if (trimmed.includes("http://")) {
    return trimmed.substring(trimmed.indexOf("http://"));
  }

  // If already relative path (/uploads/profiles/... or /images/...)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Legacy local files (expedient_xxx.jpg)
  if (trimmed.startsWith("expedient_")) {
    return `/uploads/profiles/${trimmed}`;
  }

  // Bare filename stored in Supabase profile-photos bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dodcwulqgrhqpbldrlik.supabase.co";
  return `${supabaseUrl}/storage/v1/object/public/profile-photos/${trimmed}`;
}

export function getAvatarFallback(fallbackName: string = "A"): string {
  const name = fallbackName && fallbackName.trim() !== "" ? fallbackName.trim() : "A";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4af37&color=000&bold=true`;
}
