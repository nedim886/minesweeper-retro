import { Haptics } from '@capacitor/haptics';
import { App } from '@capacitor/app';

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

// 🎵 Musiksteuerung
document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  if (music) music.volume = 0.3;
});

document.addEventListener("click", () => {
  const music = document.getElementById("bg-music");
  if (music && music.paused) {
    music.play().catch(() => {});
  }
}, { once: true });

function vibrate(pattern) {
  if (vibrationEnabled) {
    if (typeof pattern === "number") {
      Haptics.vibrate({ duration: pattern });
    } else if (Array.isArray(pattern)) {
      // Simuliere Muster durch mehrere kurze Vibrationen
      pattern.forEach((p, i) => {
        setTimeout(() => Haptics.vibrate({ duration: p }), i * 200);
      });
    }
  }
}

function toggleVibrationSetting() {
  const toggle = document.getElementById("vibration-toggle");
  vibrationEnabled = toggle.checked;
}

function toggleFlagMode() {
  flagMode = !flagMode;
  const btn = document.getElementById("flag-mode-toggle");
  btn.textContent = flagMode ? "🚩 Flag Mode: ON" : "🚩 Flag Mode: OFF";
  btn.classList.toggle("active", flagMode);
}

function showDifficulty() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "block";
}

function showHighscores() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "block";
  renderHighscores();
}

function showSettings() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "block";

  document.getElementById("vibration-setting").style.display = "block";
}

function backToMain() {
  clearInterval(timerInterval);
  document.getElementById("game-container").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
}

function exitApp() {
  App.exitApp();
}
function startGame(difficulty) {
  currentDifficulty = difficulty;
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  startTimer();

  if (difficulty === "easy") {
    gridSize = 8;
    mineCount = 10;
  } else if (difficulty === "medium") {
    gridSize = 12;
    mineCount = 20;
  } else {
    gridSize = 16;
    mineCount = 40;
  }

  document.getElementById("bomb-count").textContent = `Bombs: ${mineCount}`;
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

      enableTouchFlagging(cell, x, y);
      gridElement.appendChild(cell);
    }
  }

  updateHighscoreDisplay();
}

function enableTouchFlagging(cell, x, y) {
  let touchTimer;
  let touchMoved = false;

  const startHandler = (e) => {
    touchMoved = false;
    e.preventDefault();
    touchTimer = setTimeout(() => {
      toggleFlag(x, y);
      vibrate(50);
      touchTimer = null;
    }, 500);
  };

  const moveHandler = () => {
    touchMoved = true;
    clearTimeout(touchTimer);
  };

  const endHandler = (e) => {
    clearTimeout(touchTimer);
    if (!touchMoved && touchTimer !== null) {
      revealCell(x, y);
    }
  };

  cell.addEventListener("touchstart", startHandler, { passive: false });
  cell.addEventListener("touchmove", moveHandler, { passive: false });
  cell.addEventListener("touchend", endHandler, { passive: false });
  cell.addEventListener("touchcancel", () => clearTimeout(touchTimer));
}
function toggleFlag(x, y) {
  if (revealed[y][x]) return;
  const index = y * gridSize + x;
  const cell = document.getElementsByClassName("cell")[index];
  flagged[y][x] = !flagged[y][x];
  cell.textContent = flagged[y][x] ? "🚩" : "";
  vibrate(50);
}

function helpReveal() {
  if (gameOver) return;

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

  ["easy", "medium", "hard"].forEach(level => {
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

// 🎛 Settings-Funktionen
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

// 🌐 Globale Bindung für HTML-Buttons
window.startGame = startGame;
window.showDifficulty = showDifficulty;
window.backToMain = backToMain;
window.exitApp = exitApp;
window.showHighscores = showHighscores;
window.helpReveal = helpReveal;
window.showSettings = showSettings;
window.toggleMusic = toggleMusic;
window.setVolume = setVolume;
window.toggleVibrationSetting = toggleVibrationSetting;
window.toggleFlagMode = toggleFlagMode;
