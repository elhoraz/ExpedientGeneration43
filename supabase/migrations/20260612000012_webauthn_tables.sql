CREATE TABLE IF NOT EXISTS public.user_biometrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports TEXT[] DEFAULT '{}',
    device_type TEXT,
    backed_up BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_biometrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own biometrics" 
    ON public.user_biometrics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometrics" 
    ON public.user_biometrics FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own biometrics" 
    ON public.user_biometrics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own biometrics" 
    ON public.user_biometrics FOR DELETE 
    USING (auth.uid() = user_id);
