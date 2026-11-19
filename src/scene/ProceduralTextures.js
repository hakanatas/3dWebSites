import * as THREE from 'three';

/**
 * Generates procedural PBR textures (brushed metal, carbon fiber weave,
 * dynamic team plates, and high-resolution rear technical specification plate).
 */
export function createBrushedMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y++) {
    const shade = 112 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 512, 1);
  }

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 30 + Math.random() * 140;
    const alpha = 0.05 + Math.random() * 0.1;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, len, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createCarbonFiberTextures() {
  const size = 256;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dCtx = diffCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  dCtx.fillStyle = '#12151a';
  dCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#505050';
  bCtx.fillRect(0, 0, size, size);

  const cell = 16;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const parity = ((x / cell) + (y / cell)) % 2 === 0;
      const gradD = dCtx.createLinearGradient(x, y, x + cell, y + cell);
      gradD.addColorStop(0, parity ? '#202630' : '#14181f');
      gradD.addColorStop(0.5, parity ? '#2c3442' : '#1b2029');
      gradD.addColorStop(1, parity ? '#161b22' : '#101318');
      dCtx.fillStyle = gradD;
      dCtx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

      const gradB = bCtx.createLinearGradient(x, y, x + cell, y + cell);
      gradB.addColorStop(0, parity ? '#969696' : '#6a6a6a');
      gradB.addColorStop(0.5, parity ? '#d2d2d2' : '#9c9c9c');
      gradB.addColorStop(1, parity ? '#707070' : '#4a4a4a');
      bCtx.fillStyle = gradB;
      bCtx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }

  const map = new THREE.CanvasTexture(diffCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  return { map, bumpMap };
}

export function createTeamPlateTexture(teamCode = '#24230', subtitle = 'AG ROBOTİK · FTC', accentHex = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Anodized dark base
  ctx.fillStyle = '#11161d';
  ctx.fillRect(0, 0, 1024, 256);

  // Subtle horizontal brushed sheen
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 1024, 1);
  }

  // Accent bar on left
  ctx.fillStyle = accentHex;
  ctx.fillRect(34, 42, 12, 172);

  // Corner mounting bolts
  const bolts = [
    [22, 22],
    [1002, 22],
    [22, 234],
    [1002, 234]
  ];
  bolts.forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#38414f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1015';
    ctx.fill();
  });

  // Team code text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '700 108px "Space Grotesk", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(teamCode, 72, 118);

  // Subtitle
  ctx.fillStyle = accentHex;
  ctx.font = '600 32px "JetBrains Mono", monospace';
  ctx.fillText(subtitle, 74, 198);

  // Right-side ALKEV mark
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(241, 245, 249, 0.55)';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.fillText('ALKEV ÖZEL OKULLARI', 964, 96);
  ctx.fillStyle = 'rgba(241, 245, 249, 0.35)';
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.fillText('MORE THAN ROBOTS', 964, 140);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createRearSpecPlateTexture(
  teamCode = '#24230 AG ROBOTİK',
  specLine = 'MECANUM 4WD · JAVA AUTONOMOUS',
  accentHex = '#38bdf8'
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  // Deep machined aluminum plate
  ctx.fillStyle = '#10141b';
  ctx.fillRect(0, 0, 1024, 768);

  // Subtle metallic frame
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 976, 720);

  // Header band
  ctx.fillStyle = '#171d26';
  ctx.fillRect(26, 26, 972, 128);

  ctx.fillStyle = accentHex;
  ctx.fillRect(26, 150, 972, 5);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 48px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(teamCode, 60, 92);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText('TEKNİK TELEMETRİ & KİMLİK PLAKASI · ALKEV', 60, 132);

  // Specs table
  const rows = [
    ['KATEGORİ', 'FIRST TECH CHALLENGE (FTC) / FRC'],
    ['BAŞLANGIÇ HACMİ', '18" × 18" × 18" (457 MM KÜP)'],
    ['KONTROL ÜNİTESİ', 'REV CONTROL HUB · ANDROID STUDIO'],
    ['PROGRAMLAMA', 'JAVA / OTONOM + SÜRÜCÜ KONTROL'],
    ['AKTARMA ORGANI', specLine],
    ['MAÇ PERİYODU', '30 SN OTONOM · 120 SN TELE-OP'],
    ['ŞASİ MALZEMESİ', '6061-T6 ANODİZE ALÜMİNYUM + KARBON'],
    ['MERKEZ', 'ALKEV ÖZEL OKULLARI · İSTANBUL']
  ];

  let y = 216;
  rows.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(52, y - 34, 920, 52);
    }

    ctx.fillStyle = '#7c8899';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillText(label, 68, y);

    ctx.fillStyle = '#eef2f6';
    ctx.font = '600 24px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText(value, 360, y);
    y += 58;
  });

  // Footer status bar
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.arc(76, 704, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText('SYS STATUS: ONLINE · MORE THAN ROBOTS · WWW.ALKEVTECH.COM', 100, 712);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createHubScreenTexture(accentHex = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#070a0e';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 488, 232);

  ctx.fillStyle = accentHex;
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText('REV CONTROL HUB', 36, 66);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.fillText('BATT: 13.4V   IMU: OK', 36, 120);
  ctx.fillText('AUTO: JAVA    PID: 60HZ', 36, 160);
  ctx.fillText('LINK: 5GHZ    PING: 2MS', 36, 200);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
