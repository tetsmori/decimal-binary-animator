/**
 * 10進法・2進法コインアニメーション（情報Ⅰ教材サンプル）
 * 最終版：キャリー方向修正＆補充機能
 */

document.addEventListener("DOMContentLoaded", () => {
  const baseRadios = document.getElementsByName("base");
  const startButton = document.getElementById("startButton");
  const pauseButton = document.getElementById("pauseButton");
  const resetButton = document.getElementById("resetButton");
  const speedSlider = document.getElementById("speedSlider");
  const currentValueSpan = document.getElementById("currentValue");
  const stackContainer = document.getElementById("stackContainer");
  const shelfContainer = document.getElementById("shelfContainer");

  const appState = {
    base: 10,
    isRunning: false,
    timeoutId: null,
    currentCount: 0,
    movedSinceRefill: 0,
    placeCounts: [],
    intervalMs: parseInt(speedSlider.value, 10)
  };

  function createToken(placeLevel, numericValue) {
    const div = document.createElement("div");
    div.classList.add("token", `level-${placeLevel}`);
    div.textContent = numericValue;
    return div;
  }

  function refillTokens(count) {
    for (let i = 0; i < count; i++) {
      const token = createToken(1, 1);
      stackContainer.appendChild(token);
    }
  }

  function createPlaceColumn(index) {
    const col = document.createElement("div");
    col.classList.add("placeColumn");
    col.dataset.place = index;
    const stack = document.createElement("div");
    stack.classList.add("coinStack");
    col.appendChild(stack);
    const label = document.createElement("div");
    label.classList.add("digitLabel");
    label.textContent = "0";
    col.appendChild(label);
    shelfContainer.appendChild(col);
  }

  function init() {
    stackContainer.innerHTML = "";
    refillTokens(100);

    shelfContainer.innerHTML = "";
    appState.placeCounts = [0];
    createPlaceColumn(0);

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;
    appState.currentCount = 0;
    appState.movedSinceRefill = 0;
    currentValueSpan.textContent = appState.currentCount;
  }

  function scheduleNext() {
    if (!appState.isRunning) return;
    appState.timeoutId = setTimeout(moveOneToken, appState.intervalMs);
  }

  function moveOneToken() {
    const token = stackContainer.querySelector(".token");
    if (!token) {
      appState.isRunning = false;
      pauseButton.disabled = true;
      return;
    }
    token.classList.add("moving");
    setTimeout(() => {
      token.classList.remove("moving");
      handlePlacement(0, token);
      appState.currentCount++;
      appState.movedSinceRefill++;
      currentValueSpan.textContent = appState.currentCount;
      if (appState.movedSinceRefill >= 50) {
        refillTokens(50);
        appState.movedSinceRefill = 0;
      }
      scheduleNext();
    }, 300);
  }

  function handlePlacement(placeIndex, token) {
    if (placeIndex >= appState.placeCounts.length) {
      appState.placeCounts.push(0);
      createPlaceColumn(placeIndex);
    }
    appState.placeCounts[placeIndex]++;
    const value = appState.base === 10
      ? Math.pow(10, placeIndex)
      : Math.pow(2, placeIndex);
    token.textContent = value;
    token.className = "";
    token.classList.add("token", `level-${placeIndex + 1}`);
    token.style.animation = "slideUp 0.3s ease forwards";

    const col = shelfContainer.querySelector(
      `.placeColumn[data-place='${placeIndex}']`
    );
    col.querySelector(".coinStack").appendChild(token);
    performCarry(placeIndex);
    col.querySelector(".digitLabel").textContent = appState.placeCounts[placeIndex];
  }

  function performCarry(startIndex) {
    let idx = startIndex;
    const threshold = appState.base;
    while (idx < appState.placeCounts.length && appState.placeCounts[idx] >= threshold) {
      const col = shelfContainer.querySelector(
        `.placeColumn[data-place='${idx}']`
      );
      const stack = col.querySelector(".coinStack");
      const tokens = Array.from(
        stack.querySelectorAll(`.token.level-${idx + 1}`)
      );
      for (let i = 0; i < threshold; i++) {
        tokens[tokens.length - 1 - i].remove();
      }
      appState.placeCounts[idx] -= threshold;
      col.querySelector(".digitLabel").textContent = appState.placeCounts[idx];
      idx++;
      if (idx >= appState.placeCounts.length) {
        appState.placeCounts.push(0);
        createPlaceColumn(idx);
      }
      const carryToken = createToken(
        idx + 1,
        appState.base === 10 ? Math.pow(10, idx) : Math.pow(2, idx)
      );
      carryToken.classList.add("carry");
      carryToken.style.animation = "slideUp 0.3s ease forwards";
      const nextCol = shelfContainer.querySelector(
        `.placeColumn[data-place='${idx}']`
      );
      nextCol.querySelector(".coinStack").appendChild(carryToken);
      appState.placeCounts[idx]++;
      nextCol.querySelector(".digitLabel").textContent = appState.placeCounts[idx];
    }
  }

  function startAnimation() {
    if (appState.isRunning) return;
    appState.isRunning = true;
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetButton.disabled = false;
    scheduleNext();
  }

  function pauseAnimation() {
    clearTimeout(appState.timeoutId);
    appState.isRunning = false;
    pauseButton.textContent = "再開";
  }

  function resumeAnimation() {
    if (appState.isRunning) return;
    appState.isRunning = true;
    pauseButton.textContent = "一時停止";
    scheduleNext();
  }

  function resetAnimation() {
    clearTimeout(appState.timeoutId);
    appState.isRunning = false;
    pauseButton.textContent = "再停止";
    pauseButton.disabled = true;
    resetButton.disabled = true;
    startButton.disabled = false;
    init();
  }

  function changeBase() {
    appState.base = parseInt(
      document.querySelector('input[name="base"]:checked').value,
      10
    );
    resetAnimation();
  }

  function changeSpeed() {
    appState.intervalMs = parseInt(speedSlider.value, 10);
    if (appState.isRunning) {
      clearTimeout(appState.timeoutId);
      scheduleNext();
    }
  }

  init();
  baseRadios.forEach(radio => radio.addEventListener("change", changeBase));
  startButton.addEventListener("click", startAnimation);
  pauseButton.addEventListener("click", () => {
    appState.isRunning ? pauseAnimation() : resumeAnimation();
  });
  resetButton.addEventListener("click", resetAnimation);
  speedSlider.addEventListener("input", changeSpeed);
});
