const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:expedient2026@db.dodcwulqgrhqpbldrlik.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    const query = `
CREATE OR REPLACE FUNCTION award_prestise_points()
RETURNS TRIGGER AS $$
DECLARE
    award_points INTEGER := 0;
    act_name TEXT := '';
    target_user_id UUID := NULL;
BEGIN
    -- Determine activity, points, and which user to credit based on table
    IF TG_TABLE_NAME = 'chat_messages' THEN
        -- Only award for lounge messages
        IF NEW.is_lounge = true AND NEW.sender_id IS NOT NULL THEN
            award_points := 2;
            act_name := 'LOUNGE_CHAT';
            target_user_id := NEW.sender_id;
        ELSE
            RETURN NEW; -- No points for personal chat or messages without sender
        END IF;
    ELSIF TG_TABLE_NAME = 'majlis_topics' THEN
        -- majlis_topics uses 'created_by' column (not sender_id/author_id)
        IF NEW.created_by IS NOT NULL THEN
            award_points := 15;
            act_name := 'MAJLIS_TOPIC';
            target_user_id := NEW.created_by;
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Add Log and update profile if we have a valid user
    IF award_points > 0 AND target_user_id IS NOT NULL THEN
        INSERT INTO prestise_logs (user_id, activity_name, points)
        VALUES (target_user_id, act_name, award_points);

        UPDATE profiles 
        SET prestise_points = COALESCE(prestise_points, 0) + award_points
        WHERE id = target_user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const res = await client.query(query);
    console.log('Trigger fixed successfully:', res);
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

run();
