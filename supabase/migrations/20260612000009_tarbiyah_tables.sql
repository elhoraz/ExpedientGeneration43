CREATE TABLE IF NOT EXISTS public.tarbiyah_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,  -- bisa user_id (mentor) atau syndicate id (tender)
  type TEXT CHECK (type IN ('Mentor', 'Tender')) NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tarbiyah_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" 
  ON public.tarbiyah_requests FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert requests" 
  ON public.tarbiyah_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
