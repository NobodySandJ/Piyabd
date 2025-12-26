let data = {};
let currentAge = 19;
const REFERENCE_YEAR = 2026;
let audioContext = null;
let micStream = null;
let blowMode = 'click';
let videoStream;
let capturedPhotos = []; 

// State untuk Editing
let currentTheme = 'mixed';
let currentFont = 'Patrick Hand';

// Preloader
window.onload = function() {
    setTimeout(() => {
        document.getElementById('preloader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none';
        }, 500);
        createFloatingElements();
    }, 1500);
}

fetch('data.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        initWebsite();
    })
    .catch(err => console.error("Gagal memuat data:", err));

function initWebsite() {
    const audio = document.getElementById('bg-music');
    audio.src = data.musik; audio.volume = 0; 
    document.getElementById('intro-title').innerText = data.halaman_awal.judul;
    document.getElementById('intro-sub').innerText = data.halaman_awal.subjudul;
    document.getElementById('btn-start').innerText = data.halaman_awal.tombol_mulai;
    document.getElementById('verif-title').innerText = data.halaman_verifikasi.tanya;
    document.getElementById('verif-sub').innerText = data.halaman_verifikasi.sub_tanya;
    document.getElementById('btn-verif-yes').innerText = data.halaman_verifikasi.tombol_benar;
    document.getElementById('btn-verif-no').innerText = data.halaman_verifikasi.tombol_salah;
    document.getElementById('slider-label').innerText = data.halaman_verifikasi.label_slider;
}

function createFloatingElements() {
    const container = document.getElementById('floating-bg');
    const icons = ['🍃', '🐇', '🍰', '✨', '🍵'];
    for(let i = 0; i < 15; i++) {
        const el = document.createElement('div');
        el.classList.add('float-item');
        el.innerText = icons[Math.floor(Math.random() * icons.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (Math.random() * 10 + 10) + 's';
        el.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(el);
    }
}

function fadeInAudio() {
    const audio = document.getElementById('bg-music');
    let vol = 0;
    audio.play().then(() => {
        const fadeInterval = setInterval(() => {
            if (vol < 0.6) { vol += 0.05; audio.volume = vol; } 
            else { clearInterval(fadeInterval); }
        }, 200);
        const widget = document.getElementById('music-widget');
        widget.classList.remove('hidden'); widget.classList.remove('paused');
    }).catch(e => console.log("Audio block", e));
}

function startCelebration() { fadeInAudio(); nextPage('verification'); }
function toggleMusicPlay() {
    const audio = document.getElementById('bg-music');
    const widget = document.getElementById('music-widget');
    if (audio.paused) { audio.play(); widget.classList.remove('paused'); widget.querySelector('.widget-text').innerText = "Playing ♪"; } 
    else { audio.pause(); widget.classList.add('paused'); widget.querySelector('.widget-text').innerText = "Paused"; }
}

function confirmAge(isTrue) { 
    if (isTrue) { currentAge = 19 } 
    else { currentAge = REFERENCE_YEAR - parseInt(document.getElementById('year-slider').value) } 
    showToast("Yeay! Lanjut..."); setTimeout(() => nextPage('cake-page'), 1000) 
}

function showSlider() { document.getElementById('verif-buttons').classList.add('hidden'); document.getElementById('slider-container').classList.remove('hidden'); updateSliderVal(2007) }
function updateSliderVal(val) { document.getElementById('year-display').innerText = val; document.getElementById('slider-btn-text').innerText = `Lanjut (Umur ${REFERENCE_YEAR - val})`; }

// --- CAKE & BLOWING LOGIC ---

function initCake() {
    document.getElementById('cake-title').innerText = data.halaman_kue.judul;
    
    // Reset State
    document.getElementById('mode-selection').classList.remove('hidden');
    document.getElementById('cake-interaction-area').classList.add('hidden');
    document.getElementById('cake-flame').classList.remove('padam');
    document.getElementById('btn-to-letter').classList.add('hidden');
    document.getElementById('mic-indicator').classList.add('hidden');
    document.getElementById('btn-blow').classList.add('hidden');

    // Stop mic if running
    if(micStream) { micStream.getTracks().forEach(track => track.stop()); micStream = null; }
}

function selectBlowMode(mode) {
    blowMode = mode;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('cake-interaction-area').classList.remove('hidden');
    document.getElementById('cake-interaction-area').style.animation = "fadeIn 1s forwards";

    document.getElementById('cake-msg').innerText = data.halaman_kue.ucapan_sebelum;

    if (mode === 'mic') {
        document.getElementById('mic-indicator').classList.remove('hidden');
        document.getElementById('btn-blow').classList.add('hidden');
        initMicrophone();
    } else {
        document.getElementById('mic-indicator').classList.add('hidden');
        document.getElementById('btn-blow').classList.remove('hidden');
    }
}

function initMicrophone() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Browser tidak support mic. Beralih ke mode tombol."); 
        selectBlowMode('click');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        micStream = stream; 
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        
        analyser.smoothingTimeConstant = 0.8; 
        analyser.fftSize = 1024;
        microphone.connect(analyser); 
        analyser.connect(javascriptNode); 
        javascriptNode.connect(audioContext.destination);
        
        javascriptNode.onaudioprocess = function() {
            const array = new Uint8Array(analyser.frequencyBinCount); 
            analyser.getByteFrequencyData(array);
            let values = 0; for (let i = 0; i < array.length; i++) values += array[i];
            const average = values / array.length;
            
            document.getElementById('mic-level').style.width = Math.min(100, average * 2) + "%";
            
            if (average > 40 && !document.getElementById('cake-flame').classList.contains('padam')) {
                blowCandleAction(); 
                // Stop Mic after blow
                if(micStream) micStream.getTracks().forEach(track => track.stop()); 
                javascriptNode.disconnect();
            }
        }
    }).catch(err => { 
        console.error(err); 
        alert("Akses mic ditolak. Silakan pakai tombol manual."); 
        selectBlowMode('click'); 
    });
}

