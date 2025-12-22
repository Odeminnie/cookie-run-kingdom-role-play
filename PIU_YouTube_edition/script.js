let canvas, ctx;
let isPlaying = false;
let lastBeatTime = 0;
let beatInterval = 0;

let currentDifficulty = 'normal';
let noteSpeed = 650;
let spawnRateMultiplier = 1;

let lanePositions = [0, 0, 0, 0, 0];
let targetY = 100;
let noteScale = 1;
let combo = 0;
let activeNotes = [];

let isAutoPlay = false;
let stats = { perfect: 0, bad: 0, miss: 0, maxCombo: 0 };

// YouTube
let ytPlayer;
let apiReady = false;
let noteStartSec = 0;
let noteEndSec = 9999;

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

// --- New Trailer Logic ---
function showTrailer() {
    document.getElementById('disclaimer-screen').style.display = 'none';
    document.getElementById('trailer-screen').style.display = 'flex';
    
    const startPrompt = document.getElementById('start-prompt');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
        startPrompt.innerText = "PRESS ANY KEY TO START";
    }

    const audio = document.getElementById('trailer-audio');
    audio.play().catch(() => console.log("Audio waiting for interaction"));

    const startAction = (e) => {
        if(e.type === 'keydown' || e.type === 'mousedown' || e.type === 'touchstart') {
            audio.pause();
            document.getElementById('trailer-screen').style.display = 'none';
            document.getElementById('setup-panel').style.display = 'flex';
            window.removeEventListener('keydown', startAction);
            window.removeEventListener('mousedown', startAction);
            window.removeEventListener('touchstart', startAction);
        }
    };

    window.addEventListener('keydown', startAction);
    window.addEventListener('mousedown', startAction);
    window.addEventListener('touchstart', startAction);
}

// Load YouTube API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    apiReady = true;
    console.log("YouTube API Ready");
}

window.onload = () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    recalculateLayout();
    window.addEventListener('resize', recalculateLayout);
    setupController();
    
    // Start at Disclaimer
    document.getElementById('disclaimer-screen').style.display = 'flex';
};

function extractVideoID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

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
    const originalPoints = [58, 154, 256, 346, 442];
    lanePositions = originalPoints.map(p => rect.left + (p * noteScale));
}

function startGame() {
    const ytUrl = document.getElementById('youtubeUrl').value;
    const videoId = extractVideoID(ytUrl);
    
    if (!videoId) return alert("กรุณาใส่ลิงก์ YouTube ให้ถูกต้องครับ");
    if (!apiReady) return alert("ระบบ YouTube กำลังโหลด กรุณารอสักครู่");

    noteStartSec = parseFloat(document.getElementById('noteStartTime').value) || 0;
    noteEndSec = parseFloat(document.getElementById('noteEndTime').value) || 9999;
    bpm = parseInt(document.getElementById('bpmInput').value) || 130;
    isAutoPlay = document.getElementById('autoPlay').checked;

    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(()=>{});

    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('click-to-play').style.display = 'flex';

    if (ytPlayer) ytPlayer.destroy();
    ytPlayer = new YT.Player('yt-player', {
        videoId: videoId,
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'modestbranding': 1, 'rel': 0, 'playsinline': 1 },
        events: {
            'onReady': (event) => {
                document.getElementById('click-to-play').onclick = () => {
                    document.getElementById('click-to-play').style.display = 'none';
                    event.target.playVideo();
                    stats = { perfect: 0, bad: 0, miss: 0, maxCombo: 0 };
                    combo = 0; activeNotes = [];
                    configureDifficulty();
                    beatInterval = (60000 / bpm) * spawnRateMultiplier;
                    setTimeout(() => {
                        recalculateLayout();
                        isPlaying = true;
                        lastBeatTime = Date.now();
                        gameLoop();
                    }, 1000);
                };
            },
            'onStateChange': (event) => { if (event.data === YT.PlayerState.ENDED) showResults(); }
        }
    });
}

function gameLoop() {
    if (!isPlaying) return;
    let currentTime = ytPlayer.getCurrentTime();
    if (Date.now() > lastBeatTime + beatInterval) {
        if (currentTime >= noteStartSec && currentTime <= noteEndSec) {
            spawnNote();
        }
        lastBeatTime = Date.now();
    }
    updateAndDraw();
    requestAnimationFrame(gameLoop);
}

function spawnNote() {
    activeNotes.push({ lane: Math.floor(Math.random() * 5), y: window.innerHeight + 100, hit: false });
}

function updateAndDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const moveStep = noteSpeed / 60;
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let note = activeNotes[i];
        note.y -= moveStep;
        if (isAutoPlay && !note.hit && note.y <= targetY) handleInput(note.lane);
        const size = 120 * noteScale;
        if (!note.hit) {
            let img = assets.notes[note.lane];
            ctx.shadowBlur = 15;
            ctx.shadowColor = (note.lane === 2) ? "#ffff00" : (note.lane % 2 === 0 ? "#ff00ff" : "#00f3ff");
            ctx.drawImage(img, lanePositions[note.lane] - size/1.8, note.y - size/2, size, size);
            ctx.shadowBlur = 0;
        }
        if (note.y < targetY - (size * 1.2) && !note.hit) {
            triggerFeedback('miss');
            activeNotes.splice(i, 1);
        }
        if (note.y < -200) activeNotes.splice(i, 1);
    }
}

function handleInput(lane) {
    if (!isPlaying) return;
    const hitZone = 150 * noteScale;
    let notes = activeNotes.filter(n => n.lane === lane && !n.hit);
    if (notes.length > 0) {
        notes.sort((a,b) => a.y - b.y);
        let target = notes[0];
        let dist = Math.abs(target.y - targetY);
        if (dist <= hitZone) {
            target.hit = true;
            triggerFeedback(dist <= 60 * noteScale ? 'perfect' : 'bad');
        }
    }
}

function triggerFeedback(type) {
    const img = document.getElementById('judge-img');
    const txt = document.getElementById('combo-text');
    if (type === 'perfect') {
        combo++; stats.perfect++;
        if (combo > stats.maxCombo) stats.maxCombo = combo;
        img.src = assets.judge.perfect.src;
    } else if (type === 'bad') { combo = 0; stats.bad++; img.src = assets.judge.bad.src; }
    else { combo = 0; stats.miss++; img.src = assets.judge.miss.src; }
    img.style.opacity = 1;
    txt.innerText = combo > 0 ? combo : "";
    if(img.timer) clearTimeout(img.timer);
    img.timer = setTimeout(() => img.style.opacity = 0, 500);
}

function showResults() {
    isPlaying = false;
    if(ytPlayer) ytPlayer.stopVideo();
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('result-panel').style.display = 'flex';
    document.getElementById('res-perfect').innerText = stats.perfect;
    document.getElementById('res-bad').innerText = stats.bad;
    document.getElementById('res-miss').innerText = stats.miss;
    document.getElementById('res-combo').innerText = stats.maxCombo;
}

function setupController() {
    const handlePress = (e, lane) => {
        if(e.cancelable) e.preventDefault();
        handleInput(lane);
        document.querySelectorAll(`.pad-key[data-lane="${lane}"]`).forEach(b => {
            b.classList.add('pressed');
            setTimeout(() => b.classList.remove('pressed'), 100);
        });
    };
    document.querySelectorAll('.pad-key').forEach(btn => {
        const lane = parseInt(btn.dataset.lane);
        btn.addEventListener('touchstart', (e) => handlePress(e, lane), {passive: false});
        btn.addEventListener('mousedown', (e) => handlePress(e, lane));
    });
}
