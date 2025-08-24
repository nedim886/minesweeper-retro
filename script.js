let gridSize, mineCount;
let grid = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let timerInterval;
let seconds = 0;
let currentDifficulty = "";
let vibrationEnabled = true;
let flagMode = false;
let coins = 0;

document.addEventListener("DOMContentLoaded", () => {
  // Menüstruktur
  document.getElementById("main-menu").style.display = "block";
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("game-container").style.display = "none";
  document.getElementById("custom-settings").style.display = "none";

  // Musik
  const music = document.getElementById("bg-music");
  if (music) music.volume = 0.3;

  // Coins initialisieren
  const savedCoins = localStorage.getItem("retro_coins");
  const lastClaim = localStorage.getItem("retro_last_claim");

  if (savedCoins === null) {
    coins = 10;
    localStorage.setItem("retro_coins", coins);
    localStorage.setItem("retro_last_claim", new Date().toDateString());
  } else {
    coins = parseInt(savedCoins);
    const today = new Date().toDateString();
    if (lastClaim !== today) {
      coins += 5;
      localStorage.setItem("retro_last_claim", today);
      localStorage.setItem("retro_coins", coins);
    }
  }

  updateCoinDisplay();
});

document.addEventListener("click", () => {
  const music = document.getElementById("bg-music");
  if (music && music.paused) {
    music.play().catch(() => {});
  }
}, { once: true });

function updateCoinDisplay() {
  const menuDisplay = document.getElementById("coin-display");
  const hudDisplay = document.getElementById("coin-hud");
  if (menuDisplay) menuDisplay.textContent = `Coins: ${coins}`;
  if (hudDisplay) hudDisplay.textContent = `Coins: ${coins}`;
  localStorage.setItem("retro_coins", coins);
}

function watchAd() {
  coins += 5;
  updateCoinDisplay();
  alert("Thanks for watching! You earned 5 coins.");
}

function toggleFlagMode() {
  flagMode = !flagMode;
  const btn = document.getElementById("flag-mode-toggle");
  btn.classList.toggle("active", flagMode);
  vibrate(30);
}
function startGame(difficulty) {
  currentDifficulty = difficulty;
  document.getElementById("difficulty-menu").style.display = "none";

  if (difficulty === "custom") {
    const sizeInput = document.getElementById("custom-size");
    const mineInput = document.getElementById("custom-mines");

    const size = parseInt(sizeInput.value);
    const mines = parseInt(mineInput.value);

    if (isNaN(size) || isNaN(mines) || size < 4 || size > 30 || mines < 1 || mines >= size * size) {
      alert("Please enter valid values for grid size (4–30) and mines.");
      document.getElementById("difficulty-menu").style.display = "block";
      return;
    }

    gridSize = size;
    mineCount = mines;
  } else if (difficulty === "easy") {
    gridSize = 8;
    mineCount = 10;
  } else if (difficulty === "medium") {
    gridSize = 12;
    mineCount = 20;
  } else if (difficulty === "hard") {
    gridSize = 16;
    mineCount = 40;
  } else if (difficulty === "extreme") {
    gridSize = 20;
    mineCount = 99;
  }

  document.getElementById("game-container").style.display = "block";
  document.getElementById("bomb-count").textContent = `Bombs: ${mineCount}`;
  updateCoinDisplay();
  startTimer();
  generateGrid();
}

