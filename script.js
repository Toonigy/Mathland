function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    // Basic username/password check (simple for demo purposes)
    if (username === 'player1' && password === 'mathrpg123') {
        loginMessage.style.color = 'green';
        loginMessage.innerText = 'Login successful! Redirecting...';
        // Redirect to the game page (e.g., game.html)
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 2000);
    } else {
        loginMessage.style.color = 'red';
        loginMessage.innerText = 'Incorrect username or password.';
    }
}
