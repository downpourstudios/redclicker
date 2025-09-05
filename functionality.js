// === INNSTILLINGER ===
const SETTINGS = {
    forwardUrl: 'https://roedt.no/stem',
    shareUrl: 'https://rodtakershus.github.io/fellesskap/',
    winImage: 'logo_hvit.png',
    gameImage: './marie.png', // viktig med ./ her
    forwardButtonText: 'Del med en venn →',
    openInNewTab: true,
    logo: { 
        image: 'logo_hvit.png',
        tagline: 'Fordi \nfellesskap fungerer' 
    },
    // === LYDINNSTILLINGER ===
    sounds: {
        winScreen: 'winscreen.mp3', // La stå tom eller legg inn filnavn som 'win.mp3'
        sloganPop: 'eplepop.mp3', // La stå tom eller legg inn filnavn som 'pop.mp3'
        applePop: 'wrongsound.mp3' // La stå tom eller legg inn filnavn som 'apple.mp3'
    }
};

// Teller for sloganPop
let sloganCounter = 0;

// === LYDFUNKSJON ===
function playSound(soundKey) {
    const soundFile = SETTINGS.sounds[soundKey];
    if (!soundFile || soundFile === '') return; // Ingen lyd hvis tom
    
    try {
        // Håndter spesialtilfelle: sloganPop
        if (soundKey === "sloganPop") {
            sloganCounter++;

            // Bare spill hver tredje gang (3, 6, 9, …)
            if (sloganCounter % 3 !== 0) return;
        }

        const audio = new Audio(soundFile);

        if (soundKey === "sloganPop") {
            // Varier volumet mellom 0.2 og 0.5
            const min = 0.1;
            const max = 0.3;
            audio.volume = Math.random() * (max - min) + min;
        } else {
            // Standard volum for alt annet
            audio.volume = 0.3;
        }

        audio.play().catch(e => console.log('Lyd kunne ikke spilles:', e));
    } catch (e) {
        console.log('Lydfeil:', e);
    }
}


// === GLOBALE VARIABLER ===
let clickCount = 0;
const maxClicks = 100;
let slogans = [];
let apples = [];
const maxSlogansOnScreen = 3;
const maxApplesOnScreen = 3;
let appleMessageBox = null;
let appleSpawnInterval;
let sloganPositions = []; // Track alle brukte posisjoner
let lastSloganTime = 0.5; // Forhindre for rask spawning

// === MOBIL TOUCH VARIABLER ===
let lastTouchEnd = 0;
let touchStartTime = 0;

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
    { text: "-10 til Dag Inge Ulstein!", emoji: "👎", fallback: "" },
    { text: "Oljefondet ut av Israel!", emoji: "✊", fallback: "" },
    { text: "Nei til EUs energimarkedspakke!", emoji: "🚫", fallback: "" },
    { text: "Nei til EU, ja til folkestyre!", emoji: "💪", fallback: "" },
    { text: "Rettferdig miljøpolitikk!", emoji: "🌲", fallback: "" }
];

// === FORBEDRET DELEFUNKSJON ===
async function shareOrCopy(e) {
    e?.preventDefault();
    const url = SETTINGS.shareUrl || window.location.href;
    const btn = document.getElementById('shareButton');
    const originalText = btn.textContent;

    try {
        // Prøv å kopiere til utklippstavla først
        await navigator.clipboard.writeText(url);
        
        // Vis suksessmelding
        btn.textContent = 'Lenke kopiert! ✅';
        btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'linear-gradient(135deg, var(--progress-color), var(--progress-color))';
            btn.disabled = false;
        }, 2000);
        
    } catch (err) {
        // Fallback for eldre nettlesere
        try {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            btn.textContent = 'Lenke kopiert! ✅';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = 'linear-gradient(135deg, var(--progress-color), var(--progress-color))';
                btn.disabled = false;
            }, 2000);
            
        } catch (fallbackErr) {
            // Hvis alt feiler, vis lenke i en alert
            btn.textContent = 'Kunne ikke kopiere automatisk';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
            
            // Vis lenke i en enkel popup
            setTimeout(() => {
                alert(`Kopier denne lenken manuelt:\n\n${url}`);
            }, 100);
        }
    }
}

