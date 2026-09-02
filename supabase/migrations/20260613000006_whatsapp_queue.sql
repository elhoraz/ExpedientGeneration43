CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
    id SERIAL PRIMARY KEY,
    no_whatsapp VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.whatsapp_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage whatsapp queue" 
    ON public.whatsapp_queue FOR ALL 
    USING (true)
    WITH CHECK (true);
