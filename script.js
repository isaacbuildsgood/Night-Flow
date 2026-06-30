// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const studyDurationInput = document.getElementById('studyDuration');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const progressFill = document.getElementById('progressFill');
const dailyMinutesEl = document.getElementById('dailyMinutes');
const quoteText = document.getElementById('quoteText');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const focusAudio = document.getElementById('focusAudio');

// Application State variables
let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let initialSecondsForSession = 0;
let isRunning = false;
let dailyStudiedMinutes = 0;
let isSoundPlaying = false;

// Motivational Quotes Array
const sessionQuotes = [
    "Stay locked in.",
    "Discipline over mood.",
    "No distractions. Just focus.",
    "The night is young. Keep pushing.",
    "Success is built in the dark.",
    "Breathe. Focus. Execute.",
    "Commitment is doing what you said long after the mood has left you."
];

// Initialize App
function initApp() {
    loadProgress();
    attachEventListeners();
    setRandomQuote();
}

// Attach Event Listeners
function attachEventListeners() {
    if (startBtn) startBtn.addEventListener('click', handleStart);
    if (pauseBtn) pauseBtn.addEventListener('click', handlePause);
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    if (soundToggleBtn) soundToggleBtn.addEventListener('click', handleSoundToggle);
    if (studyDurationInput) {
        studyDurationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleStart();
        });
    }
}

// Timer Logic Handlers
function handleStart() {
    if (isRunning) return; // Prevent multiple intervals

    const inputValue = parseInt(studyDurationInput.value, 10);
    
    // If we're not resuming an already started timer
    if (remainingSeconds <= 0) {
        if (isNaN(inputValue) || inputValue <= 0) {
            alert("Please enter a valid duration in minutes to start your session.");
            return;
        }

        remainingSeconds = inputValue * 60;
        initialSecondsForSession = remainingSeconds;
        setRandomQuote(); // Change quote on new session
        updateProgressBar(0);
    }
    
    isRunning = true;
    startBtn.textContent = "Running...";
    studyDurationInput.disabled = true;

    // Run interval
    timerInterval = setInterval(updateTimer, 1000);
}

function handlePause() {
    if (!isRunning) return;
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = "Resume";
}

function handleReset() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = "Start";
    studyDurationInput.disabled = false;
    
    const inputValue = parseInt(studyDurationInput.value, 10);
    if (!isNaN(inputValue) && inputValue > 0) {
        remainingSeconds = inputValue * 60;
        initialSecondsForSession = remainingSeconds;
    } else {
        remainingSeconds = 0;
        initialSecondsForSession = 0;
    }

    renderTimerDisplay();
    updateProgressBar(0);
}

// Core Timer Logic loop every second
function updateTimer() {
    if (remainingSeconds > 0) {
        remainingSeconds--;
        renderTimerDisplay();
        
        // Compute metrics
        const elapsed = initialSecondsForSession - remainingSeconds;
        const progressPercentage = (elapsed / initialSecondsForSession) * 100;
        
        updateProgressBar(progressPercentage);
        
        // Add 1 minute to total logic simply done every 60 seconds
        if (elapsed > 0 && elapsed % 60 === 0) {
            dailyStudiedMinutes++;
            saveProgress();
            renderTotalStudied();
        }
    } else {
        // Complete current session
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = "Start";
        studyDurationInput.disabled = false;
        
        updateProgressBar(100);
        
        // We could play a completion chime here if requested
        alert("Session completed! Great focus.");
        remainingSeconds = 0;
    }
}

// UI Renderers
function renderTimerDisplay() {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    const timeStr = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    
    if (timerDisplay) timerDisplay.textContent = timeStr;
    document.title = remainingSeconds > 0 ? `${timeStr} - NightFlow` : `NightFlow - Night Study Planner`;
}

function formatNumber(num) {
    return num.toString().padStart(2, '0');
}

// Progress Tracking Methods
function updateProgressBar(percentage) {
    if (progressFill) {
        progressFill.style.width = `${Math.min(100, percentage)}%`;
    }
}

function renderTotalStudied() {
    if (dailyMinutesEl) {
        dailyMinutesEl.textContent = dailyStudiedMinutes;
    }
}

// LocalStorage Persistence
function saveProgress() {
    // Generate an ID for today to track daily study and total study.
    const today = new Date().toDateString();
    let stats = JSON.parse(localStorage.getItem('nightFlowStats')) || {};
    
    if (!stats.history) stats.history = {};
    stats.history[today] = dailyStudiedMinutes;
    stats.total = (stats.total || 0) + 1; // Actually we handle total dynamically below but just storing structure
    
    localStorage.setItem('nightFlowStats', JSON.stringify(stats));
    localStorage.setItem('nightFlowTotalMinutes', dailyStudiedMinutes); // fallback for simplicity
}

function loadProgress() {
    // Check for today's data
    const today = new Date().toDateString();
    const statsStr = localStorage.getItem('nightFlowStats');
    
    if (statsStr) {
        try {
            const stats = JSON.parse(statsStr);
            if (stats.history && stats.history[today]) {
                dailyStudiedMinutes = stats.history[today];
            } else {
                dailyStudiedMinutes = 0; // New day reset logic
            }
        } catch (e) {
            console.error("Error parsing stats", e);
        }
    } else {
        // Fallback or old storage mechanism compatibility
        const savedMin = localStorage.getItem('nightFlowTotalMinutes');
        if (savedMin) dailyStudiedMinutes = parseInt(savedMin, 10);
    }
    
    renderTotalStudied();
}

// Motivational Quote Feature
function setRandomQuote() {
    if (!quoteText) return;
    
    quoteText.style.opacity = 0; // Fade out
    
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * sessionQuotes.length);
        quoteText.textContent = `"${sessionQuotes[randomIndex]}"`;
        quoteText.style.opacity = 1; // Fade in
    }, 500); // Wait for CSS transition
}

// Sound Management
function handleSoundToggle() {
    if (!focusAudio) return;

    if (isSoundPlaying) {
        focusAudio.pause();
        soundIcon.setAttribute('name', 'volume-mute-outline');
    } else {
        // Attempt to play (browsers require user interaction first)
        focusAudio.play().then(() => {
            soundIcon.setAttribute('name', 'volume-medium-outline');
        }).catch(err => {
            console.error("Audio playback failed:", err);
            alert("Could not play audio. Please interact with the page first.");
            isSoundPlaying = false;
        });
    }
    isSoundPlaying = !isSoundPlaying;
}

// Run Initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
