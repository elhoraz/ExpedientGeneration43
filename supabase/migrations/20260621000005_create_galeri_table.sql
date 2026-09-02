-- Create Galeri Table
CREATE TABLE IF NOT EXISTS public.galeri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.galeri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view galeri" ON public.galeri FOR SELECT USING (true);
-- Admin can manage galeri
CREATE POLICY "Admin can manage galeri" ON public.galeri 
FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
