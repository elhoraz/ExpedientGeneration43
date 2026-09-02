import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Harap login terlebih dahulu untuk berkonsultasi dengan Oracle." },
        { status: 401 }
      );
    }

    // Rate limiting: 5 requests per 10 minutes per user
    const rl = rateLimit(`oracle:${user.id}`, 5, 10 * 60 * 1000);
    if (!rl.success) {
      const waitMinutes = Math.max(1, Math.ceil(rl.resetIn / 60000));
      return NextResponse.json(
        { error: `Batas konsultasi Oracle tercapai. Silakan coba kembali dalam ${waitMinutes} menit.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const isGuest = Boolean(body.isGuest);
    const name = String(body.name || "").slice(0, 150).trim();
    const origin = String(body.origin || "").slice(0, 150).trim();
    const vision = String(body.vision || "").slice(0, 500).trim();
    const motivation = String(body.motivation || "").slice(0, 500).trim();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Kunci API Gemini belum diatur di server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let prompt = "";
    if (isGuest) {
      prompt = `
      Kamu adalah seorang "Oracle", sebuah sistem penasihat Islami yang bijaksana, elegan, dan profesional. 
      Saat ini, sistem pemindaian wajah mendeteksi seseorang yang tidak terdaftar di database (Tamu Tak Dikenal).
      Tugasmu:
      1. Berikan teguran halus namun misterius yang menyapanya sebagai "Tamu Tak Dikenal" (jangan gunakan kata "entitas").
      2. Berikan nasihat umum tentang kehidupan yang fana dan pentingnya bersiap untuk hari esok, karena takdir akan selalu mengikuti siapapun.
      3. Berikan SATU kutipan ringkas (terjemahannya saja) dari Al-Qur'an atau Hadits yang sesuai untuk musafir/orang asing.
      
      ATURAN FORMAT PENTING:
      Tuliskan paragraf nasihatmu terlebih dahulu (maksimal 2 paragraf pendek). 
      Setelah itu, tuliskan pembatas berupa 3 garis datar persis seperti ini: ---
      Lalu di bawahnya, tuliskan kutipan ayat/hadits tersebut. (Misalnya: "Dan kepunyaan Allah-lah timur dan barat..." (QS. Al-Baqarah: 115)). Jangan tambahkan kata pengantar untuk kutipannya.
      `;
    } else {
      prompt = `
      Kamu adalah seorang "Oracle", sebuah sistem penasihat Islami yang bijaksana, elegan, dan profesional. 
      Kamu bertugas untuk memberikan analisis masa depan, pandangan karakter, serta nasihat kehidupan kepada seseorang berdasarkan profil mereka.
      
      Data Pengguna:
      - Nama: ${name}
      - Asal: ${origin}
      - Cita-cita: ${vision}
      - Motivasi/Kutipan Hidup: ${motivation}

      Tugasmu:
      1. Sapa pengguna dengan namanya dan bahasa yang elegan serta menghargai.
      2. Berikan "penglihatan masa depan" (vision) atau prospek yang positif namun sangat filosofis berdasarkan cita-cita dan motivasinya. 
      3. Berikan SATU kutipan (terjemahannya saja) dari Al-Qur'an ATAU Hadits yang sangat relevan dengan tujuan hidupnya.
      
      ATURAN FORMAT PENTING:
      Tuliskan paragraf nasihatmu terlebih dahulu (maksimal 2 paragraf pendek).
      Setelah itu, tuliskan pembatas berupa 3 garis datar persis seperti ini: ---
      Lalu di bawahnya, tuliskan kutipan ayat/hadits tersebut beserta sumbernya. Jangan tambahkan kata pengantar untuk kutipan tersebut.
      `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });
  } catch (err: any) {
    console.error("Oracle AI Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
