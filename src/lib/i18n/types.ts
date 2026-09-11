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
    eyebrow: string;
    title: string;
    subtitle: string;
    origin_loc: string;
    origin_coords: string;
    origin_dest: string;
    cta_explore: string;
    cta_download: string;
    cta_login: string;
    stat_alumni_label: string;
    stat_grad_year: string;
    stat_grad_label: string;
    stat_gen_num: string;
    stat_gen_label: string;
    stat_ukhuwah_num: string;
    stat_ukhuwah_label: string;
    scroll_hint: string;
  };
  almamater: {
    eyebrow: string;
    title: string;
    lead: string;
    p1_title: string;
    p1_desc: string;
    p1_badge: string;
    p2_title: string;
    p2_desc: string;
    p2_badge: string;
    p3_title: string;
    p3_desc: string;
    p3_badge: string;
  };
  philosophy: {
    eyebrow: string;
    title: string;
    epigraph_body: string;
    epigraph_author: string;
    card1_title: string;
    card1_desc: string;
    card2_title: string;
    card2_desc: string;
  };
  ecosystem: {
    eyebrow: string;
    title: string;
    lead: string;
    b1_badge: string;
    b1_title: string;
    b1_desc: string;
    b1_meta1: string;
    b1_meta2: string;
    b1_action: string;
    b2_badge: string;
    b2_title: string;
    b2_desc: string;
    b2_action: string;
    b3_badge: string;
    b3_title: string;
    b3_desc: string;
    b3_action: string;
    b4_badge: string;
    b4_title: string;
    b4_desc: string;
    b4_action: string;
    b5_badge: string;
    b5_title: string;
    b5_desc: string;
    b5_action: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    desc: string;
    btn_explore: string;
    btn_member: string;
    btn_apk: string;
    btn_share_wa: string;
    share_wa_text: string;
  };
  footer: {
    brand_title: string;
    brand_sub: string;
    address_title: string;
    address_desc: string;
    motto: string;
    col1_title: string;
    col2_title: string;
    nav_home: string;
    nav_almamater: string;
    nav_philosophy: string;
    nav_ecosystem: string;
    nav_radar: string;
    srv_member: string;
    srv_kta: string;
    srv_museum: string;
    srv_baitul: string;
    srv_apk: string;
    copy_text: string;
    link_apk: string;
    link_privacy: string;
  };
  sidebar: {
    home: string;
    museum: string;
    directory: string;
    gallery: string;
    radar: string;
    business: string;
    features: string;
    guide: string;
    profile: string;
    login: string;
    close: string;
  };
}
