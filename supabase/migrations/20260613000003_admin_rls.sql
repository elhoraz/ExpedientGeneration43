-- Admin policy for buku_tamu
CREATE POLICY "Admins can manage buku_tamu" 
    ON public.buku_tamu FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Admin policy for chat_messages
CREATE POLICY "Admins can manage chat_messages" 
    ON public.chat_messages FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Admin policy for syndicate
CREATE POLICY "Admins can manage syndicate" 
    ON public.syndicate FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
