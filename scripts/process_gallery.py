import os
import sys
import json
import random
from PIL import Image, ImageOps
import numpy as np

foto_dir = r"c:\Users\LENOVO\angkatan1\expedient-next\FOTO"
out_base = r"c:\Users\LENOVO\angkatan1\expedient-next\public\assets\gallery"
thumb_dir = os.path.join(out_base, "thumb")
disp_dir = os.path.join(out_base, "display")
os.makedirs(thumb_dir, exist_ok=True)
os.makedirs(disp_dir, exist_ok=True)

album_configs = [
    {
        "id": "rihlah",
        "title": "Rihlah & Seminar Angkatan",
        "icon": "fa-solid fa-compass",
        "year": 2024,
        "folders": [
            "Rihlah & seminar -20260922T022841Z-1-003",
            "Rihlah & seminar -20260922T023229Z-1-001",
            "Rihlah & seminar -20260922T023229Z-1-002",
            "Rihlah & seminar -20260922T023229Z-1-003",
        ],
        "target": 60,
        "captions": [
            "Momen Kebersamaan Rihlah Akbar Angkatan 43",
            "Sesi Seminar Motivasi & Refleksi Perjalanan Santri",
            "Tawa & Candatawa di Sepanjang Perjalanan Rihlah",
            "Potret Hangat Para Pejuang Ilmu Expedient 43",
            "Menikmati Senja & Alam Terbuka Bersama Sahabat Seperjuangan",
            "Langkah Bersama Mengukir Sejarah & Ukhuwah Abadi",
            "Diskusi Hangat & Nasehat Berharga dari Asatidz",
            "Kenangan Indah di Tempat Rihlah yang Tak Terlupakan",
            "Semangat Membara Generasi Penerus Peradaban",
            "Jejak Langkah Ukhuwah Fillah Abadan Abada"
        ]
    },
    {
        "id": "galeri_ekspi",
        "title": "Galeri Akbar Expedient",
        "icon": "fa-solid fa-crown",
        "year": 2025,
        "folders": [
            "GALERI EKSPI-20260922T023042Z-1-001",
            "GALERI EKSPI-20260922T023042Z-1-002",
        ],
        "target": 60,
        "captions": [
            "Mahakarya Akbar Angkatan 43 — Expedient Generation",
            "Kebanggaan Bersama Mengharumkan Almamater Tercinta",
            "Detik-detik Menuju Puncak Kelulusan & Pengabdian",
            "Koleksi Foto Resmi & Estetik Santri Angkatan 43",
            "Kharisma & Wibawa Pemimpin Masa Depan",
            "Senyuman Penuh Syukur atas Segala Nikmat & Perjuangan",
            "Formasi Gagah & Kompak Keluarga Besar Expedient",
            "Kilau Prestasi & Pengorbanan Selama di Pesantren",
            "Arsip Emas Kenangan Indah yang Abadi",
            "Doa & Harapan untuk Langkah Baru di Masa Depan"
        ]
    },
    {
        "id": "foto2mu",
        "title": "Momen Santri & Keseharian",
        "icon": "fa-solid fa-camera-retro",
        "year": 2024,
        "folders": [
            "Foto2mu-20260922T022759Z-1-001",
        ],
        "target": 50,
        "captions": [
            "Potret Spontan & Candid Keseharian Santri di Asrama",
            "Hangatnya Kebersamaan Makan & Belajar Bersama",
            "Momen Santai Melepas Lelah Setelah Aktivitas Padat",
            "Tawa Lepas Sahabat Sejati yang Selalu Menguatkan",
            "Saling Menopang dalam Suka dan Duka di Pesantren",
            "Kamera Menangkap Senyum Tulus Para Pejuang",
            "Nostalgia Lorong Asrama & Sudut-sudut Penuh Kenangan",
            "Cerita Sederhana yang Akan Selalu Dirindukan",
            "Wajah-wajah Ikhlas Menuntut Ridho Ilahi",
            "Persaudaraan yang Terjalin Tanpa Sekat"
        ]
    },
    {
        "id": "canon",
        "title": "Dokumentasi Fotografi Canon",
        "icon": "fa-solid fa-camera",
        "year": 2024,
        "folders": [
            "100CANON-20260922T022949Z-1-001",
        ],
        "target": 40,
        "captions": [
            "Bidikan Tajam Lensa Kamera Mengabadikan Momen Emas",
            "Potret Artistik & Detail Sinematik Santri Angkatan 43",
            "Ekspresi Penuh Makna dalam Sorotan Kamera Profesional",
            "Harmoni Cahaya & Komposisi dalam Bingkai Fotografi",
            "Momen Dramatis di Panggung & Arena Kegiatan",
            "Ketajaman Warna & Detil yang Menggetarkan Hati",
            "Sudut Pandang Unik Menangkap Jiwa Pengabdian",
            "Arsip Visual Berkualitas Tinggi untuk Selamanya"
        ]
    },
    {
        "id": "eid_adha",
        "title": "Gema Idul Adha 1445H",
        "icon": "fa-solid fa-kaaba",
        "year": 2024,
        "folders": [
            "Ekspedient eid adha 24-20260922T023219Z-1-001",
        ],
        "target": 35,
        "captions": [
            "Kekompakan Santri dalam Pelaksanaan Ibadah Qurban",
            "Semangat Berbagi & Berkorban di Hari Raya Idul Adha",
            "Gotong Royong & Sukacita Menyiapkan Hidangan Qurban",
            "Senyum Gembira di Hari yang Penuh Keberkahan",
            "Takbir Menggema di Seluruh Sudut Pesantren Arrisalah",
            "Momen Manis Kebersamaan Hari Raya Bersama Teman Santri"
        ]
    }
]

