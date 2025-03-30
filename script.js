// --- Game State Variables ---
let currentScene = 'title';
let playerName = '';
let schoolInitials = '';
let playerGender = 'male'; // Default gender
let selectedInstrument = null;
let playerScore = 0;
let playerLives = 3;
let currentBackgroundColor = '#333333';
let currentMelody = []; // Target contour [1, -1, 0]
let currentMelodyNotes = []; // Pitches [261, 392, ...]
let currentMelodyLength = 0;
let currentGameState = 'promptingLength'; // promptingLength, playingMelody, awaitingChoice, awaitingInputStart, inputtingMelody, evaluating, showingResult, awaitingChangeChoice, gameOver
let playerInputContour = []; // Player's arrow inputs [1, -1, 0]
let avatarState = 'neutral'; // 'neutral', 'up', 'down'
let judgesAnimationInterval = null; // To control judges animation
let highScores = []; // Array to hold {name: '...', score: ...} objects
let gameInitialized = false; // Initialization Guard

// NEW: Tracking for melody length usage
let melodySuccessCounts = {}; // Stores { length: count }, e.g., { 3: 1, 4: 0, ... }
const MAX_SUCCESS_PER_LENGTH = 3; // Set the limit here
// --- End NEW ---

const instrumentMap = { // Used for mapping key digit to name internally if needed, but list index is simpler
    '1': 'trumpet', '2': 'french_horn', '3': 'euphonium', '4': 'tuba', '5': 'saxophone',
    '6': 'trombone', '7': 'clarinet', '8': 'flute', '9': 'oboe', '0': 'percussion'
};
const instrumentList = [ // Define order for dynamic generation AND keypad mapping
    'trumpet', 'french_horn', 'euphonium', 'tuba', 'saxophone',
    'trombone', 'clarinet', 'flute', 'oboe', 'percussion'
]; 

// --- Audio Setup ---
let audioContext;
const baseFrequency = 261.63; // Middle C (C4)
const noteDuration = 0.3; // Seconds
const noteGap = 0.1; // Seconds
let currentPitchHz;
const instrumentSounds = {
    'default': { type: 'triangle', attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.1, baseOctave: 4 },
    'trumpet': { type: 'sawtooth', attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.15, baseOctave: 5 },
    'french_horn': { type: 'sine', attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.2, baseOctave: 4 },
    'euphonium': { type: 'triangle', attack: 0.03, decay: 0.15, sustain: 0.7, release: 0.2, baseOctave: 4 },
    'tuba': { type: 'square', attack: 0.04, decay: 0.2, sustain: 0.6, release: 0.25, baseOctave: 3 },
    'saxophone': { type: 'sawtooth', attack: 0.03, decay: 0.1, sustain: 0.8, release: 0.15, baseOctave: 4 },
    'trombone': { type: 'sawtooth', attack: 0.04, decay: 0.15, sustain: 0.7, release: 0.2, baseOctave: 4 },
    'clarinet': { type: 'square', attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.1, baseOctave: 5 },
    'flute': { type: 'sine', attack: 0.01, decay: 0.05, sustain: 0.9, release: 0.1, baseOctave: 6 },
    'oboe': { type: 'sawtooth', attack: 0.02, decay: 0.08, sustain: 0.8, release: 0.1, baseOctave: 5 },
    'percussion': { type: 'sine', attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.1, baseOctave: 6, isPercussion: true },
};

// --- Melody Database ---
const melodyDatabase = {
    3: [ { name: "Up-Down", contour: [1, -1] }, { name: "Down-Up", contour: [-1, 1] }, { name: "Same-Up", contour: [0, 1] }, ],
    4: [ { name: "Scale Up", contour: [1, 1, 1] }, { name: "Up-Down-Up", contour: [1, -1, 1] }, { name: "Down-Same-Up", contour: [-1, 0, 1] }, ],
    5: [ { name: "Mary Had a Little Lamb (start)", contour: [-1, -1, 1, 1] }, { name: "Ode to Joy (start)", contour: [0, 1, 0, -1, -1, 1, -1] }, { name: "Twinkle Twinkle (start)", contour: [0, 1, 0, -1, 0, -1, 0] }, ],
    6: [ { name: "Simple 6 UpDown", contour: [1, 1, -1, -1, 1] }, { name: "Simple 6 DownUp", contour: [-1, -1, 1, 1, -1] }, ],
    7: [ { name: "Do Re Mi (start)", contour: [1, 1, -1, 1, 1, 1] }, ],
    8: [ { name: "Joy to the World (start)", contour: [-1, -1, -1, -1, -1, -1, 1]}, ],
    9: [ { name: "Long Scale", contour: [1, 1, 1, 1, -1, -1, -1, -1] } ]
};

