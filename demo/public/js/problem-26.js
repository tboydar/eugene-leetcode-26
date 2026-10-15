// problem-26.js — 26. Remove Duplicates from Sorted Array 3D 視覺化（台灣正體中文）
import * as THREE from 'three';
import { label, EASE, orb, pointerLine, fitPillar, pillar } from './vfx.js';

const SW = 2.6; // 槽寬
const N = 10;
const H = (v) => (v + 1) * 1.5;
const z = 0;
const PALETTE = { 0: 0x818cf6, 1: 0x38bdf8, 2: 0x34d399, 3: 0xfbbf24, 4: 0xf87171 };
const C_SLOW = 0x60a5fa;
const C_FAST = 0xfb923c;
const C_GHOST = 0x64748b;

function slotX(i) {
  return (i - (N - 1) / 2) * SW;
}

async function pulse(engine, mesh, color = 0xffffff) {
  mesh.material.emissive.setHex(color);
  await engine.tween(mesh.material, { emissiveIntensity: [0, 1.5] }, 0.2, { ease: EASE.easeOutCubic });
  await engine.tween(mesh.material, { emissiveIntensity: [1.5, 0] }, 0.35, { ease: EASE.easeInCubic });
}

function makePointer(color) {
  const o = orb(color, 0.55);
  const line = pointerLine(color, 20);
  o.add(line);
  return o;
}