function startTimer() {
  seconds = 0;
  document.getElementById("timer").textContent = "Time: 0s";
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Time: ${seconds}s`;
  }, 1000);
}

function generateGrid() {
  const gridElement = document.getElementById("grid");
  gridElement.innerHTML = "";
  gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

  grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
  revealed = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
  flagged = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
  gameOver = false;

  let placed = 0;
  while (placed < mineCount) {
    let x = Math.floor(Math.random() * gridSize);
    let y = Math.floor(Math.random() * gridSize);
    if (grid[y][x] !== "💣") {
      grid[y][x] = "💣";
      placed++;
    }
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x] === "💣") continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (grid[y + dy]?.[x + dx] === "💣") count++;
        }
      }
      grid[y][x] = count;
    }
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;

      cell.onclick = () => {
        if (gameOver) return;
        if (flagMode) {
          toggleFlag(x, y);
        } else {
          revealCell(x, y);
        }
      };

      cell.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(x, y);
      };

      gridElement.appendChild(cell);
    }
  }

  updateHighscoreDisplay();
}
function helpReveal() {
  if (gameOver) return;

  if (coins < 1) {
    alert("❌ No coins left!");
    return;
  }

  coins -= 1;
  updateCoinDisplay();

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x] === "💣") {
        const index = y * gridSize + x;
        const cell = document.getElementsByClassName("cell")[index];
        if (!revealed[y][x] && !flagged[y][x] && cell.textContent === "") {
          cell.textContent = "X";
          cell.classList.add("help-marked");
          return;
        }
      }
    }
  }
}

function toggleFlag(x, y) {
  if (revealed[y][x]) return;
  const index = y * gridSize + x;
  const cell = document.getElementsByClassName("cell")[index];
  flagged[y][x] = !flagged[y][x];
  cell.textContent = flagged[y][x] ? "🚩" : "";
  vibrate(50);
}

function checkWin() {
  let safeCells = gridSize * gridSize - mineCount;
  let revealedCount = revealed.flat().filter(Boolean).length;
  if (revealedCount === safeCells) {
    endGame(true);
  }
}

function endGame(won) {
  gameOver = true;
  clearInterval(timerInterval);

  if (!won) {
    vibrate([100, 100, 500]);
  }

  if (won) {
    const key = `highscore_${currentDifficulty}`;
    const timestamp = new Date().toLocaleString();
    const existing = JSON.parse(localStorage.getItem(key));
    if (!existing || seconds < existing.time) {
      localStorage.setItem(key, JSON.stringify({ time: seconds, date: timestamp }));
    }
    updateHighscoreDisplay();
    alert("🎉 You won!");
  } else {
    alert("💥 Game Over!");
  }
}

function updateHighscoreDisplay() {
  const key = `highscore_${currentDifficulty}`;
  const data = JSON.parse(localStorage.getItem(key));
  const display = document.getElementById("highscore");
  if (data) {
    display.textContent = `Highscore: ${data.time}s`;
  } else {
    display.textContent = `Highscore: –`;
  }
}

function renderHighscores() {
  const container = document.getElementById("highscore-list");
  container.innerHTML = "";

  ["easy", "medium", "hard", "extreme", "custom"].forEach(level => {
    const data = JSON.parse(localStorage.getItem(`highscore_${level}`));
    const entry = document.createElement("div");
    if (data) {
      entry.textContent = `${level.toUpperCase()}: ${data.time}s (on ${data.date})`;
    } else {
      entry.textContent = `${level.toUpperCase()}: –`;
    }
    container.appendChild(entry);
  });
}

// Musiksteuerung
function toggleMusic() {
  const music = document.getElementById("bg-music");
  const toggle = document.getElementById("music-toggle");
  music.muted = !toggle.checked;
}

function setVolume() {
  const music = document.getElementById("bg-music");
  const slider = document.getElementById("volume-slider");
  music.volume = parseFloat(slider.value);
}

// Globale Bindung für HTML-Buttons
window.startGame = startGame;
window.showDifficulty = () => {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "block";
  document.getElementById("custom-settings").style.display = "none";
};
window.backToMain = () => {
  clearInterval(timerInterval);
  document.getElementById("game-container").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
  document.getElementById("custom-settings").style.display = "none";
};
window.exitApp = () => {
  const app = window.Capacitor?.Plugins?.App;
  if (app) {
    app.exitApp();
  } else {
    alert("Exit not supported in this environment.");
  }
};
window.showHighscores = () => {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "block";
  renderHighscores();
};
window.showSettings = () => {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "block";
  document.getElementById("vibration-setting").style.display = "block";
};
window.toggleMusic = toggleMusic;
window.setVolume = setVolume;
window.toggleVibrationSetting = () => {
  const toggle = document.getElementById("vibration-toggle");
  vibrationEnabled = toggle.checked;
};
window.toggleFlagMode = toggleFlagMode;
window.showCustomSettings = () => {
  document.getElementById("custom-settings").style.display = "block";
};
window.helpReveal = helpReveal;
window.watchAd = watchAd;