// --- DOM Element References --- (Fetched in initializeGame)
let scenes = {};
let gameUiElement, livesDisplayElement, scoreDisplayElement, playerInfoDisplayElement;
let playerNameInput, schoolInitialsInput, genderMaleRadio, genderFemaleRadio;
let rSlider, gSlider, bSlider, rValueSpan, gValueSpan, bValueSpan;
let startButton, instrumentSelectorDiv, avatarSprite, instructionSection;
let lengthPromptDiv, feedbackTextDiv, changeInstrumentPromptDiv, changeInstrumentTextElement, gameplayInstructionElement; // Added gameplayInstructionElement here
let melodyLengthInput, setLengthButton, judgesSprite;
let finalScoreElement, highScoreListElement;


// --- Scene Management ---
function showScene(sceneName) {
    if (Object.keys(scenes).length === 0) { console.error(`Cannot show scene "${sceneName}". Scenes object not populated.`); populateScenesObject(); if (Object.keys(scenes).length === 0) return; } // Safety check
    if (currentScene === 'auditionStage' && sceneName !== 'auditionStage') { stopJudgesAnimation(); }
    for (let key in scenes) { if (scenes[key]) scenes[key].style.display = 'none'; } // Hide all
    if (scenes[sceneName]) { // Show target
        scenes[sceneName].style.display = 'flex'; scenes[sceneName].style.flexDirection = 'column'; scenes[sceneName].style.alignItems = 'center';
        const oldScene = currentScene; currentScene = sceneName; console.log(`Switched scene from "${oldScene}" to "${currentScene}"`);
        // Update UI visibility and content
        if (['instrumentSelect', 'auditionStage', 'gameOver'].includes(currentScene)) {
             updateScoreLivesDisplay();
             if (playerInfoDisplayElement) { playerInfoDisplayElement.textContent = `Player: ${playerName} | School: ${schoolInitials}`; } else { console.warn("playerInfoDisplayElement missing");}
             if(gameUiElement) gameUiElement.style.display = 'flex'; else console.warn("gameUiElement missing");
        } else { if(gameUiElement) gameUiElement.style.display = 'none'; }
        // Run scene-specific setup
        if (currentScene === 'instrumentSelect') { populateInstrumentSelector(); }
        if (currentScene === 'auditionStage') { setupAuditionStage(); startJudgesAnimation(); }
        if (currentScene === 'gameOver') { displayGameOverScreen(); }
    } else { console.error(`Attempted to switch to unknown or missing scene: "${sceneName}". Available:`, Object.keys(scenes)); }
}

// --- Setup Functions ---
function setupAuditionStage() {
    currentGameState = 'promptingLength';
    // Use gameplayInstructionElement for the initial prompt
    if (gameplayInstructionElement) {
        gameplayInstructionElement.textContent = "Select melody length (3-9 notes) and click 'Set Length'.";
        gameplayInstructionElement.style.display = 'block';
    } else { console.error("gameplayInstructionElement missing in setup"); }

    if (lengthPromptDiv) lengthPromptDiv.style.display = 'flex'; else console.error("lengthPromptDiv missing in setup");
    if (feedbackTextDiv) feedbackTextDiv.style.display = 'none'; // Hide other areas
    if (feedbackTextDiv) feedbackTextDiv.textContent = '';
    if (changeInstrumentPromptDiv) changeInstrumentPromptDiv.style.display = 'none';

    if (melodyLengthInput) melodyLengthInput.value = 3; else console.error("melodyLengthInput missing in setup");
    playerInputContour = [];
    setAvatarState('neutral');
    console.log("Audition Stage Setup.");
}

