/**
 * Built-in product artwork (pure text → survives ZIP / GitHub / Vercel).
 * Served at /images/<name>.jpg by src/app/images/[file]/route.ts.
 * If a real file exists in public/images/<name>.jpg it wins automatically.
 */

const WRAP = (w: number, h: number, body: string, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<radialGradient id="bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eceff2"/></radialGradient>
<radialGradient id="bead" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#c98a52"/><stop offset=".55" stop-color="#8a4f26"/><stop offset="1" stop-color="#4a2410"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7dc8f"/><stop offset=".45" stop-color="#d4a03c"/><stop offset="1" stop-color="#8f5f17"/></linearGradient>
<linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset=".5" stop-color="#c9922f"/><stop offset="1" stop-color="#8a5a14"/></linearGradient>
<radialGradient id="stone" cx="38%" cy="25%" r="80%"><stop offset="0" stop-color="#6b7684"/><stop offset=".35" stop-color="#2a303a"/><stop offset="1" stop-color="#0e1116"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
${defs}
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${body}
</svg>`;

const shadow = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity=".22" filter="url(#blur)"/>`;

function bead(cx: number, cy: number, r: number) {
  return (
    `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="url(#bead)"/>` +
    `<path d="M${(cx - r * 0.55).toFixed(1)} ${(cy - r * 0.7).toFixed(1)}q${(r * 0.55).toFixed(1)} ${(r * 0.9).toFixed(1)} 0 ${(r * 1.4).toFixed(1)}M${(cx + r * 0.1).toFixed(1)} ${(cy - r * 0.85).toFixed(1)}q${(r * 0.5).toFixed(1)} ${(r * 1.0).toFixed(1)} 0 ${(r * 1.7).toFixed(1)}" stroke="#3a1a0a" stroke-opacity=".55" stroke-width="${(r * 0.1).toFixed(1)}" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${(cx - r * 0.35).toFixed(1)}" cy="${(cy - r * 0.42).toFixed(1)}" rx="${(r * 0.28).toFixed(1)}" ry="${(r * 0.16).toFixed(1)}" fill="#fff" opacity=".28"/>`
  );
}

function mala(): string {
  const cx = 400, cy = 365, R = 235, n = 27;
  let beads = "";
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    beads += bead(cx + R * Math.cos(a), cy + R * Math.sin(a), 40);
  }
  const y = (d: number) => String(cy + R + d);
  const tassel = [
    '<path d="M400 ', y(36), 'V', y(90), '" stroke="#b3202a" stroke-width="7" stroke-linecap="round" fill="none"/>',
    '<circle cx="400" cy="', y(92), '" r="13" fill="#d4a03c"/>',
    '<path d="M372 ', y(100), 'h56l14 96h-84z" fill="#c4202c"/>',
    '<path d="M380 ', y(104), 'l-3 90M392 ', y(104), 'l-1 92M404 ', y(104), 'l1 92M416 ', y(104), 'l3 90" stroke="#8d121b" stroke-width="3" fill="none"/>',
  ].join("");
  return WRAP(
    800,
    800,
    shadow(400, 700, 250, 28) +
      `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#b3202a" stroke-width="5"/>` +
      beads +
      bead(400, cy + R, 50) +
      tassel,
  );
}

function bracelet(): string {
  const cx = 400, cy = 400, R = 215, n = 16;
  let b = "";
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    b += bead(cx + R * Math.cos(a), cy + R * Math.sin(a), 56);
    const a2 = a + Math.PI / n;
    const sx = cx + R * Math.cos(a2), sy = cy + R * Math.sin(a2);
    b += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="17" fill="url(#gold)"/><circle cx="${(sx - 5).toFixed(1)}" cy="${(sy - 5).toFixed(1)}" r="5" fill="#fff" opacity=".4"/>`;
  }
  return WRAP(800, 800, shadow(400, 690, 260, 26) + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#2a2a2a" stroke-width="5"/>` + b);
}

