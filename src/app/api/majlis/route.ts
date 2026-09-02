import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { addPrestise } from "@/lib/gamification";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: topics, error } = await supabase
      .from("majlis_topics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ status: "error", message: error.message, data: null }, { status: 500 });
    }

    // Fetch creator names
    const creatorIds = Array.from(new Set(topics?.map((t: any) => t.created_by).filter(Boolean)));
    const profileMap = new Map<string, string>();
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nama_panggilan")
        .in("id", creatorIds);
      profiles?.forEach((p: any) => profileMap.set(p.id, p.nama_panggilan));
    }

    let votedTopicIds = new Set<string>();
    if (user) {
      const { data: votes } = await supabase
        .from('majlis_votes')
        .select('topic_id')
        .eq('user_id', user.id);
      votedTopicIds = new Set(votes?.map((v: any) => v.topic_id) || []);
    }

    const formattedTopics = (topics || []).map((t: any) => ({
      ...t,
      creator_name: profileMap.get(t.created_by) || "Anonim",
      has_voted: votedTopicIds.has(t.id),
    }));

    return NextResponse.json({ status: "success", message: "Topics retrieved", data: formattedTopics });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message, data: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Sesi login tidak valid. Silakan login kembali.", data: null },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action || "create_topic";

    // Create Admin Client using service role key directly (no cookies)
    // This properly bypasses RLS for server-side operations
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ==========================================
    // ACTION 1: CREATE TOPIC
    // ==========================================
    if (action === "create_topic") {
      const title = (body.title || "").trim();
      const description = (body.description || "").trim();

      if (title.length < 5) {
        return NextResponse.json(
          { status: "error", message: "Judul mosi minimal 5 karakter.", data: null },
          { status: 400 }
        );
      }

      if (description.length < 10) {
        return NextResponse.json(
          { status: "error", message: "Deskripsi mosi minimal 10 karakter.", data: null },
          { status: 400 }
        );
      }

      const { data: newTopic, error: insertError } = await adminSupabase
        .from("majlis_topics")
        .insert([
          {
            title,
            description,
            created_by: user.id,
            status: "Open",
            votes_setuju: 0,
            votes_tidak_setuju: 0,
          },
        ])
        .select("*")
        .single();

      if (insertError) {
        console.error("Majlis Topic Insert Error:", insertError);
        return NextResponse.json(
          { status: "error", message: "Gagal menyimpan mosi: " + insertError.message, data: null },
          { status: 500 }
        );
      }

      // Fetch creator name
      const { data: creatorProfile } = await adminSupabase
        .from("profiles")
        .select("nama_panggilan")
        .eq("id", user.id)
        .single();

      const creatorName = creatorProfile?.nama_panggilan || "Anonim";

      // Add Prestise Points (15 points for submitting a topic)
      await addPrestise(adminSupabase as any, user.id, "MAJLIS_TOPIC", 15);

      // Log Activity
      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Ajukan Mosi Majlis",
          details: `Mengajukan mosi: "${title.substring(0, 40)}..."`,
        },
      ]);

      return NextResponse.json({
        status: "success",
        message: "Mosi berhasil diajukan ke forum Majlis Syura.",
        data: {
          ...newTopic,
          creator_name: creatorName,
          has_voted: false,
        },
      });
    }

    // ==========================================
    // ACTION 2: VOTE ON TOPIC
    // ==========================================
    if (action === "vote") {
      const { topic_id, vote_type } = body;

      if (!topic_id || !["Setuju", "Tidak Setuju"].includes(vote_type)) {
        return NextResponse.json(
          { status: "error", message: "Pilihan suara tidak valid.", data: null },
          { status: 400 }
        );
      }

      // Check if topic is still open
      const { data: topic, error: topicError } = await adminSupabase
        .from("majlis_topics")
        .select("*")
        .eq("id", topic_id)
        .single();

      if (topicError || !topic) {
        return NextResponse.json(
          { status: "error", message: "Mosi tidak ditemukan.", data: null },
          { status: 404 }
        );
      }

      if (topic.status === "Closed") {
        return NextResponse.json(
          { status: "error", message: "Sesi voting untuk mosi ini telah ditutup.", data: null },
          { status: 400 }
        );
      }

      // Insert vote
      const { error: voteError } = await adminSupabase
        .from("majlis_votes")
        .insert([
          {
            topic_id,
            user_id: user.id,
            vote_type,
          },
        ]);

      if (voteError) {
        if (voteError.code === "23505") {
          return NextResponse.json(
            { status: "error", message: "Anda sudah memberikan suara pada mosi ini.", data: null },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { status: "error", message: "Gagal merekam suara: " + voteError.message, data: null },
          { status: 500 }
        );
      }

      // Recalculate vote counts
      const newSetuju = vote_type === "Setuju" ? (topic.votes_setuju || 0) + 1 : (topic.votes_setuju || 0);
      const newTidak = vote_type === "Tidak Setuju" ? (topic.votes_tidak_setuju || 0) + 1 : (topic.votes_tidak_setuju || 0);

      await adminSupabase
        .from("majlis_topics")
        .update({
          votes_setuju: newSetuju,
          votes_tidak_setuju: newTidak,
        })
        .eq("id", topic_id);

      // Log Activity
      await adminSupabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Vote Majlis",
          details: `Memberikan suara '${vote_type}' pada mosi`,
        },
      ]);

      return NextResponse.json({
        status: "success",
        message: "Suara Anda berhasil direkam.",
        data: {
          topic_id,
          votes_setuju: newSetuju,
          votes_tidak_setuju: newTidak,
          has_voted: true,
        },
      });
    }

    // ==========================================
    // ACTION 3: CLOSE TOPIC
    // ==========================================
    if (action === "close_topic") {
      const { topic_id } = body;

      const { data: topic, error: topicError } = await adminSupabase
        .from("majlis_topics")
        .select("*")
        .eq("id", topic_id)
        .single();

      if (topicError || !topic) {
        return NextResponse.json(
          { status: "error", message: "Mosi tidak ditemukan.", data: null },
          { status: 404 }
        );
      }

      // Check permissions (creator or admin)
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdmin = profile?.role === "admin";
      const isCreator = topic.created_by === user.id;

      if (!isAdmin && !isCreator) {
        return NextResponse.json(
          { status: "error", message: "Hanya pembuat mosi atau admin yang dapat menutup voting.", data: null },
          { status: 403 }
        );
      }

      const { error: closeError } = await adminSupabase
        .from("majlis_topics")
        .update({ status: "Closed" })
        .eq("id", topic_id);

      if (closeError) {
        return NextResponse.json(
          { status: "error", message: "Gagal menutup sesi voting: " + closeError.message, data: null },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: "success",
        message: "Sesi voting mosi berhasil ditutup.",
        data: { topic_id, status: "Closed" },
      });
    }

    return NextResponse.json(
      { status: "error", message: "Aksi tidak dikenali.", data: null },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Majlis API Error:", err);
    return NextResponse.json(
      { status: "error", message: err.message || "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}
