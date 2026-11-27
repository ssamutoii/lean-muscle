// Lean Muscle: animated exercise figures. Every shape is a path with a fixed point
// count, so SVG can tween it smoothly between sampled frames.
(function () {
  const W = 320, H = 262, FLOOR = 237;
  const L = (a, b, t) => a + (b - a) * t;
  const P = (a, b, t) => [L(a[0], b[0], t), L(a[1], b[1], t)];
  const add = (p, x, y) => [p[0] + x, p[1] + y];
  const mv = (p, u, k) => [p[0] + u[0] * k, p[1] + u[1] * k];
  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  const f = n => String(Math.round(n * 10) / 10);
  const pt = p => f(p[0]) + ' ' + f(p[1]);
  const poly = (pts, close) => 'M' + pts.map(pt).join('L') + (close === false ? '' : 'Z');
  // two-bone joint solver: side picks which way the joint bends
  const ik = (a, c, l1, l2, side) => {
    const dx = c[0] - a[0], dy = c[1] - a[1], d = Math.max(1, Math.min(Math.hypot(dx, dy), l1 + l2 - .01));
    const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x)), u = Math.atan2(dy, dx);
    return [a[0] + x * Math.cos(u) - side * h * Math.sin(u), a[1] + x * Math.sin(u) + side * h * Math.cos(u)];
  };
  const capPts = (a, b, r1, r2) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    const th = d < .5 ? 0 : Math.atan2(dy, dx), al = d < .5 ? Math.PI / 2 : Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / d)));
    const out = [], N = 7;
    for (let i = 0; i <= N; i++) { const g = th + al + (2 * Math.PI - 2 * al) * i / N; out.push([a[0] + r1 * Math.cos(g), a[1] + r1 * Math.sin(g)]); }
    for (let i = 0; i <= N; i++) { const g = th - al + 2 * al * i / N; out.push([b[0] + r2 * Math.cos(g), b[1] + r2 * Math.sin(g)]); }
    return out;
  };

  const C = {
    skin: '#e8eef7', far: '#5c6a80', hairM: '#8a6248', hairF: '#c4825a', teeM: '#9fc3ee', shortM: '#2f68b5', topF: '#43c3c9', legF: '#2f68b5',
    farCloth: '#1d355a', shoe: '#f5f9ff', farShoe: '#33415c', line: '#17253f', steel: '#7290b6', steelD: '#46607f', pad: '#33507c', padD: '#243a5c',
    cable: '#58bbff', bell: '#274d80', bellEdge: '#93c9ff', hot: '#c6f432'
  };

  function Scene(sex) {
    const items = [], fem = sex === 'female';
    const put = (d, a) => items.push(Object.assign({ d }, a));
    const S = {
      items, sex,
      cap(a, b, r1, r2, fill, x) { put(poly(capPts(a, b, r1, r2)), Object.assign({ fill }, x)); },
      dot(c, r, fill, x) { S.cap(c, c, r, r, fill, x); },
      poly(pts, fill, x) { put(poly(pts), Object.assign({ fill }, x)); },
      line(pts, stroke, w, x) { put(poly(pts, false), Object.assign({ fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, x)); },
      // equipment
      post(a, b, r) { S.cap(a, b, r || 4, r || 4, C.steelD); },
      beam(a, b, r) { S.cap(a, b, r || 4, r || 4, C.steel); },
      pad(a, b, r) { S.cap(a, b, r || 8, r || 8, C.pad); },
      pivot(p, r) { S.dot(p, r || 7, C.padD, { stroke: C.bellEdge, 'stroke-width': 2 }); },
      plate(p, r) { r = r || 24; S.dot(p, r, C.bell, { stroke: C.steel, 'stroke-width': 5 }); S.dot(p, r * .5, 'none', { stroke: C.cable, 'stroke-width': 1.5 }); S.dot(p, 4, '#e8f1ff'); },
      // dumbbell seen end on (handle points at the viewer)
      hex(p, far) { const h = [0, 1, 2, 3, 4, 5].map(i => [p[0] + 14 * Math.cos(i * Math.PI / 3 + .52), p[1] + 14 * Math.sin(i * Math.PI / 3 + .52)]); S.poly(h, C.bell, { stroke: C.bellEdge, 'stroke-width': 2, opacity: far ? .55 : 1 }); S.dot(p, 4, '#dcecff', { opacity: far ? .55 : 1 }); },
      // dumbbell seen side on, handle along direction u
      dbell(p, u, far) {
        u = u || [1, 0]; const n = [-u[1], u[0]], o = { opacity: far ? .55 : 1 };
        S.cap(mv(p, u, -17), mv(p, u, 17), 3, 3, C.steel, o);
        [-16, 16].forEach(k => S.cap(mv(mv(p, u, k), n, -8), mv(mv(p, u, k), n, 8), 5.5, 5.5, C.bell, Object.assign({ stroke: C.bellEdge, 'stroke-width': 1.5 }, o)));
      },
      cable(a, b) { S.line([a, b], C.cable, 2.5); },
      tower(x, top) { S.post([x, top || 14], [x, FLOOR - 2], 6); S.post([x - 16, FLOOR - 3], [x + 16, FLOOR - 3], 3); for (let i = 0; i < 6; i++) S.cap([x - 12, 158 + i * 11], [x + 12, 158 + i * 11], 4, 4, C.padD); },
      pulley(p) { S.dot(p, 8, C.padD, { stroke: C.bellEdge, 'stroke-width': 2 }); S.dot(p, 2.5, C.bellEdge); },
      rope(h, from) { const u = unit(from, h), n = [-u[1], u[0]]; [-1, 1].forEach(s => { const e = mv(mv(h, u, 9), n, 6 * s); S.line([mv(h, u, -8), e], '#d9b98c', 4); S.dot(e, 3.5, '#d9b98c'); }); },
      dhandle(h, from) { const u = unit(from, h), n = [-u[1], u[0]], a = mv(h, u, -11); S.line([a, mv(mv(h, u, 2), n, 9), mv(mv(h, u, 2), n, -9), a], C.bellEdge, 3); },
      bar(h, dx, dy) { S.cap(add(h, -(dx || 13), -(dy || 0)), add(h, dx || 13, dy || 0), 4, 4, C.steel); },
      rails(x, top) { S.post([x - 7, top || 8], [x - 7, FLOOR - 2], 2.5); S.post([x + 7, top || 8], [x + 7, FLOOR - 2], 2.5); S.post([x - 16, top || 8], [x + 16, top || 8], 3); S.post([x - 22, FLOOR - 3], [x + 22, FLOOR - 3], 3); },
      smithBar(p, r) { S.cap(add(p, -14, 0), add(p, 14, 0), 4, 4, C.cable); S.plate(p, r || 19); },
      bench(a, b, legs) { (legs || []).forEach(x => S.post([x[0], x[1]], [x[0], FLOOR - 2], 4)); S.pad(a, b, 9); },
      block(x1, y1, x2, y2) { S.poly([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], C.padD, { stroke: C.steel, 'stroke-width': 2 }); },
      path(d) { items.push({ d, fill: 'none', stroke: C.cable, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round', opacity: .75 }); }
    };

    const glow = (a, b, r1, r2, g) => { S.cap(a, b, r1 + 3, r2 + 3, C.hot, { opacity: .12 + .16 * g }); S.cap(a, b, r1, r2, C.hot, { opacity: .6 + .38 * g }); };

    /* ---------- side view ---------- */
    // pose: hip, sh, face(+1 faces "forward"), head?, nl/fl:{knee,ank,toe?}, na/fa:{el,ha}
    S.side = function (p, o) {
      o = o || {};
      const u = unit(p.hip, p.sh), face = p.face || 1, fr = [-u[1] * face, u[0] * face], g = o.g || 0, M = o.m || [];
      const head = p.head || mv(p.sh, u, 28);
      const hu = unit(p.sh, head), hf = [-hu[1] * face, hu[0] * face];
      const OL = { stroke: C.line, 'stroke-width': 1.8 };
      const leg = (l, far) => {
        if (!l) return;
        const hip = far ? add(p.hip, 7, -4) : p.hip, k = far ? add(l.knee, 9, -4) : l.knee, a = far ? add(l.ank, 10, -2) : l.ank;
        const toe = l.toe ? (far ? add(l.toe, 10, -2) : l.toe) : add(a, 18 * (l.dir || face), 5);
        const x = far ? {} : OL, skin = far ? C.far : C.skin, cloth = far ? C.farCloth : (fem ? C.legF : C.shortM);
        S.cap(hip, k, fem ? 14 : 14, fem ? 8 : 9, fem ? cloth : skin, x);
        S.cap(k, a, fem ? 8 : 9.5, fem ? 4.5 : 5.5, fem ? cloth : skin, x);
        if (fem) S.cap(P(k, a, .86), a, 4.8, 4.5, skin);
        else S.cap(hip, P(hip, k, .56), 14.8, 11, cloth, x);
        S.cap(a, toe, 6.2, 4.2, far ? C.farShoe : C.shoe, x);
      };
      const arm = (m, far) => {
        if (!m) return;
        const sh = far ? add(p.sh, 8, -4) : p.sh, e = far ? add(m.el, 9, -4) : m.el, h = far ? add(m.ha, 9, -4) : m.ha;
        const x = far ? {} : OL, skin = far ? C.far : C.skin;
        S.cap(sh, e, fem ? 8 : 10.5, fem ? 5.2 : 7, skin, x);
        if (!fem) S.cap(sh, P(sh, e, .42), 11.2, 9, far ? C.farCloth : C.teeM, x);
        S.cap(e, h, fem ? 5.4 : 7, fem ? 3.4 : 4.2, skin, x);
        S.dot(h, fem ? 4.6 : 5.6, skin, x);
      };
      leg(p.fl, 1); arm(p.fa, 1); o.far && o.far();
      // torso
      if (fem) {
        const waist = mv(P(p.hip, p.sh, .38), fr, -1);
        S.cap(p.sh, waist, 14, 9, C.skin); S.cap(waist, p.hip, 9, 13.5, C.skin);
        S.dot(mv(P(p.hip, p.sh, .72), fr, 8), 7.5, C.topF);
        S.cap(p.sh, P(p.hip, p.sh, .58), 13.6, 10.6, C.topF);
        S.cap(P(p.hip, p.sh, .2), p.hip, 10.6, 14, C.legF);
      } else {
        S.cap(p.sh, p.hip, 17.5, 12.5, C.skin);
        S.cap(p.sh, P(p.hip, p.sh, .22), 17.5, 13, C.teeM);
        S.cap(P(p.hip, p.sh, .24), p.hip, 13, 13.8, C.shortM);
      }
      // neck, hair and head
      S.cap(p.sh, head, fem ? 5.5 : 7.5, fem ? 5 : 6.5, C.skin);
      if (fem) {
        const root = mv(mv(head, hf, -10), hu, 5), tail = mv(mv(root, hf, -9), hu, -24);
        S.cap(root, tail, 7.5, 3, C.hairF);
        S.dot(mv(mv(head, hf, -2.5), hu, 2.5), 13.6, C.hairF);
        S.dot(mv(mv(head, hf, 2), hu, -1.5), 11, C.skin);
      } else {
        S.dot(mv(mv(head, hf, -1), hu, 2.5), 13.2, C.hairM);
        S.dot(mv(mv(head, hf, 1.5), hu, -1), 12, C.skin);
      }
      // worked muscles on the trunk and legs
      const at = (k, off) => mv(P(p.hip, p.sh, k), fr, off);
      if (M.includes('chest')) glow(at(.68, 8), at(.92, 9), 6.5, 5, g);
      if (M.includes('lats')) glow(at(.32, -6), at(.76, -9), 4, 8, g);
      if (M.includes('upperback')) glow(at(.66, -10), at(.9, -10), 6, 6, g);
      if (M.includes('abs')) glow(at(.18, 8), at(.56, 9), 4.5, 5.5, g);
      if (M.includes('lowback')) glow(at(.12, -8), at(.38, -7), 5, 4, g);
      if (M.includes('hipflex')) glow(at(.02, 8), mv(P(p.hip, p.nl.knee, .22), fr, 3), 5, 4, g);
      o.mid && o.mid();
      leg(p.nl, 0);
      if (p.nl) {
        const k = p.nl.knee, a = p.nl.ank, h = p.hip;
        const nOf = (x, y) => { const q = unit(x, y); return [-q[1], q[0]]; };
        // front of the thigh is the side away from where the shin folds
        let n = nOf(h, k); const v = unit(k, a); let s = n[0] * v[0] + n[1] * v[1];
        const frontSign = Math.abs(s) > .25 ? (s > 0 ? -1 : 1) : (n[0] * fr[0] + n[1] * fr[1] >= 0 ? 1 : -1);
        if (M.includes('quads')) glow(mv(P(h, k, .3), n, 5 * frontSign), mv(P(h, k, .84), n, 4 * frontSign), 6.5, 4, g);
        if (M.includes('hams')) glow(mv(P(h, k, .28), n, -6 * frontSign), mv(P(h, k, .82), n, -4 * frontSign), 6, 4, g);
        if (M.includes('glutes')) glow(mv(h, fr, -7), mv(P(h, k, .12), n, -6 * frontSign), 8.5, 6.5, g);
        if (M.includes('calves')) { const n2 = nOf(k, a); glow(mv(P(k, a, .12), n2, 3.5 * frontSign), mv(P(k, a, .52), n2, 2.5 * frontSign), 6, 3.5, g); }
      }
      o.pre && o.pre();
      arm(p.na, 0);
      if (p.na) {
        const e = p.na.el, h = p.na.ha, s = p.sh;
        const q = unit(s, e), n = [-q[1], q[0]], v = unit(e, h);
        const d = n[0] * v[0] + n[1] * v[1], flex = d >= 0 ? 1 : -1;
        if (M.includes('biceps')) glow(mv(P(s, e, .34), n, 3.5 * flex), mv(P(s, e, .8), n, 3 * flex), 4.8, 3.4, g);
        if (M.includes('triceps')) glow(mv(P(s, e, .3), n, -3.5 * flex), mv(P(s, e, .82), n, -3 * flex), 4.8, 3.4, g);
        if (M.includes('forearm')) glow(P(e, h, .12), P(e, h, .55), 4, 2.8, g);
        if (M.includes('delts')) glow(s, P(s, e, .24), 7.5, 5.5, g);
      }
      o.front && o.front();
    };

    /* ---------- front view ---------- */
    // pose: x, sy, hy, l/r:{el,ha}, ll/rl:{knee,ank}
    S.front = function (p, o) {
      o = o || {};
      const g = o.g || 0, M = o.m || [], x = p.x || 160, sy = p.sy, hy = p.hy;
      const sw = fem ? 20 : 27, ww = fem ? 10 : 15, hw = fem ? 17 : 14;
      const OL = { stroke: C.line, 'stroke-width': 1.8 };
      const SL = [x - sw, sy], SR = [x + sw, sy], head = [x, sy - 30];
      [[p.ll, -1], [p.rl, 1]].forEach(([l, s]) => {
        if (!l) return; const h = [x + s * (hw - 5), hy];
        S.cap(h, l.knee, 11.5, 7.5, fem ? C.legF : C.skin, OL);
        S.cap(l.knee, l.ank, fem ? 7 : 8, 5, fem ? C.legF : C.skin, OL);
        if (!fem) S.cap(h, P(h, l.knee, .55), 12.2, 10, C.shortM, OL);
        S.cap(l.ank, add(l.ank, s * 9, 5), 6, 5, C.shoe, OL);
      });
      if (fem) { S.cap([x + 7, sy - 38], [x + 22, sy - 6], 8, 3, C.hairF); }
      o.far && o.far();
      const wy = sy + (hy - sy) * .64;
      S.poly([SL, [x - sw * .35, sy - 7], [x + sw * .35, sy - 7], SR, [x + ww, wy], [x + hw, hy + 4], [x - hw, hy + 4], [x - ww, wy]], C.skin, { stroke: C.skin, 'stroke-width': 6, 'stroke-linejoin': 'round' });
      const top = fem ? C.topF : C.teeM, tb = fem ? sy + (hy - sy) * .42 : wy + 6, tw = fem ? sw * .72 : ww + 1;
      S.poly([[x - sw + 2, sy], [x - sw * .3, sy - 5], [x + sw * .3, sy - 5], [x + sw - 2, sy], [x + tw, tb], [x - tw, tb]], top, { stroke: top, 'stroke-width': 5, 'stroke-linejoin': 'round' });
      const sh = fem ? C.legF : C.shortM;
      S.poly([[x - (fem ? ww + 1 : ww + 1), wy + 6], [x + ww + 1, wy + 6], [x + hw, hy + 6], [x - hw, hy + 6]], sh, { stroke: sh, 'stroke-width': 6, 'stroke-linejoin': 'round' });
      S.cap([x, sy - 6], [x, sy - 20], fem ? 5.5 : 8, fem ? 5 : 7, C.skin);
      if (fem) { S.dot([x, head[1] - 2], 14.5, C.hairF); S.dot([x, head[1] + 2], 11, C.skin); }
      else { S.dot([x, head[1] - 2.5], 13, C.hairM); S.dot([x, head[1] + 1], 12, C.skin); }
      if (M.includes('lats')) [-1, 1].forEach(s => glow([x + s * (sw - 6), sy + 14], [x + s * (ww - 3), wy - 4], 6, 3, g));
      if (M.includes('upperback')) [-1, 1].forEach(s => glow([x + s * 5, sy + 8], [x + s * (sw - 9), sy + 4], 5, 5, g));
      if (M.includes('chest')) [-1, 1].forEach(s => glow([x + s * 4, sy + 12], [x + s * (sw - 9), sy + 9], 6, 6, g));
      o.mid && o.mid();
      [[p.l, SL], [p.r, SR]].forEach(([m, s]) => {
        if (!m) return;
        S.cap(s, m.el, fem ? 7.5 : 10.5, fem ? 5 : 7, C.skin, OL);
        if (!fem) S.cap(s, P(s, m.el, .4), 11.2, 9, C.teeM, OL);
        S.cap(m.el, m.ha, fem ? 5 : 7, fem ? 3.4 : 4.4, C.skin, OL);
        S.dot(m.ha, fem ? 4.6 : 5.6, C.skin, OL);
        if (M.includes('delts')) glow(s, P(s, m.el, .26), 7.5, 5.5, g);
        if (M.includes('triceps')) glow(P(s, m.el, .38), P(s, m.el, .82), 4.5, 3.2, g);
      });
      o.front && o.front();
    };
    return S;
  }

  /* ---------- the 63 movements. t runs 0 (start) to 1 (squeeze) ---------- */
  const EX = {};
  const MU = (...a) => a;

  // incline pressing
  const inclineBase = (S, t, g, held, opt) => {
    opt = opt || {};
    const hip = [162, 186], sh = [103, 146], ha = P([128, 128], [106, 62], t), el = P(opt.el0 || [124, 174], [106, 102], t);
    opt.back && opt.back(ha);
    S.bench([66, 136], [158, 197], [[118, 178]]); S.bench([158, 201], [188, 201], [[176, 205]]);
    S.side({ hip, sh, nl: { knee: [208, 166], ank: [224, 227] }, fl: { knee: [208, 166], ank: [224, 227] }, na: { el, ha }, fa: { el, ha } },
      { g, m: MU('chest', 'delts', 'triceps'), far: () => held(add(ha, 9, -4), 1), front: () => held(ha, 0) });
  };
  EX.incPress = (S, t, g) => inclineBase(S, t, g, (h, far) => S.hex(h, far));
  EX.nIncDb = (S, t, g) => inclineBase(S, t, g, (h, far) => S.dbell(h, [.99, .12], far), { el0: [138, 168] });
  EX.incSmith = (S, t, g) => inclineBase(S, t, g, (h, far) => { if (!far) S.smithBar(h); }, { back: () => S.rails(110) });
  EX.incMachPress = (S, t, g) => inclineBase(S, t, g, (h, far) => { if (!far) S.bar(h, 4, 12); }, { back: h => { S.tower(42, 40); S.pivot([42, 74]); S.beam([42, 74], h, 5); } });

  const flatBase = (S, t, g, held, back) => {
    const hip = [180, 182], sh = [112, 180], ha = P([134, 160], [114, 102], t), el = P([132, 192], [114, 141], t);
    back && back();
    S.bench([76, 196], [192, 196], [[92, 200], [178, 200]]);
    S.side({ hip, sh, nl: { knee: [216, 172], ank: [228, 227] }, fl: { knee: [216, 172], ank: [228, 227] }, na: { el, ha }, fa: { el, ha } },
      { g, m: MU('chest', 'delts', 'triceps'), far: () => held(add(ha, 9, -4), 1), front: () => held(ha, 0) });
  };
  EX.flatPress = (S, t, g) => flatBase(S, t, g, (h, far) => S.hex(h, far));
  EX.smithFlat = (S, t, g) => flatBase(S, t, g, (h, far) => { if (!far) S.smithBar(h, 21); }, () => S.rails(116, 40));

  const upright = (S, t, g, o) => {
    const hip = [132, 182], sh = [126, 114], ha = P(o.h0, o.h1, t), el = P(o.e0, o.e1, t);
    o.back && o.back(ha);
    S.post([116, 186], [116, 235]); S.post([96, 234], [150, 234], 3);
    S.pad([104, 96], [112, 184], 8); S.pad([112, 196], [156, 196], 8);
    const legs = { knee: [186, 180], ank: [194, 227] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: o.m, far: () => o.held(add(ha, 9, -4), 1), front: () => o.held(ha, 0) });
  };
  EX.machPress = (S, t, g) => upright(S, t, g, { h0: [150, 130], h1: [200, 122], e0: [106, 142], e1: [164, 124], m: MU('chest', 'delts', 'triceps'), back: h => { S.tower(264, 22); S.pivot([248, 40]); S.beam([264, 40], [248, 40]); S.beam([248, 40], h, 5); }, held: (h, far) => { if (!far) S.bar(h, 3, 13); } });
  const press = { h0: [150, 102], h1: [132, 40], e0: [154, 142], e1: [138, 76], m: MU('delts', 'triceps') };
  EX.ohp = (S, t, g) => upright(S, t, g, Object.assign({}, press, { held: (h, far) => S.hex(h, far) }));
  EX.smithOhp = (S, t, g) => upright(S, t, g, Object.assign({}, press, { h0: [146, 102], h1: [146, 36], back: () => S.rails(146), held: (h, far) => { if (!far) S.smithBar(h, 18); } }));
  EX.machOhp = (S, t, g) => upright(S, t, g, Object.assign({}, press, { h0: [156, 112], h1: [146, 46], back: h => { S.tower(52, 40); S.pivot([62, 92]); S.beam([52, 92], [62, 92]); S.beam([62, 92], h, 5); }, held: (h, far) => { if (!far) S.bar(h, 12, 0); } }));

  // chest-supported rows
  const proneRow = (S, t, g, o) => {
    const hip = [132, 170], sh = [182, 126], ha = P(o.h0, o.h1, t), el = P(o.e0, o.e1, t);
    o.back && o.back(ha);
    S.post([164, 172], [170, 235]); S.post([138, 234], [206, 234], 3);
    S.pad([138, 190], [194, 140], 9);
    const legs = { knee: [96, 197], ank: [72, 224] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('lats', 'upperback', 'delts', 'biceps'), far: () => o.held(add(ha, 9, -4), 1), front: () => o.held(ha, 0) });
  };
  EX.chestRow = (S, t, g) => proneRow(S, t, g, { h0: [190, 202], h1: [180, 148], e0: [186, 165], e1: [146, 124], held: (h, far) => S.dbell(h, [1, 0], far) });
  EX.machRow = (S, t, g) => proneRow(S, t, g, { h0: [232, 164], h1: [180, 158], e0: [208, 144], e1: [148, 128], back: h => { S.tower(282, 80); S.pivot([258, 220]); S.beam([282, 220], [258, 220]); S.beam([258, 220], h, 5); }, held: (h, far) => { if (!far) { S.bar(h, 3, 13); S.plate([248, 198], 14); } } });

  EX.saRow = (S, t, g) => {
    const hip = [124, 140], sh = [192, 126], ha = P([196, 202], [162, 146], t), el = P([196, 165], [146, 108], t);
    S.bench([78, 196], [228, 196], [[90, 200], [214, 200]]);
    S.side({ hip, sh, fl: { knee: [120, 184], ank: [76, 183], toe: [60, 182] }, fa: { el: [200, 156], ha: [204, 182] }, nl: { knee: [138, 183], ank: [130, 227] }, na: { el, ha } },
      { g, m: MU('lats', 'upperback', 'biceps'), front: () => S.dbell(ha, [1, 0]) });
  };

  // vertical pulls
  const pulldownBase = (S, t, g, single) => {
    const hip = [150, 184], sh = P([148, 116], [140, 118], t), ha = P([178, 44], [164, 112], t), el = P([166, 80], [134, 156], t);
    S.tower(250, 16); S.beam([250, 18], [186, 18]); S.pulley([182, 24]);
    S.post([150, 200], [150, 235]); S.post([150, 234], [250, 234], 3); S.bench([132, 199], [176, 199]); S.post([206, 166], [250, 166]);
    const legs = { knee: [204, 181], ank: [208, 227] }, rest = { el: [162, 154], ha: [188, 170] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: single ? rest : { el, ha } },
      { g, m: MU('lats', 'upperback', 'biceps'), far: () => S.cable([182, 24], ha), mid: () => S.pad([188, 166], [208, 166], 8), front: () => { if (single) S.dhandle(ha, [182, 24]); else { S.line([add(ha, -9, 6), add(ha, 0, -9), add(ha, 9, 6)], C.bellEdge, 3); S.bar(ha, 12, -3); } } });
  };
  EX.pulldown = (S, t, g) => pulldownBase(S, t, g, false);
  EX.saPulldown = (S, t, g) => pulldownBase(S, t, g, true);

  const frontSeat = (S, hy) => { S.post([160, hy + 10], [160, 235], 5); S.post([128, 234], [192, 234], 3); S.pad([134, hy + 14], [186, hy + 14], 8); };
  const sitLegs = hy => ({ ll: { knee: [138, hy + 12], ank: [136, 227] }, rl: { knee: [182, hy + 12], ank: [184, 227] } });
  const standLegs = { ll: { knee: [146, 183], ank: [141, 227] }, rl: { knee: [174, 183], ank: [179, 227] } };
  const mirror = p => [320 - p[0], p[1]];
  const both = (S, t, o) => {
    const r = { el: P(o.e0, o.e1, t), ha: P(o.h0, o.h1, t) }, l = { el: mirror(r.el), ha: mirror(r.ha) };
    return { l, r };
  };

  EX.widePulldown = (S, t, g) => {
    const a = both(S, t, { h0: [224, 40], h1: [214, 106], e0: [206, 76], e1: [226, 134] });
    S.beam([60, 14], [260, 14], 4); S.post([62, 14], [62, 235], 5); S.post([258, 14], [258, 235], 5); S.pulley([160, 18]);
    frontSeat(S, 172);
    S.front(Object.assign({ sy: 106, hy: 172 }, a, sitLegs(172)), { g, m: MU('lats', 'upperback'), far: () => S.cable([160, 20], [160, a.r.ha[1] - 8]),
      front: () => { S.line([[a.l.ha[0] - 18, a.l.ha[1] + 6], [a.l.ha[0] + 6, a.l.ha[1] - 7], [160, a.r.ha[1] - 9], [a.r.ha[0] - 6, a.r.ha[1] - 7], [a.r.ha[0] + 18, a.r.ha[1] + 6]], C.bellEdge, 5); S.pad([128, 186], [150, 186], 6); S.pad([170, 186], [192, 186], 6); } });
  };

  EX.pullup = (S, t, g) => {
    const sh = P([150, 112], [146, 70], t), hip = P([152, 180], [144, 138], t), ha = [164, 36], el = P([160, 74], [190, 88], t);
    S.post([236, 14], [236, 235], 6); S.beam([164, 20], [236, 20], 4); S.post([210, 234], [262, 234], 3); S.beam([164, 20], [164, 34], 4);
    const legs = { knee: add(hip, 4, 52), ank: add(hip, -34, 66) };
    S.side({ hip, sh, head: add(sh, -17, -22), nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('lats', 'upperback', 'biceps'), front: () => { S.dot(ha, 6, C.steel); S.dot(ha, 2.5, C.bellEdge); } });
  };

  // horizontal cable row
  EX.seatedRow = (S, t, g) => {
    const hip = [112, 190], sh = P([134, 128], [102, 122], t), ha = P([206, 150], [132, 158], t), el = P([170, 148], [84, 158], t);
    S.tower(286, 70); S.pulley([268, 176]); S.beam([286, 176], [268, 176]);
    S.bench([82, 206], [150, 206], [[96, 210], [138, 210]]); S.beam([222, 168], [236, 224], 6);
    const legs = { knee: [170, 164], ank: [214, 196], toe: [224, 178] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('lats', 'upperback', 'biceps'), far: () => S.cable([268, 176], ha), front: () => S.line([add(ha, 8, -9), add(ha, -4, 0), add(ha, 8, 9)], C.bellEdge, 4) });
  };
  EX.wideRow = (S, t, g) => {
    const a = both(S, t, { h0: [212, 128], h1: [204, 146], e0: [204, 118], e1: [246, 120] });
    S.beam([128, 214], [192, 214], 5); frontSeat(S, 176); S.pivot([160, 226]);
    S.front(Object.assign({ sy: 112, hy: 176 }, a, sitLegs(176)), { g, m: MU('upperback', 'lats', 'delts'), front: () => { S.cable([160, a.r.ha[1] + 4], [160, 222]); S.cap([a.l.ha[0] - 20, a.l.ha[1]], [a.r.ha[0] + 20, a.r.ha[1]], 4, 4, C.cable); } });
  };

  // side raises and rear delts (front view)
  EX.lateral = (S, t, g) => {
    const ha = P([176, 168], [262, 90], t), el = P([196, 128], [226, 94], t);
    S.tower(48, 60); S.pulley([66, 164]); S.beam([48, 164], [66, 164]);
    S.front(Object.assign({ sy: 88, hy: 152, r: { el, ha }, l: { el: [122, 126], ha: [118, 160] } }, standLegs), { g, m: MU('delts'), far: () => S.cable([66, 164], ha), front: () => S.dhandle(ha, [66, 164]) });
  };
  EX.cableY = (S, t, g) => {
    const ha = P([152, 160], [250, 30], t), el = P([186, 130], [220, 60], t);
    S.tower(48, 120); S.pulley([66, 224]); S.beam([48, 224], [66, 224]);
    S.front(Object.assign({ sy: 88, hy: 152, r: { el, ha }, l: { el: [122, 126], ha: [118, 160] } }, standLegs), { g, m: MU('delts'), far: () => S.cable([66, 224], ha), front: () => S.dhandle(ha, [66, 224]) });
  };
  EX.dbLateral = (S, t, g) => {
    const a = both(S, t, { h0: [198, 182], h1: [264, 108], e0: [198, 146], e1: [228, 110] });
    frontSeat(S, 172);
    S.front(Object.assign({ sy: 106, hy: 172 }, a, sitLegs(172)), { g, m: MU('delts'), front: () => { S.hex(a.l.ha); S.hex(a.r.ha); } });
  };
  EX.machLateral = (S, t, g) => {
    const a = both(S, t, { h0: [200, 178], h1: [246, 150], e0: [198, 146], e1: [244, 106] });
    S.tower(36, 40); frontSeat(S, 172);
    S.front(Object.assign({ sy: 106, hy: 172 }, a, sitLegs(172)), { g, m: MU('delts'), far: () => { S.beam([187, 106], a.r.el, 5); S.beam([133, 106], a.l.el, 5); }, front: () => { [a.l, a.r].forEach((m, i) => { S.pivot([i ? 190 : 130, 106], 6); S.cap(add(m.el, i ? 9 : -9, -10), add(m.el, i ? 9 : -9, 8), 7, 7, C.pad, { stroke: C.bellEdge, 'stroke-width': 1.5 }); S.bar(m.ha, 7, 0); }); } });
  };
  EX.revPec = (S, t, g) => {
    const a = both(S, t, { h0: [170, 118], h1: [262, 104], e0: [196, 116], e1: [228, 110] });
    S.post([160, 12], [160, 40], 6); S.beam([110, 12], [210, 12], 4); frontSeat(S, 172);
    S.front(Object.assign({ sy: 106, hy: 172 }, a, sitLegs(172)), { g, m: MU('delts', 'upperback'), far: () => { S.beam([160, 16], a.l.ha, 4); S.beam([160, 16], a.r.ha, 4); }, mid: () => S.cap([160, 128], [160, 152], 8, 8, C.pad), front: () => { S.pivot([160, 16]); S.bar(a.l.ha, 3, 11); S.bar(a.r.ha, 3, 11); } });
  };
  EX.csRearFly = (S, t, g) => {
    const a = both(S, t, { h0: [190, 188], h1: [260, 126], e0: [200, 152], e1: [226, 108] });
    S.post([160, 190], [160, 235], 5); S.post([124, 234], [196, 234], 3); S.pad([160, 128], [160, 196], 16);
    S.front({ sy: 112, hy: 170, l: a.l, r: a.r, ll: { knee: [140, 202], ank: [132, 227] }, rl: { knee: [180, 202], ank: [188, 227] } }, { g, m: MU('delts', 'upperback'), front: () => { S.hex(a.l.ha); S.hex(a.r.ha); } });
  };
  EX.cableRearFly = (S, t, g) => {
    const rh = P([128, 98], [260, 94], t), lh = mirror(rh), re = P([170, 112], [226, 100], t), le = mirror(re);
    S.post([24, 20], [24, 235], 6); S.post([296, 20], [296, 235], 6); S.pulley([30, 78]); S.pulley([290, 78]);
    S.front(Object.assign({ sy: 94, hy: 156, l: { el: le, ha: lh }, r: { el: re, ha: rh } }, { ll: { knee: [146, 185], ank: [141, 227] }, rl: { knee: [174, 185], ank: [179, 227] } }), { g, m: MU('delts', 'upperback'), front: () => { S.cable([30, 78], rh); S.cable([290, 78], lh); S.dot(rh, 6, C.bellEdge); S.dot(lh, 6, C.bellEdge); } });
  };
  EX.arnold = (S, t, g) => {
    const a = both(S, t, { h0: [172, 96], h1: [186, 26], e0: [176, 140], e1: [206, 68] });
    S.pad([160, 110], [160, 170], 22); frontSeat(S, 172);
    S.front(Object.assign({ sy: 110, hy: 172 }, a, sitLegs(172)), { g, m: MU('delts', 'triceps'), front: () => { const u = [Math.cos(1.25 * t), Math.sin(1.25 * t)]; S.dbell(a.l.ha, [u[0], -u[1]]); S.dbell(a.r.ha, u); } });
  };
  EX.rgPushdown = (S, t, g) => {
    const ha = P([190, 100], [192, 168], t), el = [196, 130];
    S.post([250, 14], [250, 235], 6); S.beam([196, 14], [250, 14], 4); S.pulley([196, 22]);
    S.front(Object.assign({ sy: 88, hy: 152, r: { el, ha }, l: { el: [112, 118], ha: [138, 146] } }, standLegs), { g, m: MU('triceps'), far: () => S.cable([196, 22], ha), front: () => S.dhandle(ha, [196, 22]) });
  };

  // standing cable work, side view
  const stand = { knee: [168, 176], ank: [164, 227] };
  const stagger = { nl: { knee: [180, 178], ank: [188, 227] }, fl: { knee: [142, 178], ank: [128, 225] } };
  EX.facePull = (S, t, g) => {
    const sh = [150, 66], ha = P([212, 56], [160, 44], t), el = P([184, 74], [120, 62], t);
    S.tower(276, 26); S.pulley([260, 50]); S.beam([276, 50], [260, 50]);
    S.side(Object.assign({ hip: [150, 133], sh, na: { el, ha }, fa: { el, ha } }, { nl: { knee: [164, 182], ank: [172, 227] }, fl: { knee: [134, 182], ank: [118, 225] } }), { g, m: MU('delts', 'upperback'), far: () => S.cable([260, 50], ha), front: () => S.rope(ha, [260, 50]) });
  };
  EX.pushdown = (S, t, g) => {
    const el = [170, 98], ha = P([204, 82], [180, 136], t);
    S.tower(262, 16); S.beam([262, 18], [222, 18]); S.pulley([218, 24]);
    S.side({ hip: [150, 124], sh: [166, 60], nl: { knee: [156, 175], ank: [154, 227] }, fl: { knee: [156, 175], ank: [154, 227] }, na: { el, ha }, fa: { el, ha } }, { g, m: MU('triceps'), far: () => S.cable([218, 24], ha), front: () => S.rope(ha, [218, 24]) });
  };
  EX.ohTri = (S, t, g) => {
    const el = [198, 40], ha = P([164, 50], [232, 22], t);
    S.tower(36, 60); S.pulley([52, 104]); S.beam([36, 104], [52, 104]);
    S.side(Object.assign({ hip: [150, 132], sh: [176, 70], na: { el, ha }, fa: { el, ha } }, stagger), { g, m: MU('triceps'), far: () => S.cable([52, 104], ha), front: () => S.rope(ha, [52, 104]) });
  };
  EX.saOhTri = (S, t, g) => {
    const el = [182, 42], ha = P([150, 60], [204, 12], t);
    S.tower(40, 100); S.pulley([58, 186]); S.beam([40, 186], [58, 186]);
    S.side({ hip: [160, 142], sh: [164, 76], nl: { knee: [178, 188], ank: [180, 227] }, fl: { knee: [146, 190], ank: [138, 227] }, na: { el, ha }, fa: { el: [196, 106], ha: [172, 134] } }, { g, m: MU('triceps'), far: () => S.cable([58, 186], ha), front: () => S.dhandle(ha, [58, 186]) });
  };
  EX.ohDbTri = (S, t, g) => {
    const hip = [146, 182], sh = [144, 114], el = [156, 74], ha = P([122, 92], [162, 36], t), fore = unit(el, ha);
    S.post([130, 186], [130, 235]); S.post([112, 234], [166, 234], 3); S.pad([118, 100], [126, 184], 8); S.pad([126, 196], [170, 196], 8);
    const legs = { knee: [200, 180], ank: [208, 227] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('triceps'), front: () => S.dbell(ha, fore) });
  };
  EX.bayesian = (S, t, g) => {
    const sh = [162, 62], el = P([142, 98], [150, 98], t), ha = P([128, 134], [184, 76], t);
    S.tower(36, 120); S.pulley([52, 206]); S.beam([36, 206], [52, 206]);
    S.side(Object.assign({ hip: [158, 128], sh, na: { el, ha }, fa: { el: [170, 100], ha: [180, 132] } }, stagger), { g, m: MU('biceps'), far: () => S.cable([52, 206], ha), front: () => S.dhandle(ha, [52, 206]) });
  };
  EX.hammer = (S, t, g) => {
    const el = [162, 100], ha = P([166, 138], [194, 72], t), v = unit(el, ha), u = [-v[1], v[0]];
    const legs = stand;
    S.side({ hip: [162, 126], sh: [162, 60], nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('biceps', 'forearm'), far: () => S.dbell(add(ha, 9, -4), u, 1), front: () => S.dbell(ha, u) });
  };

  EX.incCurl = (S, t, g) => {
    const hip = [170, 186], sh = [122, 138], el = [114, 176], ha = P([116, 213], [146, 150], t);
    S.bench([86, 118], [166, 197], [[130, 178]]); S.bench([166, 201], [196, 201], [[184, 205]]);
    const legs = { knee: [218, 170], ank: [236, 227] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('biceps'), far: () => S.hex(add(ha, 9, -4), 1), front: () => S.hex(ha) });
  };
  EX.preacher = (S, t, g) => {
    const hip = [114, 182], sh = [132, 118], el = [174, 150], ha = P([210, 170], [174, 112], t);
    S.post([172, 170], [172, 235], 5); S.post([144, 234], [200, 234], 3); S.bench([96, 197], [134, 197], [[114, 201]]);
    S.pad([148, 140], [192, 176], 9);
    const legs = { knee: [162, 188], ank: [150, 227] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('biceps', 'forearm'), front: () => { S.plate(ha, 17); S.line([add(ha, -9, 3), add(ha, -3, -3), add(ha, 3, 3), add(ha, 9, -3)], C.cable, 4); } });
  };

  // squats and presses for legs
  const sled = (S, ank, up) => { const u = [.7, -.7], n = [.7, .7], c = mv(ank, u, 13); S.beam(mv(c, n, -34), mv(c, n, 30), 6); S.beam(c, mv(c, u, 18), 4); S.plate(mv(c, u, 30), 15); };
  const legPressBase = (S, t, g, o) => {
    const hip = [114, 192], sh = [68, 144], ank = P(o.a0, o.a1, t), knee = o.calf ? P(hip, ank, .52) : ik(hip, ank, 55, 52, -1);
    const k2 = o.calf ? add(knee, -2, -6) : knee, toe = o.toe(t, ank);
    S.post([128, 230], [236, 122], 5); S.post([60, 234], [250, 234], 4); S.post([226, 134], [236, 233], 4);
    sled(S, o.plateAt ? o.plateAt(t, toe) : ank);
    S.bench([52, 140], [110, 204]); S.bench([108, 206], [136, 204]); S.post([80, 176], [80, 233]);
    const legs = { knee: k2, ank, toe };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el: [78, 178], ha: [108, 196] }, fa: { el: [78, 178], ha: [108, 196] } }, { g, m: o.m });
    o.extra && o.extra();
  };
  EX.legPress = (S, t, g) => legPressBase(S, t, g, { a0: [168, 154], a1: [192, 118], toe: (t, a) => add(a, -9, -17), m: MU('quads', 'glutes') });
  EX.lpLow = (S, t, g) => legPressBase(S, t, g, {
    a0: [174, 170], a1: [200, 134], toe: (t, a) => add(a, -9, -17), m: MU('quads'),
    extra: () => { S.block(246, 20, 304, 92); S.line([[256, 84], [294, 84]], C.steel, 2); S.cap([268, 76], [268, 60], 5, 4, C.hot); S.cap([282, 76], [282, 60], 5, 4, C.hot); }
  });
  EX.lpCalf = (S, t, g) => legPressBase(S, t, g, { calf: 1, a0: [188, 124], a1: [186, 126], toe: (t, a) => add(a, L(-14, 6, t), L(-14, -18, t)), plateAt: (t, toe) => add(toe, -2, 10), m: MU('calves') });

  const squatPose = (t, o) => {
    const hip = P(o.h0, o.h1, t), sh = P(o.s0, o.s1, t), ank = o.ank, knee = ik(hip, ank, 55, 52, -1);
    return { hip, sh, legs: { knee, ank, toe: o.toe } };
  };
  const barSquat = (S, t, g, o) => {
    const q = squatPose(t, o), ha = add(q.sh, 6, -4), el = add(q.sh, -6, 30);
    o.back && o.back(q);
    S.side({ hip: q.hip, sh: q.sh, nl: q.legs, fl: q.legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('quads', 'glutes'), front: () => o.held && o.held(q) });
  };
  EX.smithSquat = (S, t, g) => barSquat(S, t, g, { h0: [136, 180], h1: [168, 126], s0: [160, 116], s1: [164, 60], ank: [184, 227], back: () => S.rails(156), held: q => S.smithBar([156, q.sh[1] - 4], 20) });
  EX.pendulum = (S, t, g) => barSquat(S, t, g, {
    h0: [120, 182], h1: [152, 130], s0: [118, 114], s1: [148, 62], ank: [188, 219], toe: [208, 212],
    back: q => { S.post([46, 24], [46, 235], 6); S.post([46, 234], [240, 234], 4); S.beam([46, 28], add(q.sh, -14, -4), 6); S.pivot([46, 28], 9); S.pad([168, 234], [220, 218], 6); S.pad(add(q.sh, -14, -2), add(q.hip, -12, -6), 7); },
    held: q => { S.pad(add(q.sh, -6, -15), add(q.sh, 10, -13), 7); S.plate(add(q.sh, -44, -12), 15); }
  });
  EX.goblet = (S, t, g) => {
    const q = squatPose(t, { h0: [132, 180], h1: [162, 128], s0: [162, 118], s1: [162, 62], ank: [168, 217], toe: [188, 232] });
    const ha = add(q.sh, 24, 14), el = add(q.sh, 10, 36);
    S.poly([[146, 235], [182, 235], [182, 233], [146, 221]], C.steel);
    S.side({ hip: q.hip, sh: q.sh, nl: q.legs, fl: q.legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('quads'), front: () => S.dbell(add(ha, 2, 2), [0, 1]) });
  };

  const hinge = (t) => {
    const k = 1 - t, hip = P([172, 125], [134, 138], k), a = (3 + 74 * k) * Math.PI / 180;
    const sh = add(hip, Math.sin(a) * 68, -Math.cos(a) * 68), ank = [174, 227], knee = ik(hip, ank, 54, 52, -1), ha = add(sh, L(4, -3, k), 78), el = P(sh, ha, .52);
    return { hip, sh, ha, el, legs: { knee, ank } };
  };
  const rdlBase = (S, t, g, held, back) => {
    const q = hinge(t);
    back && back(q);
    S.side({ hip: q.hip, sh: q.sh, nl: q.legs, fl: q.legs, na: { el: q.el, ha: q.ha }, fa: { el: q.el, ha: q.ha } }, { g, m: MU('hams', 'glutes', 'lowback'), far: () => held(add(q.ha, 9, -4), 1), pre: () => {}, front: () => held(q.ha, 0) });
  };
  EX.rdl = (S, t, g) => rdlBase(S, t, g, (h, far) => { if (!far) S.plate(h, 26); });
  EX.dbRdl = (S, t, g) => rdlBase(S, t, g, (h, far) => S.dbell(h, [1, 0], far));
  EX.smithRdl = (S, t, g) => rdlBase(S, t, g, (h, far) => { if (!far) { S.cap([190, h[1]], h, 3.5, 3.5, C.cable); S.plate(h, 17); } }, () => S.rails(202));

  EX.hipExt = (S, t, g) => {
    const hip = [166, 148], a = L(46, -44, t) * Math.PI / 180, sh = add(hip, Math.cos(a) * 66, Math.sin(a) * 66);
    const u = unit(hip, sh), fr = [-u[1], u[0]], ha = mv(P(hip, sh, .72), fr, 22), el = mv(P(hip, sh, .5), fr, 12);
    S.post([112, 206], [112, 235], 5); S.post([78, 234], [208, 234], 4); S.post([112, 220], [168, 168], 5); S.pad([158, 160], [178, 144], 10); S.pad([84, 212], [104, 232], 7);
    const legs = { knee: [130, 184], ank: [96, 215], toe: [108, 228] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('hams', 'glutes', 'lowback'), front: () => S.plate(ha, 15) });
  };

  const splitBase = (S, t, g, o) => {
    const hip = P(o.h0, o.h1, t), sh = add(hip, 8, -67), front = o.front, knee = ik(hip, front, 55, 52, -1), rk = ik(hip, o.rear, 55, 52, 1);
    const ha = add(sh, 2, 78), el = add(sh, 0, 40);
    o.back();
    S.side({ hip, sh, nl: { knee, ank: front, toe: add(front, 19, 5) }, fl: { knee: rk, ank: o.rear, toe: o.rtoe }, na: { el, ha }, fa: { el, ha } }, { g, m: MU('quads', 'glutes'), far: () => S.hex(add(ha, 9, -4), 1), front: () => S.hex(ha) });
  };
  EX.split = (S, t, g) => splitBase(S, t, g, { h0: [158, 174], h1: [164, 132], front: [200, 227], rear: [84, 180], rtoe: [66, 183], back: () => { S.bench([46, 192], [96, 192], [[56, 196], [86, 196]]); } });
  EX.ffeSplit = (S, t, g) => splitBase(S, t, g, { h0: [150, 168], h1: [156, 124], front: [194, 216], rear: [94, 218], rtoe: [106, 232], back: () => S.block(176, 222, 232, 235) });

  // curls and extensions for legs
  const machineSeat = (S, hx) => { S.post([hx + 8, 186], [hx + 8, 235], 5); S.post([hx - 22, 234], [hx + 60, 234], 4); S.pad([hx - 28, 96], [hx - 14, 168], 8); S.pad([hx - 14, 182], [hx + 40, 182], 8); };
  const curlSeat = (S, t, g, single) => {
    const hip = [114, 166], sh = [96, 100], knee = [168, 168], a = L(0, 106, t) * Math.PI / 180, ank = add(knee, Math.cos(a) * 52, Math.sin(a) * 52);
    const toe = add(ank, Math.sin(a) * 19, -Math.cos(a) * 19), working = { knee, ank, toe };
    S.tower(40, 80); machineSeat(S, 114);
    const idle = { knee: [166, 174], ank: [152, 224], toe: [172, 229] };
    S.side({ hip, sh, nl: working, fl: single ? idle : working, na: { el: [112, 138], ha: [140, 156] }, fa: { el: [112, 138], ha: [140, 156] } }, { g, m: MU('hams'), front: () => { const n = [-Math.sin(a), Math.cos(a)]; S.pivot(knee, 6); S.beam(knee, mv(P(knee, ank, .86), n, 10), 3); S.dot(mv(P(knee, ank, .86), n, 11), 9, C.pad, { stroke: C.bellEdge, 'stroke-width': 1.5 }); S.pad([146, 150], [170, 152], 7); } });
  };
  EX.seatedLegCurl = (S, t, g) => curlSeat(S, t, g, false);
  EX.slSeatedCurl = (S, t, g) => curlSeat(S, t, g, true);
  const extSeat = (S, t, g, single) => {
    const hip = [120, 166], sh = [104, 100], knee = [174, 170], a = L(92, -2, t) * Math.PI / 180, ank = add(knee, Math.cos(a) * 52, Math.sin(a) * 52);
    const toe = add(ank, Math.sin(a) * 19, -Math.cos(a) * 19), working = { knee, ank, toe };
    S.tower(46, 80); machineSeat(S, 120);
    const idle = { knee: [172, 172], ank: [164, 222], toe: [184, 228] };
    S.side({ hip, sh, nl: working, fl: single ? idle : working, na: { el: [118, 138], ha: [138, 176] }, fa: { el: [118, 138], ha: [138, 176] } }, { g, m: MU('quads'), front: () => { const n = [Math.sin(a), -Math.cos(a)]; S.pivot(knee, 6); S.beam(knee, mv(P(knee, ank, .88), n, 10), 3); S.dot(mv(P(knee, ank, .88), n, 11), 9, C.pad, { stroke: C.bellEdge, 'stroke-width': 1.5 }); } });
  };
  EX.legExt = (S, t, g) => extSeat(S, t, g, false);
  EX.slLegExt = (S, t, g) => extSeat(S, t, g, true);

  EX.lyingCurl = (S, t, g) => {
    const hip = [150, 158], sh = [84, 160], knee = [204, 162], a = L(2, -106, t) * Math.PI / 180, ank = add(knee, Math.cos(a) * 52, Math.sin(a) * 52);
    const toe = add(ank, -Math.sin(a) * 6 + Math.cos(a) * 14, Math.cos(a) * 6 + Math.sin(a) * 14), legs = { knee, ank, toe };
    S.tower(290, 130); S.post([90, 180], [90, 235], 5); S.post([180, 180], [180, 235], 5); S.post([70, 234], [210, 234], 4); S.pad([70, 176], [192, 178], 9);
    S.side({ hip, sh, face: -1, nl: legs, fl: legs, na: { el: [76, 192], ha: [60, 198] }, fa: { el: [76, 192], ha: [60, 198] } }, { g, m: MU('hams'), front: () => { const n = [Math.sin(a), -Math.cos(a)], p = mv(P(knee, ank, .86), n, 11); S.pivot(knee, 6); S.beam(knee, p, 3); S.dot(p, 9, C.pad, { stroke: C.bellEdge, 'stroke-width': 1.5 }); } });
  };
  EX.standCurl = (S, t, g) => {
    const hip = [156, 124], sh = [172, 60], knee = [158, 176], a = L(90, 172, t) * Math.PI / 180, ank = add(knee, Math.cos(a) * 52, Math.sin(a) * 52);
    const toe = add(ank, Math.sin(a) * 18 + Math.cos(a) * 4, -Math.cos(a) * 18 + Math.sin(a) * 4);
    S.tower(272, 40); S.pulley([256, 222]); S.beam([272, 222], [256, 222]); S.beam([226, 88], [272, 88], 5);
    S.side({ hip, sh, nl: { knee, ank, toe }, fl: { knee: [160, 176], ank: [154, 227] }, na: { el: [200, 90], ha: [232, 88] }, fa: { el: [200, 90], ha: [232, 88] } }, { g, m: MU('hams'), front: () => { S.cable([256, 222], ank); S.dot(ank, 7, C.pad, { stroke: C.bellEdge, 'stroke-width': 2 }); } });
  };

  // calves
  const calfBody = (t) => { const toe = [180, 222], ank = P([162, 228], [168, 212], t), knee = add(ank, -1, -50), hip = add(knee, -2, -52), sh = add(hip, 2, -62); return { toe, ank, knee, hip, sh, legs: { knee, ank, toe } }; };
  EX.standCalf = (S, t, g) => {
    const q = calfBody(t), ha = add(q.sh, 28, 6), el = add(q.sh, 14, 30);
    S.post([252, 20], [252, 235], 6); S.post([160, 234], [268, 234], 4); S.block(176, 226, 210, 235);
    S.side({ hip: q.hip, sh: q.sh, nl: q.legs, fl: q.legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('calves'), front: () => { S.beam(add(q.sh, 4, -14), [252, q.sh[1] - 8], 4); S.pad(add(q.sh, -12, -14), add(q.sh, 12, -14), 7); } });
  };
  EX.slCalf = (S, t, g) => {
    const q = calfBody(t), ha = add(q.sh, 0, 80), el = add(q.sh, -1, 42), fh = [228, q.sh[1] + 22];
    S.post([248, 20], [248, 235], 8); S.block(176, 226, 214, 235);
    S.side({ hip: q.hip, sh: q.sh, nl: q.legs, fl: { knee: add(q.hip, -4, 53), ank: add(q.hip, -52, 50), toe: add(q.hip, -62, 66) }, na: { el, ha }, fa: { el: add(q.sh, 28, 32), ha: fh } }, { g, m: MU('calves'), front: () => S.hex(ha) });
  };
  EX.seatedCalf = (S, t, g) => {
    const hip = [124, 170], sh = [122, 102], toe = [200, 218], ank = P([180, 224], [185, 202], t), knee = add(ank, -2, -52), ha = add(knee, -10, -18), el = [136, 142];
    S.bench([96, 186], [140, 186], [[112, 190]]); S.block(192, 222, 230, 235);
    const legs = { knee, ank, toe };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('calves'), front: () => { S.beam(add(knee, -8, -12), [262, 214], 4); S.pad(add(knee, -20, -13), add(knee, 2, -13), 8); S.plate([248, knee[1] + 20], 17); } });
  };

  // abs
  EX.cableCrunch = (S, t, g) => {
    const hip = [158, 170], a = L(-80, -8, t) * Math.PI / 180, sh = add(hip, Math.cos(a) * 64, Math.sin(a) * 64);
    const u = unit(hip, sh), fr = [-u[1], u[0]], ha = mv(mv(sh, u, 22), fr, 14), el = mv(mv(sh, u, -4), fr, 28);
    S.tower(280, 14); S.pulley([250, 22]); S.beam([280, 20], [250, 20]); S.pad([130, 234], [200, 234], 4);
    const legs = { knee: [172, 224], ank: [122, 224], toe: [104, 228] };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('abs'), far: () => S.cable([250, 22], ha), front: () => S.rope(ha, [250, 22]) });
  };
  EX.revCrunch = (S, t, g) => {
    const sh = [96, 132], hip = P([152, 174], [146, 150], t), knee = P([194, 140], [130, 98], t), ank = P([230, 176], [172, 92], t), toe = add(ank, 12, 12);
    S.bench([58, 108], [176, 192], [[88, 134], [160, 186]]);
    const legs = { knee, ank, toe };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el: [62, 138], ha: [60, 108] }, fa: { el: [62, 138], ha: [60, 108] } }, { g, m: MU('abs', 'hipflex') });
  };
  const raiseLegs = (t, hip) => ({ knee: P(add(hip, 3, 52), add(hip, 52, -4), t), ank: P(add(hip, -10, 82), add(hip, 54, 46), t) });
  EX.hanging = (S, t, g) => {
    const sh = [146, 88], hip = P([148, 152], [152, 148], t), ha = [150, 22], el = [152, 56];
    S.post([232, 12], [232, 235], 6); S.beam([150, 12], [232, 12], 4); S.beam([150, 12], [150, 20], 4); S.post([206, 234], [258, 234], 3);
    const legs = raiseLegs(t, hip);
    S.side({ hip, sh, head: add(sh, 20, -19), nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('abs', 'hipflex'), front: () => { S.dot(ha, 6, C.steel); S.dot(ha, 2.5, C.bellEdge); } });
  };
  EX.captain = (S, t, g) => {
    const sh = [136, 84], hip = P([138, 148], [142, 146], t), el = [138, 122], ha = [178, 122];
    S.post([110, 40], [110, 235], 6); S.post([90, 234], [190, 234], 4); S.pad([116, 70], [116, 150], 9); S.post([110, 134], [152, 134], 4);
    const legs = raiseLegs(t, hip);
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('abs', 'hipflex'), pre: () => S.pad([130, 132], [166, 132], 6), front: () => S.post([180, 106], [180, 126], 4) });
  };

  EX.pushup = (S, t, g) => {
    const toe = [58, 228], sh = P([208, 196], [206, 152], t), ank = [66, 214], hip = P(ank, sh, .6), knee = P(ank, sh, .3);
    const ha = [210, 214], el = P([172, 178], [208, 184], t);
    const legs = { knee, ank, toe };
    S.side({ hip, sh, nl: legs, fl: legs, na: { el, ha }, fa: { el, ha } }, { g, m: MU('chest', 'triceps', 'delts'), far: () => S.hex(add(ha, 9, 4), 1), front: () => { S.hex(add(ha, 0, 10)); S.dot(ha, 5.5, '#e8eef7'); } });
  };

  const ease = x => x * x * (3 - 2 * x);
  const LIFT = [0, .055, .11, .165, .22], LOWER = [.34, .49, .64, .79, .94];
  const TIMES = [...LIFT, ...LOWER, 1];
  const VALS = [...[0, .25, .5, .75, 1].map(ease), ...[1, .75, .5, .25, 0].map(ease), 0];
  const attrs = o => Object.keys(o).filter(k => k !== 'd').map(k => `${k}="${o[k]}"`).join(' ');
  const cache = {};

  function frame(key, sex, t, g) { const S = Scene(sex); (EX[key] || EX.hammer)(S, t, g); return S.items; }

  function render(key, sex, hero) {
    const ck = key + '|' + sex + '|' + (hero ? 1 : 0);
    if (cache[ck]) return cache[ck];
    const frames = VALS.map((v, i) => frame(key, sex, v, i < 6 ? v : v * .6));
    const base = frames[0];
    const D = `dur="4s" repeatCount="indefinite" keyTimes="${TIMES.join(';')}"`;
    const body = base.map((it, i) => {
      let anim = '';
      ['d', 'opacity'].forEach(k => {
        const vals = frames.map(fr => k === 'opacity' && fr[i].opacity != null ? Math.round(fr[i].opacity * 100) / 100 : fr[i][k]);
        if (vals.some(v => v !== vals[0])) anim += `<animate attributeName="${k}" values="${vals.join(';')}" ${D}/>`;
      });
      return `<path d="${it.d}" ${attrs(it)}>${anim}</path>`;
    }).join('');
    const id = 'lmtbg';
    const DD = 'dur="4s" calcMode="discrete" repeatCount="indefinite"';
    const label = hero ? `<g font-family="Urbanist,sans-serif" font-size="12" font-weight="800" letter-spacing="1.5"><text x="12" y="22" fill="#c6f432">LIFT · 1s<animate attributeName="opacity" values="1;0" keyTimes="0;0.22" ${DD}/></text><text x="12" y="22" fill="#ffffff" opacity="0">SQUEEZE<animate attributeName="opacity" values="0;1;0" keyTimes="0;0.22;0.34" ${DD}/></text><text x="12" y="22" fill="#7cc8ff" opacity="0">LOWER · 2–3s<animate attributeName="opacity" values="0;1" keyTimes="0;0.34" ${DD}/></text></g><rect x="0" y="258" width="0" height="4" rx="2" fill="#c6f432"><animate attributeName="width" values="0;320" dur="4s" repeatCount="indefinite"/></rect>` : '';
    const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;border-radius:${hero ? 22 : 12}px" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c365d"/><stop offset=".55" stop-color="#111e33"/><stop offset="1" stop-color="#0b111a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/><ellipse cx="160" cy="240" rx="130" ry="7" fill="#000" opacity=".35"/><line x1="12" y1="${FLOOR}" x2="308" y2="${FLOOR}" stroke="#34527c" stroke-width="2"/>${body}${label}</svg>`;
    cache[ck] = svg;
    return svg;
  }

  // front and back body outline, each muscle shaded by weekly sets
  const tone = n => n >= 10 ? '#c6f432' : n >= 5 ? '#43c9bd' : n >= 1 ? '#3a7fd0' : '#26344d';
  function bodyMap(c) {
    const E = (x, y, rx, ry, m, rot) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${tone(c[m] || 0)}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}><title>${m}: ${c[m] || 0}</title></ellipse>`;
    const pair = (cx, dx, y, rx, ry, m, rot) => E(cx - dx, y, rx, ry, m, rot || 0) + E(cx + dx, y, rx, ry, m, -(rot || 0));
    const base = cx => `<g fill="#172236" stroke="#2c3d5c" stroke-width="1"><circle cx="${cx}" cy="22" r="14"/><path d="M${cx - 30} 44 Q${cx} 36 ${cx + 30} 44 L${cx + 20} 118 L${cx + 24} 140 L${cx - 24} 140 L${cx - 20} 118 Z"/></g><g stroke="#172236" stroke-linecap="round" fill="none"><path d="M${cx - 34} 52 L${cx - 44} 96 L${cx - 52} 140M${cx + 34} 52 L${cx + 44} 96 L${cx + 52} 140" stroke-width="15"/><path d="M${cx - 13} 138 L${cx - 17} 200 L${cx - 18} 262M${cx + 13} 138 L${cx + 17} 200 L${cx + 18} 262" stroke-width="21"/></g>`;
    const f = 80, b = 240;
    return `<svg viewBox="0 0 320 288" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg">${base(f)}${base(b)}`
      + pair(f, 31, 50, 9, 10, 'Front delts') + pair(f, 40, 55, 5, 9, 'Side delts', 20) + pair(f, 13, 58, 13, 10, 'Chest') + pair(f, 40, 76, 6, 15, 'Biceps', 12) + pair(f, 48, 118, 5.5, 17, 'Forearms', 18) + E(f, 96, 11, 24, 'Abs') + pair(f, 15, 170, 9.5, 30, 'Quads', 3) + pair(f, 18, 232, 6, 18, 'Calves')
      + pair(b, 32, 50, 10, 10, 'Rear delts') + E(b, 56, 17, 15, 'Upper back') + pair(b, 15, 88, 9, 22, 'Lats', 16) + pair(b, 40, 77, 6.5, 16, 'Triceps', 12) + pair(b, 48, 118, 5.5, 17, 'Forearms', 18) + pair(b, 11, 136, 12, 12, 'Glutes') + pair(b, 15, 180, 9.5, 28, 'Hamstrings', 3) + pair(b, 18, 232, 7.5, 21, 'Calves')
      + `<g font-family="Urbanist,sans-serif" font-size="11" font-weight="700" fill="#7787a1" text-anchor="middle"><text x="${f}" y="284">FRONT</text><text x="${b}" y="284">BACK</text></g></svg>`;
  }
  function muscles(mus) {
    const out = new Set();
    String(mus || '').toLowerCase().replace(/\([^)]*\)/g, '').split('·').map(s => s.trim()).forEach(m => {
      if (/chest/.test(m)) out.add('Chest');
      else if (/delts/.test(m)) { if (/front/.test(m)) out.add('Front delts'); if (/side/.test(m)) out.add('Side delts'); if (/rear/.test(m)) out.add('Rear delts'); }
      else if (m === 'triceps') out.add('Triceps');
      else if (m === 'biceps' || m === 'brachialis') out.add('Biceps');
      else if (m === 'forearms') out.add('Forearms');
      else if (m === 'lats') out.add('Lats');
      else if (/back|traps/.test(m)) out.add('Upper back');
      else if (m === 'quads') out.add('Quads');
      else if (m === 'glutes') out.add('Glutes');
      else if (m === 'hamstrings') out.add('Hamstrings');
      else if (m === 'calves') out.add('Calves');
      else if (m === 'abs') out.add('Abs');
    });
    return [...out];
  }

  window.LMTFig = { render, bodyMap, muscles, tone, keys: () => Object.keys(EX), frame };
})();
