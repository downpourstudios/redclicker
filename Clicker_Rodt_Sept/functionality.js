// === INNSTILLINGER ===
const SETTINGS = {
    forwardUrl: 'https://roedt.no/stem',
    winImage: 'logo_hvit.png',
    gameImage: 'marie_utklipp2.png',
    forwardButtonText: 'Del med en venn →',
    openInNewTab: true,
    logo: { 
        image: 'logo_hvit.png',
        tagline: 'Fordi \nfellesskap fungerer' 
    }
};

// === GLOBALE VARIABLER ===
let clickCount = 0;
const maxClicks = 100;
let slogans = [];
let apples = [];
const maxSlogansOnScreen = 3;
const maxApplesOnScreen = 4;
let appleMessageBox = null;
let appleSpawnInterval;

// === SLAGORD DATA med emoji-fallbacks ===
const slogansList = [
    { text: "+10 til gratis tannhelse", emoji: "🦷", fallback: "" },
    { text: "+10 til å gjøre mer for Palestina", emoji: "✊", fallback: "" },
    { text: "+10 til makspris på strøm", emoji: "⚡", fallback: "" },
    { text: "+10 til skattekutt for lave og vanlige inntekter!", emoji: "🪙", fallback: "" },
    { text: "+10 til å stoppe nedbygging av naturen", emoji: "🌲", fallback: "" },
    { text: "+10 til faste ansettelser", emoji: "📄", fallback: "" },
    { text: "+10 til rettferdig pensjon", emoji: "⚖️", fallback: "" },
    { text: "+10 til økte minsteytelser for eldre, syke og uføre", emoji: "🫂", fallback: "" },
    { text: "+10 til flere ansatte i velferden", emoji: "🗃️", fallback: "" },
    { text: "Kom igjen!", emoji: "💪", fallback: "" },
    { text: "Heia, heia!", emoji: "🎉", fallback: "" },
    { text: "Fortsett sånn!", emoji: "🤩", fallback: "" },
    { text: "-10 til Sylvi Listhaug!", emoji: "🥀", fallback: "" },
    { text: "-10 til Erna Solberg!", emoji: "❌", fallback: "" },
    { text: "-10 til Dag Inge Ulstein!", emoji: "👇", fallback: "" },
    { text: "Oljefondet ut av Israel!", emoji: "✊", fallback: "" },
    { text: "Nei til EUs energimarkedspakke!", emoji: "🚫", fallback: "" },
    { text: "Nei til EU, ja til folkestyre!", emoji: "💪", fallback: "" },
    { text: "Rettferdig miljøpolitikk!", emoji: "🌲", fallback: "" }
];

// === EMOJI SUPPORT CHECK ===
function supportsEmoji() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 1;
    ctx.textBaseline = 'top';
    ctx.font = '100px -apple-system, BlinkMacSystemFont';
    ctx.fillText('😀', -50, -50);
    const imageData = ctx.getImageData(0, 0, 1, 1).data;
    return imageData[0] !== 0 || imageData[1] !== 0 || imageData[2] !== 0;
}

const emojiSupported = supportsEmoji();

// === HOVEDKNAPP ===
function handleClick() {
    if (clickCount >= maxClicks) return;
    clickCount++;
    updateUI();
    showRandomSlogan();

    if (clickCount >= maxClicks) {
        clearInterval(appleSpawnInterval);
        setTimeout(() => { 
            poffAnimation(); 
            showWinScreen(); 
        }, 300);
    }
}

// === OPPDATER UI ===
function updateUI() {
    const progressPercent = (clickCount / maxClicks) * 100;
    document.getElementById('progressFill').style.width = progressPercent + '%';

    const baseSize = window.innerWidth < 480 ? 80 : 100;
    const imageScale = baseSize + clickCount * (window.innerWidth < 480 ? 1.5 : 2);
    const gameImage = document.getElementById('gameImage');
    gameImage.style.width = imageScale + 'px';
    gameImage.style.left = '50%';
    gameImage.style.transform = 'translateX(-50%)';

    // Oppdater glow effect basert på størrelse
    const glowIntensity = (clickCount / maxClicks) * 0.8; // Maks 0.8 opacity
    gameImage.style.filter = `drop-shadow(0px 4px 20px rgba(255, 255, 255, ${glowIntensity}))`;

    const button = document.getElementById('clickButton');
    if (clickCount >= 90) button.textContent = "NESTEN FERDIG!";
    else if (clickCount >= 80) button.textContent = "HOLD UT!";
    else if (clickCount >= 70) button.textContent = "DU NÆRMER DEG!";
    else if (clickCount >= 50) button.textContent = "HALVVEIS!";
    else if (clickCount >= 30) button.textContent = "HEIA!";
    else if (clickCount >= 20) button.textContent = "STÅ PÅ!";
    else if (clickCount >= 10) button.textContent = "DETTE KLARER VI!";
}