function populateInstrumentSelector() {
     if (!instrumentSelectorDiv) { console.error("instrumentSelectorDiv missing in populate"); return; }
    instrumentSelectorDiv.innerHTML = ''; // Clear first
    instrumentList.forEach((instrument, index) => {
        const key = (index + 1) % 10;
        const instrumentKeyName = instrument.replace(/_/g, ' ');
        const iconSrc = `assets/${playerGender}_${instrument}_idle.gif`; // Dynamic GIF
        const fallbackIconSrc = `assets/placeholder_icon.png`;
        const optionDiv = document.createElement('div'); optionDiv.classList.add('instrument-option'); optionDiv.dataset.instrument = instrument;
        const img = document.createElement('img');
        img.src = iconSrc; img.alt = `${instrumentKeyName} Icon`;
        img.onerror = () => { console.warn(`Failed icon: ${iconSrc}. Using fallback.`); img.src = fallbackIconSrc; img.onerror = null; }; // Fallback
        const p = document.createElement('p'); p.textContent = `${key}: ${instrumentKeyName.charAt(0).toUpperCase() + instrumentKeyName.slice(1)}`;
        optionDiv.appendChild(img); optionDiv.appendChild(p);
        optionDiv.addEventListener('click', handleInstrumentClick); // Attach listener here
        instrumentSelectorDiv.appendChild(optionDiv);
    });
     console.log("Instrument selector populated for gender:", playerGender);
}


// --- Animation Functions ---
function setAvatarState(state) {
    if (!avatarSprite) { console.error("Cannot set avatar state - avatarSprite element missing."); return; }
    if (!playerGender || !selectedInstrument) { console.warn(`Cannot set specific avatar state (${state}) - missing gender/instrument selection.`); avatarSprite.src = 'assets/placeholder_avatar_neutral.png'; return; }
    avatarState = state;
    const avatarSrc = `assets/${playerGender}_${selectedInstrument}_${state}.png`; // Dynamic PNG
    const fallbackAvatarSrc = `assets/placeholder_avatar_${state}.png`;
    console.log(`Setting avatar src: ${avatarSrc}`);
    avatarSprite.src = avatarSrc;
    avatarSprite.onerror = () => { console.error(`Failed avatar: ${avatarSrc}. Trying generic fallback.`); avatarSprite.src = fallbackAvatarSrc; avatarSprite.onerror = () => { console.error(`Failed generic fallback avatar: ${fallbackAvatarSrc}. Using neutral placeholder.`); avatarSprite.src = 'assets/placeholder_avatar_neutral.png'; avatarSprite.onerror = null; } };
}
function startJudgesAnimation() { if (judgesSprite) { judgesSprite.style.display = 'block'; console.log("Judges animation started (GIF)."); } else { console.warn("Judges sprite element not found."); } }
function stopJudgesAnimation() { console.log("Judges animation stopped (GIF)."); }


// --- UI Update Functions ---
function updateScoreLivesDisplay() { if (livesDisplayElement && scoreDisplayElement) { livesDisplayElement.textContent = `Lives: ${playerLives}`; scoreDisplayElement.textContent = `Score: ${playerScore}`; } else { console.warn("Score/Lives display elements not found"); } }

// --- High Score Functions ---
function updateHighScores(name, score) { highScores.push({ name: name, score: score }); highScores.sort((a, b) => b.score - a.score); highScores = highScores.slice(0, 5); console.log("High Scores Updated:", highScores); /* TODO: localStorage */ }
function displayHighScores() { if (!highScoreListElement) return; highScoreListElement.innerHTML = ''; if (highScores.length === 0) { highScoreListElement.innerHTML = '<li>No scores yet!</li>'; } else { highScores.forEach(entry => { const li = document.createElement('li'); li.textContent = `${entry.name}: ${entry.score}`; highScoreListElement.appendChild(li); }); } }
function displayGameOverScreen() { if(finalScoreElement) finalScoreElement.textContent = playerScore; displayHighScores(); }


