import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { BUSINESS_THEMES, slugify } from "@/lib/syndicate/themes";
import MicrositeStandaloneView from "./MicrositeStandaloneView";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tema?: string; template?: string }>;
}

const getBusinessBySlug = cache(async (slug: string) => {
  const db =
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createAdminClient()
      : await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  const selectFields = `
      *,
      profiles!user_id (
        id,
        nama_lengkap,
        nama_panggilan,
        foto_profil,
        no_whatsapp,
        akun_ig
      )
    `;

  if (isUuid) {
    const { data } = await db.from("syndicate").select(selectFields).eq("id", slug).maybeSingle();
    return data;
  }

  const { data: allBiz } = await db.from("syndicate").select(selectFields);
  if (!allBiz || allBiz.length === 0) return null;

  return allBiz.find((b: { nama_bisnis?: string | null }) => slugify(b.nama_bisnis || "") === slug) || null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const biz = await getBusinessBySlug(slug);

  if (!biz) {
    return {
      title: "Halaman Usaha Tidak Ditemukan | Expedient 43",
      description: "Profil usaha alumni Expedient 43 tidak ditemukan atau sudah diperbarui.",
    };
  }

  const title = `${biz.nama_bisnis} · ${biz.tagline || biz.kategori} | Expedient 43`;
  const description =
    biz.tagline ||
    (biz.deskripsi
      ? biz.deskripsi.slice(0, 160)
      : "Profil usaha resmi alumni Expedient 43 Pondok Modern Arrisalah Slahung Ponorogo.");
  const bannerImage = biz.banner_url || biz.logo_bisnis || "/images/logo-utuh.webp";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: bannerImage,
          width: 1200,
          height: 630,
          alt: biz.nama_bisnis,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [bannerImage],
    },
  };
}

export default async function PublicBusinessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const rawRequestedTheme = resolvedSearch?.tema || resolvedSearch?.template;
  const previewTheme =
    rawRequestedTheme && BUSINESS_THEMES[rawRequestedTheme] ? rawRequestedTheme : undefined;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerName = "Pelanggan / Rekan";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nama_panggilan, nama_lengkap")
      .eq("id", user.id)
      .single();
    if (profile) {
      viewerName = profile.nama_panggilan || profile.nama_lengkap || "Rekan Alumni";
    }
  }

  const isOwner = user ? user.id === business.user_id : false;

  return (
    <MicrositeStandaloneView
      business={business}
      isOwner={isOwner}
      viewerName={viewerName}
      currentSlug={slug}
      previewTheme={previewTheme}
    />
  );
}

