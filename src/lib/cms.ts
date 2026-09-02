import { createClient } from "./supabase/server";

export async function getPageCms(prefix: string) {
  const supabase = await createClient();
  const { data: siteContents, error } = await supabase
    .from("site_content")
    .select("*")
    .like("content_key", `${prefix}_%`);

  if (error) {
    console.error("Error fetching CMS for prefix:", prefix, error);
  }

  const cms = siteContents || [];

  return (key: string, defaultValue: string) => {
    const fullKey = `${prefix}_${key}`;
    const item = cms.find((c) => c.content_key === fullKey);
    return item ? item.content_value : defaultValue;
  };
}

export async function getGlobalCms() {
  const supabase = await createClient();
  const { data: siteContents, error } = await supabase
    .from("site_content")
    .select("*")
    .like("content_key", "global_%");

  if (error) {
    console.error("Error fetching global CMS:", error);
  }

  const cms = siteContents || [];

  return (key: string, defaultValue: string) => {
    const fullKey = `global_${key}`;
    const item = cms.find((c) => c.content_key === fullKey);
    return item ? item.content_value : defaultValue;
  };
}
