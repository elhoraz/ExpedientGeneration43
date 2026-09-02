CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lounge ON public.chat_messages(is_lounge, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_personal ON public.chat_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_oracle_visions_user ON public.oracle_visions(user_id, unlock_date);
CREATE INDEX IF NOT EXISTS idx_majlis_votes_unique ON public.majlis_votes(topic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON public.profiles(tanggal_lahir);