function thali(): string {
  return WRAP(
    800,
    800,
    shadow(400, 640, 330, 36) +
      `<ellipse cx="400" cy="520" rx="330" ry="120" fill="url(#goldV)"/>` +
      `<ellipse cx="400" cy="500" rx="330" ry="120" fill="url(#gold)"/>` +
      `<ellipse cx="400" cy="500" rx="292" ry="100" fill="none" stroke="#8f5f17" stroke-width="5" stroke-opacity=".6"/>` +
      `<ellipse cx="400" cy="504" rx="250" ry="84" fill="#e9c15f" opacity=".55"/>` +
      `<ellipse cx="400" cy="500" rx="150" ry="52" fill="none" stroke="#8f5f17" stroke-width="3" stroke-dasharray="8 8" stroke-opacity=".6"/>` +
      // diya
      `<path d="M335 470q65 70 130 0z" fill="url(#goldV)"/><ellipse cx="400" cy="470" rx="65" ry="14" fill="#f3d27a"/>` +
      `<path d="M400 452q-30-40 0-96q30 56 0 96z" fill="#ff9a1f"/><path d="M400 448q-14-24 0-58q14 34 0 58z" fill="#fff0a8"/>` +
      // small bowls
      `<ellipse cx="205" cy="505" rx="62" ry="22" fill="#b9801f"/><path d="M143 505q62 60 124 0z" fill="url(#goldV)"/>` +
      `<ellipse cx="595" cy="505" rx="62" ry="22" fill="#b9801f"/><path d="M533 505q62 60 124 0z" fill="url(#goldV)"/>` +
      // marigold petals
      [250, 300, 350, 450, 500, 550].map((x, i) => `<circle cx="${x}" cy="${540 + (i % 2) * 14}" r="15" fill="${i % 2 ? "#ff8c1a" : "#ffb300"}"/>`).join("") +
      // bell
      `<path d="M370 300q30-70 60 0v40h-60z" fill="url(#goldV)" transform="translate(0 -20)"/><circle cx="400" cy="302" r="12" fill="#8a5a14"/><rect x="394" y="228" width="12" height="40" rx="6" fill="#8a5a14"/>`,
  );
}

function kalash(): string {
  const pot = (cx: number, cy: number, s: number) =>
    `<g transform="translate(${cx} ${cy}) scale(${s})">` +
    `<ellipse cx="0" cy="260" rx="120" ry="26" fill="#000" opacity=".18" filter="url(#blur)"/>` +
    `<path d="M-70 -150h140l-18 52q96 40 96 170q0 150-148 150t-148-150q0-130 96-170z" fill="url(#goldV)"/>` +
    `<path d="M-52 -150q-4 40 -52 90q-60 60 -40 160" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="12" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="-150" rx="70" ry="20" fill="#f3d27a"/><ellipse cx="0" cy="-150" rx="52" ry="12" fill="#6e4710"/>` +
    `<path d="M-120 20q120 40 240 0M-130 80q130 44 260 0" fill="none" stroke="#8a5a14" stroke-width="7" stroke-opacity=".7"/>` +
    `<path d="M-30 -20l30-26l30 26l-30 26z" fill="#8a5a14" opacity=".55"/>` +
    `</g>`;
  return WRAP(800, 800, pot(255, 380, 1.0) + pot(560, 440, 0.8));
}

function turtle(): string {
  let cells = "";
  const pts: [number, number][] = [[400, 380], [330, 345], [470, 345], [320, 430], [480, 430], [400, 470], [400, 310]];
  for (const [x, y] of pts)
    cells += `<path d="M${x - 30} ${y}l15-26h30l15 26l-15 26h-30z" fill="none" stroke="#6e4710" stroke-width="6" stroke-opacity=".75"/>`;
  return WRAP(
    800,
    800,
    shadow(400, 600, 300, 30) +
      `<ellipse cx="205" cy="470" rx="46" ry="30" fill="url(#goldV)"/><ellipse cx="595" cy="470" rx="46" ry="30" fill="url(#goldV)"/>` +
      `<ellipse cx="290" cy="560" rx="42" ry="28" fill="url(#goldV)"/><ellipse cx="510" cy="560" rx="42" ry="28" fill="url(#goldV)"/>` +
      `<path d="M400 205q36 6 52 34q8 44-52 52q-60-8-52-52q16-28 52-34z" fill="url(#goldV)" transform="translate(0 20)"/>` +
      `<circle cx="384" cy="258" r="6" fill="#2a1604"/><circle cx="416" cy="258" r="6" fill="#2a1604"/>` +
      `<ellipse cx="400" cy="410" rx="250" ry="175" fill="url(#gold)"/>` +
      `<ellipse cx="400" cy="400" rx="212" ry="146" fill="none" stroke="#6e4710" stroke-width="7" stroke-opacity=".6"/>` +
      cells +
      `<ellipse cx="320" cy="320" rx="70" ry="26" fill="#fff" opacity=".22" transform="rotate(-22 320 320)"/>`,
  );
}

function lingam(): string {
  return WRAP(
    800,
    800,
    shadow(400, 650, 300, 34) +
      `<ellipse cx="400" cy="590" rx="290" ry="72" fill="#cfd6dd"/><ellipse cx="400" cy="570" rx="290" ry="72" fill="#e6eaee"/>` +
      `<ellipse cx="400" cy="560" rx="226" ry="52" fill="url(#stone)"/>` +
      `<path d="M262 560V400q0-200 138-200t138 200v160q-138 56-276 0z" fill="url(#stone)"/>` +
      `<path d="M318 270q10-60 62-70" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="16" stroke-linecap="round"/>` +
      `<path d="M262 400q138 70 276 0" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="6"/>` +
      // brass cobra
      `<path d="M600 590q80-60 20-150q-50-80 10-130" fill="none" stroke="url(#goldV)" stroke-width="30" stroke-linecap="round"/>` +
      `<path d="M630 300q-46-24-34-70q24-26 56-6q22 30-22 76z" fill="url(#goldV)"/>` +
      // flowers
      [280, 330, 470, 520].map((x, i) => `<circle cx="${x}" cy="${578 + (i % 2) * 10}" r="14" fill="${i % 2 ? "#ff8c1a" : "#ffb300"}"/>`).join(""),
  );
}

function temple(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a3b66"/><stop offset=".6" stop-color="#0c64a4"/><stop offset="1" stop-color="#e8a33a"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="72%" r="55%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<radialGradient id="stone" cx="38%" cy="25%" r="80%"><stop offset="0" stop-color="#6b7684"/><stop offset=".35" stop-color="#2a303a"/><stop offset="1" stop-color="#0e1116"/></radialGradient>
<linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset=".5" stop-color="#c9922f"/><stop offset="1" stop-color="#8a5a14"/></linearGradient>
</defs>
<rect width="1200" height="800" fill="url(#bg)"/><rect width="1200" height="800" fill="url(#glow)"/>
<g fill="#d4a03c" opacity=".35"><circle cx="150" cy="110" r="70" fill="none" stroke="#d4a03c" stroke-width="10"/><circle cx="1050" cy="130" r="95" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="8"/></g>
<ellipse cx="600" cy="640" rx="360" ry="60" fill="#000" opacity=".3"/>
<ellipse cx="600" cy="620" rx="330" ry="66" fill="#d9dee3"/>
<ellipse cx="600" cy="600" rx="250" ry="52" fill="url(#stone)"/>
<path d="M470 600V380q0-190 130-190t130 190v220q-130 54-260 0z" fill="url(#stone)"/>
<path d="M520 300q8-56 64-66" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="16" stroke-linecap="round"/>
${Array.from({ length: 14 }, (_, i) => `<circle cx="${380 + i * 30}" cy="${596 + Math.sin(i) * 8}" r="17" fill="${i % 2 ? "#ff8c1a" : "#ffb300"}"/>`).join("")}
<g>${[210, 330, 870, 990].map((x) => `<path d="M${x - 40} 640q40 46 80 0z" fill="url(#goldV)"/><path d="M${x} 632q-24-36 0-84q24 48 0 84z" fill="#ff9a1f"/><path d="M${x} 628q-10-20 0-46q10 26 0 46z" fill="#fff0a8"/>`).join("")}</g>
</svg>`;
}

const ART: Record<string, string> = {
  "p-mala": mala(),
  "p-bracelet": bracelet(),
  "p-puja-thali": thali(),
  "p-kalash": kalash(),
  "p-brass-turtle": turtle(),
  "p-lingam": lingam(),
  "about-temple": temple(),
  "hero-1": temple(),
  "hero-2": temple(),
  "hero-3": temple(),
};

export function getProductArt(file: string): string | null {
  const base = file.replace(/\.(jpe?g|png|webp|svg)$/i, "");
  return ART[base] ?? null;
}