// === MOBIL TOUCH EVENTS ===
function preventZoom() {
    // Forhindre zoom ved dobbelttrykk
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Forhindre zoom ved pinch
    document.addEventListener('touchmove', function (event) {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // Forhindre kontekstmeny på lang-trykk
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });
}

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
function handleClick(event) {
    // Forhindre standard oppførsel på mobil
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (clickCount >= maxClicks) return;
    clickCount++;
    updateUI();
    showRandomSlogan();

    if (clickCount >= maxClicks) {
        clearInterval(appleSpawnInterval);
        setTimeout(() => { 
            poffAnimation(); 
            setTimeout(() => showWinScreen(), 800); // Lenger delay
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

// === FORBEDRET SLAGORD-PLASSERING MED GRID SYSTEM ===
function getNextSloganPosition() {
    const gameArea = document.querySelector('.game-area');
    const areaW = gameArea.offsetWidth;
    const areaH = gameArea.offsetHeight;
    
    // Definer et rutenett-system
    const gridCols = window.innerWidth < 480 ? 2 : 3;
    const gridRows = 2;
    
    const cellWidth = (areaW - 60) / gridCols; // 60px total margin
    const cellHeight = (areaH * 0.4) / gridRows; // Øvre 40% av området
    
    const allPositions = [];
    
    // Generer alle mulige posisjoner
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            const x = 30 + col * cellWidth + (cellWidth * 0.1); // 10% margin inni hver celle
            const y = 60 + row * cellHeight + (cellHeight * 0.1);
            allPositions.push({ x, y, occupied: false });
        }
    }
    
    // Sjekk hvilke posisjoner som er opptatt
    slogans.forEach(slogan => {
        if (!slogan.parentNode) return;
        
        const rect = slogan.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();
        const sloganX = rect.left - gameRect.left;
        const sloganY = rect.top - gameRect.top;
        
        // Merk nærmeste grid-posisjon som opptatt
        allPositions.forEach(pos => {
            const distance = Math.sqrt(
                Math.pow(sloganX - pos.x, 2) + 
                Math.pow(sloganY - pos.y, 2)
            );
            if (distance < 100) { // 100px radius
                pos.occupied = true;
            }
        });
    });
    
    // Finn første ledige posisjon
    const freePositions = allPositions.filter(pos => !pos.occupied);
    
    if (freePositions.length > 0) {
        // Velg tilfeldig fra ledige posisjoner
        return freePositions[Math.floor(Math.random() * freePositions.length)];
    }
    
    // Fallback: bruk en tilfeldig posisjon
    return allPositions[Math.floor(Math.random() * allPositions.length)];
}

// === OPPDATERT SLAGORD FUNKSJON MED TIMING CONTROL ===
function showRandomSlogan() {
    const now = Date.now();
    
    // Forhindre for rask spawning (minimum 200ms mellom slogans)
    if (now - lastSloganTime < 200) return;
    lastSloganTime = now;
    
    const gameArea = document.querySelector('.game-area');
    
    const slogan = document.createElement('div');
    slogan.className = 'slogan';
    
    const randomSlogan = slogansList[Math.floor(Math.random() * slogansList.length)];
    
    // Bruk emoji hvis støttet, ellers fallback
    if (emojiSupported && randomSlogan.emoji) {
        slogan.innerHTML = `${randomSlogan.text} <span class="emoji-fallback" data-emoji="${randomSlogan.fallback}">${randomSlogan.emoji}</span>`;
    } else {
        slogan.innerHTML = `${randomSlogan.text} <span class="emoji-fallback" data-emoji="${randomSlogan.fallback}"></span>`;
    }

    // Få grid-basert posisjon
    const position = getNextSloganPosition();
    
    slogan.style.left = `${position.x}px`;
    slogan.style.top = `${position.y}px`;

    gameArea.appendChild(slogan);
    slogans.push(slogan);
    
    // Spill lyd hvis satt
    playSound('sloganPop');

    // Trigger animasjon
    requestAnimationFrame(() => slogan.classList.add("show"));

    // Maks antall slogans samtidig
    if (slogans.length > maxSlogansOnScreen) {
        const old = slogans.shift();
        if (old && old.parentNode) old.remove();
    }

    // Auto-fjern etter 3.5 sek
    setTimeout(() => {
        if (slogan && slogan.parentNode) {
            slogan.remove();
            slogans = slogans.filter(s => s !== slogan);
        }
    }, 1500);
}

// === APPLE SPAWNING SYSTEM MED DEBUG ===
function startAppleSpawning() {
    console.log('Starter apple spawning...');
    
    // Clear any existing interval
    if (appleSpawnInterval) {
        clearInterval(appleSpawnInterval);
    }
    
    // Start med en gang for testing
    setTimeout(() => {
        if (clickCount < maxClicks && apples.length < maxApplesOnScreen) {
            spawnApple();
        }
    }, 2000); // Spawn første eple etter 2 sek
    
    appleSpawnInterval = setInterval(() => {
        console.log(`Apple check: ${apples.length}/${maxApplesOnScreen}, clickCount: ${clickCount}/${maxClicks}`);
        
        // Only spawn if we haven't reached max apples and game is still running
        if (apples.length < maxApplesOnScreen && clickCount < maxClicks) {
            spawnApple();
        }
    }, 2000 + Math.random() * 500); // Random interval between 4-7 seconds
}

function spawnApple() {
    console.log('Spawning apple...');
    
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) {
        console.error('Game area not found!');
        return;
    }
    
    const apple = document.createElement('div');
    apple.className = 'apple';
    
    // Create apple with fallback if image doesn't load
 //   apple.innerHTML = `<div style="width: 100%; height: 100%; background: red; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">🍎</div>`;
    
    // Try to load the actual image, but keep fallback if it fails
    const img = new Image();
    img.onload = function() {
        apple.innerHTML = `<img src="freple.png" alt="FrP Eple" style="width: 100%; height: 100%;">`;
    };
    img.onerror = function() {
        console.log('freple.png kunne ikke lastes, bruker fallback');
    };
    img.src = 'freple.png';
    
    // Random position in game area (avoid center where Marie is)
    const areaW = gameArea.offsetWidth;
    const areaH = gameArea.offsetHeight;
    
    console.log(`Game area dimensions: ${areaW}x${areaH}`);
    
    let x, y;
    let attempts = 0;
    do {
        x = Math.random() * (areaW - 80) + 40; // 40px margin
        y = Math.random() * (areaH - 80) + 40;
        
        // Ensure apple doesn't spawn too close to center (where Marie is)
        const centerX = areaW / 2;
        const centerY = areaH / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            
        );
        
        attempts++;
        if (attempts > 20) break; // Avoid infinite loop
    } while (Math.sqrt(Math.pow(x - areaW/2, 2) + Math.pow(y - areaH/2, 2)) < 100); // Keep 100px distance from center
    
    console.log(`Apple positioned at: ${x}, ${y}`);
    
    apple.style.left = `${x}px`;
    apple.style.top = `${y}px`;
    apple.style.position = 'absolute';
    apple.style.width = '30px';
    apple.style.height = '40px';
    apple.style.cursor = 'pointer';
    apple.style.zIndex = '10';
    apple.style.opacity = '0';
    apple.style.transform = 'scale(0.5)';
    apple.style.transition = 'all 0.3s ease';
    
    // Add click handler
    apple.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Apple clicked!');
        appleClick(apple);
    });
    
    apple.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Apple touched!');
        appleClick(apple);
    });
    
    gameArea.appendChild(apple);
    apples.push(apple);
    
    console.log(`Apple added to DOM. Total apples: ${apples.length}`);
    
    // Animate in
    requestAnimationFrame(() => {
        apple.style.opacity = '1';
        apple.style.transform = 'scale(1)';
    });
    //   const rotations = [-45, -30, -15, 0, 15, 30, 45];
    //const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
    // apple.style.transform = `rotate(${randomRotation}deg)`;

    // Auto-remove after 10 seconds if not clicked
    setTimeout(() => {
        if (apple && apple.parentNode) {
            console.log('Removing apple after timeout');
            apple.style.transition = 'all 0.5s ease';
            apple.style.opacity = '0';
            apple.style.transform = 'scale(0.5)';
            
            setTimeout(() => {
                if (apple.parentNode) apple.remove();
                apples = apples.filter(a => a !== apple);
                console.log(`Apple removed. Total apples: ${apples.length}`);
            }, 500);
        }
    }, 5000);
}