function blowCandleManual() { blowCandleAction(); }
function blowCandleAction() {
    const flame = document.getElementById('cake-flame');
    flame.classList.add('kena-angin');
    setTimeout(() => {
        flame.classList.remove('kena-angin'); flame.classList.add('padam');
        const smokeContainer = document.getElementById('smoke-container'); smokeContainer.innerHTML = ''; 
        for (let i = 0; i < 10; i++) { 
            let s = document.createElement('div'); s.classList.add('smoke-particle');
            s.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
            s.style.animation = `floatSmoke 2.5s ease-out ${i * 0.15}s forwards`; smokeContainer.appendChild(s);
        }
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#556B2F', '#8FBC8F', '#E0F2E0', '#FFD700'] });
        setTimeout(() => {
            document.getElementById('cake-msg').innerText = data.halaman_kue.ucapan_sesudah;
            document.getElementById('mic-indicator').classList.add('hidden'); 
            document.getElementById('btn-blow').classList.add('hidden');
            document.getElementById('btn-to-letter').classList.remove('hidden');
        }, 1500);
    }, 800);
}

function goToLetter() { nextPage('letter'); isiSurat() }
function isiSurat() { document.getElementById('letter-title').innerHTML = data.surat.judul_kertas; document.getElementById('letter-content').innerHTML = data.surat.isi_pesan.replace(/{usia}/g, currentAge); document.getElementById('letter-sign').innerHTML = data.surat.ttd }
function setupInteraction() { document.getElementById('question').innerText = data.interaksi.tanya; document.getElementById('btn-yes').innerText = data.interaksi.tombol_ya; document.getElementById('btn-no').innerText = data.interaksi.tombol_lari }

function dodgeButton() {
    const btnNo = document.getElementById('btn-no');
    const container = document.getElementById('runaway-container');
    const rect = container.getBoundingClientRect();
    const maxX = rect.width - btnNo.offsetWidth - 20; const maxY = rect.height - btnNo.offsetHeight - 20;
    btnNo.style.left = Math.max(10, Math.floor(Math.random() * maxX)) + 'px';
    btnNo.style.top = Math.max(10, Math.floor(Math.random() * maxY)) + 'px';
    const texts = ["Eits!", "Gak kena!", "Coba lagi!", "Wleee 😝", "Jangan dong!"];
    btnNo.innerText = texts[Math.floor(Math.random() * texts.length)];
}
function sayYes() { showToast(data.interaksi.pesan_ya); setTimeout(() => nextPage('gallery'), 2000) }

function loadGallery() { 
    const container = document.getElementById('polaroid-container'); container.innerHTML = ''; 
    data.galeri.forEach((item, index) => { 
        const div = document.createElement('div'); div.classList.add('polaroid'); div.style.animation = `fadeIn 0.8s ease-out ${index * 0.2}s backwards`; 
        div.style.transform = `rotate(${Math.floor(Math.random() * 20) - 10}deg)`; 
        div.innerHTML = `<img src="${item.src}"><div class="caption">${item.caption}</div>`; container.appendChild(div) 
    }); 
    const track = document.getElementById('carousel-track'); track.innerHTML = ''; 
    let photos = (data.foto_banyak && data.foto_banyak.length > 0) ? data.foto_banyak : data.galeri.map(g => g.src); 
    while (photos.length < 8) photos = photos.concat(photos); 
    const radius = 250; const angleStep = 360 / photos.length; 
    photos.forEach((src, index) => { 
        const img = document.createElement('img'); img.src = src; 
        img.style.transform = `rotateY(${index * angleStep}deg) translateZ(${radius}px)`; track.appendChild(img) 
    });
    // Auto Rotate
    let currAngle = 0; let interval;
    const carouselArea = document.getElementById('carousel-area'); let startX = 0; let isDragging = false;
    carouselArea.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; clearInterval(interval); });
    carouselArea.addEventListener('touchmove', (e) => { if(!isDragging) return; const diff = startX - e.touches[0].clientX; currAngle -= diff * 0.2; track.style.transform = `rotateY(${currAngle}deg)`; startX = e.touches[0].clientX; });
    carouselArea.addEventListener('touchend', () => { isDragging = false; startAutoSpin(); });
    function startAutoSpin() { clearInterval(interval); interval = setInterval(() => { currAngle -= 0.2; track.style.transform = `rotateY(${currAngle}deg)`; }, 20); }
    startAutoSpin();
}

// --- PHOTOBOOTH LOGIC ---

function initPhotobooth() {
    document.getElementById('static-mode-ui').classList.remove('hidden');
    document.getElementById('live-mode-ui').classList.add('hidden');
    document.getElementById('preview-mode-ui').classList.add('hidden');
    document.getElementById('post-print-options').classList.add('hidden');
    document.getElementById('printer-animation-area').classList.add('hidden');
    
    const staticImg = document.getElementById('static-pb-img');
    if (data.photobooth && data.photobooth.src) staticImg.src = data.photobooth.src;
}

function printStaticPhoto() {
    document.getElementById('static-mode-ui').classList.add('hidden');
    const src = document.getElementById('static-pb-img').src;
    printProcess(src);
}

function openLivePhotobooth() {
    document.getElementById('static-mode-ui').classList.add('hidden');
    document.getElementById('printer-animation-area').classList.add('hidden');
    document.getElementById('post-print-options').classList.add('hidden');
    document.getElementById('preview-mode-ui').classList.add('hidden'); 
    
    document.getElementById('live-mode-ui').classList.remove('hidden');
}

function closeLivePhotobooth() {
    document.getElementById('live-mode-ui').classList.add('hidden');
    document.getElementById('static-mode-ui').classList.remove('hidden');
    if(videoStream) videoStream.getTracks().forEach(track => track.stop());
}

function startCamera() {
    const video = document.getElementById('camera-feed');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(stream => {
        videoStream = stream; video.srcObject = stream;
        video.classList.remove('hidden');
        document.getElementById('camera-placeholder').classList.add('hidden');
        document.getElementById('btn-start-cam').classList.add('hidden');
        document.getElementById('btn-take-pic').classList.remove('hidden');
    }).catch(err => alert("Gagal akses kamera."));
}

function startPhotoSequence() {
    capturedPhotos = [];
    document.getElementById('btn-take-pic').classList.add('hidden');
    document.getElementById('btn-back-static').classList.add('hidden');
    runCountdown(3, 4); 
}

function runCountdown(seconds, remainingShots) {
    const overlay = document.getElementById('countdown-overlay');
    const text = document.getElementById('countdown-text');
    overlay.classList.remove('hidden');
    let count = seconds; text.innerText = count;
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) { text.innerText = count; } 
        else {
            clearInterval(interval);
            overlay.classList.add('hidden');
            captureOnePhoto();
            if (remainingShots > 1) {
                showToast(`Foto ke-${5 - remainingShots} tersimpan!`);
                setTimeout(() => { runCountdown(3, remainingShots - 1); }, 1000);
            } else { finishCapture(); }
        }
    }, 1000);
}

function captureOnePhoto() {
    const video = document.getElementById('camera-feed');
    const displayRatio = 280 / 350; 
    const targetWidth = 560;
    const targetHeight = 700; 
    
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth; canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    
    const videoW = video.videoWidth; const videoH = video.videoHeight;
    const videoRatio = videoW / videoH;
    let sWidth, sHeight, sX, sY;

    if (videoRatio > displayRatio) {
        sHeight = videoH; sWidth = videoH * displayRatio; sX = (videoW - sWidth) / 2; sY = 0;
    } else {
        sWidth = videoW; sHeight = videoW / displayRatio; sX = 0; sY = (videoH - sHeight) / 2;
    }

    ctx.drawImage(video, sX, sY, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    capturedPhotos.push(canvas);
}

function finishCapture() {
    const video = document.getElementById('camera-feed');
    video.classList.add('hidden');
    if(videoStream) videoStream.getTracks().forEach(track => track.stop());

    document.getElementById('live-mode-ui').classList.add('hidden');
    document.getElementById('preview-mode-ui').classList.remove('hidden');

    updatePreview();
}

// === RENDER ENGINE (New Aesthetic Template) ===
function updatePreview() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const userHeader = document.getElementById('custom-header').value.trim() || "HBD Piya";
    const userFooter = document.getElementById('custom-footer').value.trim() || new Date().toLocaleDateString();

    // High Res Config
    const photoW = 500;
    const photoH = 625; // Ratio 4:5
    const gap = 40;     
    const sideMargin = 50; 
    const headerH = 180;
    const footerH = 120;
    
    // Dynamic Height based on photo count
    const totalContentHeight = (photoH * capturedPhotos.length) + (gap * (capturedPhotos.length - 1));
    canvas.width = photoW + (sideMargin * 2);
    canvas.height = headerH + totalContentHeight + footerH + 50;
    
    // 1. BACKGROUND THEME
    let bgColor = "#F9F9F9"; 
    let patternColor = "#E0E0E0";

    if(currentTheme === 'love') {
        bgColor = "#FFF0F5"; 
        patternColor = "#FFB6C1";
    } else if(currentTheme === 'bunny' || currentTheme === 'mixed') {
        bgColor = "#F0FFF0"; 
        patternColor = "#8FBC8F";
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Polkadot Pattern
    ctx.fillStyle = patternColor;
    for (let py = 0; py < canvas.height; py += 30) {
        for (let px = 0; px < canvas.width; px += 30) {
            if ((py/30) % 2 === (px/30) % 2) { 
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 2. HEADER
    ctx.textAlign = "center";
    ctx.fillStyle = "#333";
    
    let titleFont = "60px 'Patrick Hand', cursive";
    if(currentFont === 'Courier New') titleFont = "bold 55px 'Courier Prime', monospace";
    if(currentFont === 'Dancing Script') titleFont = "bold 65px 'Dancing Script', cursive";
    
    ctx.font = titleFont;
    ctx.fillText(userHeader, canvas.width/2, 110);

    // Underline Decoration
    ctx.beginPath();
    ctx.moveTo(sideMargin + 50, 130);
    ctx.lineTo(canvas.width - sideMargin - 50, 130);
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. DRAW PHOTOS with Border & Stickers
    let currentY = headerH;
    let stickers = [];
    if(currentTheme === 'love') stickers = ['❤️', '✨', '🌹', '🥰', '🫶'];
    else if(currentTheme === 'bunny') stickers = ['🐇', '🥕', '🐰', '🌸', '🥬'];
    else stickers = ['🍵', '✨', '🎂', '🎉', '🎈'];

    capturedPhotos.forEach((pCanvas, index) => {
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(sideMargin + 10, currentY + 10, photoW, photoH);

        // White Frame
        ctx.fillStyle = "#FFF";
        ctx.fillRect(sideMargin, currentY, photoW, photoH);
        
        // Image
        const innerPad = 15;
        ctx.drawImage(pCanvas, sideMargin + innerPad, currentY + innerPad, photoW - (innerPad*2), photoH - (innerPad*2));

        // 4. SMART STICKER PLACEMENT (Outside Frame)
        ctx.font = "40px Arial";
        const stickerIcon = stickers[index % stickers.length];
        
        if (index % 2 === 0) {
            // Right Side
            ctx.save();
            ctx.translate(canvas.width - sideMargin + 10, currentY + photoH - 20);
            ctx.rotate(0.2);
            ctx.fillText(stickerIcon, 0, 0);
            ctx.restore();
        } else {
            // Left Side
            ctx.save();
            ctx.translate(sideMargin - 30, currentY + 40);
            ctx.rotate(-0.2);
            ctx.fillText(stickerIcon, 0, 0);
            ctx.restore();
        }

        currentY += photoH + gap;
    });

    // 5. FOOTER
    ctx.fillStyle = "#555";
    let footerFont = "35px 'Patrick Hand', cursive";
    if(currentFont === 'Courier New') footerFont = "italic 30px 'Courier Prime', monospace";
    if(currentFont === 'Dancing Script') footerFont = "40px 'Dancing Script', cursive";
    
    ctx.font = footerFont;
    ctx.fillText(userFooter, canvas.width/2, currentY + 40);
    
    // Date
    ctx.font = "20px monospace";
    ctx.fillStyle = "#999";
    ctx.fillText(new Date().toDateString(), canvas.width/2, currentY + 75);

    document.getElementById('preview-strip-img').src = canvas.toDataURL('image/png');
}

// UI Helpers
function selectTheme(theme, btn) {
    currentTheme = theme;
    document.querySelectorAll('#theme-group .option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePreview();
}

function selectFont(font, btn) {
    currentFont = font;
    document.querySelectorAll('#font-group .option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePreview();
}

function finalizeAndPrint() {
    const imgData = document.getElementById('preview-strip-img').src;
    document.getElementById('preview-mode-ui').classList.add('hidden');
    printProcess(imgData);
}

function resetCamera() {
    document.getElementById('preview-mode-ui').classList.add('hidden');
    document.getElementById('post-print-options').classList.add('hidden');
    document.getElementById('printer-animation-area').classList.add('hidden');
    document.getElementById('btn-back-static').classList.remove('hidden');
    startCamera();
}

function printProcess(imgUrl) {
    const printerArea = document.getElementById('printer-animation-area');
    const paper = document.getElementById('photobooth-strip');
    const light = document.querySelector('.printer-light');
    const container = document.querySelector('.notebook-container'); 
    
    printerArea.classList.remove('hidden');
    paper.innerHTML = `<img src="${imgUrl}" style="width:100%; display:block;">`;
    
    light.classList.add('blink');
    paper.classList.remove('printing'); 
    
    setTimeout(() => {
        paper.classList.add('printing'); 
        container.classList.add('move-up'); 
    }, 100); 

    setTimeout(() => {
        light.classList.remove('blink');
        light.style.backgroundColor = "#00ff00";
        
        const link = document.createElement('a');
        link.href = imgUrl;
        link.download = 'piya-photobooth.png'; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Foto berhasil disimpan! 📸");

        document.getElementById('post-print-options').classList.remove('hidden');
        document.getElementById('btn-download').href = imgUrl;
        document.getElementById('btn-download').download = 'piya-photobooth.png';

        setTimeout(() => {
            container.classList.remove('move-up');
        }, 1000);

    }, 5500); 
}

function nextPage(pageId) {
    document.querySelectorAll('.page').forEach(el => { el.classList.add('hidden'); el.classList.remove('active') });
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden'); target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (pageId === 'cake-page') initCake();
        if (pageId === 'interaction') setupInteraction();
        if (pageId === 'gallery') loadGallery();
        if (pageId === 'photobooth-page') initPhotobooth();
    }
}
function showToast(message) { const toast = document.getElementById('toast-container'); toast.innerText = message; toast.classList.remove('hidden'); setTimeout(() => { toast.classList.add('show') }, 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { toast.classList.add('hidden') }, 500) }, 3000) }