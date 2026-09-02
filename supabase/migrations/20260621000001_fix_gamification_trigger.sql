-- ========================================================================
-- FIX: Gamification Trigger for majlis_topics
-- The previous trigger incorrectly referenced NEW.sender_id and NEW.author_id
-- which don't exist on the majlis_topics table. The correct column is created_by.
-- Chat messages use NEW.sender_id correctly.
-- Since gamification for majlis topics is now handled client-side via addPrestise(),
-- we drop the broken majlis-specific trigger to avoid PG errors.
-- ========================================================================

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