def evaluate_quality(img_path):
    try:
        with Image.open(img_path) as img:
            w, h = img.size
            if w < 500 or h < 500:
                return None, 0
            small = img.convert('RGB').resize((64, 64), Image.Resampling.BOX)
            gray = np.array(small.convert('L'), dtype=np.float32)
            brightness = gray.mean()
            if brightness < 18.0 or brightness > 240.0:
                return None, 0
            lap = np.abs(gray[1:-1, 1:-1] * 4 - gray[:-2, 1:-1] - gray[2:, 1:-1] - gray[1:-1, :-2] - gray[1:-1, 2:])
            sharpness = lap.var()
            if sharpness < 25.0:
                return None, 0
            return (w, h), sharpness
    except Exception:
        return None, 0

def main():
    random.seed(43)
    all_manifest_photos = []
    
    for cfg in album_configs:
        album_id = cfg["id"]
        target_count = cfg["target"]
        print(f"Processing album: {cfg['title']} (Target: {target_count})...")
        
        img_candidates = []
        for fldr in cfg["folders"]:
            full_fldr = os.path.join(foto_dir, fldr)
            if os.path.exists(full_fldr):
                for root, _, files in os.walk(full_fldr):
                    for f in files:
                        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            img_candidates.append(os.path.join(root, f))
        
        img_candidates = sorted(list(set(img_candidates)))
        print(f"  Found {len(img_candidates)} raw candidate images.")
        
        scored_candidates = []
        for p in img_candidates:
            dims, score = evaluate_quality(p)
            if dims is not None:
                scored_candidates.append((p, score, dims))
        
        print(f"  {len(scored_candidates)} candidates passed quality filter.")
        
        if len(scored_candidates) <= target_count:
            selected = scored_candidates
        else:
            step = len(scored_candidates) / float(target_count)
            selected = [scored_candidates[int(i * step)] for i in range(target_count)]
        
        print(f"  Selected {len(selected)} supreme-quality photos for {album_id}. Resizing to WebP...")
        
        captions_pool = cfg["captions"]
        for idx, (img_path, score, (orig_w, orig_h)) in enumerate(selected):
            base_name = f"{album_id}_{idx+1:03d}"
            thumb_file = f"thumb_{base_name}.webp"
            disp_file = f"disp_{base_name}.webp"
            
            thumb_path = os.path.join(thumb_dir, thumb_file)
            disp_path = os.path.join(disp_dir, disp_file)
            
            try:
                with Image.open(img_path) as raw_img:
                    img = ImageOps.exif_transpose(raw_img)
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    
                    disp_img = img.copy()
                    disp_img.thumbnail((1500, 1500), Image.Resampling.LANCZOS)
                    disp_img.save(disp_path, "WEBP", quality=82, method=4)
                    
                    thumb_img = img.copy()
                    thumb_img.thumbnail((540, 540), Image.Resampling.LANCZOS)
                    thumb_img.save(thumb_path, "WEBP", quality=80, method=4)
                
                caption = captions_pool[idx % len(captions_pool)]
                
                all_manifest_photos.append({
                    "id": f"exp-{album_id}-{idx+1:03d}",
                    "album_id": album_id,
                    "album_title": cfg["title"],
                    "thumbnail_url": f"/assets/gallery/thumb/{thumb_file}",
                    "image_url": f"/assets/gallery/display/{disp_file}",
                    "caption": f"{caption} #{idx+1}",
                    "year": cfg["year"],
                    "likes_count": random.randint(18, 64),
                    "uploader_name": "Dokumentasi Expedient 43" if idx % 3 == 0 else ("Tim Media 43" if idx % 3 == 1 else "Santri Arrisalah")
                })
            except Exception as err:
                print(f"  Error processing {img_path}: {err}")
    
    manifest_path = r"c:\Users\LENOVO\angkatan1\expedient-next\src\data\galeri-manifest.json"
    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "total": len(all_manifest_photos),
            "albums": [
                {"id": "all", "title": "Semua Momen", "icon": "fa-solid fa-photo-film", "year": None},
                {"id": "galeri_ekspi", "title": "Galeri Ekspedient", "icon": "fa-solid fa-crown", "year": 2025},
                {"id": "rihlah", "title": "Rihlah & Seminar", "icon": "fa-solid fa-compass", "year": 2024},
                {"id": "foto2mu", "title": "Momen Santri", "icon": "fa-solid fa-camera-retro", "year": 2024},
                {"id": "canon", "title": "Dokumentasi Canon", "icon": "fa-solid fa-camera", "year": 2024},
                {"id": "eid_adha", "title": "Idul Adha 2024", "icon": "fa-solid fa-kaaba", "year": 2024}
            ],
            "photos": all_manifest_photos
        }, f, indent=2, ensure_ascii=False)
    
    print(f"SUCCESS! Processed {len(all_manifest_photos)} photos into WebP.")
    print(f"Manifest written to {manifest_path}.")

if __name__ == "__main__":
    main()
