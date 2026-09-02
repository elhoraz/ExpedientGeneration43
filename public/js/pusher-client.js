// ================= PUSHER CLOUD REAL-TIME (HANYA ANGGOTA) =================
// Requires window.ExpedientConfig to be set in template.php
if (window.ExpedientConfig && window.ExpedientConfig.userId !== null) {
    const config = window.ExpedientConfig.pusher;
    // matchMedia reactive singleton — menggantikan window.innerWidth statis
    const mqMobile = window.matchMedia('(max-width: 768px)');
    
    window.pusher = new Pusher(config.key, { 
        cluster: config.cluster, 
        forceTLS: true 
    });
    
    // Monitor koneksi Pusher
    window.pusher.connection.bind('state_change', function(states) {
        console.log('[Pusher] State:', states.previous, '→', states.current);
    });
    window.pusher.connection.bind('error', function(err) {
        console.error('[Pusher] Connection error:', err);
    });
    
    const channel = window.pusher.subscribe('expedient-channel');
    const globalChatChannel = window.pusher.subscribe('chat-channel');
    
    let aegisLink = '#';
    const aegisToastElement = document.getElementById('aegisToast');
    if (aegisToastElement) {
        aegisToastElement.addEventListener('click', () => {
            if(aegisLink && aegisLink !== '#') {
                window.location.href = aegisLink;
            }
        });
    }
    
    channel.bind('alumni-baru', function(data) {
        const aegisToast = document.getElementById('aegisToast');
        const radarName = document.getElementById('radarName');
        if(aegisToast && radarName) {
            document.querySelector('.aegis-title').innerText = "Kolega Baru Bergabung";
            radarName.innerText = data.nama; 
            aegisLink = '/direktori';
            aegisToast.classList.add('show');
            if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
            setTimeout(() => aegisToast.classList.remove('show'), 6000);
            fetchUnreadNotifs(); // Refresh list jika ada
        }
    });

    // CHAT REAL-TIME BADGE
    globalChatChannel.bind('new-message', function(data) {
        // Jika kita tidak sedang di halaman chat tersebut, tambah badge
        if (window.location.pathname !== '/chat/personal/' + data.sender_id && 
            window.location.pathname !== '/chat/lounge' &&
            data.sender_id != window.ExpedientConfig.userId) {
            
            if (data.receiver_id == window.ExpedientConfig.userId || data.receiver_id === null) {
                fetchUnreadChat();
                
                if (data.receiver_id === null) {
                    const chatDropdown = document.getElementById('chatDropdown');
                    if (chatDropdown && chatDropdown.style.display === 'block') {
                        fetchMiniChat();
                    }
                }

                // Juga munculkan toast jika pesan personal
                if (data.receiver_id !== null) {
                    const aegisToast = document.getElementById('aegisToast');
                    const radarName = document.getElementById('radarName');
                    if(aegisToast && radarName) {
                        document.querySelector('.aegis-title').innerText = "Pesan Baru dari " + data.sender_name;
                        radarName.innerText = data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''); 
                        aegisLink = '/chat/personal/' + data.sender_id;
                        aegisToast.classList.add('show');
                        if (navigator.vibrate) navigator.vibrate([100, 50]);
                        setTimeout(() => aegisToast.classList.remove('show'), 6000);
                    }
                }
            }
        }
    });

    // NOTIFIKASI UMUM EVENT (PERSONAL)
    channel.bind('new-notification', function(data) {
        if (data.user_id == window.ExpedientConfig.userId) {
            const aegisToast = document.getElementById('aegisToast');
            const radarName = document.getElementById('radarName');
            if(aegisToast && radarName) {
                document.querySelector('.aegis-title').innerText = data.title;
                radarName.innerText = data.message; 
                aegisLink = data.link || '#';
                aegisToast.classList.add('show');
                if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
                setTimeout(() => aegisToast.classList.remove('show'), 6000);
                fetchUnreadNotifs();
            }
        }
    });

    // NOTIFIKASI GLOBAL (BROADCAST)
    channel.bind('broadcast-notification', function(data) {
        const aegisToast = document.getElementById('aegisToast');
        const radarName = document.getElementById('radarName');
        if(aegisToast && radarName) {
            document.querySelector('.aegis-title').innerText = data.title;
            radarName.innerText = data.message; 
            aegisLink = data.link || '#';
            aegisToast.classList.add('show');
            if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
            setTimeout(() => aegisToast.classList.remove('show'), 6000);
        }
    });

    // NOTIFIKASI UI LOGIC
    window.toggleNotif = function() {
        const dropdown = document.getElementById('notifDropdown');
        const chatDropdown = document.getElementById('chatDropdown');
        if (chatDropdown && chatDropdown.style.display === 'block') window.toggleChatPopup();
        
        if (dropdown) {
            if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                dropdown.style.display = 'block';
                // Adjust position for mobile using matchMedia
                if (mqMobile.matches) {
                    dropdown.style.left = '50%';
                    dropdown.style.transform = 'translateX(-50%) translateY(10px)';
                }
                requestAnimationFrame(() => {
                    dropdown.style.transform = mqMobile.matches ? 'translateX(-50%) translateY(0)' : 'translateY(0)';
                    dropdown.style.opacity = '1';
                });
                fetchUnreadNotifs();
            } else {
                dropdown.style.transform = mqMobile.matches ? 'translateX(-50%) translateY(10px)' : 'translateY(10px)';
                dropdown.style.opacity = '0';
                setTimeout(() => dropdown.style.display = 'none', 300);
            }
        }
    }

    window.toggleChatPopup = function() {
        const dropdown = document.getElementById('chatDropdown');
        const notifDropdown = document.getElementById('notifDropdown');
        if (notifDropdown && notifDropdown.style.display === 'block') window.toggleNotif();

        if (dropdown) {
            if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                dropdown.style.display = 'block';
                // Adjust position for mobile using matchMedia
                if (mqMobile.matches) {
                    dropdown.style.left = '50%';
                    dropdown.style.transform = 'translateX(-50%) translateY(10px)';
                }
                requestAnimationFrame(() => {
                    dropdown.style.transform = mqMobile.matches ? 'translateX(-50%) translateY(0)' : 'translateY(0)';
                    dropdown.style.opacity = '1';
                });
                fetchMiniChat();
            } else {
                dropdown.style.transform = mqMobile.matches ? 'translateX(-50%) translateY(10px)' : 'translateY(10px)';
                dropdown.style.opacity = '0';
                setTimeout(() => dropdown.style.display = 'none', 300);
            }
        }
    }

    async function fetchMiniChat() {
        try {
            const res = await fetch('/chat/load-more?receiver_id=null');
            const data = await res.json();
            if(data.status === 'success') {
                const list = document.getElementById('miniChatList');
                if(list) {
                    if(data.data.length > 0) {
                        list.innerHTML = data.data.map(m => {
                            const isMe = m.sender_id == window.ExpedientConfig.userId;
                            return `
                            <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:5px;">
                                <div style="font-size:0.65rem; color:var(--text-secondary); margin-bottom:2px;">${isMe ? 'Anda' : (m.nama_panggilan || m.nama_lengkap)}</div>
                                <div style="background:${isMe ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}; padding:8px 12px; border-radius:12px; max-width:85%; word-wrap:break-word; border:1px solid ${isMe ? 'rgba(212,175,55,0.3)' : 'var(--glass-border)'};">
                                    ${m.message}
                                </div>
                            </div>`;
                        }).join('');
                        list.scrollTop = list.scrollHeight;
                    } else {
                        list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary);">Belum ada obrolan.</div>';
                    }
                }
            }
        } catch(e) {}
    }

    const miniChatForm = document.getElementById('miniChatForm');
    if(miniChatForm) {
        miniChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('miniChatInput');
            const msg = input.value.trim();
            if(!msg) return;

            input.value = '';
            
            // OPTIMISTIC UI: Langsung render pesan ke layar (mengirim)
            const list = document.getElementById('miniChatList');
            const tempId = 'temp-' + Date.now();
            if(list) {
                // Hapus tulisan "Belum ada obrolan" jika ada
                if(list.innerHTML.includes('Belum ada obrolan')) list.innerHTML = '';
                
                // Mencegah XSS basic saat render Optimistic UI
                const safeMsg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                
                list.insertAdjacentHTML('beforeend', `
                <div id="${tempId}" style="display:flex; flex-direction:column; align-items:flex-end; margin-bottom:5px; opacity:0.6; transition:opacity 0.3s;">
                    <div style="font-size:0.65rem; color:var(--text-secondary); margin-bottom:2px;">Anda <i class="fa-solid fa-clock" style="font-size:0.55rem; margin-left:3px;" title="Mengirim..."></i></div>
                    <div style="background:rgba(212,175,55,0.2); padding:8px 12px; border-radius:12px; max-width:85%; word-wrap:break-word; border:1px solid rgba(212,175,55,0.3);">
                        ${safeMsg}
                    </div>
                </div>`);
                list.scrollTop = list.scrollHeight;
            }

            const formData = new FormData();
            formData.append('message', msg);
            
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfHash = csrfMeta ? csrfMeta.getAttribute('content') : '';

            try {
                const res = await fetch('/chat/send', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrfHash },
                    body: formData
                });
                const data = await res.json();
                if(data.csrf_hash && csrfMeta) csrfMeta.setAttribute('content', data.csrf_hash);
                
                if (data.status === 'success') {
                    // Update opacity menjadi full (berhasil terkirim)
                    const tempEl = document.getElementById(tempId);
                    if(tempEl) {
                        tempEl.style.opacity = '1';
                        const timeIcon = tempEl.querySelector('.fa-clock');
                        if (timeIcon) timeIcon.remove(); // Hapus icon jam pasir
                    }
                    // Fetch di background untuk sinkronisasi DB (opsional)
                    fetchMiniChat();
                } else {
                    // Gagal, hapus balon chat sementara dan tampilkan toast error
                    const tempEl = document.getElementById(tempId);
                    if(tempEl) tempEl.remove();
                    if(window.showToast) window.showToast('Gagal Mengirim', 'Koneksi terputus. Silakan coba lagi.', true);
                }
            } catch(e) {
                // Error jaringan
                const tempEl = document.getElementById(tempId);
                if(tempEl) tempEl.remove();
                if(window.showToast) window.showToast('Koneksi Gagal', 'Gagal terhubung ke server Lounge.', true);
            }
        });
    }

    async function fetchUnreadNotifs() {
        try {
            const res = await fetch('/notifications/unread');
            const data = await res.json();
            if (data.status === 'success') {
                const badge = document.getElementById('notifBadge');
                const list = document.getElementById('notifList');
                
                if (badge && list) {
                    if (data.data.length > 0) {
                        badge.style.display = 'block';
                        list.innerHTML = data.data.map(n => `
                            <div onclick="readNotif(${n.id}, '${n.link || '#'}')" style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:0.3s;" onmouseover="this.style.background='rgba(212,175,55,0.1)'" onmouseout="this.style.background='transparent'">
                                <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-bottom:4px;">${n.title}</div>
                                <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">${n.message}</div>
                            </div>
                        `).join('');
                    } else {
                        badge.style.display = 'none';
                        list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.85rem;">Tidak ada pesan baru.</div>';
                    }
                }
            }
        } catch(e) {}
    }

    async function fetchUnreadChat() {
        try {
            const res = await fetch('/chat/unread');
            const data = await res.json();
            if (data.status === 'success') {
                const badge = document.getElementById('chatBadge');
                if(badge) {
                    if (data.count > 0) {
                        badge.style.display = 'block';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        } catch(e) {}
    }

    window.readNotif = async function(id, link) {
        try {
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfHash = csrfMeta ? csrfMeta.getAttribute('content') : '';
            const resp = await fetch('/notifications/read/' + id, { 
                method: 'POST', 
                headers: { 
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfHash
                } 
            });
            const result = await resp.json().catch(() => ({}));
            if(result.csrf_hash && csrfMeta) {
                csrfMeta.setAttribute('content', result.csrf_hash);
            }
            window.location.href = link;
        } catch(e) {
            window.location.href = link;
        }
    }

    // Initial fetch
    setTimeout(() => {
        fetchUnreadNotifs();
        fetchUnreadChat();
    }, 2000);
}
