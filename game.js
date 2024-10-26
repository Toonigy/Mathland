// Select UI Elements
const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");
const healthBar = document.getElementById("health-bar");
const levelDisplay = document.getElementById("level-display");

// Game State Variables
let health = 100; // Start with full health
let level = 1;    // Start at level 1

// Avatar Data
const avatarData = JSON.parse(localStorage.getItem("avatar")) || {
    color: "#ffcc00",
    size: 50,
    expression: "happy"
};

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

// Update Health
function updateHealth(amount) {
    health += amount;
    if (health > 100) health = 100; // Cap health at 100%
    if (health < 0) health = 0;     // Min health at 0%

    // Update health bar width based on health percentage
    healthBar.style.width = health + "%";

    // Change health bar color based on health level
    if (health > 60) {
        healthBar.style.backgroundColor = "#4CAF50"; // Green
    } else if (health > 30) {
        healthBar.style.backgroundColor = "#FFD700"; // Yellow
    } else {
        healthBar.style.backgroundColor = "#FF4500"; // Red
    }

    // Check if health is zero (game over condition)
    if (health === 0) {
        alert("Game Over!");
        resetGame();
    }
}

// Update Level
function updateLevel() {
    level++;
    levelDisplay.innerText = "Level: " + level;
}

// Reset Game
function resetGame() {
    health = 100;
    level = 1;
    updateHealth(0); // Reset health bar
    levelDisplay.innerText = "Level: 1";
}

// Game Events (Simulate leveling up)
function simulateGameEvents() {
    // Level up every 10 seconds
    setInterval(() => {
        updateLevel();
    }, 10000);
}

// Initialize the game
function initGame() {
    drawAvatar();
    updateHealth(0);      // Set initial health bar
    simulateGameEvents(); // Start simulated events
}

// Start the game when the page loads
window.onload = initGame;
