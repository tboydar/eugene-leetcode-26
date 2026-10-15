// problem-88.js — 88. Merge Sorted Array 3D 視覺化（台灣正體中文）
import * as THREE from 'three';
import { bar, label, EASE, orb, pointerLine, fitPillar, pillar } from './vfx.js';

const SW = 2.4;          // 槽寬
const H = (v) => Math.max(v * 1.2, 0.9); // 數值 → 柱高
const C_N1 = 0x38bdf8;   // nums1 天空藍
const C_N2 = 0xfb923c;   // nums2 橘
const C_PH = 0x2f4468;   // 佔位灰藍
const C_SLOW = 0x60a5fa;
const C_FAST = 0xfb923c;
const C_P = 0x34d399;

function slotX(i, total, sw = SW) {
  return (i - (total - 1) / 2) * sw;
}

async function pulse(engine, mesh, color = 0xffffff) {
  mesh.material.emissive.setHex(color);
  await engine.tween(mesh.material, { emissiveIntensity: [0, 1.4] }, 0.2, { ease: EASE.easeOutCubic });
  await engine.tween(mesh.material, { emissiveIntensity: [1.4, 0] }, 0.35, { ease: EASE.easeInCubic });
}

export function createProblem88(engine) {
  const root = new THREE.Group();
  engine.scene.add(root);

  const nums1 = [1, 2, 3, 0, 0, 0]; // 顯示值
  const nums2 = [2, 5, 6];
  const m = 3, n = 3, total = m + n;
  const z1 = 0, z2 = -5.5;

  const slotN1 = [];
  const slotN2 = [];

  // ---- nums1 有效段 + 佔位 ----
  for (let i = 0; i < total; i++) {
    const x = slotX(i, total);
    const v = nums1[i];
    if (i < m) {
      const mb = pillar(1.6, C_N1);
      fitPillar(mb, H(v));
      mb.position.set(x, 0, z1);
      const ml = label(String(v), '#cfeafe', 0.9);
      ml.position.set(x, H(v) + 1.05, z1);
      root.add(mb, ml);
      slotN1.push({ mesh: mb, label: ml, val: v, isPH: false });
    } else {
      const pb = pillar(1.6, C_PH);
      pb.material.opacity = 0.75;
      fitPillar(pb, 0.7);
      pb.position.set(x, 0, z1);
      const pl = label('0', '#5b7497', 0.8);
      pl.position.set(x, 1.85, z1);
      root.add(pb, pl);
      slotN1.push({ mesh: pb, label: pl, val: 0, isPH: true });
    }
  }

  // ---- nums2 ----
  for (let j = 0; j < n; j++) {
    const x = slotX(j, n);
    const v = nums2[j];
    const mb = pillar(1.6, C_N2);
    fitPillar(mb, H(v));
    mb.position.set(x, 0, z2);
    const ml = label(String(v), '#ffe2c4', 0.9);
    ml.position.set(x, H(v) + 1.05, z2);
    root.add(mb, ml);
    slotN2.push({ mesh: mb, label: ml, val: v });
  }

  // ---- 指標 ----
  function makePointer(color) {
    const o = orb(color, 0.55);
    const line = pointerLine(color, 20);
    o.add(line);
    root.add(o);
    return o;
  }
  const p1 = makePointer(C_SLOW); // blue
  const p2 = makePointer(C_FAST); // orange
  const p = makePointer(C_P);     // green
  const posPtr = (ptr, x, topY, z) => {
    ptr.position.set(x, topY + 1.5, z);
  };

  let curP1 = m - 1, curP2 = n - 1, curP = total - 1;
  posPtr(p1, slotX(curP1, total), H(nums1[curP1]), z1);
  posPtr(p2, slotX(curP2, n), H(nums2[curP2]), z2);
  posPtr(p, slotX(curP, total), 0.7, z1);

  // ---- 飛行動畫：從來源複製一個值到目標位置 ----
  async function flyCopy(srcRec, destIdx, val, srcZ, destZ) {
    const sx = srcRec.mesh.position.x;
    const dx = slotX(destIdx, total);
    const srcTop = srcRec.mesh.position.y + srcRec.mesh.scale.y + 0.1;
    const dTop = H(val);
    const color = srcRec.mesh.material.color.getHex();

    const fb = pillar(1.6, color);
    fitPillar(fb, srcRec.mesh.scale.y);
    fb.position.set(sx, 0, srcZ);
    const fl = label(String(val), '#ffffff', 0.9);
    fl.position.set(sx, H(val) + 1.05, srcZ);
    root.add(fb, fl);

    // 1) 浮起
    await Promise.all([
      engine.tween(fb.position, { y: Math.max(srcTop + 2.2, 4) }, 0.3, { ease: EASE.easeOutCubic }),
      engine.tween(fl.position, { y: Math.max(srcTop + 3.3, 5.2) }, 0.3, { ease: EASE.easeOutCubic }),
    ]);
    // 2) 飛向目標並落地（變高）
    fitPillar(fb, dTop); // 長到最終高度（落地瞬間）
    await Promise.all([
      engine.tween(fb.position, { x: dx, y: dTop, z: destZ }, 0.62, { ease: EASE.easeInOutCubic }),
      engine.tween(fl.position, { x: dx, y: dTop + 1.05, z: destZ }, 0.62, { ease: EASE.easeInOutCubic }),
    ]);
    // 3) 落地彈跳
    await Promise.all([
      engine.tween(fb.position, { y: [dTop, dTop + 0.4] }, 0.12, { ease: EASE.easeOutCubic }),
      engine.tween(fl.position, { y: [dTop + 1.05, dTop + 1.42] }, 0.12, { ease: EASE.easeOutCubic }),
    ]);
    await Promise.all([
      engine.tween(fb.position, { y: dTop }, 0.18, { ease: EASE.easeInCubic }),
      engine.tween(fl.position, { y: dTop + 1.05 }, 0.18, { ease: EASE.easeInCubic }),
    ]);
    // 4) 取代該槽位的舊內容（佔位或舊值）
    const old = slotN1[destIdx];
    if (old) {
      await Promise.all([
        engine.tween(old.mesh.material, { opacity: [1, 0] }, 0.25, { ease: EASE.easeOutCubic }),
        engine.tween(old.label.material, { opacity: [1, 0] }, 0.25, { ease: EASE.easeOutCubic }),
      ]);
      root.remove(old.mesh, old.label);
    }
    slotN1[destIdx] = { mesh: fb, label: fl, val, isPH: false };
  }

  const writes = [
    { src: 'n2', val: 6, srcIdx: 2, dest: 5, cmpA: ['n1', 2], cmpB: ['n2', 2] },
    { src: 'n2', val: 5, srcIdx: 1, dest: 4, cmpA: ['n1', 2], cmpB: ['n2', 1] },
    { src: 'n1', val: 3, srcIdx: 2, dest: 3, cmpA: ['n1', 2], cmpB: ['n2', 0] },
    { src: 'n2', val: 2, srcIdx: 0, dest: 2, cmpA: ['n1', 1], cmpB: ['n2', 0] },
  ];

  function srcRec(name, idx) {
    return name === 'n1' ? slotN1[idx] : slotN2[idx];
  }

  const steps = [
    {
      label: '初始：p1→nums1[2]=3（藍）、p2→nums2[2]=6（橘）、p→nums1[5]=0（綠）',
      async run(engine) {
        await Promise.all([
          pulse(engine, slotN1[2].mesh, 0x60a5fa),
          pulse(engine, slotN2[2].mesh, 0xfb923c),
          pulse(engine, slotN1[5].mesh, 0x34d399),
        ]);
        await engine.wait(0.4);
      },
    },
    ...writes.map((w, idx) => ({
      label: `第 ${idx + 1} 次比較：${cmpText(w)} → 把較大的 ${w.val} 寫入 nums1[${w.dest}]`,
      async run(engine) {
        // 1) 比對兩側
        const a = srcRec(w.cmpA[0], w.cmpA[1]);
        const b = srcRec(w.cmpB[0], w.cmpB[1]);
        await Promise.all([
          pulse(engine, a.mesh, 0xffffff),
          pulse(engine, b.mesh, 0xffffff),
        ]);
        // 2) 較大者飛出
        const win = srcRec(w.src, w.srcIdx);
        const fromZ = w.src === 'n1' ? z1 : z2;
        await flyCopy(win, w.dest, w.val, fromZ, z1);
        // 3) 指標移動
        const moves = [];
        // 來源指針
        if (w.src === 'n2') {
          curP2 -= 1;
          if (curP2 >= 0) {
            const xp = slotX(curP2, n);
            moves.push(engine.tween(p2.position, { x: xp }, 0.3, { ease: EASE.easeInOutCubic }));
          } else {
            moves.push(engine.tween(p2.material, { opacity: [1, 0.25] }, 0.3));
          }
        } else {
          curP1 -= 1;
          const xp = slotX(curP1, total);
          moves.push(engine.tween(p1.position, { x: xp }, 0.3, { ease: EASE.easeInOutCubic }));
        }
        curP -= 1;
        moves.push(engine.tween(p.position, { x: slotX(curP, total) }, 0.3, { ease: EASE.easeInOutCubic }));
        await Promise.all(moves);
        await engine.wait(0.2);
      },
    })),
    {
      label: '收尾：nums2 已用完，nums1 前段剩餘 [1,2] 原位保留即完成',
      async run(engine) {
        await Promise.all([pulse(engine, slotN1[0].mesh, 0x34d399), pulse(engine, slotN1[1].mesh, 0x34d399)]);
        await engine.wait(0.5);
        const res = label('✅ 結果：nums1 = [1,2,2,3,5,6]，時間 O(m+n)，空間 O(1)', '#6ee7b7', 1.15, 'rgba(6,22,15,0.9)');
        res.position.set(0, 12, z1);
        root.add(res);
        await engine.wait(0.3);
      },
    },
  ];

  function cmpText(w) {
    const a = srcRec(w.cmpA[0], w.cmpA[1]).val;
    const b = srcRec(w.cmpB[0], w.cmpB[1]).val;
    return `${a} vs ${b}`;
  }

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
