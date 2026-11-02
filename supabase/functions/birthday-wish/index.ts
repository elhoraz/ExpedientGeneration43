// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 100% PURE PASSIVE MODE: Pengiriman cold japri massal dilarang demi keamanan anti-ban Meta
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Outbound automated birthday WhatsApp DMs are disabled for Meta Anti-Ban safety (100% Passive Mode)." 
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
