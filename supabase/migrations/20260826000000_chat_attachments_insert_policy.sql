-- Add INSERT policy for chat-attachments bucket so authenticated users can upload directly
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-attachments' );
