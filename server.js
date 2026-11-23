/**
 * ============================================================================
 * MATHLAND MMORPG - PART 1: AUTHORITATIVE NODE.JS GAME SERVER
 * ============================================================================
 * Architecture:
 * - Express: Serves static client assets (for Part 2) and health checks.
 * - Socket.io: Handles low-latency, bidirectional WebSocket communication.
 * - Authoritative State: The server owns all player positions, HP, XP, levels,
 *   and active math encounters to prevent client-side cheating.
 *
 * Setup Instructions:
 * 1. mkdir mathland && cd mathland
 * 2. npm init -y
 * 3. npm install express socket.io
 * 4. node server.js
 * ============================================================================
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Initialize Express and HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS enabled for flexible local/dev testing
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ============================================================================
// SERVER CONFIGURATION & WORLD CONSTANTS
// ============================================================================
const PORT = process.env.PORT || 3000;
const TICK_RATE = 20; // 20 server state broadcasts per second (50ms intervals)

const WORLD_CONFIG = {
  width: 2000,
  height: 2000,
  spawnX: 1000,
  spawnY: 1000,
  maxSpeed: 15, // Max allowed units per movement packet (anti-speedhack)
  zones: {
    ARITHMETIC_MEADOWS: { minLevel: 1, maxLevel: 5, ops: ['+', '-'] },
    MULTIPLICATION_WOODS: { minLevel: 6, maxLevel: 12, ops: ['*', '/'] },
    ALGEBRA_PEAKS: { minLevel: 13, maxLevel: 99, ops: ['algebra'] }
  }
};

// ============================================================================
// IN-MEMORY AUTHORITATIVE GAME STATE
// ============================================================================
/**
 * Stores all connected players mapped by their socket.id
 * Structure: {
 *   id: string,
 *   username: string,
 *   x: number,
 *   y: number,
 *   level: number,
 *   xp: number,
 *   hp: number,
 *   maxHp: number,
 *   zone: string,
 *   activeChallenge: { id, question, answer, xpReward, damage, expiresAt } | null
 * }
 */
const players = new Map();

// ============================================================================
// MATH ENGINE (SERVER-SIDE PROBLEM GENERATOR)
// ============================================================================
/**
 * Generates a math problem tailored to the player's current level/zone.
 * Keeps the answer strictly on the server so clients cannot inspect packets
 * to find the solution.
 *
 * @param {number} level - Player's current level
 * @returns {object} Challenge object containing question and hidden answer
 */
