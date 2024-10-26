// Select UI Elements
const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");
const bgm = document.getElementById("bgm"); // Select the audio element
const toggleMusicBtn = document.getElementById("toggle-music-btn"); // Select the toggle button

// Avatar Data
const avatarData = JSON.parse(localStorage.getItem("avatar")) || {
    color: "#ffcc00",
    size: 50,
    expression: "happy"
};

// Music state variable
let isMusicPlaying = true;

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
    playBGM(); // Play background music

    // Add event listener for the toggle music button
    toggleMusicBtn.addEventListener("click", toggleMusic);
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
        bgm.play().catch(error => {
            console.error("Error playing BGM:", error);
        });
        toggleMusicBtn.innerText = "Mute Music";
    }
    isMusicPlaying = !isMusicPlaying; // Toggle the state
}

// Start the game when the page loads
window.onload = initGame;
