// ================= PARTICLES ENGINE =================
const canvas = document.getElementById("particles-js");
if (canvas) {
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    
    let particlesArray = []; 
    let mouseArea = { x: null, y: null, radius: 100 };
    
    window.addEventListener('mousemove', e => { mouseArea.x = e.x; mouseArea.y = e.y; });
    window.addEventListener('mouseleave', () => { mouseArea.x = undefined; mouseArea.y = undefined; });
    
    class Particle {
        constructor(x, y, size, weight) { this.x = x; this.y = y; this.size = size; this.weight = weight; }
        update() {
            this.y -= this.weight;
            if (this.y < 0 - this.size) { this.y = canvas.height + this.size; this.x = Math.random() * canvas.width; }
            if (mouseArea.x != null) {
                let dx = mouseArea.x - this.x; let dy = mouseArea.y - this.y; let distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < mouseArea.radius) {
                    const forceDirectionX = dx / distance; const forceDirectionY = dy / distance;
                    const force = (mouseArea.radius - distance) / mouseArea.radius;
                    this.x -= forceDirectionX * force * 5; this.y -= forceDirectionY * force * 5;
                }
            }
        }
        draw() {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    
    function initParticles() { 
        particlesArray = []; 
        const count = window.innerWidth <= 768 ? 15 : 60; 
        for (let i = 0; i < count; i++) {
            particlesArray.push(new Particle(Math.random() * innerWidth, Math.random() * innerHeight, (Math.random() * 2) + 0.5, (Math.random() * 0.5) + 0.2)); 
        }
    }
    
    function animateParticles() { 
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        for (let i = 0; i < particlesArray.length; i++) { 
            particlesArray[i].update(); 
            particlesArray[i].draw(); 
        } 
        requestAnimationFrame(animateParticles); 
    }
    
    initParticles(); 
    animateParticles();
    
    window.addEventListener('resize', () => { 
        canvas.width = innerWidth; 
        canvas.height = innerHeight; 
        initParticles(); 
    });

    // Make particlesArray accessible globally for theme toggle
    window.particlesArray = particlesArray;
    window.Particle = Particle;

    // GYROSCOPE PARALLAX (HP)
    if (window.DeviceOrientationEvent && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const auroras = document.querySelectorAll('.aurora-blob');
        window.addEventListener('deviceorientation', (e) => {
            const tiltX = Math.min(Math.max(e.gamma, -45), 45); 
            const tiltY = Math.min(Math.max(e.beta - 45, -45), 45); 
            requestAnimationFrame(() => {
                auroras.forEach((blob, index) => {
                    const depthSpeed = (index + 1) * 0.8; 
                    blob.style.transform = `translate(${tiltX * depthSpeed}px, ${tiltY * depthSpeed}px)`;
                });
                if (window.particlesArray.length > 0) {
                    window.particlesArray.forEach(p => { p.x += tiltX * 0.05; });
                }
            });
        });
    }
}
