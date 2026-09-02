CREATE TABLE IF NOT EXISTS public.event_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    ticket_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'scanned', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id),
    UNIQUE(event_id, seat_number)
);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event tickets"
    ON public.event_tickets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own tickets"
    ON public.event_tickets FOR SELECT
    USING (auth.uid() = user_id);
