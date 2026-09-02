import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Check authorization header for cron jobs
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch pending emails
    const { data: queue, error } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lt('attempts', 3)
      .limit(10);

    if (error || !queue) {
      return NextResponse.json({ error: error?.message || 'No queue found' }, { status: 500 });
    }

    const processedIds = [];

    for (const email of queue) {
      try {
        // Mark as processing
        await supabase
          .from('email_queue')
          .update({ status: 'processing', attempts: (email.attempts || 0) + 1 })
          .eq('id', email.id);

        // Send email via configured provider (Resend or dev logger)
        await sendEmail({
          to: email.recipient_email,
          subject: email.subject,
          body: email.body_html || "",
          html: email.body_html || undefined,
        });

        // Mark as sent
        await supabase
          .from('email_queue')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', email.id);
          
        processedIds.push(email.id);

      } catch (err: any) {
        console.error(`Failed to send email to ${email.recipient_email}:`, err);
        await supabase.from('email_queue').update({ 
          status: 'failed', 
          error_message: err.message || 'Unknown send error',
          updated_at: new Date().toISOString() 
        }).eq('id', email.id);
      }
    }

    return NextResponse.json({ processed: processedIds.length, ids: processedIds });

  } catch (error: any) {
    console.error("Queue process error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
