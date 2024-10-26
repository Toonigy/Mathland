const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");

// Retrieve avatar data from local storage
const avatarData = JSON.parse(localStorage.getItem("avatar"));

function drawGameAvatar() {
    if (!avatarData) {
        console.error("No avatar data found. Redirecting to avatar creation.");
        window.location.href = "avatar.html";
        return;
    }

    const { color, size, expression } = avatarData;

    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw avatar in game (similar to avatar creation)
    gameCtx.fillStyle = color;
    gameCtx.beginPath();
    gameCtx.arc(200, 200, parseInt(size), 0, Math.PI * 2);
    gameCtx.fill();

    gameCtx.fillStyle = "#000";
    gameCtx.beginPath();
    gameCtx.arc(185, 190, parseInt(size) * 0.1, 0, Math.PI * 2);
    gameCtx.arc(215, 190, parseInt(size) * 0.1, 0, Math.PI * 2);
    gameCtx.fill();

    gameCtx.beginPath();
    if (expression === "happy") {
        gameCtx.arc(200, 220, parseInt(size) * 0.4, 0, Math.PI, false);
    } else if (expression === "sad") {
        gameCtx.arc(200, 230, parseInt(size) * 0.4, 0, Math.PI, true);
    } else if (expression === "angry") {
        gameCtx.moveTo(185, 220);
        gameCtx.lineTo(215, 220);
    }
    gameCtx.stroke();
}

// Draw the avatar in the game
drawGameAvatar();
