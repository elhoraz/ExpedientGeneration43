const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const tokenMatch = envContent.match(/^GITHUB_TOKEN=([^\r\n]+)/m);
  const token = (process.env.GITHUB_TOKEN || (tokenMatch ? tokenMatch[1] : '')).trim().replace(/^["']|["']$/g, '');

  if (!token) {
    console.error('GITHUB_TOKEN not found in process.env or .env.local');
    process.exit(1);
  }

  const repo = 'elhoraz/ExpedientGeneration43';
  const tag = 'v1.2.4';
  const assetName = 'Expedient43-v1.2.4.apk';
  const releaseName = 'Expedient Generation 43 v1.2.4 (Build 6 · Performa, Sinkronisasi Cloud & Stabilitas)';
  const apkPath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

  if (!fs.existsSync(apkPath)) {
    console.error('APK file not found at:', apkPath);
    process.exit(1);
  }

  const apkStats = fs.statSync(apkPath);
  console.log(`Uploading APK: ${apkPath} (${(apkStats.size / (1024 * 1024)).toFixed(2)} MB)`);

  const authCheck = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'ExpedientReleaseScript',
    },
  });
  if (!authCheck.ok) {
    console.error(`GITHUB_TOKEN rejected by GitHub API (${authCheck.status}). Provide a fresh PAT with repo scope in .env.local or GITHUB_TOKEN env.`);
    process.exit(1);
  }

  console.log(`Checking if release ${tag} already exists...`);
  let releaseId;
  const listRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'ExpedientReleaseScript',
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!listRes.ok) {
    console.error('Failed to list releases:', listRes.status, await listRes.text());
    process.exit(1);
  }
  const releases = await listRes.json();
  const existing = Array.isArray(releases) ? releases.find((r) => r.tag_name === tag) : null;

  if (existing) {
    console.log(`Release ${tag} already exists (ID: ${existing.id}).`);
    releaseId = existing.id;
    const existingAsset = existing.assets.find((a) => a.name === assetName);
    if (existingAsset) {
      console.log(`Asset ${assetName} already exists (ID: ${existingAsset.id}), deleting first to replace...`);
      const delRes = await fetch(`https://api.github.com/repos/${repo}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ExpedientReleaseScript',
        },
      });
      if (!delRes.ok) {
        console.error('Failed to delete old asset:', delRes.status, await delRes.text());
        process.exit(1);
      }
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
        body: [
          '### Expedient Generation 43 v1.2.4 (Build 6) Official Release',
          '',
          '- 🔒 **Pembaruan Wajib & Proteksi Versi Lama**: Aplikasi versi lama (Build <= 5) diarahkan memperbarui ke v1.2.4 agar sinkronisasi & fitur terbaru berjalan penuh.',
          '- 🔙 **Perbaikan Navigasi Tombol Back Android**: Callback Back pada halaman offline & dialog/modal kini berfungsi konsisten.',
          '- ⚡ **Optimasi Performa, Sinkronisasi Ibadah Cloud & Perbaikan Radar 3D/Oracle**: Pembaruan menyeluruh antarmuka web dan stabilitas native WebView.',
        ].join('\n'),
        draft: false,
        prerelease: false,
      }),
    });

    if (!createRes.ok) {
      console.error('Failed to create release:', createRes.status, await createRes.text());
      process.exit(1);
    }

    const newRelease = await createRes.json();
    releaseId = newRelease.id;
    console.log(`Release created successfully with ID: ${releaseId}`);
  }

  console.log(`Uploading ${assetName} to release ${releaseId}...`);
  const fileStream = fs.readFileSync(apkPath);

  const uploadRes = await fetch(
    `https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`,
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
    console.error('Failed to upload asset:', uploadRes.status, await uploadRes.text());
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