// --- Utility Functions ---
function componentToHex(c) { const val = parseInt(c); if (isNaN(val)) return "00"; const clampedVal = Math.max(0, Math.min(255, val)); const hex = clampedVal.toString(16); return hex.length == 1 ? "0" + hex : hex; }
function rgbToHex(r, g, b) { const rVal = parseInt(r); const gVal = parseInt(g); const bVal = parseInt(b); if (isNaN(rVal) || isNaN(gVal) || isNaN(bVal)) { console.error("Invalid RGB:", r, g, b); return null; } return "#" + componentToHex(rVal) + componentToHex(gVal) + componentToHex(bVal); }
function getFrequency(step, baseOctave) { const octaveShift = baseOctave - 4; const base = baseFrequency * Math.pow(2, octaveShift); const stepMultiplier = Math.pow(2, (step * 2) / 12); const freq = base * stepMultiplier; return Math.max(20, freq); }

// *** MODIFIED to generate RANDOM melodies ***
function selectMelody(length) {
    console.log(`Generating random melody of length ${length}...`);
    const contourLength = length - 1; // Contour has one less element than total notes
    if (contourLength <= 0) {
        console.warn("Cannot generate contour for length less than 2.");
        return []; // Return empty array for invalid length
    }

    let randomContour = [];
    const possibleMoves = [1, -1, 0]; // Up, Down, Same

    for (let i = 0; i < contourLength; i++) {
        // Generate a random index (0, 1, or 2)
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        // Add the randomly selected move to the contour
        randomContour.push(possibleMoves[randomIndex]);
    }

    console.log(`Generated random contour: [${randomContour}]`);
    return randomContour;
}

