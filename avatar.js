const canvas = document.getElementById("avatarCanvas");
const ctx = canvas.getContext("2d");

// Avatar Options
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const expressionInput = document.getElementById("expression");

function drawAvatar() {
    const color = colorInput.value;
    const size = parseInt(sizeInput.value);
    const expression = expressionInput.value;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(100, 100, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(85, 90, size * 0.1, 0, Math.PI * 2);
    ctx.arc(115, 90, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw mouth based on expression
    ctx.beginPath();
    if (expression === "happy") {
        ctx.arc(100, 110, size * 0.4, 0, Math.PI, false); // Smiling
    } else if (expression === "sad") {
        ctx.arc(100, 120, size * 0.4, 0, Math.PI, true); // Frowning
    } else if (expression === "angry") {
        ctx.moveTo(85, 110);
        ctx.lineTo(115, 110); // Straight line
    }
    ctx.stroke();
}

// Update avatar preview when options change
colorInput.addEventListener("input", drawAvatar);
sizeInput.addEventListener("input", drawAvatar);
expressionInput.addEventListener("change", drawAvatar);

// Initial draw
drawAvatar();

// Save Avatar and Start Game
function saveAvatar() {
    // Store avatar settings in local storage
    const avatarData = {
        color: colorInput.value,
        size: sizeInput.value,
        expression: expressionInput.value
    };
    localStorage.setItem("avatar", JSON.stringify(avatarData));

    // Redirect to game
    window.location.href = "game.html";
}