export function createProblem26(engine) {
  const root = new THREE.Group();
  engine.scene.add(root);

  const nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
  const recs = []; // rec = { mesh, label, val, ghosted, color }

  for (let i = 0; i < N; i++) {
    const v = nums[i];
    const color = PALETTE[v];
    const m = pillar(1.9, color);
    fitPillar(m, H(v));
    m.position.set(slotX(i), 0, z);
    const l = label(String(v), '#eef2ff', 0.85);
    l.position.set(slotX(i), H(v) + 1.05, z);
    root.add(m, l);
    recs.push({ mesh: m, label: l, val: v, ghosted: false, color });
  }

  // 指標
  const slow = makePointer(C_SLOW);
  const fast = makePointer(C_FAST);
  root.add(slow, fast);

  let slowIdx = 0;
  let fastIdx = 1;

  function posPointers() {
    slow.position.set(slotX(slowIdx), recs[slowIdx].mesh.position.y + H(recs[slowIdx].val) * 0 + 1.5, z);
    fast.position.set(slotX(fastIdx), 1.0, z);
  }
  slow.position.set(slotX(0), H(0) + 1.5, z);
  fast.position.set(slotX(1), H(0) + 1.5, z);

  // 把「快指針」移到某槽
  function moveFast(engine, toIdx) {
    fastIdx = toIdx;
    if (toIdx < N) {
      return engine.tween(fast.position, { x: slotX(toIdx), y: H(recs[toIdx].val) + 1.5 }, 0.3, { ease: EASE.easeInOutCubic });
    }
    // 跑出範圍：往上飄走並淡出
    return Promise.all([
      engine.tween(fast.position, { y: [H(recs[N - 1].val) + 1.5, H(recs[N - 1].val) + 5] }, 0.45, { ease: EASE.easeOutCubic }),
      engine.tween(fast.material, { opacity: [1, 0] }, 0.45),
    ]);
  }

  function moveSlow(engine, toIdx) {
    slowIdx = toIdx;
    return engine.tween(slow.position, { x: slotX(toIdx), y: H(recs[toIdx].val) + 1.5 }, 0.3, { ease: EASE.easeOutBack });
  }

  // 重複項：閃紅 + 淡化為灰色幽靈
  async function ghost(engine, idx) {
    const rec = recs[idx];
    rec.mesh.material.emissive.setHex(0xf87171);
    await engine.tween(rec.mesh.material, { emissiveIntensity: [0, 1.6] }, 0.18, { ease: EASE.easeOutCubic });
    await engine.tween(rec.mesh.material, { emissiveIntensity: [1.6, 0] }, 0.3, { ease: EASE.easeInCubic });
    await Promise.all([
      engine.tweenColor(rec.mesh.material, undefined, C_GHOST, 0.4),
      engine.tween(rec.mesh.material, { opacity: [1, 0.28] }, 0.4),
      engine.tween(rec.label.material, { opacity: [1, 0.3] }, 0.4),
    ]);
    rec.mesh.position.y = Math.max(H(rec.val) * 0.3, 0.3);
    rec.ghosted = true;
  }

  // 寫入新唯一值：從來源槽飛一個複本到 slow 槽
  async function writeUnique(engine, slowTo, val, srcIdx) {
    const srcRec = recs[srcIdx];
    const colorHex = srcRec.mesh.material.color.getHex();
    const nb = pillar(1.9, colorHex);
    fitPillar(nb, H(val));
    nb.position.set(slotX(srcIdx), 0, z);
    const nl = label(String(val), '#eef2ff', 0.85);
    nl.position.set(slotX(srcIdx), H(val) + 1.05, z);
    root.add(nb, nl);

    // 舊目標先淡出移除
    const old = recs[slowTo];
    if (old && old !== srcRec) {
      await Promise.all([
        engine.tween(old.mesh.material, { opacity: [old.mesh.material.opacity, 0] }, 0.22, { ease: EASE.easeOutCubic }),
        engine.tween(old.label.material, { opacity: [old.label.material.opacity, 0] }, 0.22, { ease: EASE.easeOutCubic }),
      ]);
      root.remove(old.mesh, old.label);
    }

    // 飛起來
    await Promise.all([
      engine.tween(nb.position, { y: [0, 4] }, 0.22, { ease: EASE.easeOutCubic }),
      engine.tween(nl.position, { y: [H(val) + 1.05, 5.4] }, 0.22, { ease: EASE.easeOutCubic }),
    ]);
    // 飛到 slow 槽並落地
    await Promise.all([
      engine.tween(nb.position, { x: [slotX(srcIdx), slotX(slowTo)], y: [4, H(val)], z: [z, z] }, 0.55, { ease: EASE.easeInOutCubic }),
      engine.tween(nl.position, { x: [slotX(srcIdx), slotX(slowTo)], y: [5.4, H(val) + 1.05] }, 0.55, { ease: EASE.easeInOutCubic }),
    ]);

    recs[slowTo] = { mesh: nb, label: nl, val, ghosted: false, color: colorHex };
    await moveSlow(engine, slowTo);
  }

  const steps = [
    {
      label: '初始：slow=0（藍）→ nums[0]=0，fast=1（橘）→ nums[1]=0',
      async run(engine) {
        await Promise.all([pulse(engine, recs[0].mesh, C_SLOW), pulse(engine, recs[1].mesh, C_FAST)]);
        await engine.wait(0.4);
      },
    },
    {
      label: 'fast=1：nums[1]=0 與 nums[slow]=0 相同 → 重複項，跳過（淡化）',
      async run(engine) {
        await ghost(engine, 1);
        await moveFast(engine, 2);
        await engine.wait(0.25);
      },
    },
    {
      label: 'fast=2：nums[2]=1 ≠ 0 → 新值：slow 前進到 1，把 1 寫入 nums[1]',
      async run(engine) {
        await pulse(engine, recs[2].mesh, PALETTE[1]);
        await writeUnique(engine, 1, 1, 2);
        await moveFast(engine, 3);
        await engine.wait(0.2);
      },
    },
    {
      label: 'fast=3：nums[3]=1 與 nums[slow]=1 相同 → 重複項，淡化',
      async run(engine) {
        await ghost(engine, 3);
        await moveFast(engine, 4);
        await engine.wait(0.18);
      },
    },
    {
      label: 'fast=4：nums[4]=1 相同 → 再次跳過重複項',
      async run(engine) {
        await ghost(engine, 4);
        await moveFast(engine, 5);
        await engine.wait(0.18);
      },
    },
    {
      label: 'fast=5：nums[5]=2 ≠ 1 → 新值：slow 前進到 2，寫入 2',
      async run(engine) {
        await pulse(engine, recs[5].mesh, PALETTE[2]);
        await writeUnique(engine, 2, 2, 5);
        await moveFast(engine, 6);
        await engine.wait(0.2);
      },
    },
    {
      label: 'fast=6：nums[6]=2 相同 → 重複項，淡化',
      async run(engine) {
        await ghost(engine, 6);
        await moveFast(engine, 7);
        await engine.wait(0.18);
      },
    },
    {
      label: 'fast=7：nums[7]=3 ≠ 2 → 新值：slow 前進到 3，寫入 3',
      async run(engine) {
        await pulse(engine, recs[7].mesh, PALETTE[3]);
        await writeUnique(engine, 3, 3, 7);
        await moveFast(engine, 8);
        await engine.wait(0.2);
      },
    },
    {
      label: 'fast=8：nums[8]=3 相同 → 重複項，淡化',
      async run(engine) {
        await ghost(engine, 8);
        await moveFast(engine, 9);
        await engine.wait(0.18);
      },
    },
    {
      label: 'fast=9：nums[9]=4 ≠ 3 → 新值：slow 前進到 4，寫入 4',
      async run(engine) {
        await pulse(engine, recs[9].mesh, PALETTE[4]);
        await writeUnique(engine, 4, 4, 9);
        await moveFast(engine, 10);
        await engine.wait(0.25);
      },
    },
    {
      label: '完成：fast 超出陣列，k = slow+1 = 5 → 前 5 格 [0,1,2,3,4]',
      async run(engine) {
        // 後段淡化（忽略區）
        await Promise.all(
          Array.from({ length: 5 }, (_, k) => 5 + k).map((i) =>
            Promise.all([
              engine.tweenColor(recs[i].mesh.material, undefined, C_GHOST, 0.4),
              engine.tween(recs[i].mesh.material, { opacity: [1, 0.22] }, 0.4),
              engine.tween(recs[i].label.material, { opacity: [1, 0.25] }, 0.4),
            ])
          )
        );
        // 前 5 格亮起
        await Promise.all(
          Array.from({ length: 5 }, (_, k) => k).map((i) =>
            pulse(engine, recs[i].mesh, 0x34d399).then(() => engine.tween(recs[i].mesh.position, { y: [recs[i].mesh.position.y, recs[i].mesh.position.y + 0.7] }, 0.22, { ease: EASE.easeOutCubic }).then(() => engine.tween(recs[i].mesh.position, { y: recs[i].mesh.position.y - 0.7 }, 0.28, { ease: EASE.easeInCubic })))
          )
        );
        const res = label('✅ k = 5 → [0,1,2,3,4]，時間 O(n)，空間 O(1)', '#6ee7b7', 1.15, 'rgba(6,22,15,0.9)');
        res.position.set(0, 12, z);
        root.add(res);
        await engine.wait(0.3);
      },
    },
  ];

  function dispose() {
    engine.scene.remove(root);
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const arr = Array.isArray(o.material) ? o.material : [o.material];
        arr.forEach((mm) => mm.dispose());
      }
    });
  }

  return { root, steps, dispose };
}
