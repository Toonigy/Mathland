// Select UI Elements
const healthBar = document.getElementById("health-bar");
const levelDisplay = document.getElementById("level-display");

// Game State Variables
let health = 100; // Start with full health
let level = 1;    // Start at level 1

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

// Initialize the UI
function initUI() {
    updateHealth(0); // Set initial health bar
    simulateGameEvents(); // Start simulated events
}

// Expose UI functions to the global scope
window.updateHealth = updateHealth;
window.updateLevel = updateLevel;
window.resetGame = resetGame;
window.initUI = initUI;
