const fs = require('fs');
const path = require('path');

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const tokenMatch = envContent.match(/GITHUB_TOKEN=([^\r\n]+)/);
  if (!tokenMatch) {
    console.error('GITHUB_TOKEN not found in .env.local');
    process.exit(1);
  }
  const token = tokenMatch[1].trim();
  const repo = 'elhoraz/ExpedientGeneration43';
  const tag = 'v1.2.2';
  const releaseName = 'Expedient Generation 43 v1.2.2 (Pembaruan Adzan Mode Hening)';
  const apkPath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

  if (!fs.existsSync(apkPath)) {
    console.error('APK file not found at:', apkPath);
    process.exit(1);
  }

  const apkStats = fs.statSync(apkPath);
  console.log(`Uploading APK: ${apkPath} (${(apkStats.size / (1024 * 1024)).toFixed(2)} MB)`);

  // 1. Create or get release
  console.log(`Checking if release ${tag} already exists...`);
  let releaseId;
  const listRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'ExpedientReleaseScript',
      Accept: 'application/vnd.github.v3+json',
    },
  });
  const releases = await listRes.json();
  const existing = Array.isArray(releases) ? releases.find((r) => r.tag_name === tag) : null;

  if (existing) {
    console.log(`Release ${tag} already exists (ID: ${existing.id}).`);
    releaseId = existing.id;
    // Check if asset already exists
    const existingAsset = existing.assets.find((a) => a.name === 'Expedient43-v1.2.2.apk');
    if (existingAsset) {
      console.log(`Asset Expedient43-v1.2.2.apk already exists (ID: ${existingAsset.id}), deleting first to replace...`);
      await fetch(`https://api.github.com/repos/${repo}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ExpedientReleaseScript',
        },
      });
      console.log('Old asset deleted.');
    }
  } else {
    console.log(`Creating release ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'ExpedientReleaseScript',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_name: tag,
        name: releaseName,
        body: `### Expedient Generation 43 v1.2.2 (Build 4) Official Release\n\n- 🔇 **Penyesuaian Adzan Cerdas (Mode Hening & Getar)**: Suara adzan otomatis tidak berbunyi ketika smartphone dalam profil Diam (Silent) atau Bergetar (Vibrate). Notifikasi visual tetap hadir dengan getaran lembut tanpa mengganggu suasana hening/rapat.\n- 🔊 **Mode Normal Sempurna**: Saat smartphone dalam profil normal, layar tetap otomatis menyala dan kumandang adzan tetap bersuara merdu disertai tombol "⏹ Hentikan Adzan".\n- 🛡️ **Pencegahan Double Audio**: Sinkronisasi audio latar depan web dan native player untuk mencegah adzan bertumpuk.\n- 🚀 **Perbaikan Navigasi & Auto-Update Terkini**.`,
        draft: false,
        prerelease: false,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Failed to create release:', createRes.status, err);
      process.exit(1);
    }

    const newRelease = await createRes.json();
    releaseId = newRelease.id;
    console.log(`Release created successfully with ID: ${releaseId}`);
  }

  // 2. Upload asset
  console.log(`Uploading Expedient43-v1.2.2.apk to release ${releaseId}...`);
  const fileStream = fs.readFileSync(apkPath);

  const uploadRes = await fetch(
    `https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=Expedient43-v1.2.2.apk`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'ExpedientReleaseScript',
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': apkStats.size.toString(),
      },
      body: fileStream,
    }
  );

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text();
    console.error('Failed to upload asset:', uploadRes.status, uploadErr);
    process.exit(1);
  }

  const assetData = await uploadRes.json();
  console.log('APK Asset uploaded successfully!');
  console.log('Download URL:', assetData.browser_download_url);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