// --- Audio Playback Functions ---
function initAudio() { if (!audioContext && (window.AudioContext || window.webkitAudioContext)) { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') { audioContext.resume().then(() => { console.log("Audio Context resumed."); }); } console.log("Audio Context Initialized. State:", audioContext.state); } catch(e) { console.error("Web Audio API init failed", e); audioContext = null; } } else if (!audioContext) { console.warn("Web Audio API not supported."); } }
function playNote(frequency, duration, instrument) { if (!audioContext || audioContext.state !== 'running') { console.warn(`Audio skip: Context not ready (State: ${audioContext ? audioContext.state : 'null'})`); return; } if (typeof frequency !== 'number' || frequency <= 0 || !isFinite(frequency)) { console.error("Invalid frequency:", frequency); return; } const soundProfile = instrumentSounds[instrument] || instrumentSounds['default']; const now = audioContext.currentTime; try { const osc = audioContext.createOscillator(); osc.type = soundProfile.type; osc.frequency.setValueAtTime(frequency, now); const gain = audioContext.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(1.0, now + soundProfile.attack); gain.gain.linearRampToValueAtTime(soundProfile.sustain, now + soundProfile.attack + soundProfile.decay); gain.gain.setValueAtTime(soundProfile.sustain, Math.max(now + soundProfile.attack + soundProfile.decay, now + duration - soundProfile.release)); gain.gain.linearRampToValueAtTime(0, now + duration); osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + duration); } catch (e) { console.error("Error playing note:", e); } }
async function playMelody(contour, instrument) {
    console.log(`--- playMelody START --- Instrument: ${instrument}, Contour: [${contour}]`); initAudio();
    if (!audioContext) { console.error("playMelody ABORT: AudioContext null."); if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Audio Error! Press 2?'; currentGameState = 'awaitingChoice'; return; }
    if (audioContext.state !== 'running') {
        console.warn(`playMelody Warning: Context state "${audioContext.state}". Resuming...`); try { await audioContext.resume(); console.log(`Resume finished. New state: ${audioContext.state}`); if (audioContext.state !== 'running') throw new Error("Not running after resume"); } catch (e) { console.error("playMelody ABORT: Resume failed:", e); if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Audio Error! Click screen, press 2?'; currentGameState = 'awaitingChoice'; return; }
    }
    console.log("playMelody: Context OK. Playing..."); currentGameState = 'playingMelody';
    if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Listen carefully...'; else { console.error("gameplayInstructionElement missing!"); return; }
    if(feedbackTextDiv) feedbackTextDiv.style.display = 'none'; // Hide other text areas
    const soundProfile = instrumentSounds[instrument] || instrumentSounds['default']; let currentStep = 0; currentMelodyNotes = [];
    try {
        let firstNoteFreq = getFrequency(currentStep, soundProfile.baseOctave); currentMelodyNotes.push(firstNoteFreq); console.log(`playMelody: Playing note 1 (${firstNoteFreq} Hz)...`); playNote(firstNoteFreq, noteDuration, instrument); await new Promise(r => setTimeout(r, (noteDuration + noteGap) * 1000));
        for (let i = 0; i < contour.length; i++) {
             if (currentGameState !== 'playingMelody') { console.warn("playMelody interrupted."); return; } const direction = contour[i]; /* calc step */ if (soundProfile.isPercussion && direction !== 0) { currentStep = direction > 0 ? currentStep + 1 : currentStep -1; } else if (!soundProfile.isPercussion) { currentStep += direction; } currentStep = Math.max(-7, Math.min(7, currentStep)); let nextFreq = getFrequency(currentStep, soundProfile.baseOctave); currentMelodyNotes.push(nextFreq); console.log(`playMelody: Playing note ${i+2} (${nextFreq} Hz)...`); playNote(nextFreq, noteDuration, instrument); await new Promise(r => setTimeout(r, (noteDuration + noteGap) * 1000));
         }
        console.log("playMelody: Playback finished ok."); if(gameplayInstructionElement) gameplayInstructionElement.textContent = "Press '1' to Listen Again, or '2' to Play."; currentGameState = 'awaitingChoice';
    } catch (error) { console.error("Error in playMelody loop:", error); if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Error playing. Press 2?'; currentGameState = 'awaitingChoice';
    } finally { console.log("--- playMelody END ---"); }
}


// --- Evaluation Function ---
// *** This is the CORRECTED version from previous steps ***
function evaluatePlayerInput() {
    console.log("Evaluating:", playerInputContour, "vs", currentMelody); let correct = true;
    if (playerInputContour.length !== currentMelody.length) { correct = false; console.error("Length mismatch!"); }
    else { for (let i = 0; i < currentMelody.length; i++) { if (playerInputContour[i] !== currentMelody[i]) { correct = false; break; } } }

    if(gameplayInstructionElement) gameplayInstructionElement.style.display = 'none'; // Hide "Evaluating..."
    if(lengthPromptDiv) lengthPromptDiv.style.display = 'none';

    if (correct) {
        playerScore += currentMelodyLength; 
 melodySuccessCounts[currentMelodyLength]++;
console.log("Correct! Score:", playerScore); updateScoreLivesDisplay();
        currentGameState = 'awaitingChangeChoice'; if(feedbackTextDiv) feedbackTextDiv.style.display = 'none';
        if(changeInstrumentTextElement) changeInstrumentTextElement.textContent = `Correct! +${currentMelodyLength} pts. Change Instrument? (Y/N)`;
        if(changeInstrumentPromptDiv) changeInstrumentPromptDiv.style.display = 'block'; else { console.error("changeInstrumentPromptDiv missing!"); }
    } else { // Incorrect
        playerLives -= 1; console.log("Incorrect. Lives:", playerLives); updateScoreLivesDisplay();
        currentGameState = 'showingResult';
        if(changeInstrumentPromptDiv) changeInstrumentPromptDiv.style.display = 'none';
        if(feedbackTextDiv) feedbackTextDiv.style.display = 'block'; else { console.error("feedbackTextDiv missing!"); }
        if (playerLives <= 0) { if(feedbackTextDiv) feedbackTextDiv.textContent = `Incorrect! No lives left!`; setTimeout(gameOver, 1500); }
        else { if(feedbackTextDiv) feedbackTextDiv.textContent = `Incorrect! Lives left: ${playerLives}`; setTimeout(() => { if (currentGameState !== 'gameOver') { setupAuditionStage(); } }, 2000); }
    }
}
function gameOver() { console.log("GAME OVER - Score:", playerScore); currentGameState = 'gameOver'; stopJudgesAnimation(); updateHighScores(`${playerName} (${schoolInitials})`, playerScore); showScene('gameOver'); }


// --- Event Listener Functions ---
function handleColorChange() {
    console.log("handleColorChange triggered."); if (!rSlider || !gSlider || !bSlider || !rValueSpan || !gValueSpan || !bValueSpan || !document.body) { console.error("handleColorChange: Elements missing!"); return; } try { const r = parseInt(rSlider.value); const g = parseInt(gSlider.value); const b = parseInt(bSlider.value); console.log(`Sliders: R=${r}, G=${g}, B=${b}`); rValueSpan.textContent = r; gValueSpan.textContent = g; bValueSpan.textContent = b; const hexColor = rgbToHex(r, g, b); console.log(`rgbToHex: ${hexColor}`); if (hexColor) { currentBackgroundColor = hexColor; document.body.style.backgroundColor = currentBackgroundColor; console.log(`BG Set: ${currentBackgroundColor}`); } else { console.error("Invalid hex color:", hexColor); } } catch (e) { console.error("Error in handleColorChange:", e); }
}
function handleStartGame() {
     console.log("handleStartGame called"); if (!playerNameInput || !schoolInitialsInput || !genderMaleRadio || !genderFemaleRadio) { console.error("handleStartGame: Missing elements"); return; } playerName = playerNameInput.value.trim(); schoolInitials = schoolInitialsInput.value.trim().toUpperCase(); playerGender = genderMaleRadio.checked ? 'male' : 'female'; if (!playerName) { alert("Enter name."); playerNameInput.focus(); return; } if (!schoolInitials) { alert("Enter initials."); schoolInitialsInput.focus(); return; } initAudio(); console.log("Starting game:", {playerName, schoolInitials, playerGender}); playerScore = 0; playerLives = 3;  melodySuccessCounts = { 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    console.log("Melody success counts reset:", melodySuccessCounts); updateScoreLivesDisplay(); console.log("Showing instrumentSelect..."); showScene('instrumentSelect');
}
function selectInstrumentAndProceed(instrumentName) { if (currentScene !== 'instrumentSelect') return; selectedInstrument = instrumentName; console.log("Instrument selected:", selectedInstrument); showScene('auditionStage'); }
function handleInstrumentClick(event) { const clickedElement = event.currentTarget; const instrument = clickedElement.dataset.instrument; console.log("Instrument clicked:", instrument); if (instrument) { selectInstrumentAndProceed(instrument); } else { console.error("Click failed: No instrument data."); } }

function handleGlobalKeyDown(event) {
    const key = event.key; const upperKey = key.toUpperCase();
    console.log(`Keydown: "${key}", State: ${currentGameState}, Scene: ${currentScene}`); initAudio();
    if (currentGameState === 'gameOver' && key === 'Enter') { console.log("Restarting..."); showScene('title'); return; }
    if (currentGameState === 'awaitingChangeChoice') { if (upperKey === 'Y') { console.log("Change: Yes"); showScene('instrumentSelect'); return; } else if (upperKey === 'N') { console.log("Change: No"); setupAuditionStage(); return; } console.log("Ignoring key"); return; }
    if (['playingMelody', 'evaluating', 'showingResult', 'gameOver'].includes(currentGameState)) { console.log("Input blocked state:", currentGameState); return; }
    if (currentScene === 'instrumentSelect') { if (/^[0-9]$/.test(key)) { const instrumentIndex = key === '0' ? 9 : parseInt(key) - 1; console.log(`Keypad ${key} -> Index ${instrumentIndex}`); if (instrumentIndex >= 0 && instrumentIndex < instrumentList.length) { const selected = instrumentList[instrumentIndex]; console.log(`Selecting: ${selected}`); selectInstrumentAndProceed(selected); return; } else { console.warn(`Index ${instrumentIndex} out of bounds.`); } } else { console.log(`Non-digit key ignored.`); } return; }
    else if (currentScene === 'auditionStage') { handleAuditionStageInput(key, event); }
    else { console.log("Key ignored in scene:", currentScene); }
}
function handleAuditionStageInput(key, event) {
    if (['evaluating', 'showingResult', 'gameOver', 'playingMelody', 'awaitingChangeChoice'].includes(currentGameState)) { return; } console.log("Audition Key:", key, "State:", currentGameState); let needsPreventDefault = false; if ( (currentGameState === 'awaitingInputStart' && key === ' ') || (currentGameState === 'inputtingMelody' && ['ArrowUp', 'ArrowDown', 'ArrowRight'].includes(key)) || (currentGameState === 'awaitingChoice' && (key === '1' || key === '2')) ) { needsPreventDefault = true; } if(needsPreventDefault) event.preventDefault(); switch (currentGameState) { case 'awaitingChoice': if (key === '1') { if (currentMelody && currentMelody.length > 0) { if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Listen carefully...'; if(feedbackTextDiv) feedbackTextDiv.style.display = 'none'; playMelody(currentMelody, selectedInstrument); } } else if (key === '2') { if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Get Ready! Press SPACE BAR...'; if(feedbackTextDiv) feedbackTextDiv.style.display = 'none'; currentGameState = 'awaitingInputStart'; playerInputContour = []; setAvatarState('neutral'); } break; case 'awaitingInputStart': if (key === ' ') { if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Use UP ▲, DOWN ▼, or RIGHT ▶ keys...'; if(feedbackTextDiv) feedbackTextDiv.style.display = 'none'; currentGameState = 'inputtingMelody'; playerInputContour = []; setAvatarState('neutral'); if(currentMelodyNotes && currentMelodyNotes.length > 0) { currentPitchHz = currentMelodyNotes[0]; playNote(currentPitchHz, noteDuration, selectedInstrument); } else { const p = instrumentSounds[selectedInstrument]||instrumentSounds['default']; currentPitchHz = getFrequency(0, p.baseOctave); playNote(currentPitchHz, noteDuration, selectedInstrument); } } break; case 'inputtingMelody': let d = null; let state = 'neutral'; if (key === 'ArrowUp') { d = 1; state = 'up'; } else if (key === 'ArrowDown') { d = -1; state = 'down'; } else if (key === 'ArrowRight') { d = 0; state = 'neutral'; } if (d !== null) { setAvatarState(state); playerInputContour.push(d); let nextF; const r = Math.pow(2, 2/12); if (d === 1) nextF = currentPitchHz * r; else if (d === -1) nextF = currentPitchHz / r; else nextF = currentPitchHz; nextF = Math.max(20, nextF); if (isFinite(nextF)) { playNote(nextF, noteDuration, selectedInstrument); currentPitchHz = nextF; } else { console.error("Invalid frequency:", nextF); } if (playerInputContour.length === currentMelody.length) { currentGameState = 'evaluating'; if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Evaluating...'; if(feedbackTextDiv) feedbackTextDiv.style.display = 'none'; setTimeout(evaluatePlayerInput, 100); } } break; }
}

// *** MODIFIED handleSetLengthClick with Usage Limit Check ***
function handleSetLengthClick() {
    console.log("handleSetLengthClick triggered. State:", currentGameState);
    if (currentGameState !== 'promptingLength') { console.warn("Set length clicked in wrong state:", currentGameState); return; }
    if (!melodyLengthInput) { console.error("Cannot set length - input element missing."); return; }

    const length = parseInt(melodyLengthInput.value);
    console.log("Requested length:", length);

    // --- NEW: Check usage limit ---
    // Use || 0 to handle cases where the count might be undefined initially
    if ((melodySuccessCounts[length] || 0) >= MAX_SUCCESS_PER_LENGTH) {
        alert(`You've already mastered length ${length} (${MAX_SUCCESS_PER_LENGTH} times)! Please choose a different length.`);
        console.log(`Length ${length} limit reached (${melodySuccessCounts[length]}/${MAX_SUCCESS_PER_LENGTH}). Blocking.`);
        if(melodyLengthInput) melodyLengthInput.focus(); // Keep focus on input
        return; // Stop processing this click
    }
    // --- End NEW ---

    // Validate length range (3-9)
    if (length >= 3 && length <= 9) {
        currentMelodyLength = length;
        const selectedContour = selectMelody(currentMelodyLength); // Select melody contour
        if (!selectedContour) { console.error("Failed to select melody contour."); alert("Error selecting melody."); return; }
        currentMelody = selectedContour; // Store contour
        console.log(`Melody set - Length: ${currentMelodyLength}, Contour: [${currentMelody}]`);

        // UI Updates for playback prep
        if(lengthPromptDiv) lengthPromptDiv.style.display = 'none'; else console.warn("lengthPromptDiv missing");
        if(feedbackTextDiv) feedbackTextDiv.style.display = 'none';
        if(changeInstrumentPromptDiv) changeInstrumentPromptDiv.style.display = 'none';
        if(gameplayInstructionElement) {
            gameplayInstructionElement.textContent = 'Preparing melody...'; // Show "Preparing" briefly
            gameplayInstructionElement.style.display = 'block';
        } else { console.error("gameplayInstructionElement missing!"); }

        // Call playMelody after short delay
        setTimeout(() => {
            console.log("Calling playMelody...");
            // Instruction will be updated inside playMelody to "Listen..."
            playMelody(currentMelody, selectedInstrument).catch(error => {
                 console.error("Error caught from playMelody call:", error);
                 if(gameplayInstructionElement) gameplayInstructionElement.textContent = 'Playback Error! Press 2?';
                 currentGameState = 'awaitingChoice'; // Allow recovery
            });
        }, 50); // Short delay

    } else { // Handle invalid length input (not 3-9)
        alert("Please enter length between 3 and 9.");
        if(melodyLengthInput) melodyLengthInput.focus();
    }
} 


// --- Initialization ---
function initializeGame() {
    console.log("Game Initializing..."); if (gameInitialized) { console.warn("Init already done."); return; }
    document.addEventListener('DOMContentLoaded', () => {
        if (gameInitialized) return; console.log("DOM Content Loaded - Initializing Game Setup"); gameInitialized = true;
        populateElementVariables(); // Fetch ALL elements first
        // Attach listeners IF elements exist
        if (rSlider && gSlider && bSlider) { rSlider.addEventListener('input', handleColorChange); gSlider.addEventListener('input', handleColorChange); bSlider.addEventListener('input', handleColorChange); handleColorChange(); console.log("Color Sliders listeners attached."); } else { console.error("COLOR SLIDER(S) MISSING."); }
        if (startButton) { startButton.addEventListener('click', handleStartGame); console.log("Start Button listener attached."); } else { console.error("START BUTTON MISSING."); }
        if (setLengthButton) { setLengthButton.addEventListener('click', handleSetLengthClick); console.log("Set Length Button listener attached."); } else { console.error("SET LENGTH BUTTON MISSING."); }
        document.addEventListener('keydown', handleGlobalKeyDown); console.log("Global keydown listener attached.");
        console.log("DOM-dependent setup complete.");
        console.log("Requesting initial scene display..."); showScene('title'); // Show initial scene LAST
     });
}
function populateElementVariables() { // Fetches all element references
    scenes = { title: document.getElementById('scene-title'), instrumentSelect: document.getElementById('scene-instrument-select'), auditionStage: document.getElementById('scene-audition-stage'), gameOver: document.getElementById('scene-game-over') };
    gameUiElement = document.getElementById('game-ui'); livesDisplayElement = document.getElementById('livesDisplay'); scoreDisplayElement = document.getElementById('scoreDisplay'); playerInfoDisplayElement = document.getElementById('playerInfoDisplay');
    playerNameInput = document.getElementById('playerName'); schoolInitialsInput = document.getElementById('schoolInitials'); genderMaleRadio = document.getElementById('genderMale'); genderFemaleRadio = document.getElementById('genderFemale');
    rSlider = document.getElementById('bgColorR'); gSlider = document.getElementById('bgColorG'); bSlider = document.getElementById('bgColorB'); rValueSpan = document.getElementById('rValue'); gValueSpan = document.getElementById('gValue'); bValueSpan = document.getElementById('bValue');
    startButton = document.getElementById('startButton'); instrumentSelectorDiv = document.getElementById('instrument-selector'); avatarSprite = document.getElementById('avatar-sprite'); instructionSection = document.getElementById('instruction-section'); gameplayInstructionElement = document.getElementById('gameplay-instruction');
    lengthPromptDiv = document.getElementById('length-prompt'); feedbackTextDiv = document.getElementById('feedback-text'); changeInstrumentPromptDiv = document.getElementById('change-instrument-prompt'); changeInstrumentTextElement = document.getElementById('change-instrument-text');
    melodyLengthInput = document.getElementById('melodyLength'); setLengthButton = document.getElementById('setLengthButton'); judgesSprite = document.getElementById('judges-sprite');
    finalScoreElement = document.getElementById('finalScore'); highScoreListElement = document.getElementById('highScoreList');
    console.log("DOM Elements Populated. Start Button found:", !!startButton, " Title Scene found:", !!scenes.title);
}
// function populateScenesObject(){} // No longer needed, handled by populateElementVariables


// --- Run Initialization ---
initializeGame();