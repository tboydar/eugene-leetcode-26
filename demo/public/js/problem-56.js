// problem-56.js — 56. Merge Intervals 3D 視覺化（台灣正體中文）
import * as THREE from 'three';
import { bar, label, EASE, orb, pointerLine, fitPillar, pillar } from './vfx.js';

// 單位：1 個數值 = U 個世界單位
const U = 2.2;
const H = 3;          // 區間箱高度
const SW = 2.2;       // 區間箱深度 (Z)
const Z_IN = -5.5;    // 輸入區
const Z_WORK = 1.5;   // 工作區（目前合併區間）
const Z_FIN = 8.0;    // 結果區

const C_INIT = 0x6366f1; // indigo（輸入）
const C_CUR = 0x38bdf8;  // sky（目前合併）
const C_FIN = 0x34d399;  // green（最終結果）
const C_HL = 0xfbbf24;   // amber（高亮/重疊）

function fitInterval(mesh, s, e) {
  mesh.userData.s = s;
  mesh.userData.e = e;
  mesh.scale.x = Math.max(e - s, 0.001) * U;
  mesh.position.x = ((s + e) / 2) * U;
  mesh.position.y = H / 2;
}

async function pulse(engine, mesh, color = C_HL) {
  mesh.material.emissive.setHex(color);
  await engine.tween(mesh.material, { emissiveIntensity: [0, 1.5] }, 0.22, { ease: EASE.easeOutCubic });
  await engine.tween(mesh.material, { emissiveIntensity: [1.5, 0] }, 0.4, { ease: EASE.easeInCubic });
}

async function tweenColorMesh(engine, mesh, toHex, dur = 0.5) {
  const c = mesh.material.color;
  const from = { r: c.r, g: c.g, b: c.b };
  await engine.tweenColor(mesh.material, undefined, toHex, dur, {});
}

function setLabelText(engine, root, rec, text) {
  root.remove(rec.label);
  rec.label.geometry?.dispose?.();
  rec.label.material?.dispose?.();
  rec.label = label(text, rec.color === C_FIN ? '#d1fae5' : '#e0e7ff', 0.9);
  syncLabelPos(rec);
  root.add(rec.label);
}

function syncLabelPos(rec) {
  rec.label.position.set(rec.mesh.position.x, H + 1.9, rec.mesh.position.z);
}

