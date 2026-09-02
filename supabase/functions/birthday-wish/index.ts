// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Pastikan request ini adalah POST
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // Ambil auth header (anon key)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const fonnteToken = Deno.env.get('FONNTE_TOKEN') ?? ''

    if (!supabaseUrl || !supabaseKey || !fonnteToken) {
      return new Response('Server Configuration Error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Cari user yang ulang tahun hari ini
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nama_panggilan, no_whatsapp, tanggal_lahir')
      .not('no_whatsapp', 'is', null)

    if (error) {
      throw error
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada user untuk dicek." }), { headers: { "Content-Type": "application/json" } })
    }

    // Filter by today's date
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthdayUsers = profiles.filter(p => {
      if (!p.tanggal_lahir) return false;
      const dob = new Date(p.tanggal_lahir);
      return (dob.getMonth() + 1) === currentMonth && dob.getDate() === currentDay;
    });

    if (birthdayUsers.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada user yang ulang tahun hari ini." }), { headers: { "Content-Type": "application/json" } })
    }

    let sentCount = 0;

    for (const user of birthdayUsers) {
      // Normalize number
      let num = user.no_whatsapp.replace(/\D/g, "");
      if (num.startsWith("0")) num = "62" + num.substring(1);
      else if (!num.startsWith("62")) num = "62" + num;

      const message = `🎉 *Barakallah Fii Umrik, ${user.nama_panggilan}!* 🎉\n\nSelamat ulang tahun dari kami keluarga besar Expedient Generation.\nSemoga panjang umur, sehat selalu, dan apa yang dicita-citakan lekas terwujud. Aamiin! 🎂✨`;

      try {
        const response = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: num,
            message: message
          })
        });

        if (response.ok) {
          sentCount++;
        }
      } catch (err) {
        console.error("Gagal kirim ke", user.nama_panggilan, err);
      }
      
      // Delay 300ms
      await new Promise(r => setTimeout(r, 300));
    }

    return new Response(
      JSON.stringify({ success: true, message: `Berhasil mengirim ${sentCount} ucapan.` }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
