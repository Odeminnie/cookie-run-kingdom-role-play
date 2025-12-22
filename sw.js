const CACHE_NAME = 'crk-ultimate-v1';

// รายการไฟล์ทั้งหมดที่จะเก็บลงในเครื่องผู้ใช้
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    
    // --- ไฟล์เสียงและรูปภาพหน้าหลัก ---
    './openingonwebsite.mp3',
    './menu_theme.mp3',
    './click.wav',
    './crk-logo.png',
    './po.jpeg',
    './11233e6cbfa399bb0c0292dc29f1d0a7.jpg',
    
    // --- PIU_MP3_edition ---
    './PIU_MP3_edition/Minigames.html',
    './PIU_MP3_edition/assets/receptor.png',
    './PIU_MP3_edition/assets/btn_0.png',
    './PIU_MP3_edition/assets/btn_1.png',
    './PIU_MP3_edition/assets/btn_2.png',
    './PIU_MP3_edition/assets/btn_3.png',
    './PIU_MP3_edition/assets/btn_4.png',

    // --- PIU_YouTube_edition ---
    './PIU_YouTube_edition/Minigames.html',
    './PIU_YouTube_edition/assets/receptor.png',
    './PIU_YouTube_edition/assets/btn_0.png',
    './PIU_YouTube_edition/assets/btn_1.png',
    './PIU_YouTube_edition/assets/btn_2.png',
    './PIU_YouTube_edition/assets/btn_3.png',
    './PIU_YouTube_edition/assets/btn_4.png'
];

// ติดตั้ง Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('PWA: Caching all assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// ล้าง Cache เก่าเมื่อมีการอัปเดตเวอร์ชัน
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// การดึงข้อมูล (Fetch Strategy: Cache First)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

