export type LayoutMode = "korean-4cut" | "grid-2x2" | "retro-3cut" | "polaroid";
export type FilterMode = "normal" | "golden" | "noir" | "vintage" | "emerald" | "cyber" | "pastel";
export type FrameTheme =
  | "gingham"
  | "cobalt"
  | "doily"
  | "portra"
  | "instagram"
  | "luggage"
  | "spiral"
  | "ticket"
  | "receipt"
  | "scrapbook"
  | "doodle"
  | "mihrab"
  | "sovereign"
  | "white"
  | "film"
  | "santri"
  | "sakura"
  | "cyber"
  | "parchment"
  | "ocean"
  | "velvet"
  | "y2k"
  | "botanical"
  | "monolith"
  | "custom";
export type AspectRatioMode = "classic" | "square" | "portrait";

export interface PhotoItem {
  image: string;
  video?: string;
}

export interface PlacedSticker {
  id: string;
  emoji: string;
  top: number;
  left: number;
  scale?: number;
}

export interface ExportedResultState {
  dataUrl: string;
  blob: Blob | null;
  filename: string;
  downloadUrl?: string;
  type: "image" | "video";
}

export const CURATED_FRAME_THEMES: ReadonlyArray<{ id: FrameTheme; label: string }> = [
  { id: "gingham", label: "Beige Gingham & Washi Tape" },
  { id: "cobalt", label: "Cobalt Y2K Every Moment" },
  { id: "doily", label: "Korduroi & Renda Doily" },
  { id: "portra", label: "Kodak Portra 400" },
  { id: "instagram", label: "Instagram Feed UI" },
  { id: "luggage", label: "Vintage Luggage Tag" },
  { id: "spiral", label: "Spiral Notebook" },
  { id: "ticket", label: "Boarding Pass Ticket" },
  { id: "receipt", label: "Struk Kopontren Mart" },
  { id: "scrapbook", label: "Scrapbook Santri" },
  { id: "doodle", label: "Y2K Doodle Pop" },
  { id: "mihrab", label: "Mihrab Kubah Emas" },
];

export const STUDIO_FRAME_THEMES: ReadonlyArray<{ id: FrameTheme; label: string }> = [
  { id: "sovereign", label: "Emas Kehormatan" },
  { id: "white", label: "Minimalist White" },
  { id: "film", label: "35mm Analog" },
  { id: "santri", label: "Nostalgia Santri" },
  { id: "sakura", label: "Sakura Pastel" },
  { id: "cyber", label: "Emerald Arrisalah" },
  { id: "parchment", label: "Vintage Parchment" },
  { id: "ocean", label: "Deep Ocean" },
  { id: "velvet", label: "Royal Velvet" },
  { id: "y2k", label: "Y2K Chrome" },
  { id: "botanical", label: "Sage Botanical" },
  { id: "monolith", label: "Dark Monolith" },
];

export const PHOTOBOOTH_FILTER_CHIPS: ReadonlyArray<{ id: FilterMode; label: string }> = [
  { id: "normal", label: "Asli" },
  { id: "golden", label: "Golden Hour" },
  { id: "noir", label: "Noir B&W" },
  { id: "vintage", label: "90s Film" },
  { id: "emerald", label: "Emerald" },
  { id: "cyber", label: "Cahaya Pesantren" },
  { id: "pastel", label: "Soft Pastel" },
];

export const PHOTOBOOTH_STICKERS = ["👑", "🎓", "✨", "🌙", "📸", "🤍", "🕶️", "🕌", "🤝", "⚡", "⭐", "🌺"] as const;
