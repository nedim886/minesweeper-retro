let gridSize, mineCount;
let grid = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let timerInterval;
let seconds = 0;
let currentDifficulty = "";

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
  alert("App will now close.");
  window.close();
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
      cell.onclick = () => revealCell(x, y);
      cell.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(x, y);
      };
      gridElement.appendChild(cell);
    }
  }

  updateHighscoreDisplay();
}

function revealCell(x, y) {
  if (gameOver || revealed[y][x] || flagged[y][x]) return;

  revealed[y][x] = true;
  const index = y * gridSize + x;
  const cell = document.getElementsByClassName("cell")[index];
  cell.classList.add("revealed");

  if (grid[y][x] === "💣") {
    cell.textContent = "💣";
    cell.style.backgroundColor = "red";
    endGame(false);
  } else {
    const value = grid[y][x];
    cell.textContent = value === 0 ? "" : value;
    cell.setAttribute("data-value", value);
    if (value === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          let nx = x + dx;
          let ny = y + dy;
          if (
            nx >= 0 && nx < gridSize &&
            ny >= 0 && ny < gridSize &&
            !revealed[ny][nx]
          ) {
            revealCell(nx, ny);
          }
        }
      }
    }
    checkWin();
  }
}

function toggleFlag(x, y) {
  if (revealed[y][x]) return;
  const index = y * gridSize + x;
  const cell = document.getElementsByClassName("cell")[index];
  flagged[y][x] = !flagged[y][x];
  cell.textContent = flagged[y][x] ? "🚩" : "";
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

// Music Settings
function toggleMusic() {
  const music = document.getElementById("bg-music");
  const toggle = document.getElementById("music-toggle");
  music.muted = !toggle.checked;
}

function setVolume() {
  const music = document.getElementById("bg-music");
  const slider = document.getElementById("volume-slider");
  music