// === SLAGORD FUNKSJON ===
function showRandomSlogan() {
    const gameArea = document.querySelector('.game-area');
    const areaW = gameArea.offsetWidth;
    const areaH = gameArea.offsetHeight;

    const slogan = document.createElement('div');
    slogan.className = 'slogan';
    
    const randomSlogan = slogansList[Math.floor(Math.random() * slogansList.length)];
    
    // Bruk emoji hvis støttet, ellers fallback
    if (emojiSupported && randomSlogan.emoji) {
        slogan.innerHTML = `${randomSlogan.text} <span class="emoji-fallback" data-emoji="${randomSlogan.fallback}">${randomSlogan.emoji}</span>`;
    } else {
        slogan.innerHTML = `${randomSlogan.text} <span class="emoji-fallback" data-emoji="${randomSlogan.fallback}"></span>`;
    }

    // Spre slogans i øvre del av game-area, lenger unna toppen
    const margin = 60;
    const topMargin = 120; // Økt margin fra toppen
    const maxX = Math.max(areaW - 250, 100);
    const maxY = Math.max(areaH * 0.3 - 70, 50); // Redusert område

    const randomX = margin + Math.random() * maxX;
    const randomY = topMargin + Math.random() * maxY;

    slogan.style.left = `${randomX}px`;
    slogan.style.top = `${randomY}px`;

    gameArea.appendChild(slogan);
    slogans.push(slogan);

    // Trigger animasjon
    requestAnimationFrame(() => slogan.classList.add("show"));

    // Maks antall slogans samtidig
    if (slogans.length > maxSlogansOnScreen) {
        const old = slogans.shift();
        if (old && old.parentNode) old.remove();
    }

    // Auto-fjern etter 2.5 sek
    setTimeout(() => {
        if (slogan && slogan.parentNode) {
            slogan.remove();
            slogans = slogans.filter(s => s !== slogan);
        }
    }, 2500);
}

// === WIN SCREEN ===
function showWinScreen() {
    document.getElementById('gameImage').style.display = 'none';
    if (SETTINGS.winImage) {
        document.getElementById('winImage').innerHTML = `<img src="${SETTINGS.winImage}" alt="Vinnerbilde">`;
    }
    document.querySelector('.forward-button').textContent = SETTINGS.forwardButtonText;
    
    // Formatert tekst med avsnitt
    const winMessage = `
        <p>Nå har du gjort Marie så stor og sterk at hun ikke er til å komme utenom. 
        Bra jobba!</p>
        <p>Men for at dette skal skje i virkeligheten må du faktisk gå og stemme på <strong>Rødt.</strong></p>
        
        <p>Din stemme har mye å si for å drive frem den forandringen som trengs. Vi lever i et forskjells-Norge, hvor naturen bygges ned bit for bit og verden ikke gjør alt som trengs for å stanse et pågående folkemord.</p>
        
        <p>Det trengs et sterkt Rødt for å få til et vendepunkt. Vi kjemper om direktemandat i en lang rekke fylker og om utjevningsmandat i hele landet. Din stemme til Rødt kan være den avgjørende.</p>
        <p>Og uansett gir hver eneste stemme oss større muskler etter valget.</p>
        
        <p>Les mer om hva Rødt vil her: <a href="https://roedt.no/stem" target="_blank">https://roedt.no/stem</a></p>
        
        <p>Vi lover å bruke den styrken du gir oss.</p> 
        <p><strong>Godt valg!</strong></p>
    `;
    
    document.getElementById('winMessage').innerHTML = winMessage;
    document.getElementById('winScreen').style.display = 'flex';
}

// === POOF ANIMASJON ===
function poffAnimation() {
    const container = document.getElementById('gameImage');
    container.style.transition = 'transform 1s ease';
    container.style.transform += ' scale(1.2)';
    setTimeout(() => { 
        container.style.transform = container.style.transform.replace(' scale(1.2)', ''); 
    }, 100);
}

// === EPLER ===
function spawnApple() {
    if (clickCount >= 99) return;
    if (apples.length >= maxApplesOnScreen) return;

    const gameArea = document.querySelector('.game-area');
    const areaRect = gameArea.getBoundingClientRect();
    const progressBar = document.querySelector('.progress-bar');
    const progressRect = progressBar.getBoundingClientRect();

    const apple = document.createElement('img');
    apple.src = 'freple.png';
    apple.className = 'apple';
    apple.alt = 'Eple';

    const rotations = [-45, -30, -15, 0, 15, 30, 45];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
    apple.style.transform = `rotate(${randomRotation}deg)`;

    // Plasser epler under progress bar med bedre spredt plassering
    let leftPx, topPx, safe = false;
    let attempts = 0;
    
    const progressBarBottom = progressRect.bottom - areaRect.top;
    const minTop = progressBarBottom + 15; // 15px under progress bar
    const maxTop = areaRect.height - 70; // Ikke helt i bunnen
    
    const minSpacing = 80; // Økt minimum avstand mellom epler
    
    while (!safe && attempts < 15) {
        leftPx = 30 + Math.random() * (areaRect.width - 90); // Mer margin fra sidene
        topPx = minTop + Math.random() * (maxTop - minTop);
        
        safe = !apples.some(a => {
            const rect = a.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(rect.x - (areaRect.left + leftPx), 2) + 
                Math.pow(rect.y - (areaRect.top + topPx), 2)
            );
            return distance < minSpacing;
        });
        attempts++;
    }

    apple.style.left = `${leftPx}px`;
    apple.style.top = `${topPx}px`;

    apple.addEventListener('click', () => appleClick(apple));

    gameArea.appendChild(apple);
    apples.push(apple);

    // Auto remove etter 5-7 sek
    setTimeout(() => {
        if (apple && apple.parentNode) {
            apple.remove();
            apples = apples.filter(a => a !== apple);
        }
    }, 5000 + Math.random() * 2000);
}

