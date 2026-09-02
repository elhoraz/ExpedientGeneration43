-- Menambahkan kolom is_read ke chat_messages
ALTER TABLE public.chat_messages ADD COLUMN is_read BOOLEAN DEFAULT false;
