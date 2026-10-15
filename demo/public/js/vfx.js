// vfx.js — three.js 引擎 + 補間動畫框架 + 步驟播放器（Runner）
// 台灣正體中文；單線程循序播放；暫停可凍結、單步可逐步執行。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// ---------- 緩動函式 ----------
export const EASE = {
  linear: (t) => t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInCubic: (t) => t * t * t,
  easeOutBack: (t) => { const c = 1.70158; const c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  easeInOutBack: (t) => {
    const c = 1.70158; const c2 = c * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
};
export const ease = EASE;

// ---------- 補間 (Tween) ----------
class Tween {
  constructor(engine, obj, props, dur, opts = {}) {
    this.engine = engine;
    this.obj = obj;
    this.props = props;
    this.dur = dur * 1000;
    this.ease = opts.ease || EASE.linear;
    this.tick = opts.tick;
    this.elapsed = engine.time;
    this.started = false;
    this.finished = false;
    this._resolve = null;
    this._promise = new Promise((res) => (this._resolve = res));
    this._from = {};
    this._to = {};
    for (const k in props) {
      const v = props[k];
      if (Array.isArray(v)) {
        this._from[k] = v[0];
        this._to[k] = v[1];
      } else {
        this._from[k] = obj[k];
        this._to[k] = v;
      }
    }
    engine.tweens.push(this);
  }
  get promise() { return this._promise; }
  update() {
    if (this.finished) return;
    if (!this.started) { this.started = true; this.elapsed = this.engine.time; }
    const p = clamp((this.engine.time - this.elapsed) / this.dur, 0, 1);
    const e = this.ease(p);
    for (const k in this._to) this.obj[k] = lerp(this._from[k], this._to[k], e);
    if (this.tick) this.tick(this.obj, e);
    if (p >= 1) this._finish();
  }
  _finish() {
    this.finished = true;
    this.engine.tweens = this.engine.tweens.filter((t) => t !== this);
    this._resolve('ok');
  }
  halt(reason = 'halted') {
    if (this.finished) return;
    for (const k in this._to) this.obj[k] = this._to[k];
    if (this.tick) this.tick(this.obj, 1);
    this.finished = true;
    this.engine.tweens = this.engine.tweens.filter((t) => t !== this);
    this._resolve(reason);
  }
}

// ---------- 引擎 ----------
export class Engine {
  constructor(container) {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1626);
    // 霧淡 backdrop
    this.scene.fog = new THREE.Fog(0x0d1626, 60, 160);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
    this.camera.position.set(0, 22, 34);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 3, 0);
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 120;

    // 燈光
    const amb = new THREE.AmbientLight(0x9fb4d8, 0.55);
    const hemi = new THREE.HemisphereLight(0xdfe9ff, 0x1b2a44, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(18, 30, 14);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 120;
    dir.shadow.camera.left = -40;
    dir.shadow.camera.right = 40;
    dir.shadow.camera.top = 40;
    dir.shadow.camera.bottom = -40;
    const fill = new THREE.DirectionalLight(0x88bbff, 0.35);
    fill.position.set(-16, 10, -12);
    this.scene.add(amb, hemi, dir, fill);
    this.dir = dir;

    // 地面 + 網格
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x101b30, roughness: 0.95, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(80, 40, 0x2c4060, 0x1c2c46);
    grid.position.y = -1.19;
    this.scene.add(grid);

    this.tweens = [];
    this.time = 0;          // 引擎時鐘（毫秒）
    this.paused = false;
    this.speed = 1;         // 全域播放速度倍率
    this._raf = null;
    this._last = performance.now();
    this._loop();
  }

  _loop() {
    const now = performance.now();
    const dtRaw = clamp(now - this._last, 0, 100);
    this._last = now;
    if (!this.paused) {
      this.time += dtRaw;
      // 依速度倍率步進補間（time 本身不乘，避免跳動；tween 自己的 elapsed 不受 speed 影響，
      // 但為了「切速度立即有感」，改用 time += dtRaw*speed，造成時間本身加速。
      // 這會讓等待(await)也加速 —— 正是我們要的「速度」效果。
      this.time += dtRaw * (this.speed - 1);
      for (const t of [...this.tweens]) t.update();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  // 轉場：tween(obj, {prop:[from,to] 或 prop:to}, 秒數, {ease, tick}) → Promise
  tween(obj, props, dur, opts = {}) {
    return new Tween(this, obj, props, dur, opts).promise;
  }

  // 顏色轉場：tweenColor(material, fromHex?, toHex, 秒數, opts)
  tweenColor(material, fromHex, toHex, dur, opts = {}) {
    if (toHex === undefined) { toHex = fromHex; fromHex = undefined; }
    const c = material.color;
    const from = fromHex ? { r: new THREE.Color(fromHex).r, g: new THREE.Color(fromHex).g, b: new THREE.Color(fromHex).b }
      : { r: c.r, g: c.g, b: c.b };
    const to = { r: new THREE.Color(toHex).r, g: new THREE.Color(toHex).g, b: new THREE.Color(toHex).b };
    const target = { ...from };
    return new Tween(this, target, to, dur, {
      ...opts,
      tick: (o) => { material.color.setRGB(o.r, o.g, o.b); if (opts.tick) opts.tick(o); },
    }).promise;
  }

  // 等待
  wait(sec) {
    const dummy = {};
    return new Tween(this, dummy, { x: 1 }, sec, { ease: EASE.linear }).promise;
  }

  // 清除所有補間（用於重置）
  haltTweens() { for (const t of [...this.tweens]) t.halt(); }

  dispose() {
    cancelAnimationFrame(this._raf);
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const m = Array.isArray(o.material) ? o.material : [o.material];
        m.forEach((mm) => { mm.dispose(); });
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
  }
}

// ---------- 材質工具 ----------
export function standardMaterial(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.5, metalness: opts.metalness ?? 0.12,
    emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? true, opacity: opts.opacity ?? (opts.transparent === false ? 1 : 1),
  });
}

// 長方體（JSON 立方）。呼叫 size 時以中心為基準縮放。
export function bar(sizeX, sizeH, sizeD, color, opts = {}) {
  const geo = new THREE.BoxGeometry(sizeX, sizeH, sizeD);
  const mat = standardMaterial(color, opts);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = true;
  return mesh;
}

// 從底部成長的立柱：h 由 y=0 往上；barBottom(mesh, h) 重新縮放
export function pillar(sizeX, color, opts = {}) {
  const geo = new THREE.BoxGeometry(sizeX, 1, sizeX);
  const mat = standardMaterial(color, opts);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
export function fitPillar(mesh, h) {
  mesh.scale.y = Math.max(h, 0.001);
  mesh.position.y = h / 2 + 0.001;
}

// 文字標籤（Canvas Sprite）
export function label(text, color = '#e2e8f0', size = 1, bg = 'transparent') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = '800 72px "PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (bg !== 'transparent') {
    ctx.fillStyle = bg;
    const w = ctx.measureText(text).width;
    const rw = w + 44;
    const x = 256;
    roundRect(ctx, x - rw / 2, 34, rw, 60, 16);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(size * 3.2, size * 0.8, 1);
  return sp;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 發光光球（指針用）
export function orb(color, r = 0.5) {
  const geo = new THREE.SphereGeometry(r, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111827, emissive: color, emissiveIntensity: 2.2, roughness: 0.2, metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

// 圓柱「光柱」指示（從底下往上）
export function pointerLine(color, height = 6) {
  const geo = new THREE.CylinderGeometry(0.035, 0.035, height, 8, 1, true);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  return mesh;
}

// 箭頭（沿 -Z 指向來源的輔助線）用於飛行動畫方向暗示
export function arrowBetween(scene, from, to, color = 0x38bdf8) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  return line;
}

// ---------- 步驟播放器（Runner）----------
// steps: [{ label: string, run: async (engine, ctl) => Promise }]
// ctl = { tween, tweenColor, wait, halt } 已是 engine 本身
export class Runner {
  constructor(engine, steps = []) {
    this.engine = engine;
    this.steps = steps;
    this._log = null; // 訊息更新 callback(formatted)
    this._onStep = null; // onStep(i)
    this._onEnd = null;
    this.idx = 0;
    this.playing = false;
    this._loopActive = false;
    this._alive = true;
  }

  setLog(fn) { this._log = fn; return this; }
  onStep(fn) { this._onStep = fn; return this; }
  onEnd(fn) { this._onEnd = fn; return this; }

  _notify() {
    if (this._onStep) this._onStep(this.idx, this.steps.length);
  }
  broadcast() { this._notify(); }

  async _runStep(i) {
    const s = this.steps[i];
    if (!s) return;
    const wasPaused = this.engine.paused;
    this.engine.paused = false; // 執行本步時確保時鐘走
    try {
      if (this._log) this._log(s.label);
      await s.run(this.engine);
    } catch (e) {
      console.error('[runner] step fail', i, e);
    }
    if (!this._alive) return; // 已被 destroy/reset：不再寫 DOM、不碰暫停狀態
    if (!this.playing && this.engine.paused === false) this.engine.paused = true; // 單步後凍結
    else if (wasPaused && !this.playing) this.engine.paused = true;
    this.idx = i + 1;
    this._notify();
  }

  // 播放（若已在播放則無動作；若在暫停則解除凍結）
  play() {
    if (this.playing) { this.engine.paused = false; return; }
    if (this.idx >= this.steps.length) { this.reset(); this._alive = true; }
    this.playing = true;
    this.engine.paused = false;
    if (!this._loopActive) this._loop();
  }

  pause() {
    this.playing = false;
    if (this._loopActive) this.engine.paused = true; // 凍結目前的補間
  }
  // 同 play()，但明確用於「繼續」
  resume() { this.play(); }

  // 單步：播放中呼叫＝暫停；已完全停止（無活躍迴圈）＝安全執行一步
  step() {
    if (this._loopActive) { this.pause(); return; } // 迴圈仍在（含暫停中的 step）→ 只暫停，避免重複執行
    if (this.playing) { this.pause(); return; }
    if (this.idx >= this.steps.length) { this.reset(); this._alive = true; }
    this.playing = false;
    this._runStep(this.idx);
  }

  async _loop() {
    this._loopActive = true;
    try {
      while (this.idx < this.steps.length) {
        if (!this._alive) return;
        await this._runStep(this.idx);
        if (!this.playing) { /* 暫停時停下，等待 play/resume */ return; }
      }
      this.playing = false;
      if (this._onEnd) this._onEnd();
    } finally {
      this._loopActive = false;
    }
  }

  reset() {
    this._alive = false;
    this.engine.haltTweens();
    this.playing = false;
    this.idx = 0;
    this._loopActive = false;
    this._notify();
  }

  destroy() {
    this._alive = false;
    this.engine.haltTweens();
    this.playing = false;
  }
}
