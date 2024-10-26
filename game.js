// Select UI Elements
const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");
const bgm = document.getElementById("bgm");
const toggleMusicBtn = document.getElementById("toggle-music-btn");
const settingsBtn = document.getElementById("settings-btn");
const backpackBtn = document.getElementById("backpack-btn");

// Battle Variables
let playerHealth = 100;
let enemyHealth = 100;
let currentEnemy;
let mathProblem;
let correctAnswer;

// Avatar Data
const avatarData = JSON.parse(localStorage.getItem("avatar")) || {
    color: "#ffcc00",
    size: 50,
    expression: "happy"
};

// Music state variable
let isMusicPlaying = false;

// Draw the Avatar on Canvas
function drawAvatar() {
    const { color, size, expression } = avatarData;

    // Clear previous frame
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw head
    gameCtx.fillStyle = color;
    gameCtx.beginPath();
    gameCtx.arc(200, 200, size, 0, Math.PI * 2);
    gameCtx.fill();

    // Draw eyes
    gameCtx.fillStyle = "#000";
    gameCtx.beginPath();
    gameCtx.arc(185, 190, size * 0.1, 0, Math.PI * 2);
    gameCtx.arc(215, 190, size * 0.1, 0, Math.PI * 2);
    gameCtx.fill();

    // Draw mouth based on expression
    gameCtx.beginPath();
    if (expression === "happy") {
        gameCtx.arc(200, 220, size * 0.4, 0, Math.PI, false); // Smiling
    } else if (expression === "sad") {
        gameCtx.arc(200, 230, size * 0.4, 0, Math.PI, true); // Frowning
    } else if (expression === "angry") {
        gameCtx.moveTo(185, 220);
        gameCtx.lineTo(215, 220); // Straight line
    }
    gameCtx.stroke();
}

// Initialize the game
function initGame() {
    drawAvatar();
    initUI(); // Initialize the UI
    toggleMusicBtn.addEventListener("click", toggleMusic);
    settingsBtn.addEventListener("click", openSettings);
    backpackBtn.addEventListener("click", openBackpack);
    
    // Start the game when page loads
    document.getElementById("start-battle-btn").addEventListener("click", startBattle);
}

// Start the battle
function startBattle() {
    document.getElementById("battle-ui").style.display = "block";
    currentEnemy = {
        name: "Goblin",
        health: 100,
    };
    enemyHealth = currentEnemy.health;
    updateHealthBars();
    generateMathProblem();
}

// Update health bars
function updateHealthBars() {
    document.getElementById("enemy-health-bar").style.width = enemyHealth + "%";
    document.getElementById("player-health-bar").style.width = playerHealth + "%";
}

// Generate a math problem
function generateMathProblem() {
    const num1 = Math.floor(Math.random() * 10) + 1; // Random number 1-10
    const num2 = Math.floor(Math.random() * 10) + 1; // Random number 1-10
    const operator = Math.random() > 0.5 ? '+' : '-';
    mathProblem = `${num1} ${operator} ${num2}`;
    correctAnswer = eval(mathProblem); // Use eval cautiously in production
    document.getElementById("math-question").innerText = `Solve: ${mathProblem}`;
}

// Handle answer submission
document.getElementById("submit-answer").addEventListener("click", () => {
    const playerAnswer = parseInt(document.getElementById("math-answer").value);
    if (playerAnswer === correctAnswer) {
        // Correct answer
        enemyHealth -= 20; // Damage enemy
        document.getElementById("battle-log").innerText = "Correct! You dealt 20 damage.";
    } else {
        // Incorrect answer
        playerHealth -= 10; // Damage player
        document.getElementById("battle-log").innerText = "Wrong answer! You took 10 damage.";
    }
    updateHealthBars();
    checkBattleOutcome();
    generateMathProblem(); // Generate new problem
});

// Heal button functionality
document.getElementById("heal-button").addEventListener("click", () => {
    playerHealth += 20; // Heal player
    if (playerHealth > 100) playerHealth = 100; // Cap at 100
    playerHealth -= 5; // Heal incurs some damage due to enemy attack
    document.getElementById("battle-log").innerText = "You healed 20 health but took 5 damage!";
    updateHealthBars();
    checkBattleOutcome();
});

// Check for battle outcome
function checkBattleOutcome() {
    if (enemyHealth <= 0) {
        document.getElementById("battle-log").innerText = "You defeated the enemy!";
        document.getElementById("battle-ui").style.display = "none"; // Hide battle UI
        playerHealth = 100; // Reset player health for next battle
        updateHealthBars();
    } else if (playerHealth <= 0) {
        document.getElementById("battle-log").innerText = "You have been defeated!";
        document.getElementById("battle-ui").style.display = "none"; // Hide battle UI
    }
}

// Play Background Music
function playBGM() {
    bgm.volume = 0.5; // Set the volume (0 to 1)
    bgm.play().catch(error => {
        console.error("Error playing BGM:", error);
    });
}

// Toggle Music On/Off
function toggleMusic() {
    if (isMusicPlaying) {
        bgm.pause();
        toggleMusicBtn.innerText = "Play Music";
    } else {
        playBGM(); // Call playBGM here to play the music
        toggleMusicBtn.innerText = "Mute Music";
    }
    isMusicPlaying = !isMusicPlaying; // Toggle the state
}

// Open Settings
function openSettings() {
    alert("Settings menu opened."); // Placeholder for settings functionality
}

// Open Backpack
function openBackpack() {
    alert("Backpack opened."); // Placeholder for backpack functionality
}

// Start the game when the page loads
window.onload = initGame;
