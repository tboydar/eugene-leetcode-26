// main.js — 入口：分頁切換、側欄渲染、播放控制、Runner 接線
import { Engine, Runner } from './vfx.js';
import { CONTENT } from './content.js';
import { createProblem56 } from './problem-56.js';
import { createProblem88 } from './problem-88.js';
import { createProblem26 } from './problem-26.js';

const PROBLEMS = {
  56: createProblem56,
  88: createProblem88,
  26: createProblem26,
};

const $ = (id) => document.getElementById(id);
const stageEl = $('stage');

// ---------- 引擎（單一 WebGL 場景，跨題共用） ----------
const engine = new Engine(stageEl);

// 目前載入的題目
let active = null; // { id, steps, root, dispose, runner, meta }

function clearActive() {
  if (!active) return;
  if (active.runner) active.runner.destroy();
  active.dispose();
  active = null;
}

function buildSidebar(id) {
  const meta = CONTENT[id];
  const pills = meta.pills.map((p) => `<span class="pill">${p}</span>`).join('');
  $('sidebar').innerHTML = `
    <h2>${meta.title}</h2>
    <div class="meta-row">
      <span class="pill topic">${id === '56' ? '今日難題' : '今日簡易'}</span>
      ${pills}
    </div>
    ${meta.body}
  `;
}

function setStepCount(idx, total) {
  $('step-count').textContent = `步驟 ${idx} / ${total}`;
  $('step-fill').style.width = total ? `${(idx / total) * 100}%` : '0%';
}

function syncPlayButton(playing) {
  const b = $('btn-play');
  b.textContent = playing ? '⏸ 暫停' : '▶ 播放';
  b.classList.toggle('paused', !playing);
}

function loadProblem(id) {
  clearActive();
  buildSidebar(id);

  const creator = PROBLEMS[id];
  const prob = creator(engine);

  const runner = new Runner(engine, prob.steps);
  runner
    .setLog((msg) => {
      $('step-label').textContent = msg.replace(/^▶\s*/, '');
      $('step-label').classList.add('active');
    })
    .onStep((idx, total) => setStepCount(idx, total))
    .onEnd(() => {
      $('step-label').textContent = '✅ 全部步驟完成！可重播或重置';
      syncPlayButton(false);
    });

  active = { id, steps: prob.steps, runner, dispose: prob.dispose, meta: CONTENT[id] };

  // 標籤 active 樣式
  document.querySelectorAll('.tab').forEach((tab) => {
    const on = tab.dataset.id === id;
    tab.classList.toggle('active', on);
    tab.setAttribute('aria-selected', String(on));
  });

  setStepCount(0, prob.steps.length);
  $('step-label').textContent = '準備好，按「播放」開始';
  syncPlayButton(false);

  runner.broadcast();
}

// ---------- 控制按鈕 ----------
$('btn-play').addEventListener('click', () => {
  if (!active) return;
  if (active.runner.playing) {
    active.runner.pause();
  } else {
    active.runner.play();
  }
  syncPlayButton(active.runner.playing);
});

$('btn-step').addEventListener('click', () => {
  if (!active) return;
  if (active.runner.playing) {
    active.runner.pause();
    syncPlayButton(false);
    return;
  }
  active.runner.step();
  syncPlayButton(false);
});

$('btn-reset').addEventListener('click', () => {
  if (!active) return;
  const id = active.id;
  clearActive();
  loadProblem(id);
});

// ---------- 速度 ----------
$('speed').addEventListener('input', (e) => {
  engine.speed = parseFloat(e.target.value);
  $('speed-val').textContent = engine.speed.toFixed(1) + 'x';
});

// ---------- 標籤切換 ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.dataset.id === String(active?.id)) return;
    loadProblem(tab.dataset.id);
  });
});

// ---------- 視窗 resize ----------
window.addEventListener('resize', () => {
  const w = stageEl.clientWidth;
  const h = stageEl.clientHeight;
  if (w < 4 || h < 4) return;
  engine.camera.aspect = w / h;
  engine.camera.updateProjectionMatrix();
  engine.renderer.setSize(w, h);
});

// ---------- 起始載入（今日難題 56） ----------
loadProblem('56');

// 除錯用：供自動化測試讀取目前狀態
window.__engine = engine;
window.__dbg = () => ({
  active: active?.id ?? null,
  count: $('step-count').textContent,
  label: $('step-label').textContent,
  playing: active?.runner?.playing ?? false,
  paused: engine.paused,
});