function startAppleSpawning() {
    appleSpawnInterval = setInterval(() => {
        if (clickCount < 99) spawnApple();
    }, 1200 + Math.random() * 1800);
}

// === APPLE CLICK ===
function appleClick(apple) {
    if (appleMessageBox) return;

    const box = document.createElement('div');
    box.className = 'apple-message-box fade-shake';
    
    box.innerHTML = `
        <div class="apple-image">
            <img src="freple.png" alt="Eple">
        </div>
        <div class="apple-message-content">
            <p>Ai, hold deg unna de epleskrottene!</p>
            <p>Du får ikke minuspoeng, men de sakker deg ned litt og får deg til å bruke unødvendige krefter og ressurser...</p>
        </div>
        <button id="closeAppleBox" class="apple-close-btn">Lukk</button>
    `;
    
    document.body.appendChild(box);
    appleMessageBox = box;
    
    // Disable main button temporarily
    const mainButton = document.getElementById('clickButton');
    mainButton.disabled = true;
    mainButton.style.opacity = '0.6';

    document.getElementById('closeAppleBox').addEventListener('click', () => {
        box.remove();
        appleMessageBox = null;
        mainButton.disabled = false;
        mainButton.style.opacity = '1';
    });

    // Remove apple
    if (apple && apple.parentNode) {
        apple.remove();
        apples = apples.filter(a => a !== apple);
    }
}

// === BRUKERKNAPPER ===
function forwardUser() {
    if (SETTINGS.openInNewTab) {
        window.open(SETTINGS.forwardUrl, '_blank');
    } else {
        window.location.href = SETTINGS.forwardUrl;
    }
}

function resetGame() {
    clickCount = 0;
    
    // Fjern alle slogans
    slogans.forEach(s => {
        if (s && s.parentNode) s.remove();
    });
    slogans = [];
    
    // Reset progress bar
    document.getElementById('progressFill').style.width = '0%';
    
    // Reset Marie image
    const baseSize = window.innerWidth < 480 ? 80 : 100;
    const gameImage = document.getElementById('gameImage');
    gameImage.style.width = baseSize + 'px';
    gameImage.style.left = '50%';
    gameImage.style.transform = 'translateX(-50%)';
    gameImage.style.display = 'block';
    gameImage.style.filter = 'drop-shadow(0px 4px 20px rgba(255, 255, 255, 0))'; // Reset glow
    
    // Reset button text
    document.getElementById('clickButton').textContent = 'SETT I GANG!';
    document.getElementById('clickButton').disabled = false;
    document.getElementById('clickButton').style.opacity = '1';
    
    // Hide win screen
    document.getElementById('winScreen').style.display = 'none';

    // Remove all apples and restart spawning
    apples.forEach(a => {
        if (a && a.parentNode) a.remove();
    });
    apples = [];
    
    // Clear any existing apple message box
    if (appleMessageBox) {
        appleMessageBox.remove();
        appleMessageBox = null;
    }
    
    // Restart apple spawning
    clearInterval(appleSpawnInterval);
    startAppleSpawning();
}

// === INITIALISERING ===
window.onload = function() {
    // Set up game image
    if (SETTINGS.gameImage) {
        document.getElementById('gameImage').innerHTML = `<img src="${SETTINGS.gameImage}" alt="Marie">`;
    }
    
    // Set up logo
    if (SETTINGS.logo.image) {
        document.getElementById('logoImage').innerHTML = `<img src="${SETTINGS.logo.image}" alt="Logo">`;
    } else {
        document.getElementById('logoImage').innerHTML = `<div style="background: white; border-radius: 50%; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">R</div>`;
    }
    
    // Set up tagline with line breaks
    document.getElementById('logoTagline').innerHTML = SETTINGS.logo.tagline.replace(/\n/g, '<br>');

    // Start apple spawning
    startAppleSpawning();
    
    console.log('Styrkeklikker\'n er klar! Emoji støtte:', emojiSupported ? 'Ja' : 'Nei');
};