import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

describe('ARC-01: Dynamic Code Splitting for Heavy Libraries', () => {
  it('MUST use next/dynamic with ssr: false in RadarDynamic.tsx and render in radar/page.tsx', () => {
    const radarDyn = fs.readFileSync(path.join(projectRoot, 'src/app/(dashboard)/radar/RadarDynamic.tsx'), 'utf-8');
    assert.match(radarDyn, /import\s+dynamic\s+from\s+["']next\/dynamic["']/);
    assert.match(radarDyn, /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\(\s*["']\.\/RadarClient["']\s*\)/);
    assert.match(radarDyn, /ssr:\s*false/);

    const radarPage = fs.readFileSync(path.join(projectRoot, 'src/app/(dashboard)/radar/page.tsx'), 'utf-8');
    assert.match(radarPage, /import\s+RadarDynamic\s+from\s+["']\.\/RadarDynamic["']/);
  });

  it('MUST use next/dynamic with ssr: false in PhotoboothDynamic.tsx and render in photobooth/page.tsx', () => {
    const photoDyn = fs.readFileSync(path.join(projectRoot, 'src/app/(dashboard)/photobooth/PhotoboothDynamic.tsx'), 'utf-8');
    assert.match(photoDyn, /import\s+dynamic\s+from\s+["']next\/dynamic["']/);
    assert.match(photoDyn, /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\(\s*["']\.\/PhotoboothClient["']\s*\)/);
    assert.match(photoDyn, /ssr:\s*false/);

    const photoPage = fs.readFileSync(path.join(projectRoot, 'src/app/(dashboard)/photobooth/page.tsx'), 'utf-8');
    assert.match(photoPage, /import\s+PhotoboothDynamic\s+from\s+["']\.\/PhotoboothDynamic["']/);
  });

  it('MUST use next/dynamic with ssr: false in OracleDynamic.tsx and render in oracle/page.tsx', () => {
    const oracleDyn = fs.readFileSync(path.join(projectRoot, 'src/app/(standalone)/oracle/OracleDynamic.tsx'), 'utf-8');
    assert.match(oracleDyn, /import\s+dynamic\s+from\s+["']next\/dynamic["']/);
    assert.match(oracleDyn, /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\(\s*["']\.\/OracleClient["']\s*\)/);
    assert.match(oracleDyn, /ssr:\s*false/);

    const oraclePage = fs.readFileSync(path.join(projectRoot, 'src/app/(standalone)/oracle/page.tsx'), 'utf-8');
    assert.match(oraclePage, /import\s+OracleDynamic\s+from\s+["']\.\/OracleDynamic["']/);
  });
});

describe('ARC-02: Modularisasi Giant Component PersonalChatClient', () => {
  it('MUST provide usePersonalChat hook with essential messaging operations', () => {
    const chatHookPath = path.join(projectRoot, 'src/hooks/usePersonalChat.ts');
    assert.equal(fs.existsSync(chatHookPath), true, 'usePersonalChat.ts must exist');
    const hookFile = fs.readFileSync(chatHookPath, 'utf-8');
    assert.match(hookFile, /export\s+function\s+usePersonalChat/);
    assert.match(hookFile, /handleLoadMore/);
    assert.match(hookFile, /sendMessage/);
    assert.match(hookFile, /deleteMessage/);
    assert.match(hookFile, /uploadImage/);
    assert.match(hookFile, /sendVoiceNote/);
    assert.match(hookFile, /sendVideoNote/);
  });

  it('MUST provide useAgoraVideoCall hook with call state and signaling', () => {
    const callHookPath = path.join(projectRoot, 'src/hooks/useAgoraVideoCall.ts');
    assert.equal(fs.existsSync(callHookPath), true, 'useAgoraVideoCall.ts must exist');
    const hookFile = fs.readFileSync(callHookPath, 'utf-8');
    assert.match(hookFile, /export\s+function\s+useAgoraVideoCall/);
    assert.match(hookFile, /call_signal/);
    assert.match(hookFile, /startCall/);
    assert.match(hookFile, /endCall/);
  });

  it('PersonalChatClient.tsx MUST consume custom hooks and keep component modular', () => {
    const clientFile = fs.readFileSync(path.join(projectRoot, 'src/app/(dashboard)/chat/personal/[id]/PersonalChatClient.tsx'), 'utf-8');
    assert.match(clientFile, /import\s+{\s*usePersonalChat\s*}\s+from\s+["']@\/hooks\/usePersonalChat["']/);
    assert.match(clientFile, /import\s+{\s*useAgoraVideoCall\s*}\s+from\s+["']@\/hooks\/useAgoraVideoCall["']/);
    assert.match(clientFile, /usePersonalChat\s*\(/);
    assert.match(clientFile, /useAgoraVideoCall\s*\(/);
  });
});

describe('ARC-03: Trigram Indexing & Directory Query Optimization', () => {
  it('MUST create directory indexes migration with pg_trgm and GIN indexes', () => {
    const migrationPath = path.join(projectRoot, 'supabase/migrations/20260908000001_directory_indexes.sql');
    assert.equal(fs.existsSync(migrationPath), true, 'directory_indexes migration must exist');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    assert.match(sql, /CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+pg_trgm/i);
    assert.match(sql, /USING\s+gin\s*\(\s*nama_lengkap\s+gin_trgm_ops\s*\)/i);
    assert.match(sql, /USING\s+gin\s*\(\s*kota_asal\s+gin_trgm_ops\s*\)/i);
    assert.match(sql, /idx_user_blocks_lookup/i);
  });

  it('MUST filter out blocked users in direktori/page.tsx for UGC safety', () => {
    const dirPage = fs.readFileSync(path.join(projectRoot, 'src/app/(dashboard)/direktori/page.tsx'), 'utf-8');
    assert.match(dirPage, /from\s*\(\s*["']user_blocks["']\s*\)/);
    assert.match(dirPage, /blockedUserIds/);
  });
});

describe('ARC-04: Resilient WhatsApp OTP Failover with Audit Logging', () => {
  it('MUST create otp_resiliency migration with otp_logs table', () => {
    const migrationPath = path.join(projectRoot, 'supabase/migrations/20260908000002_otp_resiliency.sql');
    assert.equal(fs.existsSync(migrationPath), true, 'otp_resiliency migration must exist');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.otp_logs/i);
    assert.match(sql, /fallback_triggered/i);
  });

  it('MUST implement logOtpDelivery and WhatsApp-to-Gmail failover in send-otp route', () => {
    const routeFile = fs.readFileSync(path.join(projectRoot, 'src/app/api/auth/send-otp/route.ts'), 'utf-8');
    assert.match(routeFile, /async\s+function\s+logOtpDelivery/);
    assert.match(routeFile, /status:\s*["']fallback_triggered["']/);
    assert.match(routeFile, /fallback:\s*true/);
  });

  it('MUST offer direct email fallback button in register/page.tsx', () => {
    const regFile = fs.readFileSync(path.join(projectRoot, 'src/app/register/page.tsx'), 'utf-8');
    assert.match(regFile, /Tidak menerima WhatsApp\?\s*Kirim via Email/);
  });
});