// === FORBEDRET WIN SCREEN MED BEDRE TEKSTFORMATERING ===
function showWinScreen() {
    document.getElementById('gameImage').style.display = 'none';
    if (SETTINGS.winImage) {
        document.getElementById('winImage').innerHTML = `<img src="${SETTINGS.winImage}" alt="Vinnerbilde">`;
    }
    document.querySelector('.forward-button').textContent = SETTINGS.forwardButtonText;
    
    // Spill vinnerlyd
    playSound('winScreen');
    
    // Bedre formatert tekst med balanserte avsnitt
    const winMessage = `
        <p>Nå har du gjort Marie så stor og sterk at hun ikke er til å komme utenom. Bra jobba!</p>
        
        <p>Men for at dette skal skje i virkeligheten må du faktisk gå og stemme på <strong>Rødt.</strong></p>
        
        <p>Din stemme har mye å si for å drive frem den forandringen som trengs. Vi lever i et forskjells-Norge, hvor naturen bygges ned bit for bit og verden ikke gjør alt som trengs for å stanse et pågående folkemord.</p>
        
        <p>Les mer om hva Rødt vil her:<br><a href="https://roedt.no/stem" target="_blank">https://roedt.no/stem</a></p>
        
        <p>Vi lover å bruke den styrken du gir oss.<br><strong>Godt valg!</strong></p>
    `;
    
    document.getElementById('winMessage').innerHTML = winMessage;
    
    // Vis win screen MED MER SYNLIG ANIMASJON
    const winScreen = document.getElementById('winScreen');
    const winContent = winScreen.querySelector('.win-content');
    
    winScreen.style.display = 'flex';
    
    // Kraftigere animasjon
    winContent.style.opacity = '0';
    winContent.style.transform = 'scale(0.5) translateY(100px) rotate(-5deg)';
    winContent.style.transition = 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bounce effect
    
    // Animert bakgrunn
    winScreen.style.backgroundColor = 'rgba(0,0,0,0)';
    winScreen.style.transition = 'background-color 0.8s ease';
    
    setTimeout(() => {
        winContent.style.opacity = '1';
        winContent.style.transform = 'scale(1) translateY(0) rotate(0deg)';
        winScreen.style.backgroundColor = 'rgba(0,0,0,0.9)';
    }, 50);
}