function generateMathChallenge(level) {
  const challengeId = `math_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  let question = '';
  let answer = 0;
  let xpReward = 25 * level;
  let damage = 10 + (level * 2);

  if (level <= 5) {
    // Tier 1: Addition & Subtraction
    const a = Math.floor(Math.random() * (10 * level)) + 1;
    const b = Math.floor(Math.random() * (10 * level)) + 1;
    const isAdd = Math.random() > 0.4;

    if (isAdd) {
      question = `${a} + ${b}`;
      answer = a + b;
    } else {
      // Ensure non-negative results for beginner zones
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      question = `${max} - ${min}`;
      answer = max - min;
    }
  } else if (level <= 12) {
    // Tier 2: Multiplication & Clean Division
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    const isMult = Math.random() > 0.4;

    if (isMult) {
      question = `${a} × ${b}`;
      answer = a * b;
    } else {
      const product = a * b;
      question = `${product} ÷ ${a}`;
      answer = b;
    }
  } else {
    // Tier 3: Linear Algebra (Solve for x: ax + b = c)
    const x = Math.floor(Math.random() * 15) + 1;
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 20) + 1;
    const c = a * x + b;

    question = `Solve for x: ${a}x + ${b} = ${c}`;
    answer = x;
    xpReward *= 1.5;
  }

  return {
    id: challengeId,
    question,
    answer, // NEVER send this field to the client!
    xpReward: Math.floor(xpReward),
    damage,
    expiresAt: Date.now() + 15000 // 15 seconds to solve
  };
}

/**
 * Determines the current world zone based on coordinates.
 */
function getZoneFromCoords(x, y) {
  const distFromCenter = Math.hypot(x - WORLD_CONFIG.spawnX, y - WORLD_CONFIG.spawnY);
  if (distFromCenter < 350) return 'ARITHMETIC_MEADOWS';
  if (distFromCenter < 700) return 'MULTIPLICATION_WOODS';
  return 'ALGEBRA_PEAKS';
}

/**
 * Checks if player has enough XP to level up and applies stat boosts.
 */
function checkLevelUp(player) {
  const xpNeeded = player.level * 100;
  if (player.xp >= xpNeeded) {
    player.xp -= xpNeeded;
    player.level += 1;
    player.maxHp += 20;
    player.hp = player.maxHp; // Full heal on level up
    return true;
  }
  return false;
}

// ============================================================================
// EXPRESS HTTP ROUTES
// ============================================================================
// Serve static files from /public (where our HTML5 Canvas client will live in Part 2)
app.use(express.static(path.join(__dirname, 'public')));

// Server status & telemetry endpoint
app.get('/api/status', (req, res) => {
  res.json({
    game: 'MathLand MMORPG',
    status: 'ONLINE',
    onlinePlayers: players.size,
    worldConfig: WORLD_CONFIG,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// ============================================================================
// SOCKET.IO REAL-TIME MULTIPLAYER EVENTS
// ============================================================================
io.on('connection', (socket) => {
  console.log(`[CONNECT] Socket connected: ${socket.id}`);

  // 1. PLAYER JOIN HANDSHAKE
  socket.on('player:join', (data) => {
    try {
      const rawName = (data && data.username) ? String(data.username).trim() : '';
      const sanitizedName = rawName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || `Scholar_${socket.id.slice(0, 4)}`;
      const uid = (data && data.uid) ? String(data.uid) : socket.id;

      // Add slight random offset to spawn so players don't stack directly on top of each other
      const startX = WORLD_CONFIG.spawnX + (Math.random() * 80 - 40);
      const startY = WORLD_CONFIG.spawnY + (Math.random() * 80 - 40);

      const level = (data && Number(data.level)) || 1;
      const maxHp = 100 + (level - 1) * 20;

      const newPlayer = {
        id: socket.id,
        uid: uid,
        username: sanitizedName,
        x: Math.round(startX),
        y: Math.round(startY),
        level: level,
        xp: (data && Number(data.xp)) || 0,
        hp: maxHp,
        maxHp: maxHp,
        zone: 'ARITHMETIC_MEADOWS',
        activeChallenge: null
      };

      players.set(socket.id, newPlayer);
      console.log(`[JOIN] ${newPlayer.username} (UID: ${uid}) entered MathLand.`);

      // Send initial world state and player profile back to the joining client
      socket.emit('world:init', {
        self: newPlayer,
        worldConfig: WORLD_CONFIG,
        players: Array.from(players.values())
      });

      // Notify all other players of the newcomer
      socket.broadcast.emit('player:joined', newPlayer);
    } catch (err) {
      console.error(`[ERROR] player:join failed for ${socket.id}:`, err);
    }
  });

  // 2. PLAYER MOVEMENT (WITH BASIC ANTI-CHEAT BOUNDS & SPEED VALIDATION)
  socket.on('player:move', (movement) => {
    const player = players.get(socket.id);
    if (!player || !movement) return;

    // Prevent moving while locked in a math battle
    if (player.activeChallenge) return;

    const dx = Number(movement.dx) || 0;
    const dy = Number(movement.dy) || 0;

    // Validate movement vector magnitude to prevent teleportation/speedhacks
    const distance = Math.hypot(dx, dy);
    if (distance > WORLD_CONFIG.maxSpeed) {
      return; // Reject invalid movement packet
    }

    // Clamp coordinates within world boundaries
    player.x = Math.max(0, Math.min(WORLD_CONFIG.width, Math.round(player.x + dx)));
    player.y = Math.max(0, Math.min(WORLD_CONFIG.height, Math.round(player.y + dy)));
    player.zone = getZoneFromCoords(player.x, player.y);
  });

  // 3. INITIATE MATH ENCOUNTER (FIGHTING A MONSTER / SOLVING A RUNE)
  socket.on('combat:encounter', () => {
    const player = players.get(socket.id);
    if (!player) return;

    // Don't overwrite an existing active challenge that hasn't expired
    if (player.activeChallenge && Date.now() < player.activeChallenge.expiresAt) {
      return;
    }

    const challenge = generateMathChallenge(player.level);
    player.activeChallenge = challenge;

    // Send ONLY safe challenge fields (NEVER send challenge.answer!)
    socket.emit('combat:challenge', {
      id: challenge.id,
      question: challenge.question,
      xpReward: challenge.xpReward,
      damage: challenge.damage,
      expiresAt: challenge.expiresAt
    });
  });

  // 4. SUBMIT MATH ANSWER
  socket.on('combat:answer', (payload) => {
    const player = players.get(socket.id);
    if (!player || !player.activeChallenge) return;

    const challenge = player.activeChallenge;
    player.activeChallenge = null; // Clear challenge immediately so it cannot be answered twice

    const isExpired = Date.now() > challenge.expiresAt;
    const submittedAnswer = payload ? Number(payload.answer) : NaN;
    const isCorrect = !isExpired && !Number.isNaN(submittedAnswer) && submittedAnswer === challenge.answer;

    if (isCorrect) {
      // CORRECT ANSWER: Award XP and check for Level Up
      player.xp += challenge.xpReward;
      const leveledUp = checkLevelUp(player);

      socket.emit('combat:result', {
        success: true,
        message: leveledUp
          ? `Correct! You gained ${challenge.xpReward} XP and leveled up to Level ${player.level}!`
          : `Correct! +${challenge.xpReward} XP!`,
        xpGained: challenge.xpReward,
        leveledUp,
        stats: {
          level: player.level,
          xp: player.xp,
          hp: player.hp,
          maxHp: player.maxHp,
          x: player.x,
          y: player.y
        }
      });
    } else {
      // WRONG ANSWER OR TIMEOUT: Monster attacks player!
      player.hp = Math.max(0, player.hp - challenge.damage);
      let defeated = false;

      if (player.hp === 0) {
        // Respawn player at Arithmetic Meadows with full HP
        defeated = true;
        player.hp = player.maxHp;
        player.x = WORLD_CONFIG.spawnX;
        player.y = WORLD_CONFIG.spawnY;
        player.zone = 'ARITHMETIC_MEADOWS';
      }

      socket.emit('combat:result', {
        success: false,
        message: defeated
          ? `Defeated! The correct answer was ${challenge.answer}. Respawning at spawn...`
          : `${isExpired ? 'Time ran out!' : 'Incorrect!'} Answer was ${challenge.answer}. Took ${challenge.damage} damage!`,
        damageTaken: challenge.damage,
        defeated,
        stats: {
          level: player.level,
          xp: player.xp,
          hp: player.hp,
          maxHp: player.maxHp,
          x: player.x,
          y: player.y
        }
      });
    }
  });

  // 5. WORLD CHAT
  socket.on('chat:message', (text) => {
    const player = players.get(socket.id);
    if (!player || typeof text !== 'string') return;

    const cleanMessage = text.trim().slice(0, 140);
    if (!cleanMessage) return;

    io.emit('chat:broadcast', {
      senderId: player.id,
      username: player.username,
      level: player.level,
      message: cleanMessage,
      timestamp: Date.now()
    });
  });

  // 6. DISCONNECT CLEANUP
  socket.on('disconnect', (reason) => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`[DISCONNECT] ${player.username} left MathLand (${reason}).`);
      players.delete(socket.id);
      io.emit('player:left', { id: socket.id });
    }
  });
});

// ============================================================================
// AUTHORITATIVE SERVER TICK LOOP
// ============================================================================
// Broadcasts lightweight snapshots of all player positions & states at 20Hz
setInterval(() => {
  if (players.size === 0) return;

  const worldSnapshot = Array.from(players.values()).map((p) => ({
    id: p.id,
    username: p.username,
    x: p.x,
    y: p.y,
    level: p.level,
    xp: p.xp,
    hp: p.hp,
    maxHp: p.maxHp,
    zone: p.zone,
    inCombat: Boolean(p.activeChallenge)
  }));

  io.emit('world:tick', worldSnapshot);
}, 1000 / TICK_RATE);

// ============================================================================
// START SERVER
// ============================================================================
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🧮 MathLand MMORPG Server running on port ${PORT}`);
  console.log(`📡 Tick Rate: ${TICK_RATE}Hz | Status: http://localhost:${PORT}/api/status`);
  console.log(`==================================================`);
});