let canvas, ctx;
let audio, bpm;
let isPlaying = false;
let lastBeatTime = 0;
let beatInterval = 0;

let currentDifficulty = 'normal';
let noteSpeed = 650;
let spawnRateMultiplier = 1;

let lanePositions = [-12, -8, 0, 0, 0];
let targetY = 100;
let noteScale = 1;
let combo = 0;
let activeNotes = [];

// ระบบคะแนนและ Auto Play
let isAutoPlay = false;
let stats = { perfect: 0, bad: 0, miss: 0, maxCombo: 0 };

const assets = {
    notes: [],
    judge: { perfect: new Image(), miss: new Image(), bad: new Image() }
};

for (let i = 0; i < 5; i++) {
    let img = new Image();
    img.src = `assets/note_${i}.png`;
    assets.notes.push(img);
}
assets.judge.perfect.src = 'assets/judge_perfect.png';
assets.judge.miss.src = 'assets/judge_miss.png';
assets.judge.bad.src = 'assets/judge_bad.png';

window.onload = () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    recalculateLayout();
    window.addEventListener('resize', recalculateLayout);
    setupController();
};

function selectDifficulty(level) {
    currentDifficulty = level;
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.diff-btn.${level}`).classList.add('active');
}

function configureDifficulty() {
    if (currentDifficulty === 'easy') { noteSpeed = 450; spawnRateMultiplier = 1.6; }
    else if (currentDifficulty === 'normal') { noteSpeed = 650; spawnRateMultiplier = 1.0; }
    else { noteSpeed = 950; spawnRateMultiplier = 0.6; }
}

function recalculateLayout() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const receptorImg = document.getElementById('receptor-img');
    const rect = receptorImg.getBoundingClientRect();
    if (rect.width === 0) return;

    targetY = rect.top + (rect.height / 2);
    noteScale = rect.width / 500;
    
    const originalPoints = [58, 154, 250, 346, 442];
    lanePositions = originalPoints.map(p => rect.left + (p * noteScale));
}

function startGame() {
    const file = document.getElementById('audioFile').files[0];
    if (!file) return alert("กรุณาเลือกไฟล์เพลงก่อนครับ");
    
    isAutoPlay = document.getElementById('autoPlay').checked;
    bpm = parseInt(document.getElementById('bpmInput').value) || 130;
    
    stats = { perfect: 0, bad: 0, miss: 0, maxCombo: 0 };
    combo = 0;
    activeNotes = [];

    configureDifficulty();
    beatInterval = (60000 / bpm) * spawnRateMultiplier;
    
    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    recalculateLayout();

    audio = new Audio(URL.createObjectURL(file));
    audio.onended = showResults; 
    audio.play().then(() => {
        isPlaying = true;
        lastBeatTime = Date.now();
        gameLoop();
    });
}

function gameLoop() {
    if (!isPlaying) return;
    if (Date.now() > lastBeatTime + beatInterval) {
        spawnNote();
        lastBeatTime = Date.now();
    }
    updateAndDraw();
    requestAnimationFrame(gameLoop);
}

function spawnNote() {
    activeNotes.push({
        lane: Math.floor(Math.random() * 5),
        y: window.innerHeight + 100, 
        hit: false
    });
}

function updateAndDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const moveStep = noteSpeed / 60;

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let note = activeNotes[i];
        note.y -= moveStep;
        
        // Auto Play Logic
        if (isAutoPlay && !note.hit && note.y <= targetY) {
            handleInput(note.lane);
        }

        // --- กำหนดขนาด Pixel ที่นี่ ---
        // หากต้องการขนาด 120x120 pixel ให้แก้เป็น:
        const size = 90; 
        
        // หรือถ้าอยากให้ขยายตามขนาดหน้าจอ (Responsive) แต่เริ่มที่ 100px:
        // const size = 100 * noteScale;

        if (!note.hit) {
            let img = assets.notes[note.lane];
            
            // เพิ่มรัศมีการเรืองแสงให้เข้ากับขนาดที่ใหญ่ขึ้น
            ctx.shadowBlur = 20; 
            ctx.shadowColor = (note.lane === 2) ? "#ffff00" : (note.lane % 2 === 0 ? "#ff00ff" : "#00f3ff");
            
            // วาดรูปให้กว้างและสูงเท่ากับ size (Pixel) เพื่อรักษาทรงสี่เหลี่ยมจัตุรัส
            ctx.drawImage(
                img, 
                lanePositions[note.lane] - size / 1.8, 
                note.y - size / 2, 
                100, 
                140
            );
            ctx.shadowBlur = 0;
        }

        // ส่วนการเช็ค Miss (ควรปรับระยะเผื่อตามขนาดโน้ตที่ใหญ่ขึ้น)
        if (note.y < targetY - (size * 0.8) && !note.hit) {
            triggerFeedback('miss');
            activeNotes.splice(i, 1);
        }
        
        if (note.y < -100) activeNotes.splice(i, 1);
    }
}


function handleInput(lane) {
    if (!isPlaying) return;
    const hitZone = 120 * noteScale;
    let notes = activeNotes.filter(n => n.lane === lane && !n.hit);
    
    if (notes.length > 0) {
        notes.sort((a,b) => a.y - b.y);
        let target = notes[0];
        let dist = Math.abs(target.y - targetY);

        if (dist <= hitZone) {
            target.hit = true;
            triggerFeedback(dist <= 50 * noteScale ? 'perfect' : 'bad');
        }
    }
}

function triggerFeedback(type) {
    const img = document.getElementById('judge-img');
    const txt = document.getElementById('combo-text');
    
    if (type === 'perfect') {
        combo++;
        stats.perfect++;
        if (combo > stats.maxCombo) stats.maxCombo = combo;
        img.src = assets.judge.perfect.src;
    } else if (type === 'bad') {
        combo = 0;
        stats.bad++;
        img.src = assets.judge.bad.src;
    } else {
        combo = 0;
        stats.miss++;
        img.src = assets.judge.miss.src;
    }

    img.style.opacity = 1;
    img.style.transform = "scale(1.3)";
    setTimeout(() => img.style.transform = "scale(1)", 80);
    txt.innerText = combo > 0 ? combo : "";
    
    if(img.timer) clearTimeout(img.timer);
    img.timer = setTimeout(() => img.style.opacity = 0, 500);
}

function showResults() {
    isPlaying = false;
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('result-panel').style.display = 'flex';
    
    document.getElementById('res-perfect').innerText = stats.perfect;
    document.getElementById('res-bad').innerText = stats.bad;
    document.getElementById('res-miss').innerText = stats.miss;
    document.getElementById('res-combo').innerText = stats.maxCombo;
}

function setupController() {
    document.querySelectorAll('.pad-btn').forEach(btn => {
        const lane = parseInt(btn.dataset.lane);
        const press = (e) => { e.preventDefault(); handleInput(lane); };
        btn.addEventListener('touchstart', press, {passive: false});
        btn.addEventListener('mousedown', press);
    });
    
    // Key Support
    const keyMap = {'z':0, 'q':1, 's':2, 'e':3, 'c':4};
    window.addEventListener('keydown', (e) => {
        if (keyMap[e.key] !== undefined) handleInput(keyMap[e.key]);
    });
}
