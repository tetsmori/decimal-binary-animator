/**
 * 10進法・2進法コインアニメーション（情報Ⅰ教材サンプル）
 * 修正日：2025年6月6日（桁ラベルをあらかじめ固定列に配置）
 * - init() 時に base に応じた列数をすべて生成し、以降は列数を追加しない
 * - 各 placeColumn の下部に digitLabel を初期から配置し、X 方向の位置は固定
 * - キャリー時も既存列を使い、数を更新するだけ
 * - 2進法モードで 32+32 → 64 なども同様に既存列で対応（2^6=64 まで扱える 7 列をあらかじめ作成）
 * - 再帰的 setTimeout でアニメーション制御
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM 要素取得
  const baseRadios = document.getElementsByName("base");
  const startButton = document.getElementById("startButton");
  const pauseButton = document.getElementById("pauseButton");
  const resetButton = document.getElementById("resetButton");
  const speedSlider = document.getElementById("speedSlider");
  const currentValueSpan = document.getElementById("currentValue");
  const stackContainer = document.getElementById("stackContainer");
  const shelfContainer = document.getElementById("shelfContainer");

  // アプリの状態管理
  const appState = {
    base: 10,                  // 10進法 or 2進法
    isRunning: false,          // アニメーション実行中フラグ
    timeoutId: null,           // setTimeout の ID
    currentCount: 0,           // 現在の総数
    placeCounts: [],           // 各列（桁）のコイン枚数
    maxPlaces: 6,              // 実際に生成する列数（10進:6列, 2進:7列）
    intervalMs: parseInt(speedSlider.value, 10)
  };

  /**
   * トークン（コイン）を作成
   * @param {number} placeLevel    // 1=1の位, 2=10の位/2の位…（CSS用クラス level-1, level-2…）
   * @param {number} numericValue  // コインに表示する数値（10進:1,10,100… / 2進:1,2,4…）
   * @returns HTMLElement          // 新しい .token 要素
   */
  function createToken(placeLevel, numericValue) {
    const div = document.createElement("div");
    div.classList.add("token", `level-${placeLevel}`);
    div.textContent = numericValue;
    return div;
  }

  /**
   * 初期化処理
   * - base に応じた固定列数（maxPlaces）をすべて生成
   * - 山積み側は 100 枚のコインをグリッドに生成
   */
  function init() {
    // (1) maxPlaces を base に応じて設定
    if (appState.base === 2) {
      appState.maxPlaces = 7;  // 2^0～2^6 を扱うため7列
    } else {
      appState.maxPlaces = 6;  // 10^0～10^5 を扱うため6列
    }
    // placeCounts を初期化（すべて 0 枚）
    appState.placeCounts = Array(appState.maxPlaces).fill(0);

    // (2) 山積みエリア: 10×10 グリッドに 100 枚のコインを生成
    stackContainer.innerHTML = "";
    for (let i = 0; i < 100; i++) {
      const token = createToken(1, 1);
      // 山積み側のコインは常に可視化するため、transform/opacity の override は CSS ですでにかかっています
      stackContainer.appendChild(token);
    }

    // (3) 並べたコインエリア: あらかじめ maxPlaces 列をすべて生成
    shelfContainer.innerHTML = "";
    for (let i = 0; i < appState.maxPlaces; i++) {
      const col = document.createElement("div");
      col.classList.add("placeColumn");
      col.dataset.place = i;  // data-place="0" が 1 の位、… data-place="i" が base^i の位

      // coinStack 部分: 下から上に積む領域
      const coinStack = document.createElement("div");
      coinStack.classList.add("coinStack");
      col.appendChild(coinStack);

      // digitLabel 部分: 列の下部に桁重み（枚数）を表示
      const label = document.createElement("div");
      label.classList.add("digitLabel");
      label.textContent = "0";  // 初期は 0 枚
      col.appendChild(label);

      shelfContainer.appendChild(col);
    }

    // (4) ボタン状態／カウントリセット
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;
    appState.currentCount = 0;
    currentValueSpan.textContent = appState.currentCount;
  }

  /**
   * 次のコイン移動をスケジュール
   *  → 再帰的 setTimeout でコントロール
   */
  function scheduleNext() {
    if (!appState.isRunning) return;
    appState.timeoutId = setTimeout(() => {
      moveOneToken();
    }, appState.intervalMs);
  }

  /**
   * 1 単位コインを山積みから各位列へ移動
   */
  function moveOneToken() {
    const token = stackContainer.querySelector(".token");
    if (!token) {
      // 山積みが空になったら停止
      appState.isRunning = false;
      pauseButton.disabled = true;
      return;
    }
    // 移動演出: スライドアップ（CSS の slideUp アニメーション）
    token.classList.add("moving");
    setTimeout(() => {
      token.classList.remove("moving");
      placeTokenAtPlace(0, token);
      appState.currentCount++;
      currentValueSpan.textContent = appState.currentCount;
      checkCarry(0);
      // 次のコイン移動をスケジュール
      scheduleNext();
    }, 300);
  }

  /**
   * 指定の placeIndex（0=1の位, 1=上位：[10の位または2の位]…）にトークンを配置し、
   * placeCounts と digitLabel を更新
   * 
   * ※ 列はあらかじめ全 maxPlaces 数生成済みのため、新たに列を追加しない
   * 
   * @param {number} placeIndex 
   * @param {HTMLElement} token 
   */
  function placeTokenAtPlace(placeIndex, token) {
    // (1) placeCounts をインクリメント
    appState.placeCounts[placeIndex]++;

    // (2) token のテキストを更新（10進なら 10^placeIndex、2進なら 2^placeIndex）
    const numericValue = (appState.base === 10)
      ? Math.pow(10, placeIndex)
      : Math.pow(2, placeIndex);
    token.textContent = numericValue;

    // (3) CSS クラスをリセットして適切な level-* を付与
    token.className = "";  // 以前の carry / fadeOut / moving クラスをクリア
    token.classList.add("token", `level-${placeIndex + 1}`);

    // (4) 追加時にはスライドアップアニメーションを適用
    token.style.animation = "slideUp 0.3s ease forwards";

    // (5) 既存の該当列の coinStack に append
    const col = shelfContainer.querySelector(`.placeColumn[data-place="${placeIndex}"]`);
    const coinStack = col.querySelector(".coinStack");
    coinStack.appendChild(token);

    // (6) digitLabel を更新 (placeCounts[placeIndex])
    const label = col.querySelector(".digitLabel");
    label.textContent = appState.placeCounts[placeIndex];
  }

  /**
   * 繰り上がり（キャリー）の判定と処理
   * @param {number} placeIndex 
   */
  function checkCarry(placeIndex) {
    const count = appState.placeCounts[placeIndex];
    const threshold = appState.base;

    if (count >= threshold) {
      // この位のコインを threshold 枚、フェードアウトさせてから削除
      let removed = 0;
      const col = shelfContainer.querySelector(`.placeColumn[data-place="${placeIndex}"]`);
      const tokens = Array.from(col.querySelectorAll(`.coinStack .token.level-${placeIndex + 1}`));
      for (let i = tokens.length - 1; i >= 0 && removed < threshold; i--) {
        tokens[i].classList.add("fadeOut");
        setTimeout(() => {
          if (tokens[i].parentNode) {
            tokens[i].parentNode.removeChild(tokens[i]);
          }
        }, 300);
        removed++;
      }
      // placeCounts をしきい値分だけ減算
      appState.placeCounts[placeIndex] -= threshold;
      // digitLabel 更新
      const label = col.querySelector(".digitLabel");
      label.textContent = appState.placeCounts[placeIndex];

      // (2) 上位位に新規コインを生成して配置
      const nextIndex = placeIndex + 1;
      // （ここでは列数はあらかじめ確保済みなので、placeIndex が maxPlaces を超えるケースは考慮不要）
      if (nextIndex < appState.maxPlaces) {
        const newToken = createToken(
          nextIndex + 1,
          (appState.base === 10)
            ? Math.pow(10, nextIndex)
            : Math.pow(2, nextIndex)
        );
        newToken.classList.add("carry");
        newToken.style.animation = "slideUp 0.3s ease forwards";

        const nextCol = shelfContainer.querySelector(`.placeColumn[data-place="${nextIndex}"]`);
        const nextStack = nextCol.querySelector(".coinStack");
        nextStack.appendChild(newToken);

        appState.placeCounts[nextIndex]++;
        // digitLabel 更新
        const nextLabel = nextCol.querySelector(".digitLabel");
        nextLabel.textContent = appState.placeCounts[nextIndex];

        // (3) 再帰判定：さらに上位位にも繰り上がりがあるか
        if (appState.placeCounts[nextIndex] >= threshold) {
          setTimeout(() => {
            checkCarry(nextIndex);
          }, 400);
        }
      }
    }
  }

  /**
   * アニメーション開始
   */
  function startAnimation() {
    if (appState.isRunning) return;
    appState.isRunning = true;
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetButton.disabled = false;
    scheduleNext();
  }

  /**
   * 一時停止
   */
  function pauseAnimation() {
    if (!appState.isRunning) return;
    clearTimeout(appState.timeoutId);
    appState.isRunning = false;
    pauseButton.textContent = "再開";
  }

  /**
   * 再開
   */
  function resumeAnimation() {
    if (appState.isRunning) return;
    appState.isRunning = true;
    pauseButton.textContent = "一時停止";
    scheduleNext();
  }

  /**
   * リセット
   */
  function resetAnimation() {
    clearTimeout(appState.timeoutId);
    appState.isRunning = false;
    pauseButton.textContent = "一時停止";
    pauseButton.disabled = true;
    resetButton.disabled = true;
    startButton.disabled = false;
    init();
  }

  /**
   * 基数変更
   */
  function changeBase() {
    const selected = document.querySelector('input[name="base"]:checked').value;
    appState.base = parseInt(selected, 10);
    resetAnimation();
  }

  /**
   * 速度変更
   */
  function changeSpeed() {
    appState.intervalMs = parseInt(speedSlider.value, 10);
    if (appState.isRunning) {
      clearTimeout(appState.timeoutId);
      scheduleNext();
    }
  }

  // ページ読み込み時に初期化
  init();

  // イベントリスナー登録
  baseRadios.forEach(radio => radio.addEventListener("change", changeBase));
  startButton.addEventListener("click", startAnimation);
  pauseButton.addEventListener("click", () => {
    if (appState.isRunning) pauseAnimation();
    else resumeAnimation();
  });
  resetButton.addEventListener("click", resetAnimation);
  speedSlider.addEventListener("input", changeSpeed);
});
