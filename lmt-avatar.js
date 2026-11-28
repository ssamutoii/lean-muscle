// Lean Muscle: customisable avatar. Original soft-3D style with dot eyes, drawn as SVG.
(function () {
  const CX = 120;
  const SKIN = ['#fde3cf', '#f6cba8', '#e9b088', '#d39a6a', '#b97c4e', '#96603a', '#744628', '#53311d'];
  const HAIRC = ['#1b1714', '#3b2619', '#6b4428', '#a8743f', '#e2c07a', '#b4502a', '#c9ccd3', '#e98fb5', '#5fa8ff'];
  const CLOTH = ['#1c2433', '#f4f6fa', '#c6f432', '#4db8ff', '#2f68b5', '#5fe0c0', '#ff7a59', '#e95c8f', '#9b7bff', '#8a95a8', '#d9c7a6', '#7a1f2b'];

  const OPTS = {
    male: {
      body: [['slim', 'Slim'], ['average', 'Average'], ['athletic', 'Athletic'], ['muscular', 'Muscular'], ['broad', 'Heavier']],
      hair: [['buzz', 'Buzz cut'], ['crop', 'Short crop'], ['sidepart', 'Side part'], ['curly', 'Curly top'], ['afro', 'Afro'], ['cornrows', 'Cornrows'], ['manbun', 'Man bun'], ['long', 'Shoulder length'], ['bald', 'Shaved']],
      top: [['tank', 'Tank'], ['tee', 'T-shirt'], ['long', 'Long sleeve'], ['hoodie', 'Hoodie']],
      bottom: [['shorts', 'Shorts'], ['joggers', 'Joggers'], ['tights', 'Tights']],
      face: [['none', 'Clean'], ['stubble', 'Stubble'], ['beard', 'Beard']]
    },
    female: {
      body: [['slim', 'Slim'], ['toned', 'Toned'], ['muscular', 'Muscular'], ['curvy', 'Curvy'], ['fuller', 'Fuller']],
      hair: [['ponytail', 'Ponytail'], ['highbun', 'High bun'], ['long', 'Long straight'], ['bob', 'Bob'], ['curls', 'Long curls'], ['afropuff', 'Afro puff'], ['braids', 'Braids'], ['pixie', 'Pixie']],
      top: [['bra', 'Sports bra'], ['crop', 'Crop top'], ['tank', 'Tank'], ['tee', 'T-shirt'], ['long', 'Long sleeve']],
      bottom: [['leggings', 'Leggings'], ['bike', 'Bike shorts'], ['shorts', 'Shorts'], ['joggers', 'Joggers']],
      face: [['none', 'None'], ['lashes', 'Lashes']]
    },
    acc: [['headband', 'Headband'], ['cap', 'Cap'], ['glasses', 'Glasses'], ['headphones', 'Headphones'], ['watch', 'Watch'], ['wristbands', 'Wristbands']]
  };

  // half-widths and limb radii for each body type
  const BODY = {
    male: {
      slim:     { nk: 10, sw: 40, ch: 33, wa: 27, hp: 30, ua: 9, fa: 7.5, th: 15.5, ca: 10.5, belly: 0 },
      average:  { nk: 11, sw: 44, ch: 37, wa: 32, hp: 34, ua: 10.5, fa: 8.5, th: 17.5, ca: 11.5, belly: 2 },
      athletic: { nk: 12, sw: 48, ch: 42, wa: 31, hp: 33, ua: 12, fa: 9.5, th: 18.5, ca: 12.5, belly: 0 },
      muscular: { nk: 14, sw: 54, ch: 47, wa: 34, hp: 35, ua: 15, fa: 11, th: 21.5, ca: 14, belly: 0, traps: 1 },
      broad:    { nk: 13, sw: 50, ch: 46, wa: 46, hp: 44, ua: 13.5, fa: 10.5, th: 22, ca: 14, belly: 8 }
    },
    female: {
      slim:     { nk: 8.5, sw: 34, ch: 29, wa: 23, hp: 32, ua: 7.5, fa: 6, th: 14.5, ca: 9.5, belly: 0, bust: 3 },
      toned:    { nk: 9, sw: 36, ch: 31, wa: 24.5, hp: 35, ua: 8.5, fa: 6.5, th: 16, ca: 10.5, belly: 0, bust: 4 },
      muscular: { nk: 10, sw: 41, ch: 35, wa: 27.5, hp: 37, ua: 10.5, fa: 8, th: 18.5, ca: 12, belly: 0, bust: 4 },
      curvy:    { nk: 9, sw: 36, ch: 33, wa: 25.5, hp: 42, ua: 9, fa: 7, th: 19.5, ca: 12, belly: 0, bust: 6 },
      fuller:   { nk: 10, sw: 40, ch: 39, wa: 36, hp: 45, ua: 11, fa: 8.5, th: 22, ca: 13.5, belly: 5, bust: 7 }
    }
  };

  const DEF = {
    male: { base: 'male', skin: 2, body: 'athletic', hair: 'crop', hairCol: 1, face: 'none', top: 'tee', topCol: 0, bottom: 'shorts', botCol: 9, shoeCol: 2, acc: [] },
    female: { base: 'female', skin: 1, body: 'toned', hair: 'ponytail', hairCol: 1, face: 'none', top: 'bra', topCol: 3, bottom: 'leggings', botCol: 4, shoeCol: 1, acc: [] }
  };
  function norm(a, sex) {
    const base = a && a.base || (sex === 'female' ? 'female' : 'male');
    const o = Object.assign({}, DEF[base], a || {}, { base });
    const ok = (k, list) => list.some(x => x[0] === o[k]) ? o[k] : DEF[base][k];
    ['body', 'hair', 'top', 'bottom', 'face'].forEach(k => { o[k] = ok(k, OPTS[base][k]); });
    o.acc = (o.acc || []).filter(x => OPTS.acc.some(y => y[0] === x));
    return o;
  }

  // ---------- colour and path helpers ----------
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, k) => toHex(hx(h).map(v => k > 0 ? v + (255 - v) * k : v * (1 + k)));
  const lum = h => { const [r, g, b] = hx(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const f = n => Math.round(n * 10) / 10;
  const P = p => f(p[0]) + ',' + f(p[1]);
  function smooth(pts, closed) {
    const n = pts.length, seg = closed ? n : n - 1;
    let d = 'M' + P(pts[0]);
    for (let i = 0; i < seg; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const a = closed || i > 0 ? p0 : p1, b = closed || i < n - 2 ? p3 : p2;
      d += ' C' + P([p1[0] + (p2[0] - a[0]) / 6, p1[1] + (p2[1] - a[1]) / 6]) + ' ' + P([p2[0] - (b[0] - p1[0]) / 6, p2[1] - (b[1] - p1[1]) / 6]) + ' ' + P(p2);
    }
    return d + (closed ? 'Z' : '');
  }
  const mirror = pts => pts.map(p => [2 * CX - p[0], p[1]]);
  // tapered limb along a centre line, with rounded ends
  function limb(c, r) {
    const A = [], B = [], n = c.length;
    for (let i = 0; i < n; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      A.push([c[i][0] + nx * r[i], c[i][1] + ny * r[i]]); B.push([c[i][0] - nx * r[i], c[i][1] - ny * r[i]]);
    }
    const u = (p, q, k) => { const dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy) || 1; return [p[0] + dx / L * k, p[1] + dy / L * k]; };
    return smooth([...A, u(c[n - 1], c[n - 2], r[n - 1] * .95), ...B.reverse(), u(c[0], c[1], r[0] * .9)], true);
  }

  function build(a, opt) {
    a = norm(a); opt = opt || {};
    const fem = a.base === 'female', B = BODY[a.base][a.body], uid = 'av' + Math.random().toString(36).slice(2, 7);
    const skin = SKIN[a.skin] || SKIN[2], hair = HAIRC[a.hairCol] || HAIRC[0];
    const topC = CLOTH[a.topCol] || CLOTH[0], botC = CLOTH[a.botCol] || CLOTH[0], shoeC = CLOTH[a.shoeCol] || CLOTH[1];
    const defs = [], grads = {};
    // cylinder shading: darker edges, lit centre, light from the upper left
    const G = (c, dir) => {
      const k = c + (dir || 'h'); if (grads[k]) return `url(#${grads[k]})`;
      const id = uid + 'g' + Object.keys(grads).length; grads[k] = id;
      const v = dir === 'v';
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}"><stop offset="0" stop-color="${shade(c, v ? .16 : -.12)}"/><stop offset=".26" stop-color="${shade(c, .18)}"/><stop offset=".55" stop-color="${c}"/><stop offset=".85" stop-color="${shade(c, -.24)}"/><stop offset="1" stop-color="${shade(c, -.42)}"/></linearGradient>`);
      return `url(#${id})`;
    };
    const W = (c, w) => {
      const k = c + 'w' + w; if (grads[k]) return `url(#${grads[k]})`;
      const id = uid + 'g' + Object.keys(grads).length; grads[k] = id;
      defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${CX - w}" y1="0" x2="${CX + w}" y2="0"><stop offset="0" stop-color="${shade(c, -.24)}"/><stop offset=".18" stop-color="${c}"/><stop offset=".4" stop-color="${shade(c, .12)}"/><stop offset=".5" stop-color="${shade(c, -.04)}"/><stop offset=".6" stop-color="${shade(c, .1)}"/><stop offset=".82" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.3)}"/></linearGradient>`);
      return `url(#${id})`;
    };
    const clip = (y1, y2, extra) => { const id = uid + 'c' + defs.length; defs.push(`<clipPath id="${id}"><rect x="-20" y="${y1}" width="280" height="${y2 - y1}"/>${extra || ''}</clipPath>`); return `clip-path="url(#${id})"`; };
    const flat = !!opt.head;
    defs.push(`<radialGradient id="${uid}v" cx=".34" cy=".26" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".32" stop-color="#fff" stop-opacity=".07"/><stop offset=".66" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></radialGradient>`,
      `<filter id="${uid}b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter>`,
      `<filter id="${uid}bb" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>`,
      `<pattern id="${uid}k" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#000" opacity=".07"/><circle cx="3" cy="3" r=".7" fill="#000" opacity=".06"/><circle cx="3" cy="1" r=".55" fill="#fff" opacity=".08"/><circle cx="1" cy="3" r=".55" fill="#fff" opacity=".07"/></pattern>`);
    const VOL = `url(#${uid}v)`;
    const path = (d, fill, x) => `<path d="${d}" fill="${fill}"${x ? ' ' + x : ''}/>` + (!flat && String(fill).startsWith('url(') ? `<path d="${d}" fill="${VOL}"${x ? ' ' + x : ''}/>` : '');
    // knitted fabric: soft ribbing over the colour
    const cloth = (d, fill, x) => path(d, fill, x) + (flat ? '' : `<path d="${d}" fill="url(#${uid}k)"${x ? ' ' + x : ''}/>`);
    const soft = (shape, op, big) => `<g filter="url(#${uid}${big ? 'bb' : 'b'})" opacity="${op}">${shape}</g>`;
    const out = { back: [], legs: [], torso: [], armL: [], armR: [], head: [], front: [] };

    // ---------- geometry ----------
    const HY = 60, R = fem ? 30 : 31;
    const sh = 112, wy = 186, hy = 212, cr = 232;
    const right = [[CX + B.nk, 98], [CX + B.nk + (B.sw - B.nk) * .5, 103 - (B.traps ? 3 : 0)], [CX + B.sw - 5, sh - 1], [CX + B.sw, sh + 12], [CX + B.ch, 142],
      [CX + B.ch * .55 + B.wa * .45 + (B.belly ? B.belly * .4 : 0), 164], [CX + B.wa + B.belly * .3, wy], [CX + B.hp, hy], [CX + B.hp - 4, cr - 6], [CX + 7, cr + 1]];
    const torso = smooth([...right, ...mirror(right).reverse()], true);
    const tclip = uid + 'tc'; defs.push(`<clipPath id="${tclip}"><path d="${torso}"/></clipPath>`);
    const BW = B.hp + 22, BG = W(botC, BW);
    const lxo = Math.max(B.th + 2, B.hp - B.th + 2), kxo = Math.max(B.ca + 3, lxo - 3), axo = kxo + 1;
    const legC = s => [[CX + s * lxo, 214], [CX + s * (lxo - .5), 256], [CX + s * kxo, 300], [CX + s * (kxo + .5), 324], [CX + s * axo, 366]];
    const legR = (k) => [B.th + k, B.th * .9 + k, B.ca * .82 + k, B.ca + k, 6.2 + k * .6];
    const wristX = Math.max(B.sw + 9, B.hp + B.fa * .75 + 5), elbX = Math.max(B.sw + 5, (B.hp + B.ch) / 2 + B.ua * .7 + 2);
    const armC = s => [[CX + s * (B.sw - 7), sh + 6], [CX + s * (B.sw - 2 + (elbX - B.sw) * .45), 150], [CX + s * elbX, 186], [CX + s * (elbX + (wristX - elbX) * .4), 206], [CX + s * wristX, 240]];
    const armR = k => [B.ua + 3 + k, B.ua * 1.06 + k, B.ua * .76 + k, B.fa * 1.05 + k, B.fa * .62 + k];
    const hand = s => [CX + s * (wristX + 1), 250];

    // ---------- legs, shoes and bottoms ----------
    const legs = [-1, 1].map(s => limb(legC(s), legR(0)));
    out.legs.push(`<g ${clip(206, 400)}>` + legs.map(d => path(d, G(skin))).join('') + '</g>');
    if (a.bottom === 'leggings' || a.bottom === 'tights') out.legs.push(`<g ${clip(206, a.bottom === 'tights' ? 330 : 357)}>${legs.map(d => cloth(d, BG)).join('')}</g>`);
    else if (a.bottom === 'bike') out.legs.push(`<g ${clip(206, 286)}>${legs.map(d => cloth(d, BG)).join('')}</g>`);
    else if (a.bottom === 'shorts') {
      const wide = [-1, 1].map(s => limb(legC(s), legR(fem ? 2.5 : 4.5)));
      out.legs.push(`<g ${clip(206, fem ? 258 : 276)}>${wide.map(d => cloth(d, BG)).join('')}</g>`);
      out.legs.push(`<g ${clip(fem ? 253 : 271, fem ? 258 : 276)}>${wide.map(d => path(d, shade(botC, -.18))).join('')}</g>`);
    } else if (a.bottom === 'joggers') {
      const wide = [-1, 1].map(s => limb(legC(s), legR(3.5)));
      out.legs.push(`<g ${clip(206, 360)}>${wide.map(d => cloth(d, BG)).join('')}</g>`);
      out.legs.push(`<g ${clip(350, 362)}>${[-1, 1].map(s => limb(legC(s), legR(1.5))).map(d => path(d, shade(botC, -.2))).join('')}</g>`);
      // side stripe
      out.legs.push([-1, 1].map(s => `<path d="${smooth(legC(s).slice(0, 4).map((p, i) => [p[0] + s * legR(3.5)[i] * .82, p[1]]), false)}" fill="none" stroke="${lum(botC) > .6 ? shade(botC, -.3) : shade(botC, .35)}" stroke-width="2" opacity=".7"/>`).join(''));
    }
    out.legs.push(`<path d="M${CX},${cr - 2} L${CX},${cr + 6}" stroke="${shade(botC, -.35)}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`);
    out.legs.push([-1, 1].map(s => {
      const x = CX + s * (axo + 2), y = 368, w = 15 + B.ca * .25;
      const shoe = `M${f(x - w)},${y + 10} C${f(x - w)},${y - 6} ${f(x - 6)},${y - 10} ${f(x)},${y - 9} C${f(x + 8)},${y - 9} ${f(x + w)},${y - 4} ${f(x + w)},${y + 10} Z`;
      const panel = `M${f(x - w + 3)},${y + 6} C${f(x - w + 4)},${y - 2} ${f(x - 4)},${y - 3} ${f(x)},${y + 2} C${f(x + 4)},${y - 3} ${f(x + w - 4)},${y - 2} ${f(x + w - 3)},${y + 6} Z`;
      return soft(`<ellipse cx="${f(x)}" cy="${y + 15}" rx="${f(w + 2)}" ry="3.5" fill="#1a1020"/>`, .35) + path(shoe, G('#f4f6fa')) + path(panel, G(shoeC)) + `<rect x="${f(x - w - 1)}" y="${y + 8}" width="${f(2 * w + 2)}" height="7.5" rx="3.75" fill="${G('#dfe4ec', 'v')}"/>` + `<path d="M${f(x - 4)},${y - 5} l8,0 M${f(x - 5)},${y - 1.5} l10,0" stroke="#c4ccd8" stroke-width="1.5" stroke-linecap="round"/>`;
    }).join(''));

    // ---------- torso ----------
    out.torso.push(path(torso, G(skin)));
    if (!fem && a.top === 'tank' || a.top === 'bra' || a.top === 'crop') {
      // definition lines for the abs and chest, visible with skin showing
      const def = shade(skin, -.16), o = `fill="none" stroke="${def}" stroke-linecap="round" opacity=".55"`;
      if (!fem) out.torso.push(`<path d="M${CX},${132} L${CX},${200}" ${o} stroke-width="1.5"/><path d="M${CX - B.ch * .7},${138} Q${CX - B.ch * .3},${150} ${CX - 2},${140} M${CX + B.ch * .7},${138} Q${CX + B.ch * .3},${150} ${CX + 2},${140}" ${o} stroke-width="1.6"/>`);
      if (!B.belly && (a.body !== 'slim')) out.torso.push(`<path d="M${CX - 9},${172} q9,3 18,0 M${CX - 9},${186} q9,3 18,0" ${o} stroke-width="1.3"/>`);
      if (!B.belly) out.torso.push(`<ellipse cx="${CX}" cy="${196}" rx="1.6" ry="2.4" fill="${def}" opacity=".7"/>`);
    }
    // bottoms over the hips
    const waistTop = a.bottom === 'leggings' || a.bottom === 'tights' || a.bottom === 'bike' ? (fem ? 192 : 196) : 198;
    out.torso.push(`<g ${clip(waistTop, 260)}>${cloth(torso, BG)}</g>`, `<g ${clip(waistTop, waistTop + 7)}>${path(torso, shade(botC, -.2))}</g>`);
    if (a.bottom === 'shorts' || a.bottom === 'joggers') out.torso.push(`<path d="M${CX - 3},${waistTop + 8} l-2,10 M${CX + 3},${waistTop + 8} l2,10" stroke="${shade(botC, .5)}" stroke-width="1.5" stroke-linecap="round"/>`);
    // tops
    const T = a.top, low = { tank: 204, tee: 206, long: 206, hoodie: 212, bra: 160, crop: 172 }[T];
    const highY = 92;
    out.torso.push(`<g ${clip(highY, low)}>${cloth(torso, G(topC))}</g>`);
    out.torso.push(`<g ${clip(low - 6, low)}>${path(torso, shade(topC, -.12))}${flat ? '' : `<path d="${torso}" fill="url(#${uid}k)"/>`}</g>`);
    if (T === 'tank' || T === 'bra') {
      const ah = fem ? 10 : 12, nw = B.nk + (T === 'bra' ? 11 : fem ? 9 : 8), nd = T === 'bra' ? 132 : fem ? 128 : 124;
      const cut = [-1, 1].map(s => `<ellipse cx="${CX + s * (B.sw + 2)}" cy="${sh + 10}" rx="${B.sw - B.ch + ah + 6}" ry="${fem ? 30 : 28}"/>`).join('') + `<path d="M${CX - nw},${92} Q${CX - nw + 2},${nd} ${CX},${nd} Q${CX + nw - 2},${nd} ${CX + nw},${92} Z"/>`;
      out.torso.push(`<g clip-path="url(#${tclip})"><g fill="${G(skin)}">${cut}</g></g>`);
      out.torso.push(`<g clip-path="url(#${tclip})" fill="none" stroke="${shade(topC, -.2)}" stroke-width="2.2">${cut}</g>`);
      if (fem && T === 'bra') out.torso.push(`<path d="M${CX - B.ch + 7},${150} Q${CX},${143} ${CX + B.ch - 7},${150}" fill="none" stroke="${shade(topC, -.22)}" stroke-width="1.4" opacity=".7"/>`);
    }
    if (T === 'tee' || T === 'long' || T === 'hoodie' || T === 'crop') {
      out.torso.push(`<ellipse cx="${CX}" cy="${97}" rx="${B.nk + 4}" ry="${T === 'hoodie' ? 7 : 9}" fill="${shade(topC, -.22)}"/><ellipse cx="${CX}" cy="${95}" rx="${B.nk + 1.5}" ry="${T === 'hoodie' ? 5 : 8}" fill="${G(skin)}"/>`);
    }
    if (T === 'hoodie') out.torso.push(`<path d="M${CX - 18},${176} h36 l4,22 h-44 Z" fill="${shade(topC, -.12)}"/><path d="M${CX - 5},${102} l-2,26 M${CX + 5},${102} l2,26" stroke="${shade(topC, .5)}" stroke-width="2" stroke-linecap="round"/>`);
    if (fem && B.bust && (T === 'tee' || T === 'long' || T === 'tank' || T === 'crop')) out.torso.push(`<path d="M${CX - B.ch + 6},${150} Q${CX - B.ch / 2},${158} ${CX - 3},${150} M${CX + B.ch - 6},${150} Q${CX + B.ch / 2},${158} ${CX + 3},${150}" fill="none" stroke="${shade(topC, -.25)}" stroke-width="1.3" opacity=".6"/>`);
    if (B.traps) out.torso.push(`<path d="M${CX - B.nk - 2},${100} Q${CX - B.sw * .6},${102} ${CX - B.sw + 8},${110} M${CX + B.nk + 2},${100} Q${CX + B.sw * .6},${102} ${CX + B.sw - 8},${110}" fill="none" stroke="${shade(T === 'tank' ? skin : topC, -.15)}" stroke-width="1.5" opacity=".5"/>`);

    if (!flat) {
      const ao = shade(skin, -.55), tc = `clip-path="url(#${tclip})"`;
      out.torso.push(`<g ${tc}>` + soft(`<ellipse cx="${CX}" cy="${101}" rx="${B.nk + 12}" ry="7" fill="#1a1020"/>`, .28)
        + soft([-1, 1].map(s => `<ellipse cx="${CX + s * (B.ch + 2)}" cy="${170}" rx="7" ry="44" fill="#1a1020"/>`).join(''), .26)
        + (low < 190 ? soft(`<ellipse cx="${CX}" cy="${low + 3}" rx="${B.ch}" ry="4" fill="${ao}"/>`, .45) : '')
        + soft(`<ellipse cx="${CX}" cy="${waistTop + 1}" rx="${B.wa + 6}" ry="3.5" fill="#1a1020"/>`, .22) + '</g>');
    }

    // ---------- arms ----------
    [-1, 1].forEach(s => {
      const g = s < 0 ? out.armL : out.armR, c = armC(s), d = limb(c, armR(0)), hp = hand(s);
      g.push(path(d, G(skin)));
      const sleeve = { tee: 160, crop: 156, long: 236, hoodie: 238 }[T];
      if (sleeve) {
        const wd = limb(c, armR(T === 'tee' || T === 'crop' ? 2 : 1.6).map((r, i) => i === 0 ? r - 2 : r));
        g.push(`<g ${clip(90, sleeve)}>${cloth(wd, G(topC))}</g><g ${clip(sleeve - 5, sleeve)}>${path(wd, shade(topC, -.18))}</g>`);
      }
      if (!sleeve && !fem && (a.body === 'muscular' || a.body === 'athletic')) g.push(`<path d="${smooth([[c[1][0] - s * B.ua * .2, 142], [c[1][0] + s * B.ua * .1, 158], [c[2][0] - s * 2, 178]], false)}" fill="none" stroke="${shade(skin, -.15)}" stroke-width="1.4" opacity=".5"/>`);
      const hr = B.fa * .8 + 2, hh = B.fa * .95 + 3;
      g.push(path(`M${f(hp[0] - hr)},${f(hp[1] - hh * .5)} C${f(hp[0] - hr)},${f(hp[1] + hh)} ${f(hp[0] + hr)},${f(hp[1] + hh)} ${f(hp[0] + hr)},${f(hp[1] - hh * .5)} C${f(hp[0] + hr)},${f(hp[1] - hh * 1.1)} ${f(hp[0] - hr)},${f(hp[1] - hh * 1.1)} ${f(hp[0] - hr)},${f(hp[1] - hh * .5)} Z`, G(skin)));
      g.push(`<path d="M${f(hp[0] - s * hr * .7)},${f(hp[1] - hh * .3)} q${f(-s * 3)},${f(hh * .5)} ${f(-s * 1)},${f(hh * .9)}" stroke="${shade(skin, -.22)}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>`);
      if (a.acc.includes('wristbands')) g.push(`<rect x="${f(c[4][0] - B.fa - 1)}" y="230" width="${f(2 * B.fa + 2)}" height="9" rx="4" fill="${G(CLOTH[2])}"/>`);
      if (s < 0 && a.acc.includes('watch')) g.push(`<rect x="${f(c[4][0] - B.fa * .75 - 1)}" y="229" width="${f(B.fa * 1.5 + 2)}" height="8" rx="2" fill="#1c2433"/><rect x="${f(c[4][0] - 4)}" y="227.5" width="8" height="11" rx="2.5" fill="#2b3a55" stroke="#c6f432" stroke-width="1"/>`);
    });

    // ---------- head, face and hair ----------
    const hairBack = [], hairFront = [], hd = shade(hair, -.25);
    const hgid = uid + 'hg'; defs.push(`<linearGradient id="${hgid}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(hair, .06)}"/><stop offset=".22" stop-color="${shade(hair, lum(hair) < .2 ? .3 : .22)}"/><stop offset=".34" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, -.38)}"/></linearGradient>`);
    const H = `url(#${hgid})`;
    const capD = (lift, line) => `M${CX - R - 2},${HY + 4} C${CX - R - 4},${HY - R - 10 - lift} ${CX + R + 4},${HY - R - 10 - lift} ${CX + R + 2},${HY + 4} C${CX + R - 1},${HY - 6} ${CX + R - 8},${HY - line} ${CX},${HY - line - 2} C${CX - R + 8},${HY - line} ${CX - R + 1},${HY - 6} ${CX - R - 2},${HY + 4} Z`;
    const curls = (cx, cy, rx, ry, r, n) => Array.from({ length: n }, (_, i) => { const t = Math.PI * (1 + i / (n - 1)); return `<circle cx="${f(cx + rx * Math.cos(t))}" cy="${f(cy + ry * Math.sin(t))}" r="${r}" fill="${H}"/>`; }).join('');
    switch (a.hair) {
      case 'bald': hairFront.push(`<path d="${capD(-6, 15)}" fill="${hair}" opacity=".08"/>`); break;
      case 'buzz': hairFront.push(`<path d="${capD(-5, 14)}" fill="${hair}" opacity=".78"/>`); break;
      case 'crop': hairFront.push(`<path d="${capD(0, 14)}" fill="${H}"/><path d="M${CX - 16},${HY - 16} q10,-6 22,-2" stroke="${hd}" stroke-width="2" fill="none" stroke-linecap="round"/>`); break;
      case 'sidepart': hairFront.push(`<path d="${capD(6, 14)}" fill="${H}"/><path d="M${CX - R - 1},${HY - 6} C${CX - 18},${HY - 30} ${CX + 10},${HY - 30} ${CX + R + 3},${HY - 14} C${CX + 10},${HY - 20} ${CX - 8},${HY - 18} ${CX - R + 2},${HY - 2} Z" fill="${shade(hair, .12)}"/>`); break;
      case 'curly': hairFront.push(`<path d="${capD(2, 13)}" fill="${H}"/>` + curls(CX, HY - 14, R - 2, 18, 8.5, 8)); break;
      case 'afro': hairBack.push(`<circle cx="${CX}" cy="${HY - 10}" r="${R + 19}" fill="${H}"/>` + curls(CX, HY - 10, R + 17, R + 15, 7, 11)); hairFront.push(`<path d="${capD(2, 13)}" fill="${H}"/>`); break;
      case 'cornrows': hairFront.push(`<path d="${capD(0, 15)}" fill="${H}"/>` + [-14, -7, 0, 7, 14].map(x => `<path d="M${CX + x * 1.1},${HY - 15} Q${CX + x * 1.4},${HY - 30} ${CX + x * 1.6},${HY - R - 4}" stroke="${shade(hair, .3)}" stroke-width="1.6" fill="none" stroke-dasharray="3 2.5"/>`).join('')); break;
      case 'manbun': hairFront.push(`<path d="${capD(2, 14)}" fill="${H}"/><circle cx="${CX}" cy="${HY - R - 12}" r="10" fill="${H}"/><path d="M${CX - 8},${HY - R - 4} h16" stroke="${hd}" stroke-width="3" stroke-linecap="round"/>`); break;
      case 'long':
        hairBack.push(`<path d="M${CX - R - 4},${HY - 4} C${CX - R - 8},${HY + 30} ${CX - R - 6},${HY + (fem ? 92 : 44)} ${CX - R + 2},${HY + (fem ? 104 : 52)} L${CX + R - 2},${HY + (fem ? 104 : 52)} C${CX + R + 6},${HY + (fem ? 92 : 44)} ${CX + R + 8},${HY + 30} ${CX + R + 4},${HY - 4} Z" fill="${H}"/>`);
        hairFront.push(`<path d="${capD(4, 15)}" fill="${H}"/><path d="M${CX + 2},${HY - R - 6} C${CX - 10},${HY - 18} ${CX - R + 2},${HY - 6} ${CX - R - 2},${HY + 18} L${CX - R - 4},${HY - 6} Z" fill="${shade(hair, .1)}"/>`); break;
      case 'ponytail':
        hairBack.push(`<path d="M${CX + R - 4},${HY - 22} C${CX + R + 22},${HY - 16} ${CX + R + 16},${HY + 34} ${CX + R + 4},${HY + 58} C${CX + R + 2},${HY + 30} ${CX + R - 2},${HY - 4} ${CX + R - 10},${HY - 14} Z" fill="${H}"/>`);
        hairFront.push(`<path d="${capD(3, 15)}" fill="${H}"/><path d="M${CX - R + 4},${HY - 14} C${CX - 6},${HY - 28} ${CX + 12},${HY - 30} ${CX + R - 2},${HY - 18}" fill="none" stroke="${shade(hair, .2)}" stroke-width="1.6" opacity=".7"/><circle cx="${CX + R - 2}" cy="${HY - 20}" r="4" fill="${CLOTH[a.topCol] || CLOTH[2]}"/>`); break;
      case 'highbun': hairFront.push(`<path d="${capD(3, 15)}" fill="${H}"/><circle cx="${CX}" cy="${HY - R - 15}" r="14" fill="${H}"/><path d="M${CX - 9},${HY - R - 18} q9,-6 18,0" stroke="${shade(hair, .25)}" stroke-width="1.6" fill="none"/><path d="M${CX - 9},${HY - R - 3} h18" stroke="${hd}" stroke-width="3" stroke-linecap="round"/>`); break;
      case 'bob':
        hairBack.push(`<path d="M${CX - R - 6},${HY - 6} C${CX - R - 8},${HY + 18} ${CX - R - 6},${HY + 28} ${CX - R + 4},${HY + 32} L${CX + R - 4},${HY + 32} C${CX + R + 6},${HY + 28} ${CX + R + 8},${HY + 18} ${CX + R + 6},${HY - 6} Z" fill="${H}"/>`);
        hairFront.push(`<path d="${capD(4, 13)}" fill="${H}"/><path d="M${CX - R + 2},${HY - 10} C${CX - 10},${HY - 26} ${CX + 14},${HY - 26} ${CX + R - 2},${HY - 12} L${CX + R + 2},${HY - 22} C${CX},${HY - 40} ${CX - R},${HY - 30} ${CX - R + 2},${HY - 10} Z" fill="${shade(hair, .1)}"/>`); break;
      case 'curls':
        hairBack.push(`<path d="M${CX - R - 8},${HY - 6} C${CX - R - 16},${HY + 40} ${CX - R - 8},${HY + 86} ${CX - 12},${HY + 96} L${CX + 12},${HY + 96} C${CX + R + 8},${HY + 86} ${CX + R + 16},${HY + 40} ${CX + R + 8},${HY - 6} Z" fill="${H}"/>` + [-1, 1].map(s => [0, 1, 2, 3, 4].map(i => `<circle cx="${CX + s * (R + 6 - i)}" cy="${HY + i * 19}" r="9" fill="${H}"/>`).join('')).join(''));
        hairFront.push(`<path d="${capD(5, 13)}" fill="${H}"/>` + curls(CX, HY - 15, R - 1, 17, 7.5, 8)); break;
      case 'afropuff': hairFront.push(`<path d="${capD(1, 15)}" fill="${H}"/><circle cx="${CX}" cy="${HY - R - 18}" r="20" fill="${H}"/>` + curls(CX, HY - R - 18, 18, 18, 6, 8) + `<path d="M${CX - 10},${HY - R - 1} h20" stroke="${CLOTH[a.topCol] || CLOTH[2]}" stroke-width="4" stroke-linecap="round"/>`); break;
      case 'braids':
        hairBack.push([-1, 1].map(s => `<path d="M${CX + s * (R - 2)},${HY + 4} C${CX + s * (R + 8)},${HY + 40} ${CX + s * (R + 4)},${HY + 80} ${CX + s * (R + 6)},${HY + 108}" stroke="${H}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${CX + s * (R - 2)},${HY + 4} C${CX + s * (R + 8)},${HY + 40} ${CX + s * (R + 4)},${HY + 80} ${CX + s * (R + 6)},${HY + 108}" stroke="${shade(hair, .3)}" stroke-width="9" fill="none" stroke-dasharray="2 5" opacity=".5"/>`).join(''));
        hairFront.push(`<path d="${capD(0, 15)}" fill="${H}"/>` + [-12, -4, 4, 12].map(x => `<path d="M${CX + x},${HY - 15} Q${CX + x * 1.3},${HY - 30} ${CX + x * 1.4},${HY - R - 4}" stroke="${shade(hair, .3)}" stroke-width="1.6" fill="none" stroke-dasharray="3 2.5"/>`).join('')); break;
      case 'pixie': hairFront.push(`<path d="${capD(3, 12)}" fill="${H}"/><path d="M${CX - R},${HY - 4} C${CX - 20},${HY - 28} ${CX + 14},${HY - 30} ${CX + R + 2},${HY - 16} C${CX + 6},${HY - 18} ${CX - 12},${HY - 14} ${CX - R},${HY - 4} Z" fill="${shade(hair, .12)}"/>`); break;
    }
    out.back.push(hairBack.join(''));
    const head = out.head;
    head.push(path(`M${CX - B.nk + 1},${HY + 16} h${(B.nk - 1) * 2} v30 h-${(B.nk - 1) * 2} Z`, G(skin)));
    head.push(flat ? '' : soft(`<ellipse cx="${CX}" cy="${HY + R - 2}" rx="${B.nk + 2}" ry="9" fill="${shade(skin, -.55)}"/>`, .5));
    [-1, 1].forEach(s => head.push(`<ellipse cx="${CX + s * (R - 1)}" cy="${HY + 5}" rx="6.5" ry="8.5" fill="${G(shade(skin, -.04))}"/><path d="M${CX + s * (R - 1)},${HY + 1} q${s * 3},2 ${s * .5},7" stroke="${shade(skin, -.28)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`));
    const jaw = fem ? 0 : 2;
    head.push(path(`M${CX},${HY - R - 2} C${CX + R + 2},${HY - R - 2} ${CX + R + 1},${HY + 4} ${CX + R - 2 + jaw},${HY + 14} C${CX + R - 8},${HY + R + 2} ${CX + 8},${HY + R + 3} ${CX},${HY + R + 3} C${CX - 8},${HY + R + 3} ${CX - R + 8},${HY + R + 2} ${CX - R + 2 - jaw},${HY + 14} C${CX - R - 1},${HY + 4} ${CX - R - 2},${HY - R - 2} ${CX},${HY - R - 2} Z`, G(skin)));
    head.push(flat ? '' : soft(`<ellipse cx="${CX - 10}" cy="${HY - 10}" rx="12" ry="8" fill="#fff"/>`, .22) + soft(`<ellipse cx="${CX + R - 6}" cy="${HY + 10}" rx="6" ry="14" fill="${shade(skin, -.5)}"/>`, .18));
    if (a.face === 'stubble') head.push(`<path d="M${CX - R + 3},${HY + 10} C${CX - R + 8},${HY + R + 2} ${CX + R - 8},${HY + R + 2} ${CX + R - 3},${HY + 10} C${CX + 10},${HY + 18} ${CX - 10},${HY + 18} ${CX - R + 3},${HY + 10} Z" fill="${hair}" opacity=".28"/>`);
    if (a.face === 'beard') head.push(`<path d="M${CX - R + 2},${HY + 4} C${CX - R + 4},${HY + R + 10} ${CX + R - 4},${HY + R + 10} ${CX + R - 2},${HY + 4} C${CX + R - 6},${HY + 16} ${CX + 12},${HY + 26} ${CX},${HY + 26} C${CX - 12},${HY + 26} ${CX - R + 6},${HY + 16} ${CX - R + 2},${HY + 4} Z" fill="${H}"/><path d="M${CX - 10},${HY + 12} Q${CX},${HY + 8} ${CX + 10},${HY + 12}" fill="none" stroke="${H}" stroke-width="4" stroke-linecap="round"/><ellipse cx="${CX}" cy="${HY + 17}" rx="8" ry="4.5" fill="${shade(skin, -.08)}"/>`);
    // eyes: simple dots, with a blink
    head.push(`<g class="av-eyes" style="transform-origin:${CX}px ${HY + 4}px">` + [-1, 1].map(s => `<ellipse cx="${CX + s * 10.5}" cy="${HY + 4}" rx="3.6" ry="4.9" fill="#231a19"/><ellipse cx="${CX + s * 10.5 + 1.3}" cy="${HY + 2.2}" rx="1.3" ry="1.5" fill="#fff" opacity=".9"/>${fem ? `<path d="M${CX + s * 13.2},${HY + 1.4} l${s * 2.6},-2.2" stroke="#231a19" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : ''}`).join('') + '</g>');
    if (a.face === 'lashes') head.push([-1, 1].map(s => `<path d="M${CX + s * 13.5},${HY + 0.5} l${s * 3},-2.5" stroke="#1b1d26" stroke-width="1.6" stroke-linecap="round"/>`).join(''));
    head.push([-1, 1].map(s => `<path d="M${CX + s * 5.5},${HY - 8} q${s * 5},-${fem ? 3.6 : 2.6} ${s * 10},${fem ? 1 : 0.6}" stroke="${a.hair === 'bald' || a.hair === 'buzz' ? shade(skin, -.45) : shade(hair, -.1)}" stroke-width="${fem ? 2.4 : 3.2}" fill="none" stroke-linecap="round"/>`).join(''));
    head.push(`<path d="M${CX + 1},${HY + 4} q2.5,5 -1.5,6.5" stroke="${shade(skin, -.24)}" stroke-width="1.7" fill="none" stroke-linecap="round"/><ellipse cx="${CX - .5}" cy="${HY + 8}" rx="2.2" ry="1.4" fill="#fff" opacity=".22"/>`);
    head.push(`<path class="av-mouth" d="M${CX - 6.5},${HY + 15.5} Q${CX},${HY + 20.5} ${CX + 6.5},${HY + 15.5}" stroke="${shade(skin, -.5)}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
    head.push([-1, 1].map(s => `<ellipse cx="${CX + s * 15}" cy="${HY + 11}" rx="4.5" ry="2.6" fill="#ff8a80" opacity="${lum(skin) > .5 ? .26 : .18}"${flat ? '' : ` filter="url(#${uid}b)"`}/>`).join(''));
    if (!flat && !['bald', 'buzz'].includes(a.hair)) head.push(soft(`<path d="M${CX - R + 4},${HY - 14} Q${CX},${HY - 6} ${CX + R - 4},${HY - 14}" stroke="${shade(skin, -.55)}" stroke-width="6" fill="none"/>`, .28));
    head.push(hairFront.join(''));
    if (fem && ['ponytail', 'highbun'].includes(a.hair)) head.push([-1, 1].map(s => `<path d="M${CX + s * (R - 4)},${HY - 12} C${CX + s * (R + 1)},${HY + 2} ${CX + s * (R - 1)},${HY + 14} ${CX + s * (R - 5)},${HY + 22}" stroke="${H}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`).join(''));
    if (!flat && !['bald', 'buzz', 'cornrows', 'braids'].includes(a.hair)) head.push(soft(`<path d="M${CX - R + 8},${HY - R + 6} Q${CX - 6},${HY - R - 8} ${CX + 10},${HY - R - 4}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`, .45));
    // head accessories
    const A = a.acc;
    if (A.includes('headband') && !A.includes('cap')) head.push(`<path d="M${CX - R - 1},${HY - 6} C${CX - 14},${HY - 18} ${CX + 14},${HY - 18} ${CX + R + 1},${HY - 6} L${CX + R + 1},${HY - 13} C${CX + 14},${HY - 25} ${CX - 14},${HY - 25} ${CX - R - 1},${HY - 13} Z" fill="${G(CLOTH[(a.topCol + 2) % CLOTH.length])}"/>`);
    if (A.includes('cap')) head.push(`<path d="M${CX - R - 3},${HY - 8} C${CX - R - 4},${HY - R - 14} ${CX + R + 4},${HY - R - 14} ${CX + R + 3},${HY - 8} Z" fill="${G(topC)}"/><path d="M${CX - R - 6},${HY - 9} Q${CX},${HY - 15} ${CX + R + 6},${HY - 9} Q${CX},${HY - 1} ${CX - R - 6},${HY - 9} Z" fill="${shade(topC, -.25)}"/><circle cx="${CX}" cy="${HY - R - 6}" r="2.5" fill="${shade(topC, -.3)}"/>`);
    if (A.includes('glasses')) head.push(`<g fill="rgba(200,230,255,.18)" stroke="#1b1d26" stroke-width="2">` + [-1, 1].map(s => `<circle cx="${CX + s * 10}" cy="${HY + 3}" r="7"/>`).join('') + `<path d="M${CX - 3},${HY + 2} q3,-2 6,0" fill="none"/></g>`);
    if (A.includes('headphones')) head.push(`<path d="M${CX - R - 3},${HY + 2} C${CX - R - 4},${HY - R - 16} ${CX + R + 4},${HY - R - 16} ${CX + R + 3},${HY + 2}" fill="none" stroke="#1c2433" stroke-width="5" stroke-linecap="round"/>` + [-1, 1].map(s => `<rect x="${CX + s * (R + 1) - 6}" y="${HY - 6}" width="12" height="20" rx="6" fill="#1c2433" stroke="#c6f432" stroke-width="1.4"/>`).join(''));

    // ---------- assemble ----------
    const style = `<style>
      .av-idle .av-body{animation:av-breathe 3.8s ease-in-out infinite;transform-origin:${CX}px 380px}
      .av-idle .av-eyes{animation:av-blink 4.6s infinite}
      .av-idle .av-armL{animation:av-swayL 3.8s ease-in-out infinite;transform-origin:${CX - B.sw + 7}px ${sh + 6}px}
      .av-idle .av-armR{animation:av-swayR 3.8s ease-in-out infinite;transform-origin:${CX + B.sw - 7}px ${sh + 6}px}
      .av-hop .av-body{animation:av-hop .7s cubic-bezier(.3,.7,.4,1)}
      .av-hop .av-shadow{animation:av-shadow .7s cubic-bezier(.3,.7,.4,1);transform-origin:${CX}px 386px}
      .av-flex .av-armL{animation:av-flexL 1.1s ease-in-out;transform-origin:${CX - B.sw + 7}px ${sh + 6}px}
      .av-flex .av-armR{animation:av-flexR 1.1s ease-in-out;transform-origin:${CX + B.sw - 7}px ${sh + 6}px}
      .av-wave .av-armR{animation:av-wave 1.2s ease-in-out;transform-origin:${CX + B.sw - 7}px ${sh + 6}px}
      .av-hop .av-mouth,.av-flex .av-mouth,.av-wave .av-mouth{animation:av-grin 1s}
      @keyframes av-breathe{50%{transform:scale(1.008,1.012)}}
      @keyframes av-blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
      @keyframes av-swayL{50%{transform:rotate(1.2deg)}}
      @keyframes av-swayR{50%{transform:rotate(-1.2deg)}}
      @keyframes av-hop{30%{transform:translateY(4px) scale(1.03,.96)}55%{transform:translateY(-22px) scale(.98,1.03)}80%{transform:translateY(2px) scale(1.02,.98)}}
      @keyframes av-shadow{55%{transform:scale(.7);opacity:.5}}
      @keyframes av-flexL{25%,75%{transform:rotate(-118deg)}}
      @keyframes av-flexR{25%,75%{transform:rotate(118deg)}}
      @keyframes av-wave{20%{transform:rotate(-150deg)}35%{transform:rotate(-125deg)}50%{transform:rotate(-155deg)}65%{transform:rotate(-125deg)}80%{transform:rotate(-150deg)}}
      @keyframes av-grin{20%,80%{transform:scale(1.35,1.5);transform-origin:${CX}px ${HY + 16}px}}
      @media (prefers-reduced-motion:reduce){.av-idle *,.av-hop *,.av-flex *,.av-wave *{animation:none!important}}
    </style>`;
    const shadow = `<ellipse class="av-shadow" cx="${CX}" cy="386" rx="${50 + B.hp * .4}" ry="8" fill="#2a3a6a" opacity=".28" filter="url(#${uid}bb)"/>`;
    const body = `<g class="av-body">${out.back.join('')}${out.torso.join('')}${out.legs.join('')}<g class="av-armL">${out.armL.join('')}</g><g class="av-armR">${out.armR.join('')}</g>${out.head.join('')}</g>`;
    // arms sit behind the torso when hanging but in front once raised, so draw them twice: behind, then visible above the shoulder line
    const vb = opt.head ? `${CX - 54} ${HY - 58} 108 108` : '0 -22 240 422';
    return `<svg class="lmt-av${opt.still ? '' : ' av-idle'}" viewBox="${vb}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your avatar"><defs>${defs.join('')}</defs>${opt.head ? '' : style + shadow}${body}</svg>`;
  }

  function react(el) {
    const svg = el && (el.tagName === 'svg' ? el : el.querySelector('svg.lmt-av'));
    if (!svg) return;
    const kinds = ['av-hop', 'av-flex', 'av-wave'];
    kinds.forEach(k => svg.classList.remove(k));
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    void svg.getBoundingClientRect();
    svg.classList.remove('av-idle'); svg.classList.add(k);
    clearTimeout(svg._t); svg._t = setTimeout(() => { svg.classList.remove(k); svg.classList.add('av-idle'); }, 1250);
  }

  // colours the exercise animations borrow from the avatar
  function look(a, sex) {
    a = norm(a, sex);
    const fem = a.base === 'female', B = BODY[a.base][a.body], base = BODY[a.base][fem ? 'toned' : 'athletic'];
    const legsCovered = a.bottom === 'leggings' || a.bottom === 'tights' || a.bottom === 'joggers';
    const armsCovered = a.top === 'long' || a.top === 'hoodie';
    return {
      sex: a.base, skin: SKIN[a.skin], hair: HAIRC[a.hairCol], hairStyle: a.hair, top: CLOTH[a.topCol], bottom: CLOTH[a.botCol], shoe: CLOTH[a.shoeCol],
      legsCovered, armsCovered, sleeves: a.top === 'tee' || a.top === 'crop', midriff: a.top === 'bra' || a.top === 'crop',
      arm: B.ua / base.ua, leg: B.th / base.th, torso: (B.ch + B.wa) / (base.ch + base.wa), hip: B.hp / base.hp
    };
  }

  window.LMTAvatar = { build, react, norm, look, OPTS, SKIN, HAIRC, CLOTH, defaults: s => Object.assign({}, DEF[s === 'female' ? 'female' : 'male']) };
})();