// === FORBEDRET POOF ANIMASJON ===
function poffAnimation() {
    const container = document.getElementById('gameImage');
    
    // Mer dramatisk poof med flere steg
    container.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    container.style.transform += ' scale(1.4) rotate(15deg)';
    
    setTimeout(() => { 
        container.style.transition = 'transform 0.6s ease, opacity 0.4s ease';
        container.style.transform = container.style.transform.replace(' scale(1.4) rotate(15deg)', ' scale(2) rotate(-10deg)'); 
        container.style.opacity = '0';
    }, 300);
}

// === APPLE CLICK ===
function appleClick(apple) {
    if (appleMessageBox) return;
    
    // Spill eple-lyd
    playSound('applePop');

    const box = document.createElement('div');
    box.className = 'apple-message-box fade-shake';
    
    box.innerHTML = `
        <div class="apple-image">
            <div style="width: 60px; height: 60px; background: red; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">🍎</div>
        </div>
        <div class="apple-message-content">
            <p>Ai, der kom du borti FRP's råtne politikk.</p>
            <p>Nå mister du litt poeng til fellesskapet.</p>
        </div>
        <button id="closeAppleBox" class="apple-close-btn">Kast vekk eplet</button>
    `;
    
    document.body.appendChild(box);
    appleMessageBox = box;
    
    // Disable main button temporarily
    const mainButton = document.getElementById('clickButton');
    mainButton.disabled = true;
    mainButton.style.opacity = '0.6';

    // Forbedret knapp-handling for mobil
    const closeBtn = document.getElementById('closeAppleBox');
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeAppleBox();
    });

    closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeAppleBox();
    });

    function closeAppleBox() {
        if (box && box.parentNode) {
            box.remove();
        }
        appleMessageBox = null;
        mainButton.disabled = false;
        mainButton.style.opacity = '1';
    }

    // Remove apple med animasjon
    if (apple && apple.parentNode) {
        apple.style.transition = 'all 0.3s ease';
        apple.style.opacity = '0';
        apple.style.transform += ' scale(0.5) rotate(180deg)';
        setTimeout(() => {
            if (apple.parentNode) apple.remove();
            apples = apples.filter(a => a !== apple);
        }, 300);
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
    lastSloganTime = 0;
    
    // Fjern alle slogans
    slogans.forEach(s => {
        if (s && s.parentNode) s.remove();
    });
    slogans = [];
    sloganPositions = [];
    
    // Reset progress bar
    document.getElementById('progressFill').style.width = '0%';
    
    // Reset Marie image
    const baseSize = window.innerWidth < 480 ? 80 : 100;
    const gameImage = document.getElementById('gameImage');
    gameImage.style.width = baseSize + 'px';
    gameImage.style.left = '50%';
    gameImage.style.transform = 'translateX(-50%)';
    gameImage.style.display = 'block';
    gameImage.style.opacity = '1';
    gameImage.style.filter = 'drop-shadow(0px 4px 20px rgba(255, 255, 255, 0))';
    
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

// === MOBIL IMAGE LOADING FIX ===
function ensureImageLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.onerror = function() {
            setTimeout(() => {
                const src = this.src;
                this.src = '';
                this.src = src;
            }, 100);
        };
        
        img.style.opacity = '1';
        img.style.visibility = 'visible';
    });
}