export function createProblem56(engine) {
  const root = new THREE.Group();
  engine.scene.add(root);
  const recs = [];

  // ---- 數線刻度 ----
  (function buildAxis() {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(19 * U, 0.18, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x33507a })
    );
    line.position.set(9 * U, -0.4, Z_WORK);
    root.add(line);
    [0, 3, 6, 9, 12, 15, 18].forEach((v) => {
      const t = label(String(v), '#54729c', 0.55);
      t.position.set(v * U, -1.0, Z_WORK);
      root.add(t);
    });
  })();

  // ---- 輸入：故意打亂順序 ----
  const shuffled = [[2, 6], [8, 10], [1, 3], [15, 18]];
  const sortedOrder = [[1, 3], [2, 6], [8, 10], [15, 18]];

  shuffled.forEach(([s, e], i) => {
    const m = bar(1, H, SW, C_INIT);
    m.position.z = Z_IN + (i - 1.5) * 2.6;
    fitInterval(m, s, e);
    const l = label(`[${s},${e}]`, '#e0e7ff', 0.9);
    const rec = { mesh: m, label: l, s, e, color: C_INIT };
    syncLabelPos(rec);
    root.add(m, l);
    recs.push(rec);
  });

  // 每一筆記錄對應的排序名次（依 start）
  const rank = (start) => sortedOrder.findIndex((x) => x[0] === start);

  const steps = [
    {
      label: '初始狀態：4 個區間（順序故意打亂，資料同官方範例）',
      async run(engine) {
        await engine.wait(0.3);
        await Promise.all(recs.map((r) => pulse(engine, r.mesh, 0x818cf8, )));
        await engine.wait(0.35);
        await Promise.all(recs.map((r) => engine.tween(r.mesh.material, { opacity: [0.35, 1] }, 0.25)));
      },
    },
    {
      label: '第一步：先依 start 由小到大排序',
      async run(engine) {
        for (const r of recs) await pulse(engine, r.mesh, 0x38bdf8);
        // 依排序名次依次飛到新位置
        const ordered = [...recs].sort((a, b) => rank(a.s) - rank(b.s));
        for (let k = 0; k < ordered.length; k++) {
          const r = ordered[k];
          const z = Z_IN + (k - 1.5) * 2.6;
          await Promise.all([
            engine.tween(r.mesh.position, { z }, 0.5, { ease: EASE.easeInOutCubic }),
            engine.tween(r.label.position, { z }, 0.5, { ease: EASE.easeInOutCubic }),
          ]);
          await engine.wait(0.12);
        }
        await engine.wait(0.3);
      },
    },
    {
      label: '第二步：拿出 [1,3] 當作「目前合併區間」',
      async run(engine) {
        const r = recs.find((x) => x.s === 1 && x.e === 3);
        await pulse(engine, r.mesh);
        await Promise.all([
          engine.tween(r.mesh.position, { z: Z_WORK }, 0.6, { ease: EASE.easeOutCubic }),
          engine.tween(r.label.position, { z: Z_WORK }, 0.6, { ease: EASE.easeOutCubic }),
        ]);
        await tweenColorMesh(engine, r.mesh, C_CUR);
        r.color = C_CUR;
        await engine.wait(0.25);
      },
    },
    {
      label: '第三步：比較下一個 [2,6] → 2 ≤ 3，重疊！',
      async run(engine) {
        const cur = recs.find((x) => x.s === 1 && x.e === 3);
        const nxt = recs.find((x) => x.s === 2 && x.e === 6);
        if (cur && nxt) {
          await pulse(engine, nxt.mesh);
          await engine.tween(nxt.mesh.position, { z: Z_WORK + 0.3 }, 0.5, { ease: EASE.easeOutCubic });
          await engine.tween(nxt.label.position, { z: Z_WORK + 0.3 }, 0.5, { ease: EASE.easeOutCubic });
          await pulse(engine, cur.mesh);
        }
        await engine.wait(0.25);
      },
    },
    {
      label: '第四步：合體！[1,3] 與 [2,6] 延伸成 [1,6]',
      async run(engine) {
        const cur = recs.find((x) => x.s === 1 && x.e === 3);
        const nxt = recs.find((x) => x.s === 2 && x.e === 6);
        if (cur) {
          // 延伸尾巴
          await engine.tween(
            cur.mesh.userData,
            { e: 6 },
            0.8,
            { ease: EASE.easeInOutCubic, tick: () => fitInterval(cur.mesh, cur.mesh.userData.s, cur.mesh.userData.e) }
          );
          cur.e = 6;
          // 更新標籤
          setLabelText(engine, root, cur, '[1,6]');
          if (nxt) {
            // 被併入的箱淡出、縮小
            await Promise.all([
              engine.tween(nxt.mesh.scale, { x: [nxt.mesh.scale.x, 0.0001] }, 0.6, { ease: EASE.easeInCubic }),
              engine.tween(nxt.mesh.material, { opacity: [1, 0] }, 0.6, { ease: EASE.easeInCubic }),
              engine.tween(nxt.label.material, { opacity: [1, 0] }, 0.6, { ease: EASE.easeInCubic }),
            ]);
            root.remove(nxt.mesh, nxt.label);
            nxt.dead = true;
          }
        }
        await engine.wait(0.3);
      },
    },
    {
      label: '第五步：[1,6] 不再與任何區間重疊 → 加入結果區',
      async run(engine) {
        const cur = recs.find((x) => x.s === 1 && x.e === 6);
        if (cur) {
          await pulse(engine, cur.mesh, 0x34d399);
          await Promise.all([
            engine.tween(cur.mesh.position, { z: Z_FIN }, 0.6, { ease: EASE.easeOutCubic }),
            engine.tween(cur.label.position, { z: Z_FIN }, 0.6, { ease: EASE.easeOutCubic }),
          ]);
          await tweenColorMesh(engine, cur.mesh, C_FIN);
          cur.color = C_FIN;
          setLabelText(engine, root, cur, '[1,6]');
        }
        await engine.wait(0.25);
      },
    },
    {
      label: '第六步：[8,10] 成為新的目前合併區間',
      async run(engine) {
        const r = recs.find((x) => x.s === 8 && x.e === 10);
        if (r) {
          await pulse(engine, r.mesh);
          await Promise.all([
            engine.tween(r.mesh.position, { z: Z_WORK }, 0.6, { ease: EASE.easeOutCubic }),
            engine.tween(r.label.position, { z: Z_WORK }, 0.6, { ease: EASE.easeOutCubic }),
          ]);
          await tweenColorMesh(engine, r.mesh, C_CUR);
          r.color = C_CUR;
          if (r.mesh.material.opacity < 1) await engine.tween(r.mesh.material, { opacity: 1 }, 0.3);
        }
        await engine.wait(0.25);
      },
    },
    {
      label: '第七步：比較 [15,18] → 15 > 10，不重疊',
      async run(engine) {
        const cur = recs.find((x) => x.s === 8 && x.e === 10);
        const nxt = recs.find((x) => x.s === 15 && x.e === 18);
        if (cur) await pulse(engine, cur.mesh, 0x34d399);
        if (nxt) await pulse(engine, nxt.mesh);
        await engine.wait(0.3);
      },
    },
    {
      label: '第八步：[8,10] 加入結果區；[15,18] 成為目前合併區間',
      async run(engine) {
        const a = recs.find((x) => x.s === 8 && x.e === 10);
        const b = recs.find((x) => x.s === 15 && x.e === 18);
        if (a) {
          await Promise.all([
            engine.tween(a.mesh.position, { z: Z_FIN }, 0.6, { ease: EASE.easeOutCubic }),
            engine.tween(a.label.position, { z: Z_FIN }, 0.6, { ease: EASE.easeOutCubic }),
          ]);
          await tweenColorMesh(engine, a.mesh, C_FIN);
          a.color = C_FIN;
          setLabelText(engine, root, a, '[8,10]');
        }
        if (b) {
          await pulse(engine, b.mesh);
          await Promise.all([
            engine.tween(b.mesh.position, { z: Z_WORK }, 0.6, { ease: EASE.easeOutCubic }),
            engine.tween(b.label.position, { z: Z_WORK }, 0.6, { ease: EASE.easeOutCubic }),
          ]);
          await tweenColorMesh(engine, b.mesh, C_CUR);
          b.color = C_CUR;
        }
        await engine.wait(0.25);
      },
    },
    {
      label: '第九步：最後，[15,18] 加入結果區',
      async run(engine) {
        const r = recs.find((x) => x.s === 15 && x.e === 18);
        if (r) {
          await pulse(engine, r.mesh, 0x34d399);
          await Promise.all([
            engine.tween(r.mesh.position, { z: Z_FIN }, 0.6, { ease: EASE.easeOutCubic }),
            engine.tween(r.label.position, { z: Z_FIN }, 0.6, { ease: EASE.easeOutCubic }),
          ]);
          await tweenColorMesh(engine, r.mesh, C_FIN);
          r.color = C_FIN;
          setLabelText(engine, root, r, '[15,18]');
        }
        await engine.wait(0.25);
      },
    },
    {
      label: '完成！答案 = [[1,6],[8,10],[15,18]]。時間 O(n log n)，空間 O(n)',
      async run(engine) {
        for (const r of recs) {
          if (r.dead) continue;
          await engine.tween(r.mesh.position, { y: [H / 2, H / 2 + 0.8] }, 0.25, { ease: EASE.easeOutCubic });
          await engine.tween(r.mesh.position, { y: H / 2 }, 0.3, { ease: EASE.easeInCubic });
        }
        const heading = label('✅ 結果：[[1,6],[8,10],[15,18]]', '#6ee7b7', 1.4, 'rgba(6,22,15,0.9)');
        heading.position.set(9 * U, 12, Z_WORK);
        root.add(heading);
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
        arr.forEach((m) => m.dispose());
      }
    });
  }

  return { root, steps, dispose };
}
