export type Locale = "id" | "en" | "ar";

export type Direction = "ltr" | "rtl";

export interface LanguageMeta {
  code: Locale;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: Direction;
}

export const SUPPORTED_LOCALES: Record<Locale, LanguageMeta> = {
  id: {
    code: "id",
    label: "Indonesia",
    nativeLabel: "Bahasa Indonesia",
    flag: "🇮🇩",
    dir: "ltr",
  },
  ar: {
    code: "ar",
    label: "Arab",
    nativeLabel: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  },
  en: {
    code: "en",
    label: "Inggris",
    nativeLabel: "English",
    flag: "🇬🇧",
    dir: "ltr",
  },
};

export interface Dictionary {
  nav: {
    almamater: string;
    philosophy: string;
    ecosystem: string;
    radar: string;
    login: string;
    explore_museum: string;
    brand_sub: string;
  };
  hero: {
    badge: string;
    title_prefix: string;
    title_highlight: string;
    subtitle: string;
    cta_primary: string;
    cta_secondary: string;
    stat_cohort_label: string;
    stat_cohort_val: string;
    stat_alumni_label: string;
    stat_curriculum_label: string;
    stat_curriculum_val: string;
    stat_status_label: string;
    stat_status_val: string;
  };
  almamater: {
    eyebrow: string;
    title: string;
    desc_quote: string;
    pillar_title: string;
    pillar_desc: string;
    pillar_badge: string;
    p1_title: string;
    p1_desc: string;
    p2_title: string;
    p2_desc: string;
    p3_title: string;
    p3_desc: string;
    p4_title: string;
    p4_desc: string;
    video_badge: string;
    video_loc: string;
    video_btn_yt: string;
    video_btn_channel: string;
  };
  philosophy: {
    eyebrow: string;
    title: string;
    epigraph_body: string;
    epigraph_author: string;
    epigraph_badge: string;
    c1_title: string;
    c1_desc: string;
    c2_title: string;
    c2_desc: string;
    c3_title: string;
    c3_desc: string;
    meta_batch_label: string;
    meta_batch_val: string;
    meta_motto_label: string;
    meta_motto_val: string;
    meta_campus_label: string;
    meta_campus_val: string;
  };
  ecosystem: {
    eyebrow: string;
    title: string;
    desc: string;
    item_museum_title: string;
    item_museum_desc: string;
    item_dir_title: string;
    item_dir_desc: string;
    item_radar_title: string;
    item_radar_desc: string;
    item_vault_title: string;
    item_vault_desc: string;
    item_forum_title: string;
    item_forum_desc: string;
    item_kta_title: string;
    item_kta_desc: string;
  };
  cta: {
    title: string;
    desc: string;
    btn_museum: string;
    btn_login: string;
    btn_share_wa: string;
    share_wa_text: string;
  };
  footer: {
    desc: string;
    rights: string;
    tagline: string;
  };
  sidebar: {
    home: string;
    museum: string;
    directory: string;
    radar: string;
    gallery: string;
    kta: string;
    forum: string;
    profile: string;
    admin: string;
    logout: string;
    login: string;
    lang_select: string;
  };
}
