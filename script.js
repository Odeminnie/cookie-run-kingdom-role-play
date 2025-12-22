document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Element References ---
    const prologueScreen = document.getElementById('prologue-screen');
    const titleScreen = document.getElementById('title-screen');
    const kingdomHub = document.getElementById('kingdom-hub');
    const btnNext = document.getElementById('btn-next-step'); 
    
    // Audio Elements References
    const bgmOpening = document.getElementById('bgm-opening'); // เพลงหน้าแรก
    const bgmHub = document.getElementById('bgm-hub');         // เพลงหน้าเมนู
    const sfxClick = document.getElementById('sfx-click'); 
    
    // Tip Element
    const tipTextElement = document.getElementById('mc-tip-text');

    // Settings State
    let isSoundOn = true;
    let currentLang = 'th'; // 'th' or 'en'
    let tipInterval;

    // --- 2. Random Minecraft Tips ---
    const mcTips = [
        "Tip: อย่าขุดดินลงไปตรงๆ นะ เดี๋ยวตกลาวา!",
        "รู้หรือไม่: คุกกี้ผู้กล้าหาญกลัวน้ำใน Minecraft มาก",
        "Tip: เสียง Creeper ดังฟู่... รีบวิ่งหนีเร็ว!",
        "Fact: การสร้างบ้านด้วยดิน อาจโดน Enderman ขโมยได้",
        "Tip: กด F3 เพื่อดูพิกัดของอาณาจักร",
        "Tip: ต้องใช้ Obsidian 10 ก้อนเพื่อสร้างประตูไป Nether",
        "รู้หรือไม่: Villager ชอบมรกต แต่คุกกี้ชอบคริสตัล",
        "Tip: อย่าลืมปัก Torch รอบเมือง กันมอนสเตอร์เกิด",
        "Fact: การตกจากที่สูงแก้ได้ด้วยถังน้ำ (ถ้ากดทันนะ)",
        "Tip: ใส่ชุดเกราะเพชร ก่อนไปสู้กับมังกร!",
        "Tip: ถ้าหิว ให้กินขนมปัง (หรือ Jelly Bear ก็ได้)",
        "รู้หรือไม่: Sugar Gnome คือสถาปนิกที่เก่งที่สุดใน Server",
        "Tip: ระวัง! ตอนกลางคืนจะมีซอมบี้บุกเมือง",
        "Tip: ใช้ Bed เพื่อข้ามเวลากลางคืน",
        "Fact: แมวสามารถไล่ Creeper ได้นะ",
        "Tip: เจอลาวา? ลองเอาน้ำราดดูสิ ได้ Obsidian นะ",
        "Tip: Redstone มันซับซ้อน พอๆ กับสูตรทำลูกกวาด",
        "Tip: การขุดแบบ Strip Mining ช่วยหาเพชรได้ง่ายขึ้น",
        "รู้หรือไม่: นมช่วยล้างสถานะยาพิษได้",
        "Tip: อย่าไปจ้องหน้า Enderman นานๆ ล่ะ!",
        "Tip: พกอาหารติดตัวไว้เสมอ กองทัพต้องเดินด้วยท้อง"
    ];

    function pickRandomTip() {
        const randomIndex = Math.floor(Math.random() * mcTips.length);
        return mcTips[randomIndex];
    }

    function startTipRotation() {
        tipTextElement.innerText = pickRandomTip();
        tipTextElement.classList.add('visible');

        tipInterval = setInterval(() => {
            tipTextElement.classList.remove('visible');
            setTimeout(() => {
                tipTextElement.innerText = pickRandomTip();
                tipTextElement.classList.add('visible');
            }, 1000); 
        }, 5000); 
    }

    function stopTipRotation() {
        clearInterval(tipInterval);
    }

    // --- 3. Sound System ---
    function playClickSound() {
        if (sfxClick && isSoundOn) {
            sfxClick.currentTime = 0; 
            sfxClick.volume = 0.6; 
            sfxClick.play().catch(err => console.log("SFX play waiting"));
        }
    }

    function updateAudioState() {
        if (bgmOpening) bgmOpening.muted = !isSoundOn;
        if (bgmHub) bgmHub.muted = !isSoundOn;
        if (sfxClick) sfxClick.muted = !isSoundOn;
    }

    function fadeInAudio(audio, duration = 1000, maxVol = 0.4) {
        if (!audio) return;
        audio.volume = 0;
        audio.play().catch(err => console.log("Audio play prevented"));
        
        let step = maxVol / (duration / 50);
        let currentVol = 0;
        
        let fadeInterval = setInterval(() => {
            currentVol += step;
            if (currentVol >= maxVol) {
                audio.volume = maxVol;
                clearInterval(fadeInterval);
            } else {
                audio.volume = currentVol;
            }
        }, 50);
    }

    function fadeOutAudio(audio, duration = 1000) {
        if (!audio) return;
        let startVol = audio.volume;
        let step = startVol / (duration / 50);
        
        let fadeInterval = setInterval(() => {
            if (audio.volume - step <= 0) {
                audio.volume = 0;
                audio.pause();
                clearInterval(fadeInterval);
            } else {
                audio.volume -= step;
            }
        }, 50);
    }

    // --- 4. Navigation Logic ---
    btnNext.addEventListener('click', () => {
        playClickSound();
        if (isSoundOn) {
            fadeInAudio(bgmOpening, 1500, 0.4);
        } else {
            bgmOpening.volume = 0.4;
            bgmOpening.muted = true;
            bgmOpening.play().catch(e => console.log(e));
        }

        prologueScreen.style.opacity = '0';
        prologueScreen.style.transition = 'opacity 0.6s ease';
        setTimeout(() => {
            prologueScreen.classList.add('hidden');
            titleScreen.classList.remove('hidden');
            startTipRotation();
        }, 600);
    });

    titleScreen.addEventListener('click', () => {
        if (titleScreen.classList.contains('leaving')) return;
        playClickSound();
        stopTipRotation();

        fadeOutAudio(bgmOpening, 1500);
        
        if (isSoundOn) {
            setTimeout(() => {
                fadeInAudio(bgmHub, 2000, 0.3);
            }, 800);
        } else {
            bgmHub.volume = 0.3;
            bgmHub.muted = true;
            bgmHub.play().catch(e => console.log(e));
        }

        titleScreen.classList.add('leaving');
        titleScreen.style.opacity = '0';
        titleScreen.style.transition = 'opacity 0.8s ease-out';
        setTimeout(() => {
            titleScreen.classList.add('hidden');
            kingdomHub.classList.remove('hidden');
            setupMainDashboard();
        }, 800);
    });

    function setupMainDashboard() {
        const allButtons = document.querySelectorAll('.discord-gate-btn, .menu-item, .store-btn');
        allButtons.forEach((btn, index) => {
            btn.addEventListener('click', playClickSound);
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(30px) scale(0.9)';
            setTimeout(() => {
                btn.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0) scale(1)';
            }, 150 * index);
        });
    }

    // --- 5. Modal System ---
    window.openModal = function(id) {
        playClickSound();
        const overlay = document.getElementById('modal-overlay');
        const sections = document.querySelectorAll('.info-paper');
        
        sections.forEach(sec => sec.classList.add('hidden'));
        
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeModal = function() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    // เพิ่มฟังก์ชันสำหรับเล่นมินิเกม
    window.navigateGame = function(url) {
        playClickSound();
        window.location.href = url;
    };

    // --- 6. Profile & Settings Logic ---
    const soundCheck = document.getElementById('sound-toggle');
    if (soundCheck) {
        soundCheck.addEventListener('change', (e) => {
            isSoundOn = e.target.checked;
            updateAudioState();
            playClickSound();
        });
    }

    window.triggerDevAlert = function() {
        playClickSound();
        const msg = currentLang === 'th' ? "🛠️ ระบบกำลังพัฒนา..." : "🛠️ System under development...";
        alert(msg);
    };

    window.toggleLanguage = function() {
        playClickSound();
        currentLang = currentLang === 'th' ? 'en' : 'th';
        document.getElementById('current-lang-disp').innerText = currentLang.toUpperCase();
        const translatables = document.querySelectorAll('[data-th]');
        translatables.forEach(el => {
            if (currentLang === 'th') {
                el.innerHTML = el.getAttribute('data-th');
            } else {
                el.innerHTML = el.getAttribute('data-en');
            }
        });
    };
});
