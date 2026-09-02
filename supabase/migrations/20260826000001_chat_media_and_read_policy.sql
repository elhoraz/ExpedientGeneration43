-- Migration: Add media columns and receiver update policy for chat_messages

-- 1. Add audio_url, video_url, message_type
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';

-- 2. Add UPDATE policy for receiver to update is_read
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Receivers can update read status'
    ) THEN
        CREATE POLICY "Receivers can update read status"
        ON public.chat_messages FOR UPDATE
        USING (auth.uid() = receiver_id);
    END IF;
END $$;