// === INITIALISERING ===
window.onload = function() {
    preventZoom();
    
    if (SETTINGS.gameImage) {
        const gameImage = document.getElementById('gameImage');
        gameImage.innerHTML = `<img src="${SETTINGS.gameImage}" alt="Marie" onload="this.style.opacity=1" onerror="console.log('Bildelastingsfeil: ${SETTINGS.gameImage}')">`;
    }
    
    if (SETTINGS.logo.image) {
        const logoImage = document.getElementById('logoImage');
        logoImage.innerHTML = `<img src="${SETTINGS.logo.image}" alt="Logo" onload="this.style.opacity=1" onerror="console.log('Logo lastingsfeil: ${SETTINGS.logo.image}')">`;
    } else {
        document.getElementById('logoImage').innerHTML = `<div style="background: white; border-radius: 50%; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">R</div>`;
    }
    
    document.getElementById('logoTagline').innerHTML = SETTINGS.logo.tagline.replace(/\n/g, '<br>');

    const clickButton = document.getElementById('clickButton');
    
    clickButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartTime = Date.now();
    });

    clickButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 500) {
            handleClick(e);
        }
    });

    startAppleSpawning();
    
    console.log('Styrkeklikker\'n er klar! Emoji støtte:', emojiSupported ? 'Ja' : 'Nei');
    console.log('Lydinnstillinger:', SETTINGS.sounds);
};




