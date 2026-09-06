import * as THREE from 'three';
        import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
        import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

        let is3DReady = false;
        function safeInit() {
            if(is3DReady) return;
            is3DReady = true;
            init3D();
        }
        document.fonts.ready.then(safeInit);
        setTimeout(safeInit, 800); 

        function init3D() {
            const expedientData = window.ExpedientData || {};

            const GOLD = '#d4af37';
            const PURE_GOLD = '#ffd700'; 
            const DARK_BG = '#050505'; 

            const container = document.getElementById('canvas-container');
            const scene = new THREE.Scene();
            
            // FOG
            scene.fog = new THREE.FogExp2(0x020202, 0.015);

            const isMobile = window.innerWidth < 768;
            const camera = new THREE.PerspectiveCamera(isMobile ? 55 : 45, window.innerWidth / window.innerHeight, 0.1, 200);
            camera.position.set(0, 0, isMobile ? 26 : 28); 

            // Renderer Murni (Optimized for Mobile)
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
            renderer.setClearColor( 0x000000, 0 ); 
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1; 
            container.appendChild(renderer.domElement);

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

            // ==========================================
            // LIGHTING 
            // ==========================================
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
            scene.add(ambientLight);

            const spotLight = new THREE.SpotLight(0xffeedd, 120); 
            spotLight.position.set(10, 30, 25);
            spotLight.angle = Math.PI / 4;
            spotLight.penumbra = 0.8;
            spotLight.castShadow = true;
            spotLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
            spotLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
            scene.add(spotLight);

            const rimLight = new THREE.PointLight(PURE_GOLD, 60, 40); 
            rimLight.position.set(-10, -5, 10);
            scene.add(rimLight);

            const cardGlowLight = new THREE.PointLight(0xffaa00, 0, 15);
            cardGlowLight.position.set(0, 0, -2);
            scene.add(cardGlowLight); 

            const mouseLight = new THREE.PointLight(PURE_GOLD, 50, 40);
            mouseLight.position.set(0, 0, -5); 
            scene.add(mouseLight);

            const dustGeo = new THREE.BufferGeometry();
            const dustCount = 150;
            const dustPos = new Float32Array(dustCount * 3);
            for(let i=0; i<dustCount*3; i++) {
                dustPos[i] = (Math.random() - 0.5) * 60;
            }
            dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
            const dustMat = new THREE.PointsMaterial({ color: PURE_GOLD, size: 0.1, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
            const dustParticles = new THREE.Points(dustGeo, dustMat);
            scene.add(dustParticles);

            // ==========================================
            // 1. KINTSUGI MARBLE
            // ==========================================
            function createSeamlessMarbleTexture(isDayMode) {
                const size = 2048; 
                const canvas = document.createElement('canvas');
                canvas.width = size; canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                if (isDayMode) {
                    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size);
                    grad.addColorStop(0, '#ffffff'); 
                    grad.addColorStop(1, '#f2f2f2'); 
                    ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);

                    ctx.globalAlpha = 0.25;
                    ctx.strokeStyle = '#cdd2d6'; ctx.lineWidth = 12;
                    for(let i=0; i<30; i++) {
                        ctx.beginPath(); ctx.moveTo(Math.random()*size, 0);
                        for(let j=0; j<8; j++) ctx.lineTo(Math.random()*size, (j+1)*300);
                        ctx.stroke();
                    }
                } else {
                    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size);
                    grad.addColorStop(0, '#032417');
                    grad.addColorStop(1, '#010a06'); 
                    ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);

                    ctx.globalAlpha = 0.2;
                    ctx.strokeStyle = '#084d33'; ctx.lineWidth = 4;
                    for(let i=0; i<50; i++) {
                        ctx.beginPath(); ctx.moveTo(Math.random()*size, 0);
                        for(let j=0; j<8; j++) ctx.lineTo(Math.random()*size, (j+1)*300);
                        ctx.stroke();
                    }
                }

                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 20; 
                ctx.shadowColor = isDayMode ? 'rgba(0,0,0,0.1)' : PURE_GOLD; 
                ctx.strokeStyle = isDayMode ? '#d4af37' : PURE_GOLD; 
                ctx.lineWidth = isDayMode ? 4 : 6;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';

                for(let i=0; i<15; i++) {
                    ctx.beginPath(); let x = Math.random()*size, y = Math.random()*size; ctx.moveTo(x, y);
                    for(let j=0; j<12; j++) {
                        x += (Math.random()-0.5)*500; y += Math.random()*300; ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }

                const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return tex;
            }

            const marbleGroup = new THREE.Group(); marbleGroup.position.set(0, 0, -10); 
            
            const nightMarbleMat = new THREE.MeshPhysicalMaterial({ map: createSeamlessMarbleTexture(false), metalness: 0.15, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, color: 0xffffff, transparent: true, opacity: 1.0 });
            const nightMarbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), nightMarbleMat); nightMarbleMesh.receiveShadow = true; marbleGroup.add(nightMarbleMesh);

            const dayMarbleMat = new THREE.MeshPhysicalMaterial({ map: createSeamlessMarbleTexture(true), metalness: 0.1, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02, color: 0xffffff, transparent: true, opacity: 0.0 });
            const dayMarbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), dayMarbleMat); dayMarbleMesh.position.z = 0.1; dayMarbleMesh.receiveShadow = true; marbleGroup.add(dayMarbleMesh);

            scene.add(marbleGroup);

            // ==========================================
            // THE HARDWARE (Hook)
            // ==========================================
            const anchorPos = new THREE.Vector3(0, 11, -6);
            const mountGroup = new THREE.Group(); mountGroup.position.copy(anchorPos); 
            
            const mountBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 64), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.2 }));
            mountBase.rotation.x = Math.PI / 2; mountBase.position.z = -0.5; mountBase.receiveShadow = true; mountGroup.add(mountBase);

            const mountRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 16, 32), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1.0, roughness: 0.1 }));
            mountRing.rotation.y = Math.PI / 2; mountRing.castShadow = true; mountGroup.add(mountRing);
            scene.add(mountGroup);

            const lanyardMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.3 });

            // ==========================================
            // CARD TEXTURE GENERATORS
            // ==========================================
            function drawRealisticSmartChip(ctx, x, y, w, h, r, isBump) {
                if (!isBump) {
                    const grad = ctx.createLinearGradient(x, y, x+w, y+h);
                    grad.addColorStop(0, '#f9d976'); grad.addColorStop(0.5, '#d4af37'); grad.addColorStop(1, '#a67c00');
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = '#ffffff'; 
                }
                ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();

                ctx.strokeStyle = isBump ? '#000000' : 'rgba(80, 50, 0, 0.6)'; 
                ctx.lineWidth = 3;
                
                ctx.beginPath(); ctx.roundRect(x+6, y+6, w-12, h-12, r-4); ctx.stroke();
                
                const cx = x+w/2, cy = y+h/2;
                ctx.beginPath(); ctx.ellipse(cx, cy, w*0.2, h*0.25, 0, 0, Math.PI*2); ctx.stroke();
                
                ctx.beginPath(); ctx.moveTo(x+6, cy-15); ctx.lineTo(cx-w*0.2, cy-15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x+6, cy+15); ctx.lineTo(cx-w*0.2, cy+15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x+w-6, cy-15); ctx.lineTo(cx+w*0.2, cy-15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x+w-6, cy+15); ctx.lineTo(cx+w*0.2, cy+15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, y+6); ctx.lineTo(cx, cy-h*0.25); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, y+h-6); ctx.lineTo(cx, cy+h*0.25); ctx.stroke();
            }

            function drawBrushedMetalMain(ctx, w, h) {
                ctx.fillStyle = DARK_BG; ctx.fillRect(0, 0, w, h);
                ctx.globalAlpha = 0.03;
                for(let i=0; i<w; i+=2) { ctx.fillStyle = Math.random() > 0.5 ? '#222222' : '#000000'; ctx.fillRect(i, 0, 1, h); }
                ctx.globalAlpha = 1.0;
                const grd = ctx.createRadialGradient(w/2, h/2, 200, w/2, h/2, w);
                grd.addColorStop(0, 'transparent'); grd.addColorStop(1, 'rgba(0,0,0,0.9)');
                ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
            }

            // === FUNGSI BANTUAN ANTI-TERBALIK ===
            // Berfungsi untuk mengkalibrasi UV Mapping dari Canvas ke RoundedBoxGeometry
            function kalibrasiUV(texture, isBump) {
                texture.flipY = false; // Memperbaiki orientasi yang terbalik (upside down) secara vertikal
                texture.wrapS = THREE.RepeatWrapping; 
                texture.repeat.x = -1; // Memperbaiki orientasi teks yang terbalik kiri-kanan (mirrored)
                if (!isBump) texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                return texture;
            }

            function createFrontTexture(isBump = false) {
                const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1624;
                const ctx = canvas.getContext('2d');
                
                if (isBump) { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height); } 
                else { drawBrushedMetalMain(ctx, canvas.width, canvas.height); }

                ctx.fillStyle = isBump ? '#888888' : GOLD;
                ctx.fillRect(40, 0, 12, canvas.height); ctx.fillRect(60, 0, 2, canvas.height);

                ctx.save(); ctx.translate(140, 1500); ctx.rotate(-Math.PI / 2);
                ctx.fillStyle = isBump ? '#ffffff' : 'rgba(212,175,55,0.15)'; 
                ctx.font = '900 130px "Playfair Display", serif'; ctx.letterSpacing = '20px';
                ctx.fillText('EXPEDIENT', 0, 0); ctx.restore();

                drawRealisticSmartChip(ctx, 160, 160, 120, 100, 15, isBump);

                if (isBump) {
                    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(820, 200, 70, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(820, 200, 65, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                } else {
                    const hGrad = ctx.createLinearGradient(700, 100, 900, 300);
                    hGrad.addColorStop(0, '#d4af37'); hGrad.addColorStop(0.5, '#fff'); hGrad.addColorStop(1, '#d4af37');
                    ctx.fillStyle = hGrad; ctx.beginPath(); ctx.arc(820, 200, 70, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = DARK_BG; ctx.beginPath(); ctx.arc(820, 200, 65, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = GOLD;
                }
                ctx.font = 'bold 50px "Playfair Display", serif'; ctx.textAlign = 'center'; ctx.fillText('VVIP', 820, 215); ctx.textAlign = 'left';

                const photoX = 160; const photoY = 400; const photoW = 760; const photoH = 650;
                ctx.strokeStyle = isBump ? '#888888' : 'rgba(212,175,55,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(photoX, photoY, photoW, photoH);
                
                if (!isBump) {
                    const glass = ctx.createLinearGradient(photoX, photoY, photoX+photoW, photoY+photoH);
                    glass.addColorStop(0, 'rgba(255,255,255,0.05)'); glass.addColorStop(1, 'rgba(0,0,0,0.5)');
                    ctx.fillStyle = glass; ctx.fillRect(photoX, photoY, photoW, photoH);
                }
                
                ctx.strokeStyle = isBump ? '#ffffff' : GOLD; ctx.lineWidth = 4; const size = 30;
                ctx.beginPath(); ctx.moveTo(photoX, photoY+size); ctx.lineTo(photoX, photoY); ctx.lineTo(photoX+size, photoY); ctx.stroke(); 
                ctx.beginPath(); ctx.moveTo(photoX+photoW-size, photoY); ctx.lineTo(photoX+photoW, photoY); ctx.lineTo(photoX+photoW, photoY+size); ctx.stroke(); 

                if (!isBump) {
                    ctx.fillStyle = '#1a2228';
                    ctx.beginPath(); ctx.arc(540, 650, 120, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(540, 1050, 280, Math.PI, 0); ctx.fill();
                }

                if (isBump) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 1; }

                ctx.fillStyle = isBump ? '#ffffff' : '#ffffff'; ctx.font = 'bold 65px "Playfair Display", serif';
                ctx.fillText(expedientData.nama.toUpperCase(), 160, 1180, 760);
                
                ctx.fillStyle = isBump ? '#ffffff' : GOLD; ctx.font = '600 30px "Inter", sans-serif'; ctx.letterSpacing = '5px';
                ctx.fillText(expedientData.jabatan.toUpperCase(), 160, 1240, 760);

                if (isBump) ctx.shadowBlur = 0; 

                ctx.fillStyle = isBump ? '#888888' : 'rgba(212,175,55,0.3)'; ctx.fillRect(160, 1300, 760, 2);

                if (isBump) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 1; } 

                ctx.fillStyle = isBump ? '#ffffff' : '#8b9ba8'; ctx.font = '400 28px monospace'; ctx.letterSpacing = '2px';
                ctx.fillText('ID: ' + expedientData.nomor_id, 160, 1380);
                ctx.fillText(expedientData.exp, 160, 1430);

                if (isBump) ctx.shadowBlur = 0;

                if (!isBump) {
                    ctx.fillStyle = '#ffffff';
                    for(let i=0; i<30; i++) {
                        const bw = Math.random() * 8 + 2; ctx.fillRect(720 + (i*8), 1350, bw, 80);
                    }
                }

                return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
            }

            function createBackTexture(isBump = false) {
                const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1624; const ctx = canvas.getContext('2d');
                if (isBump) { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height); } else { drawBrushedMetalMain(ctx, canvas.width, canvas.height); }

                ctx.fillStyle = isBump ? '#111111' : '#000000'; ctx.fillRect(0, 150, 1024, 250);
                ctx.strokeStyle = isBump ? '#444444' : '#222'; ctx.lineWidth = 5; ctx.strokeRect(0, 150, 1024, 250);

                if (isBump) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 1; } 

                ctx.fillStyle = isBump ? '#ffffff' : GOLD; ctx.textAlign = 'center'; ctx.font = 'bold 45px "Playfair Display", serif';
                ctx.fillText('THE REGISTRY DIRECTIVE', 512, 550);

                if (isBump) ctx.shadowBlur = 0;

                ctx.fillStyle = isBump ? '#ffffff' : GOLD; ctx.fillRect(400, 580, 224, 2);

                ctx.fillStyle = isBump ? '#aaaaaa' : '#8b9ba8'; ctx.font = '300 28px "Inter", sans-serif';
                const lines = [
                    "Properti VVIP Eksklusif Expedient Generation.",
                    "Kartu ini menyimpan data terenkripsi untuk",
                    "akses tanpa batas ke dalam ekosistem The Vault.",
                    "Penyalahgunaan akan dikenakan sanksi dewan."
                ];
                lines.forEach((line, i) => ctx.fillText(line, 512, 680 + (i * 45)));

                ctx.strokeStyle = isBump ? '#ffffff' : GOLD; ctx.lineWidth = 8; ctx.strokeRect(342, 1030, 340, 340);
                ctx.fillStyle = isBump ? '#ffffff' : GOLD; ctx.fillRect(320, 1010, 40, 10); ctx.fillRect(320, 1010, 10, 40); 

                ctx.fillStyle = isBump ? '#aaaaaa' : '#444'; ctx.font = '400 20px monospace';
                ctx.fillText('SCAN FOR OMNIPRESENCE VERIFICATION', 512, 1420);

                return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
            }

            function createKTAFrontTexture(isBump = false) {
                const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = isBump ? '#000000' : '#050505'; ctx.fillRect(0,0,1024,640);
                ctx.strokeStyle = isBump ? '#444444' : '#151515'; ctx.lineWidth = 4;
                for(let i=-200; i<1200; i+=60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i+400, 640); ctx.stroke(); }

                drawRealisticSmartChip(ctx, 100, 50, 100, 80, 10, isBump);

                if (isBump) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 1; }

                ctx.fillStyle = isBump ? '#ffffff' : '#d4af37'; ctx.font = 'bold 36px "Playfair Display", serif'; ctx.letterSpacing = '10px';
                ctx.fillText('EXPEDIENT', 100, 180);
                
                if (isBump) ctx.shadowBlur = 0;

                ctx.fillStyle = isBump ? '#aaaaaa' : '#666'; ctx.font = '22px monospace'; ctx.letterSpacing = '5px';
                ctx.fillText('VVIP ACCESS PLATINUM', 100, 230);

                if (!isBump) {
                    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)'; ctx.beginPath(); ctx.arc(800, 320, 250, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(800, 320, 245, 0, Math.PI*2); ctx.stroke();
                } else {
                    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(800, 320, 250, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#555'; ctx.beginPath(); ctx.arc(800, 320, 245, 0, Math.PI*2); ctx.stroke();
                }

                if (isBump) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 1; }

                ctx.fillStyle = isBump ? '#ffffff' : '#ffffff'; ctx.font = 'bold 45px "Inter", sans-serif'; ctx.letterSpacing = '3px';
                
                // MaxWidth diatur agar nama tidak pernah menyentuh foto lingkaran
                ctx.fillText(expedientData.nama.toUpperCase(), 100, 530, 435);
                
                ctx.fillStyle = isBump ? '#ffffff' : '#d4af37'; ctx.font = '30px monospace';
                ctx.fillText(expedientData.nomor_id, 100, 580, 435); 

                if (isBump) ctx.shadowBlur = 0;

                return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
            }

            function createKTABackTexture(isBump = false) {
                const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640;
                const ctx = canvas.getContext('2d');
                
                if (isBump) { ctx.fillStyle = '#000000'; ctx.fillRect(0,0,1024,640); } 
                else { drawBrushedMetalMain(ctx, 1024, 640); }
                
                ctx.fillStyle = isBump ? '#111111' : '#000000'; ctx.fillRect(0, 100, 1024, 120);
                
                if (isBump) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 1; }
                
                ctx.fillStyle = isBump ? '#ffffff' : '#d4af37'; ctx.font = 'bold 30px "Playfair Display", serif'; ctx.textAlign = 'left';
                ctx.fillText('THE VAULT AUTHORIZATION', 80, 320);

                if (isBump) ctx.shadowBlur = 0;

                ctx.fillStyle = isBump ? '#aaaaaa' : '#666'; ctx.font = '22px "Inter", sans-serif';
                ctx.fillText('If found, return immediately to the Expedient Council.', 80, 380);
                ctx.fillText('Unauthorized use will be prosecuted.', 80, 420);

                return kalibrasiUV(new THREE.CanvasTexture(canvas), isBump);
            }

            const texFront = createFrontTexture(false); const bumpFront = createFrontTexture(true); 
            const texBack = createBackTexture(false); const bumpBack = createBackTexture(true);   
            const kFrontTex = createKTAFrontTexture(false); const kFrontBump = createKTAFrontTexture(true);
            const kBackTex = createKTABackTexture(false);   const kBackBump = createKTABackTexture(true);

            const cardMaterialProps = isMobile ? {
                roughness: 0.3,
                metalness: 0.5,
                bumpScale: 0.015
            } : { 
                roughness: 0.15, 
                metalness: 0.6, 
                clearcoat: 1.0, 
                clearcoatRoughness: 0.1,
                iridescence: 0.8, 
                iridescenceIOR: 1.5,
                iridescenceThicknessRange: [100, 400],
                bumpScale: 0.015 
            };

            const goldEdgeMaterial = new THREE.MeshStandardMaterial({ 
                color: PURE_GOLD, 
                metalness: 1.0, 
                roughness: 0.15 
            });
            
            const materials = [
                goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, 
                new THREE.MeshPhysicalMaterial({ map: texFront, bumpMap: bumpFront, ...cardMaterialProps }),
                new THREE.MeshPhysicalMaterial({ map: texBack, bumpMap: bumpBack, ...cardMaterialProps })
            ];

            // ==========================================
            // ID CARD & LANYARD
            // ==========================================
            const cardWidth = 5.4; const cardHeight = 8.6; const cardDepth = 0.12; 
            
            const idCardGeo = new RoundedBoxGeometry(cardWidth, cardHeight, cardDepth, 24, 0.3);
            const idCard = new THREE.Mesh(idCardGeo, materials);
            idCard.position.set(0, 10, 0); idCard.castShadow = true; scene.add(idCard);

            const clipGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32); clipGeo.rotateZ(Math.PI / 2);
            const clipMat = new THREE.MeshStandardMaterial({ color: PURE_GOLD, metalness: 1.0, roughness: 0.2 });
            const metalClip = new THREE.Mesh(clipGeo, clipMat);
            metalClip.position.set(0, cardHeight / 2 + 0.1, 0); metalClip.castShadow = true;
            idCard.add(metalClip);

            const stringLength = 11.5; 
            const restPos = new THREE.Vector3(0, anchorPos.y - stringLength, 0); 
            
            let lanyardMesh = null;

            function updateLanyardGeometry() {
                const clipGlobalPos = new THREE.Vector3(0, cardHeight/2 + 0.3, 0);
                idCard.localToWorld(clipGlobalPos);
                const dist = anchorPos.distanceTo(clipGlobalPos);
                const sag = Math.max(0, stringLength - dist) * 0.5; 
                
                const control1 = new THREE.Vector3(anchorPos.x, anchorPos.y - (stringLength * 0.3) - sag, anchorPos.z - 1);
                const control2 = new THREE.Vector3(clipGlobalPos.x, clipGlobalPos.y + (stringLength * 0.3) + sag, clipGlobalPos.z - 1);
                
                const curve = new THREE.CubicBezierCurve3(anchorPos, control1, control2, clipGlobalPos);
                
                // Kurangi poligon tali secara drastis di mobile untuk mengurangi beban Garbage Collection
                const tubeGeo = new THREE.TubeGeometry(curve, isMobile ? 12 : 40, 0.12, isMobile ? 4 : 8, false);

                if (lanyardMesh) {
                    lanyardMesh.geometry.dispose(); 
                    lanyardMesh.geometry = tubeGeo;
                } else {
                    lanyardMesh = new THREE.Mesh(tubeGeo, lanyardMat);
                    lanyardMesh.castShadow = true;
                    scene.add(lanyardMesh);
                }
            }

            // ==========================================
            // KTA CARD
            // ==========================================
            const ktaWidth = 5.4; const ktaHeight = 3.4; const ktaDepth = 0.08; 
            
            const ktaGeo = new RoundedBoxGeometry(ktaWidth, ktaHeight, ktaDepth, 24, 0.3);
            
            const ktaFrontMat = new THREE.MeshPhysicalMaterial({ map: kFrontTex, bumpMap: kFrontBump, ...cardMaterialProps, roughness: 0.1, metalness: 0.6 });
            const ktaBackMat = new THREE.MeshPhysicalMaterial({ map: kBackTex, bumpMap: kBackBump, ...cardMaterialProps, roughness: 0.2, metalness: 0.8 });
            
            const ktaMatArray = [goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, goldEdgeMaterial, ktaFrontMat, ktaBackMat];
            const ktaMesh = new THREE.Mesh(ktaGeo, ktaMatArray);
            ktaMesh.castShadow = true;
            scene.add(ktaMesh);

            const ktaRestPos = new THREE.Vector3(); 
            if (window.innerWidth < 768) { ktaRestPos.set(-4, -5, -4); } else { ktaRestPos.set(-8, 0, -2); }
            ktaMesh.position.copy(ktaRestPos);

            // ==========================================
            // SYSTEM THEME TOGGLE (DUAL MORPHING)
            // ==========================================
            const btnThemeToggle = document.getElementById('btnThemeToggle');
            const envStatus = document.getElementById('envStatus');
            let isLightMode = false;
            let targetDayOpacity = 0;

            btnThemeToggle.addEventListener('click', () => {
                isLightMode = !isLightMode;
                document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
                btnThemeToggle.innerHTML = isLightMode ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
                envStatus.innerText = isLightMode ? 'CALACATTA_GALLERY_ACTIVE' : 'NOIR_VAULT_ACTIVE';

                if (isLightMode) {
                    scene.fog.color.setHex(0xf8f9fa);
                    scene.fog.density = 0.008; 
                    ambientLight.intensity = 2.0;
                    spotLight.intensity = 200; 
                    spotLight.color.setHex(0xffffff);
                    rimLight.intensity = 40;
                    dustMat.opacity = 0.05; 
                    targetDayOpacity = 1;
                } else {
                    scene.fog.color.setHex(0x020202);
                    scene.fog.density = 0.015;
                    ambientLight.intensity = 0.8;
                    spotLight.intensity = 120; 
                    spotLight.color.setHex(0xffeedd); 
                    rimLight.intensity = 60;
                    dustMat.opacity = 0.5; 
                    targetDayOpacity = 0;
                }
                updateFocusState();
            });

            // ==========================================
            // EXPORT ID CARD (COMPOSITE 2D POSTER)
            // ==========================================
            const btnExportId = document.getElementById('btnExportId');
            if (btnExportId) {
                btnExportId.addEventListener('click', () => {
                    if (!texFront.image || !texBack.image || !kFrontTex.image || !kBackTex.image) return;

                    // Buat Canvas komposit 2D
                    const compCanvas = document.createElement('canvas');
                    const ctx = compCanvas.getContext('2d');
                    
                    // Resolusi poster eksklusif
                    compCanvas.width = 2400;
                    compCanvas.height = 1800;

                    // Latar Belakang Gelap Elegan
                    const bgGrad = ctx.createLinearGradient(0, 0, compCanvas.width, compCanvas.height);
                    bgGrad.addColorStop(0, '#1a1d24');
                    bgGrad.addColorStop(1, '#050505');
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

                    // Ornamen Teks Latar
                    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
                    ctx.font = '900 150px "Playfair Display", serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('SOVEREIGN DIRECTIVE', 1200, 300);

                    // Fungsi untuk menggambar kartu dengan efek khusus
                    function drawCard(img, dx, dy, dw, dh, isKTA=false) {
                        ctx.save();
                        // Bayangan realistis
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                        ctx.shadowBlur = 40;
                        ctx.shadowOffsetX = 15;
                        ctx.shadowOffsetY = 25;
                        
                        // Buat clipping mask berujung membulat
                        ctx.beginPath();
                        ctx.roundRect(dx, dy, dw, dh, isKTA ? 30 : 50);
                        ctx.clip();
                        
                        // Gambar tekstur kartu asli (yang belum terkena shader 3D)
                        ctx.drawImage(img, dx, dy, dw, dh);
                        ctx.restore();
                        
                        // Beri efek highlight emas di pinggiran
                        ctx.save();
                        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.roundRect(dx, dy, dw, dh, isKTA ? 30 : 50);
                        ctx.stroke();
                        ctx.restore();
                    }

                    // Tali / Lanyard (Simulasi 2D elegan)
                    ctx.save();
                    ctx.strokeStyle = '#111';
                    ctx.lineWidth = 15;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetY = 10;
                    
                    // Tali Kiri
                    ctx.beginPath(); ctx.moveTo(400, -100); ctx.bezierCurveTo(400, 200, 500, 400, 500, 500); ctx.stroke();
                    // Tali Kanan
                    ctx.beginPath(); ctx.moveTo(600, -100); ctx.bezierCurveTo(600, 200, 500, 400, 500, 500); ctx.stroke();
                    
                    // Klip Baja Emas
                    ctx.fillStyle = '#d4af37';
                    ctx.fillRect(470, 480, 60, 40);
                    ctx.fillStyle = '#222';
                    ctx.fillRect(490, 520, 20, 30); // penyambung ke ID
                    ctx.restore();

                    // Dimensi ID Card (Rasio 5.4 : 8.6)
                    const idW = 600; const idH = 955;
                    // Draw Front ID Card
                    drawCard(texFront.image, 200, 550, idW, idH);
                    // Draw Back ID Card
                    drawCard(texBack.image, 900, 550, idW, idH);

                    // Dimensi KTA (Rasio 5.4 : 3.4)
                    const ktaW = 600; const ktaH = 377;
                    // Draw Front KTA
                    drawCard(kFrontTex.image, 1600, 550, ktaW, ktaH, true);
                    // Draw Back KTA
                    drawCard(kBackTex.image, 1600, 1000, ktaW, ktaH, true);

                    // Unduh hasil komposit
                    const dataURL = compCanvas.toDataURL('image/png', 1.0);
                    const link = document.createElement('a');
                    link.download = `Sovereign_ID_${expedientData.nama.replace(/\s+/g, '_')}.png`;
                    link.href = dataURL;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    if (navigator.vibrate) navigator.vibrate(50);
                    btnExportId.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => {
                        btnExportId.innerHTML = '<i class="fa-solid fa-download"></i>';
                    }, 2000);
                });
            }

            // ==========================================
            // IMAGE & QR LOADER
            // ==========================================
           const loadQR = new Promise((resolve) => {
    // UBAH 'profil/' MENJADI 'scan/'
    const qrImageUrl = window.ExpedientData ? window.ExpedientData.qr_url : "";
    const qrImg = new Image(); qrImg.crossOrigin = "Anonymous"; qrImg.src = qrImageUrl;
    qrImg.onload = () => resolve(qrImg); qrImg.onerror = () => resolve(null);
});

            const loadProfile = new Promise((resolve) => {
                if (expedientData.foto_url === '') return resolve(null);
                const img = new Image(); img.crossOrigin = "Anonymous"; img.src = expedientData.foto_url;
                img.onload = () => resolve(img); img.onerror = () => resolve(null);
            });

            Promise.all([loadQR, loadProfile]).then(([qrImg, profileImg]) => {
                document.getElementById('loadingText').innerText = "CALIBRATING PHYSICS...";

                if(qrImg) {
                    if(texBack && texBack.image) {
                        const ctxBack = texBack.image.getContext('2d');
                        ctxBack.drawImage(qrImg, 362, 1050, 300, 300); texBack.needsUpdate = true;
                    }
                    if(kBackTex && kBackTex.image) {
                        const ctxKta = kBackTex.image.getContext('2d');
                        ctxKta.drawImage(qrImg, 750, 320, 200, 200); kBackTex.needsUpdate = true;
                    }
                }

                if (profileImg) {
                    if(texFront && texFront.image) {
                        const ctxFront = texFront.image.getContext('2d');
                        const photoX = 160; const photoY = 400; const photoW = 760; const photoH = 650;
                        ctxFront.save(); ctxFront.beginPath(); ctxFront.rect(photoX, photoY, photoW, photoH); ctxFront.clip();
                        const scale = Math.max(photoW / profileImg.width, photoH / profileImg.height);
                        const drawW = profileImg.width * scale; const drawH = profileImg.height * scale;
                        const drawX = photoX + (photoW - drawW) / 2; const drawY = photoY + (photoH - drawH) / 2;
                        ctxFront.drawImage(profileImg, drawX, drawY, drawW, drawH);
                        const glass = ctxFront.createLinearGradient(photoX, photoY, photoX+photoW, photoY+photoH);
                        glass.addColorStop(0, 'rgba(255,255,255,0.05)'); glass.addColorStop(1, 'rgba(0,0,0,0.5)');
                        ctxFront.fillStyle = glass; ctxFront.fillRect(photoX, photoY, photoW, photoH);
                        ctxFront.restore();
                        ctxFront.strokeStyle = GOLD; ctxFront.lineWidth = 4; const size = 30;
                        ctxFront.beginPath(); ctxFront.moveTo(photoX, photoY+size); ctxFront.lineTo(photoX, photoY); ctxFront.lineTo(photoX+size, photoY); ctxFront.stroke(); 
                        ctxFront.beginPath(); ctxFront.moveTo(photoX+photoW-size, photoY); ctxFront.lineTo(photoX+photoW, photoY); ctxFront.lineTo(photoX+photoW, photoY+size); ctxFront.stroke();
                        texFront.needsUpdate = true;
                    }
                    if(kFrontTex && kFrontTex.image) {
                        const ctxKta = kFrontTex.image.getContext('2d');
                        ctxKta.save(); ctxKta.beginPath(); ctxKta.arc(800, 320, 245, 0, Math.PI*2); ctxKta.clip();
                        const targetSize = 500; 
                        const scaleKta = Math.max(targetSize / profileImg.width, targetSize / profileImg.height);
                        const drawWKta = profileImg.width * scaleKta; const drawHKta = profileImg.height * scaleKta;
                        const drawXKta = 800 - drawWKta / 2; const drawYKta = 320 - drawHKta / 2;
                        ctxKta.drawImage(profileImg, drawXKta, drawYKta, drawWKta, drawHKta);
                        ctxKta.lineWidth = 4; ctxKta.strokeStyle = 'rgba(212, 175, 55, 0.5)';
                        ctxKta.beginPath(); ctxKta.arc(800, 320, 245, 0, Math.PI*2); ctxKta.stroke();
                        ctxKta.restore();
                        kFrontTex.needsUpdate = true;
                    }
                }

                setTimeout(() => {
                    const loader = document.getElementById('preloader');
                    loader.style.opacity = '0';
                    setTimeout(() => loader.style.display = 'none', 800);
                }, 500);
            });

            // ==========================================
            // KINEMATICS & INTERACTION
            // ==========================================
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            let targetCameraX = 0; let targetCameraY = 0;
            let isKtaActive = false; const ktaViewPos = new THREE.Vector3(0, 0, 16); 
            let ktaTargetRotX = 0; let ktaTargetRotY = 0; let ktaDragDist = 0; 
            
            let isMainActive = false; const mainViewPos = new THREE.Vector3(0, 0, 16); 
            let mainTargetRotX = 0; let mainTargetRotY = 0;
            let lastClickTime = 0; 

            let isZoomed = false;

            function updateFocusState() {
                isZoomed = (isKtaActive || isMainActive);
                const baseDensity = isLightMode ? 0.008 : 0.015;
                scene.fog.density = isZoomed ? baseDensity + 0.02 : baseDensity;
            }

            function toggleKTA() {
                isKtaActive = !isKtaActive;
                if(isKtaActive) {
                    ktaTargetRotX = 0; ktaTargetRotY = 0; 
                    const currentRot = new THREE.Euler().copy(ktaMesh.rotation);
                    ktaMesh.rotation.set(0, currentRot.y, 0); 
                }
                updateFocusState();
            }

            function toggleMainCard() {
                isMainActive = !isMainActive;
                if(isMainActive) {
                    mainTargetRotX = 0; 
                    let currentRotY = idCard.rotation.y % (Math.PI * 2);
                    if (currentRotY > Math.PI) currentRotY -= Math.PI * 2;
                    if (currentRotY < -Math.PI) currentRotY += Math.PI * 2;
                    mainTargetRotY = currentRotY;
                } else {
                    velocity.set(0,0,0); targetRotY = 0;
                }
                updateFocusState();
            }

            function updateMouseRaycast(event) {
                const rect = container.getBoundingClientRect();
                let clientX = event.clientX; let clientY = event.clientY;
                if(event.touches && event.touches.length > 0) {
                    clientX = event.touches[0].clientX; clientY = event.touches[0].clientY;
                }
                mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                return { cx: clientX, cy: clientY };
            }

            container.addEventListener('click', (event) => {
                const currentTime = new Date().getTime();
                const timeDiff = currentTime - lastClickTime;
                const isDoubleClick = (timeDiff < 300 && timeDiff > 0);
                lastClickTime = currentTime;

                if(isDragging && !isKtaActive && !isMainActive) return;
                
                if (isKtaActive && ktaDragDist < 5 && !isDoubleClick) { toggleKTA(); return; }
                if (isMainActive && ktaDragDist < 5 && !isDoubleClick) { toggleMainCard(); return; }
                if (isDoubleClick && isMainActive) { toggleMainCard(); return; }

                updateMouseRaycast(event);

                if (isDoubleClick && !isKtaActive && !isMainActive) {
                    const intersectsMain = raycaster.intersectObject(idCard, true);
                    if (intersectsMain.length > 0) { toggleMainCard(); return; }
                }

                const intersects = raycaster.intersectObject(ktaMesh);
                if(intersects.length > 0 && !isKtaActive && !isMainActive && !isDoubleClick) {
                    toggleKTA();
                    const overlay = document.getElementById('uxOverlay');
                    if(overlay) overlay.classList.add('hidden');
                }
            });

            let isDragging = false; let hasInteracted = false; 
            let targetPos = new THREE.Vector3().copy(restPos);
            let targetRotY = 0; let targetRotX = 0; let targetRotZ = 0;
            let velocity = new THREE.Vector3(0,0,0);
            const springK = 0.08; const damping = 0.82;   
            let previousMouse = {x: 0, y: 0};

            function onPointerDown(event) {
                ktaDragDist = 0; 
                const coords = updateMouseRaycast(event);
                
                if(isKtaActive || isMainActive) {
                    isDragging = true; document.body.classList.add('is-grabbing'); 
                    previousMouse = {x: coords.cx, y: coords.cy}; return;
                }
                if(raycaster.intersectObject(ktaMesh).length > 0) return;

                isDragging = true; document.body.classList.add('is-grabbing'); 
                if (!hasInteracted) {
                    const overlay = document.getElementById('uxOverlay');
                    if(overlay) overlay.classList.add('hidden');
                    hasInteracted = true;
                }
                previousMouse = {x: coords.cx, y: coords.cy};
            }

            let globalCursorX = 0; let globalCursorY = 0;

            function onPointerMove(event) {
                const rect = container.getBoundingClientRect();
                let cx = event.clientX; let cy = event.clientY;
                if(event.touches && event.touches.length > 0) {
                    cx = event.touches[0].clientX; cy = event.touches[0].clientY;
                }
                
                const normX = ((cx - rect.left) / rect.width) * 2 - 1;
                const normY = -((cy - rect.top) / rect.height) * 2 + 1;
                
                globalCursorX = normX; globalCursorY = normY;
                targetCameraX = normX * 2; targetCameraY = normY * 2;

                if (isDragging) ktaDragDist += Math.abs(cx - previousMouse.x) + Math.abs(cy - previousMouse.y);

                if (isKtaActive && isDragging) {
                    ktaTargetRotY += (cx - previousMouse.x) * 0.01;
                    ktaTargetRotX += (cy - previousMouse.y) * 0.01;
                    previousMouse = {x: cx, y: cy}; return; 
                }
                if (isMainActive && isDragging) {
                    mainTargetRotY += (cx - previousMouse.x) * 0.01;
                    mainTargetRotX += (cy - previousMouse.y) * 0.01;
                    previousMouse = {x: cx, y: cy}; return; 
                }

                if (!isDragging || isKtaActive || isMainActive) return;

                targetPos.x = normX * 14; targetPos.y = normY * 14; targetPos.z = 3; 
                targetRotY += (cx - previousMouse.x) * 0.015;
                previousMouse = {x: cx, y: cy};
            }

            function onPointerUp() {
                if(isDragging) {
                    isDragging = false; document.body.classList.remove('is-grabbing'); 
                    if (!isKtaActive && !isMainActive) { targetPos.copy(restPos); }
                }
            }

            container.addEventListener('mousedown', onPointerDown); 
            window.addEventListener('mousemove', onPointerMove); 
            window.addEventListener('mouseup', onPointerUp);
            container.addEventListener('touchstart', onPointerDown, {passive: false}); 
            window.addEventListener('touchmove', onPointerMove, {passive: false}); 
            window.addEventListener('touchend', onPointerUp);

            // ==========================================
            // 🌐 GYROSCOPE (HOLOGRAPHIC TILT) FOR MOBILE
            // ==========================================
            let baseBeta = null; let baseGamma = null;
            window.addEventListener('deviceorientation', (event) => {
                if (!event.beta || !event.gamma) return;
                
                // Kalibrasi titik keseimbangan HP awal
                if (baseBeta === null) baseBeta = event.beta;
                if (baseGamma === null) baseGamma = event.gamma;
                
                let diffBeta = event.beta - baseBeta;
                let diffGamma = event.gamma - baseGamma;
                
                // Batasi kemiringan maksimal 45 derajat
                diffBeta = Math.max(-45, Math.min(45, diffBeta));
                diffGamma = Math.max(-45, Math.min(45, diffGamma));
                
                // Normalisasi ke skala -1.0 hingga 1.0 (Seperti kursor mouse)
                const normX = diffGamma / 45; 
                const normY = diffBeta / 45;

                // Suntikkan ke sistem Fisika Three.js
                globalCursorX = normX;
                globalCursorY = normY;
                targetCameraX = normX * 2.5; 
                targetCameraY = normY * 2.5;
            }, true);

            // ==========================================
            // RENDER LOOP
            // ==========================================
            let lastCardPos = new THREE.Vector3();
            function animate() {
                requestAnimationFrame(animate);
                const time = Date.now() * 0.001;

                if(dayMarbleMat.opacity !== targetDayOpacity) {
                    dayMarbleMat.opacity += (targetDayOpacity - dayMarbleMat.opacity) * 0.05;
                    if(Math.abs(targetDayOpacity - dayMarbleMat.opacity) < 0.01) dayMarbleMat.opacity = targetDayOpacity;
                }

                raycaster.setFromCamera(new THREE.Vector2(globalCursorX, globalCursorY), camera);
                const wallIntersects = raycaster.intersectObject(nightMarbleMesh);
                if(wallIntersects.length > 0) {
                    mouseLight.position.x += (wallIntersects[0].point.x - mouseLight.position.x) * 0.1;
                    mouseLight.position.y += (wallIntersects[0].point.y - mouseLight.position.y) * 0.1;
                }
                mouseLight.intensity = isLightMode ? 20 : 50;
                mouseLight.color.setHex(isLightMode ? 0xffffff : 0xffd700);

                dustParticles.rotation.y += 0.0005;
                dustParticles.rotation.x += 0.0002;

                if (!isMainActive && !isKtaActive) {
                    camera.position.x += (targetCameraX - camera.position.x) * 0.05;
                    camera.position.y += (targetCameraY - camera.position.y) * 0.05;
                    camera.lookAt(0, 0, 0); 
                    
                    marbleGroup.position.x = -(camera.position.x * 0.05);
                    marbleGroup.position.y = -(camera.position.y * 0.05);

                    if (!isDragging) {
                        targetRotY = (globalCursorX * 0.4); 
                        targetRotX = -(globalCursorY * 0.4);
                    }
                } else {
                    camera.position.x += (0 - camera.position.x) * 0.1;
                    camera.position.y += (0 - camera.position.y) * 0.1;
                    camera.lookAt(0, 0, 0);
                    marbleGroup.position.lerp(new THREE.Vector3(0,0,-10), 0.05);
                }

                if (isMainActive) {
                    idCard.position.lerp(mainViewPos, 0.08);
                    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(mainTargetRotX, mainTargetRotY, 0));
                    idCard.quaternion.slerp(targetQuat, 0.1);
                } else {
                    const force = new THREE.Vector3().subVectors(targetPos, idCard.position).multiplyScalar(springK);
                    velocity.add(force); velocity.multiplyScalar(damping); 
                    idCard.position.add(velocity);

                    idCard.rotation.x += (targetRotX - idCard.rotation.x) * 0.1;
                    idCard.rotation.y += (targetRotY - idCard.rotation.y) * 0.1;
                    idCard.rotation.z += (targetRotZ - idCard.rotation.z) * 0.2;
                }

                cardGlowLight.position.copy(idCard.position);
                cardGlowLight.position.z -= 1; 
                const glowIntensity = Math.max(0, 30 - (idCard.position.z * 5));
                cardGlowLight.intensity = isLightMode ? 0 : glowIntensity; 

                if(isKtaActive) {
                    ktaMesh.position.lerp(ktaViewPos, 0.08);
                    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(ktaTargetRotX, ktaTargetRotY, 0));
                    ktaMesh.quaternion.slerp(targetQuat, 0.1);
                } else {
                    const floatTime = time * 1.2;
                    const floatY = Math.sin(floatTime) * 0.4;
                    ktaMesh.position.lerp(new THREE.Vector3(ktaRestPos.x, ktaRestPos.y + floatY, ktaRestPos.z), 0.1);
                    
                    const ktaParallaxX = -(globalCursorY * 0.2); const ktaParallaxY = (globalCursorX * 0.3);
                    const floatRotZ = Math.cos(floatTime * 0.8) * 0.05; 
                    
                    ktaMesh.rotation.y += (ktaParallaxY + 0.008 - ktaMesh.rotation.y) * 0.1; 
                    ktaMesh.rotation.x += (ktaParallaxX + 0.2 - ktaMesh.rotation.x) * 0.1;
                    ktaMesh.rotation.z += (floatRotZ - ktaMesh.rotation.z) * 0.05; 
                }

                // Cek apakah kartu bergerak untuk menghentikan loop geometri tali (optimasi CPU)
                if (idCard.position.distanceToSquared(lastCardPos) > 0.0001) {
                    updateLanyardGeometry();
                    lastCardPos.copy(idCard.position);
                }

                renderer.render(scene, camera); 
            }
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.fov = window.innerWidth < 768 ? 65 : 45;
                if(window.innerWidth < 768) { ktaRestPos.set(-4, -5, -4); } else { ktaRestPos.set(-8, 0, -2); }
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }