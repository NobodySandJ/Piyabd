let data = {};
let currentAge = 19; 
const REFERENCE_YEAR = 2026; 

fetch('data.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        initWebsite();
    })
    .catch(err => console.error("Gagal memuat data:", err));

function initWebsite() {
    const audio = document.getElementById('bg-music');
    audio.src = data.musik;
    audio.volume = 0.6; 
    
    document.getElementById('intro-title').innerText = data.halaman_awal.judul;
    document.getElementById('intro-sub').innerText = data.halaman_awal.subjudul;
    document.getElementById('btn-start').innerText = data.halaman_awal.tombol_mulai;
    
    document.getElementById('verif-title').innerText = data.halaman_verifikasi.tanya;
    document.getElementById('verif-sub').innerText = data.halaman_verifikasi.sub_tanya;
    document.getElementById('btn-verif-yes').innerText = data.halaman_verifikasi.tombol_benar;
    document.getElementById('btn-verif-no').innerText = data.halaman_verifikasi.tombol_salah;
    document.getElementById('slider-label').innerText = data.halaman_verifikasi.label_slider;
}

function startCelebration() {
    document.getElementById('bg-music').play().catch(e => {
        showToast("Klik sekali lagi nanti buat musik ya! 🎵");
    });
    nextPage('verification');
}

function confirmAge(isTrue) {
    if (isTrue) {
        currentAge = 19; 
        showToast("Yeay! Sweet Nineteen! 🍵");
        setTimeout(() => { nextPage('cake-page'); }, 1000);
    } else {
        const sliderVal = document.getElementById('year-slider').value;
        currentAge = REFERENCE_YEAR - parseInt(sliderVal);
        showToast(`Oke, umur kamu ${currentAge} tahun!`);
        setTimeout(() => { nextPage('cake-page'); }, 1000);
    }
}

function showSlider() {
    document.getElementById('verif-buttons').classList.add('hidden');
    document.getElementById('slider-container').classList.remove('hidden');
    updateSliderVal(2007);
}

function updateSliderVal(val) {
    document.getElementById('year-display').innerText = val;
    const ageCalc = REFERENCE_YEAR - val;
    const btnText = data.halaman_verifikasi.tombol_lanjut_slider.replace('{usia}', ageCalc);
    document.getElementById('btn-slider-go').innerText = btnText;
}

function initCake() {
    document.getElementById('cake-title').innerText = data.halaman_kue.judul;
    const msgElement = document.getElementById('cake-msg');
    msgElement.innerText = data.halaman_kue.ucapan_sebelum;
    msgElement.style.opacity = 1;

    document.getElementById('cake-flame').classList.remove('padam');
    
    document.getElementById('btn-blow').innerText = data.halaman_kue.tombol_tiup;
    document.getElementById('btn-to-letter').innerText = data.halaman_kue.tombol_lanjut; 
    
    document.getElementById('btn-to-letter').classList.add('hidden');
    document.getElementById('btn-blow').classList.remove('hidden');
}

function blowCandle() {
    const flame = document.getElementById('cake-flame');
    const smoke = document.getElementById('smoke-effect');
    const msgElement = document.getElementById('cake-msg');
    const btnBlow = document.getElementById('btn-blow');
    const btnToLetter = document.getElementById('btn-to-letter');

    msgElement.style.opacity = 0;
    flame.classList.add('padam');
    
    smoke.classList.remove('hidden');
    smoke.style.animation = 'none';
    smoke.offsetHeight; 
    smoke.style.animation = 'floatUp 2.5s ease-out forwards'; 

    setTimeout(() => {
        msgElement.innerText = data.halaman_kue.ucapan_sesudah;
        msgElement.style.opacity = 1;

        btnBlow.classList.add('hidden');
        btnToLetter.classList.remove('hidden'); 
    }, 2000);
}

function goToLetter() {
    nextPage('letter');
    isiSurat();
}

function isiSurat() {
    const rawTitle = data.surat.judul_kertas;
    const rawContent = data.surat.isi_pesan;
    
    document.getElementById('letter-title').innerHTML = rawTitle;
    document.getElementById('letter-content').innerHTML = rawContent.replace(/{usia}/g, currentAge);
    document.getElementById('letter-sign').innerHTML = data.surat.ttd;
}

function nextPage(pageId) {
    document.querySelectorAll('.page').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');

        if (pageId === 'cake-page') initCake();
        if (pageId === 'interaction') setupInteraction();
        if (pageId === 'gallery') loadGallery();
    }
}

function setupInteraction() {
    document.getElementById('question').innerText = data.interaksi.tanya;
    document.getElementById('btn-yes').innerText = data.interaksi.tombol_ya;
    document.getElementById('btn-no').innerText = data.interaksi.tombol_lari;
}

function dodgeButton() {
    const btnNo = document.getElementById('btn-no');
    const maxX = window.innerWidth * 0.6;
    const maxY = window.innerHeight * 0.6;
    const x = Math.random() * maxX - (maxX/2); 
    const y = Math.random() * maxY - (maxY/2);
    btnNo.style.transform = `translate(${x}px, ${y}px)`;
    btnNo.style.transition = "transform 0.2s ease-out";
}

function showToast(message) {
    const toast = document.getElementById('toast-container');
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.classList.add('hidden'); }, 500);
    }, 3000);
}

function sayYes() {
    showToast(data.interaksi.pesan_ya);
    setTimeout(() => { nextPage('gallery'); }, 2000);
}

// --- FUNGSI LOAD GALLERY & 3D CAROUSEL ---
function loadGallery() {
    // 1. Polaroid (Bagian Atas - Tetap Sama)
    const container = document.getElementById('polaroid-container');
    container.innerHTML = ''; 

    data.galeri.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('polaroid');
        div.style.animation = `fadeIn 0.8s ease-out ${index * 0.2}s backwards`;
        const randomRotate = Math.floor(Math.random() * 20) - 10;
        div.style.transform = `rotate(${randomRotate}deg)`;
        div.innerHTML = `<img src="${item.src}" alt="Foto Piya"><div class="caption">${item.caption}</div>`;
        container.appendChild(div);
    });

    // 2. 3D Carousel (Bagian Bawah)
    const track = document.getElementById('carousel-track');
    track.innerHTML = '';

    // Ambil data foto. Jika sedikit, kita duplikat agar lingkaran terlihat penuh
    let photos = (data.foto_banyak && data.foto_banyak.length > 0) ? data.foto_banyak : data.galeri.map(g => g.src);
    
    // Minimal ada 8 foto biar lingkaran bagus. Kalau kurang, duplikat arraynya
    while (photos.length < 8) {
        photos = photos.concat(photos);
    }

    // Konfigurasi Radius (Jarak foto dari titik tengah)
    // Semakin banyak foto, radius harus makin besar biar tidak tumpuk
    const radius = 250; 
    const totalPhotos = photos.length;
    const angleStep = 360 / totalPhotos; // Jarak sudut antar foto

    photos.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = "Foto 3D";
        
        // HITUNG POSISI 3D:
        // 1. Putar sesuai urutan (rotateY)
        // 2. Dorong keluar sejauh radius (translateZ)
        const theta = index * angleStep;
        img.style.transform = `rotateY(${theta}deg) translateZ(${radius}px)`;
        
        track.appendChild(img);
    });
}