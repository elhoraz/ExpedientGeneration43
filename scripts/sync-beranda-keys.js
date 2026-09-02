const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const content = fs.readFileSync("src/app/(dashboard)/beranda/BerandaClient.tsx", "utf-8");
    
    // Regex to match t('key', 'value') or t("key", "value") or t('key', `value`)
    // Supports multi-line values and escaped quotes by using lazy match [\s\S]*?
    const regex = /t\s*\(\s*(['"])(beranda_[^'"]+)\1\s*,\s*(['"`])([\s\S]*?)\3\s*\)/g;
    
    let match;
    const extracted = [];
    const newKeysSet = new Set();
    
    while ((match = regex.exec(content)) !== null) {
        const key = match[2];
        let val = match[4];
        
        // Unescape escaped quotes if necessary (simple unescape for now)
        val = val.replace(/\\(["'`])/g, '$1');
        
        extracted.push({ content_key: key, content_value: val, content_type: 'text' });
        newKeysSet.add(key);
    }
    
    console.log(`Extracted ${extracted.length} clean keys from BerandaClient.tsx`);
    
    // 1. Fetch all existing beranda_ keys
    const { data: existing } = await supabase.from('site_content').select('content_key').like('content_key', 'beranda_%');
    
    const keysToDelete = existing.filter(row => !newKeysSet.has(row.content_key)).map(r => r.content_key);
    console.log(`Found ${keysToDelete.length} obsolete/ugly keys to delete.`);
    
    // 2. Delete obsolete keys
    if (keysToDelete.length > 0) {
        // Delete in chunks of 100
        for(let i=0; i<keysToDelete.length; i+=100) {
            const chunk = keysToDelete.slice(i, i+100);
            await supabase.from('site_content').delete().in('content_key', chunk);
        }
        console.log("Deleted obsolete keys.");
    }
    
    // 3. Upsert clean keys
    const uniqueExtracted = [];
    const seen = new Set();
    for (const item of extracted) {
        if (!seen.has(item.content_key)) {
            seen.add(item.content_key);
            uniqueExtracted.push(item);
        }
    }
    
    if (uniqueExtracted.length > 0) {
        for(let i=0; i<uniqueExtracted.length; i+=100) {
            const chunk = uniqueExtracted.slice(i, i+100);
            const { error } = await supabase.from('site_content').upsert(chunk, { onConflict: 'content_key' });
            if (error) {
                console.error("Error upserting chunk:", error);
            }
        }
        console.log("Upserted clean keys successfully.");
    }
}

run().catch(console.error);
