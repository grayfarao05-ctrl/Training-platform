// introEngine.js - Stateless 2D Canvas renderer for ITreal WelcomeIntro
import { introData } from './introData.js';

export function createIntro(img, options = {}) {
  const { scene, under, glyphs, fontGlyphs, contours } = introData;
  const W = scene.w; // 960
  const H = scene.h; // 580

  // Helper to dynamically lay out a centered line of text from fontGlyphs (em = 100)
  function buildDynamicLine(text, baseFontSize, baselineY, lineNum, maxWidth = 860) {
    if (!fontGlyphs || !text) return [];
    const chars = Array.from(text);
    // Measure raw width at em=100
    let rawWidth = 0;
    for (const ch of chars) {
      const g = fontGlyphs[ch] || fontGlyphs[ch.toUpperCase()] || fontGlyphs[' '];
      rawWidth += g ? g.a : 45;
    }
    if (rawWidth <= 0) return [];

    // Scale font size down gracefully if name is very long
    let fontSize = baseFontSize;
    const estWidth = (rawWidth / 100) * fontSize;
    if (estWidth > maxWidth) {
      fontSize = fontSize * (maxWidth / estWidth);
    }

    const scale = fontSize / 100;
    const totalW = rawWidth * scale;
    let currX = W / 2 - totalW / 2;
    const built = [];

    for (const ch of chars) {
      const g = fontGlyphs[ch] || fontGlyphs[ch.toUpperCase()];
      const adv = (g ? g.a : 45) * scale;
      if (ch !== ' ' && g && g.p && g.p.length > 0) {
        const polylines = g.p.map((poly) =>
          poly.map((pt) => [currX + pt[0] * scale, baselineY + pt[1] * scale])
        );
        built.push({
          char: ch,
          line: lineNum,
          polylines,
          length: 0,
          bbox: [currX, baselineY - fontSize, currX + adv, baselineY],
        });
      }
      currX += adv;
    }
    return built;
  }

  const rawName = typeof options.studentName === 'string' ? options.studentName.trim() : '';
  const activeGlyphSources = rawName
    ? [
        ...buildDynamicLine('Thank you for your interest', 62, 82, 1, 880),
        ...buildDynamicLine(rawName.toUpperCase(), 96, 178, 2, 860),
      ]
    : glyphs;

  // Precompute cumulative lengths for glyphs and contours
  const glyphsList = activeGlyphSources.map((g) => {
    const polys = g.polylines.map((poly) => {
      const segLengths = [];
      let total = 0;
      for (let i = 0; i < poly.length - 1; i++) {
        const dx = poly[i + 1][0] - poly[i][0];
        const dy = poly[i + 1][1] - poly[i][1];
        const len = Math.hypot(dx, dy);
        segLengths.push(len);
        total += len;
      }
      return { poly, segLengths, total };
    });
    const totalLength = polys.reduce((acc, p) => acc + p.total, 0);
    return {
      char: g.char,
      line: g.line,
      polys,
      totalLength: totalLength || g.length || 1,
      bbox: g.bbox,
    };
  });

  const contoursList = contours.map((c, idx) => {
    const segLengths = [];
    let total = 0;
    const pts = c.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy);
      segLengths.push(len);
      total += len;
    }
    return {
      id: c.id || `c-${idx}`,
      points: pts,
      segLengths,
      totalLength: total || c.length || 1,
      x: c.x,
      y: c.y,
      w: c.w,
      h: c.h,
    };
  });

  // -------------------------------------------------------------
  // Timeline setup
  // -------------------------------------------------------------
  // Beam: 0.15s to 0.95s
  const BEAM_START = 0.15;
  const BEAM_END = 0.95;

  // Bounces: 0.8s to 1.96s (3 hops)
  // Durations: 0.5s, 0.38s, 0.28s
  // Heights: 170, 90, 42
  const beamX1 = under.x1; // 43.0
  const beamX2 = under.x2; // 933.5
  const beamY = under.y; // 558.5
  const beamLen = beamX2 - beamX1; // 890.5

  const landX0 = beamX1 + 0.03 * beamLen; // 69.715
  const landX1 = beamX1 + 0.20 * beamLen; // 221.1
  const landX2 = beamX1 + 0.335 * beamLen; // 341.3175
  const landX3 = beamX1 + 0.425 * beamLen; // 421.4625

  const BOUNCE_HOPS = [
    { t0: 0.80, t1: 1.30, dur: 0.50, x0: landX0, x1: landX1, h: 170 },
    { t0: 1.30, t1: 1.68, dur: 0.38, x0: landX1, x1: landX2, h: 90 },
    { t0: 1.68, t1: 1.96, dur: 0.28, x0: landX2, x1: landX3, h: 42 },
  ];

  const LANDINGS = [
    { t: 0.80, x: landX0 },
    { t: 1.30, x: landX1 },
    { t: 1.68, x: landX2 },
    { t: 1.96, x: landX3 },
  ];

  // Arc to first letter: 1.96s to 2.46s (0.50s)
  const ARC1_START = 1.96;
  const ARC1_END = 2.46;
  const firstGlyphStart = glyphsList[0]?.polys[0]?.poly[0] || [260, 98];

  // Letters: 2.46s to 4.45s (duration 1.99s)
  const WRITE_START = 2.46;
  const WRITE_END = 4.45;
  const WRITE_TOTAL_TIME = WRITE_END - WRITE_START;
  const sumGlyphLengths = glyphsList.reduce((acc, g) => acc + g.totalLength, 0) || 1;

  let currentGlyphTime = WRITE_START;
  const glyphTimings = glyphsList.map((g, idx) => {
    const fraction = g.totalLength / sumGlyphLengths;
    const dur = WRITE_TOTAL_TIME * fraction;
    const traceDur = dur * 0.78;
    const hopDur = dur * 0.22;
    const tTraceStart = currentGlyphTime;
    const tTraceEnd = tTraceStart + traceDur;
    const tEnd = tTraceStart + dur;
    currentGlyphTime = tEnd;

    const nextGlyph = glyphsList[idx + 1];
    const nextStart = nextGlyph ? nextGlyph.polys[0]?.poly[0] : null;

    return {
      glyph: g,
      tTraceStart,
      tTraceEnd,
      tEnd,
      traceDur,
      hopDur,
      nextStart,
    };
  });

  // Arc to logo: 4.45s to 4.96s (0.51s)
  const ARC2_START = WRITE_END;
  const ARC2_END = 4.96;
  const lastGlyphEnd = glyphsList[glyphsList.length - 1]?.polys[0]?.poly[0] || [650, 176];
  const firstContourStart = contoursList[0]?.points[0] || [10, 224];

  // Logo shapes: 4.96s onwards at ~3800 units/sec, 0.05s hops
  const LOGO_SPEED = 3800;
  const LOGO_HOP = 0.05;
  let currentContourTime = 4.96;

  const contourTimings = contoursList.map((c, idx) => {
    const traceDur = c.totalLength / LOGO_SPEED;
    const tTraceStart = currentContourTime;
    const tTraceEnd = tTraceStart + traceDur;
    const tEnd = tTraceEnd + LOGO_HOP;
    currentContourTime = tEnd;

    const nextContour = contoursList[idx + 1];
    const nextStart = nextContour ? nextContour.points[0] : null;

    return {
      contour: c,
      tTraceStart,
      tTraceEnd,
      tEnd,
      traceDur,
      nextStart,
    };
  });

  const LOGO_TRACE_END = contourTimings[contourTimings.length - 1]?.tTraceEnd || 6.75;

  // Real logo image fade: starts 0.35s before tracing ends, fades in over 0.9s
  const LOGO_FADE_START = LOGO_TRACE_END - 0.35;
  const LOGO_FADE_DUR = 0.9;

  // Drop back to beam: 0.45s arc from last contour end to beam start (x1=43, y=558.5)
  const DROP_START = LOGO_TRACE_END;
  const DROP_END = DROP_START + 0.45;
  const lastContourEnd = contoursList[contoursList.length - 1]?.points[0] || [800, 330];

  // Run along beam: 0.75s ease-in-out from x1 to ring center (946.5)
  const RUN_START = DROP_END;
  const RUN_DUR = 0.75;
  const RUN_END = RUN_START + RUN_DUR;
  const ringCenter = under.ring; // { cx: 946.5, cy: 558.5, r: 13 }

  // Underline crossfade: starts 0.3s after run begins, fades in over 0.8s
  const UNDER_FADE_START = RUN_START + 0.3;
  const UNDER_FADE_DUR = 0.8;

  // Button fade: 0.9s after run ends
  const BTN_FADE_START = RUN_END + 0.9;
  const TOTAL_END = RUN_END + 2.2; // ~9.5s

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }

  // Sample a point on a polyline given fraction p in [0, 1]
  function samplePolyline(poly, segLengths, totalLen, p) {
    if (p <= 0 || poly.length === 0) return poly[0];
    if (p >= 1) return poly[poly.length - 1];
    const targetDist = p * totalLen;
    let acc = 0;
    for (let i = 0; i < segLengths.length; i++) {
      const seg = segLengths[i];
      if (acc + seg >= targetDist) {
        const segFrac = seg > 0 ? (targetDist - acc) / seg : 0;
        const x = poly[i][0] + segFrac * (poly[i + 1][0] - poly[i][0]);
        const y = poly[i][1] + segFrac * (poly[i + 1][1] - poly[i][1]);
        return [x, y];
      }
      acc += seg;
    }
    return poly[poly.length - 1];
  }

  // Draw full polyline
  function strokePolyline(ctx, poly) {
    if (!poly || poly.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.stroke();
  }

  // Draw partial polyline up to fraction p
  function strokePartialPolyline(ctx, poly, segLengths, totalLen, p) {
    if (p <= 0 || poly.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    if (p >= 1) {
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i][0], poly[i][1]);
      }
      ctx.stroke();
      return;
    }
    const targetDist = p * totalLen;
    let acc = 0;
    for (let i = 0; i < segLengths.length; i++) {
      const seg = segLengths[i];
      if (acc + seg >= targetDist) {
        const segFrac = seg > 0 ? (targetDist - acc) / seg : 0;
        const x = poly[i][0] + segFrac * (poly[i + 1][0] - poly[i][0]);
        const y = poly[i][1] + segFrac * (poly[i + 1][1] - poly[i][1]);
        ctx.lineTo(x, y);
        break;
      }
      acc += seg;
      ctx.lineTo(poly[i + 1][0], poly[i + 1][1]);
    }
    ctx.stroke();
  }

  // Fill closed glyph with nonzero winding rule
  function fillGlyphPolylines(ctx, polys, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    for (let i = 0; i < polys.length; i++) {
      const poly = polys[i].poly;
      if (poly.length < 3) continue;
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let j = 1; j < poly.length; j++) {
        ctx.lineTo(poly[j][0], poly[j][1]);
      }
      ctx.closePath();
    }
    ctx.fill('nonzero');
  }

  // -------------------------------------------------------------
  // STATELESS LIGHT PATH POSITION SAMPLER
  // Returns { x, y, active, radius, alpha } for any time t
  // -------------------------------------------------------------
  function getLightPos(t) {
    if (t < 0.80 || t > RUN_END + 0.35) {
      return { x: 0, y: 0, active: false, radius: 0, alpha: 0 };
    }

    // 1. The Bounces (0.80s - 1.96s)
    for (let i = 0; i < BOUNCE_HOPS.length; i++) {
      const hop = BOUNCE_HOPS[i];
      if (t >= hop.t0 && t <= hop.t1) {
        const u = (t - hop.t0) / hop.dur;
        const x = hop.x0 + u * (hop.x1 - hop.x0);
        // Parabolic vertical trajectory
        const y = beamY - 4 * hop.h * u * (1 - u);
        return { x, y, active: true, radius: 9, alpha: 1.0 };
      }
    }

    // 2. Arc up to first letter (1.96s - 2.46s)
    if (t >= ARC1_START && t <= ARC1_END) {
      const u = (t - ARC1_START) / (ARC1_END - ARC1_START);
      const eu = easeInOut(u);
      const p0 = [landX3, beamY];
      const p1 = [landX3 + 50, 80]; // apex control point
      const p2 = firstGlyphStart;
      // Quadratic Bezier arc
      const x = (1 - eu) * (1 - eu) * p0[0] + 2 * (1 - eu) * eu * p1[0] + eu * eu * p2[0];
      const y = (1 - eu) * (1 - eu) * p0[1] + 2 * (1 - eu) * eu * p1[1] + eu * eu * p2[1];
      return { x, y, active: true, radius: 8.5, alpha: 1.0 };
    }

    // 3. Letters Writing (2.46s - 4.45s)
    if (t >= WRITE_START && t <= WRITE_END) {
      for (let i = 0; i < glyphTimings.length; i++) {
        const gt = glyphTimings[i];
        if (t >= gt.tTraceStart && t <= gt.tEnd) {
          if (t <= gt.tTraceEnd) {
            // Tracing the glyph
            const frac = (t - gt.tTraceStart) / (gt.traceDur || 0.001);
            // Distribute across glyph's polylines
            const targetLen = frac * gt.glyph.totalLength;
            let acc = 0;
            for (let pIdx = 0; pIdx < gt.glyph.polys.length; pIdx++) {
              const pObj = gt.glyph.polys[pIdx];
              if (acc + pObj.total >= targetLen || pIdx === gt.glyph.polys.length - 1) {
                const subFrac = pObj.total > 0 ? (targetLen - acc) / pObj.total : 0;
                const pt = samplePolyline(pObj.poly, pObj.segLengths, pObj.total, clamp(subFrac, 0, 1));
                return { x: pt[0], y: pt[1], active: true, radius: 7.5, alpha: 1.0 };
              }
              acc += pObj.total;
            }
          } else {
            // Hopping to next letter
            const u = (t - gt.tTraceEnd) / (gt.hopDur || 0.001);
            const eu = easeInOut(u);
            const lastPt = gt.glyph.polys[gt.glyph.polys.length - 1]?.poly.slice(-1)[0] || [0, 0];
            const nextPt = gt.nextStart || firstContourStart;
            // Small hop curve
            const midY = Math.min(lastPt[1], nextPt[1]) - 16;
            const x = (1 - eu) * lastPt[0] + eu * nextPt[0];
            const y = (1 - eu) * (1 - eu) * lastPt[1] + 2 * (1 - eu) * eu * midY + eu * eu * nextPt[1];
            return { x, y, active: true, radius: 6.5, alpha: 0.9 };
          }
        }
      }
    }

    // 4. Arc down to logo (4.45s - 4.96s)
    if (t >= ARC2_START && t <= ARC2_END) {
      const u = (t - ARC2_START) / (ARC2_END - ARC2_START);
      const eu = easeInOut(u);
      const p0 = lastGlyphEnd;
      const p1 = [120, 200]; // mid control point
      const p2 = firstContourStart;
      const x = (1 - eu) * (1 - eu) * p0[0] + 2 * (1 - eu) * eu * p1[0] + eu * eu * p2[0];
      const y = (1 - eu) * (1 - eu) * p0[1] + 2 * (1 - eu) * eu * p1[1] + eu * eu * p2[1];
      return { x, y, active: true, radius: 8, alpha: 1.0 };
    }

    // 5. Logo Shapes Outlines (4.96s - LOGO_TRACE_END)
    if (t >= 4.96 && t <= LOGO_TRACE_END + 0.05) {
      for (let i = 0; i < contourTimings.length; i++) {
        const ct = contourTimings[i];
        if (t >= ct.tTraceStart && t <= ct.tEnd) {
          if (t <= ct.tTraceEnd) {
            const frac = (t - ct.tTraceStart) / (ct.traceDur || 0.001);
            const pt = samplePolyline(ct.contour.points, ct.contour.segLengths, ct.contour.totalLength, clamp(frac, 0, 1));
            return { x: pt[0], y: pt[1], active: true, radius: 8, alpha: 1.0 };
          } else {
            // Hop between logo shapes (0.05s)
            const u = (t - ct.tTraceEnd) / LOGO_HOP;
            const eu = easeInOut(u);
            const p0 = ct.contour.points[ct.contour.points.length - 1];
            const p1 = ct.nextStart || [beamX1, beamY];
            const x = (1 - eu) * p0[0] + eu * p1[0];
            const y = (1 - eu) * p0[1] + eu * p1[1];
            return { x, y, active: true, radius: 7, alpha: 0.9 };
          }
        }
      }
    }

    // 6. Drop back to beam (DROP_START to DROP_END)
    if (t >= DROP_START && t <= DROP_END) {
      const u = (t - DROP_START) / (DROP_END - DROP_START);
      const eu = easeInOut(u);
      const p0 = lastContourEnd;
      const p1 = [beamX1 - 20, beamY - 60];
      const p2 = [beamX1, beamY];
      const x = (1 - eu) * (1 - eu) * p0[0] + 2 * (1 - eu) * eu * p1[0] + eu * eu * p2[0];
      const y = (1 - eu) * (1 - eu) * p0[1] + 2 * (1 - eu) * eu * p1[1] + eu * eu * p2[1];
      return { x, y, active: true, radius: 8.5, alpha: 1.0 };
    }

    // 7. Run along beam (RUN_START to RUN_END)
    if (t >= RUN_START && t <= RUN_END) {
      const u = (t - RUN_START) / RUN_DUR;
      const eu = easeInOut(u);
      const x = beamX1 + eu * (ringCenter.cx - beamX1);
      const y = beamY;
      return { x, y, active: true, radius: 10, alpha: 1.0 };
    }

    // Lingering flash at ring
    if (t > RUN_END && t <= RUN_END + 0.35) {
      const u = (t - RUN_END) / 0.35;
      return { x: ringCenter.cx, y: ringCenter.cy, active: true, radius: 12 * (1 - u), alpha: 1 - u };
    }

    return { x: 0, y: 0, active: false, radius: 0, alpha: 0 };
  }

  // Pre-generate deterministic sparkle data
  const SPARKLES = [];
  for (let i = 0; i < 36; i++) {
    // Distribute near text and logo
    const sx = 60 + ((i * 137.5) % 840);
    const sy = 40 + ((i * 83.1) % 500);
    const speed = 0.8 + ((i * 1.618) % 1.4);
    const phase = (i * 2.399) % (Math.PI * 2);
    const r = 1.2 + ((i * 3.1) % 2.0);
    const isCyan = i % 2 === 0;
    SPARKLES.push({ sx, sy, speed, phase, r, isCyan });
  }

  // -------------------------------------------------------------
  // MAIN STATELESS DRAW FUNCTION
  // -------------------------------------------------------------
  function draw(ctx, t, k = {}) {
    const scale = k.scale || 1.0;
    const sparkleLimit = k.sparkleCount !== undefined ? k.sparkleCount : 36;
    const minLw = Math.max(1.8, 1.3 / scale);

    // 1. Clear background: radial gradient #10263b -> #07111d -> #03070d
    // When rendered fullscreen in WelcomeIntro.jsx, the full-viewport background
    // is painted before scaling so there are no box seams.
    if (!k.skipBg) {
      const bgGrad = ctx.createRadialGradient(W / 2, H * 0.44, 40, W / 2, H * 0.44, W * 0.75);
      bgGrad.addColorStop(0, '#10263b');
      bgGrad.addColorStop(0.55, '#07111d');
      bgGrad.addColorStop(1, '#03070d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Glowing Beam (0.15s onwards)
    if (t >= BEAM_START) {
      let beamGrow = 1.0;
      if (t < BEAM_END) {
        beamGrow = easeOut(clamp((t - BEAM_START) / (BEAM_END - BEAM_START), 0, 1));
      }

      // Beam crossfades into logo underline: fades out when logo underline fades in
      let beamAlpha = 1.0;
      if (t >= UNDER_FADE_START) {
        const u = clamp((t - UNDER_FADE_START) / UNDER_FADE_DUR, 0, 1);
        beamAlpha = 1.0 - u;
      }

      if (beamAlpha > 0.001 && beamGrow > 0.001) {
        const midX = (beamX1 + beamX2) / 2;
        const currentHalfLen = (beamLen / 2) * beamGrow;
        const bx0 = midX - currentHalfLen;
        const bx1 = midX + currentHalfLen;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Beam gradient: light cyan on left (rgb(150,235,255)) to deep blue on right (rgb(15,120,215))
        const beamGrad = ctx.createLinearGradient(beamX1, beamY, beamX2, beamY);
        beamGrad.addColorStop(0, `rgba(150, 235, 255, ${0.95 * beamAlpha})`);
        beamGrad.addColorStop(0.5, `rgba(60, 180, 245, ${0.95 * beamAlpha})`);
        beamGrad.addColorStop(1, `rgba(15, 120, 215, ${0.95 * beamAlpha})`);

        const beamGlowGrad = ctx.createLinearGradient(beamX1, beamY, beamX2, beamY);
        beamGlowGrad.addColorStop(0, `rgba(150, 235, 255, ${0.16 * beamAlpha})`);
        beamGlowGrad.addColorStop(0.5, `rgba(60, 180, 245, ${0.16 * beamAlpha})`);
        beamGlowGrad.addColorStop(1, `rgba(15, 120, 215, ${0.16 * beamAlpha})`);

        // Wide stroke (glow)
        ctx.strokeStyle = beamGlowGrad;
        ctx.lineWidth = Math.max(under.thickness * 2.2, minLw * 4);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx0, beamY);
        ctx.lineTo(bx1, beamY);
        ctx.stroke();

        // Core stroke (8 units thickness)
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = under.thickness;
        ctx.beginPath();
        ctx.moveTo(bx0, beamY);
        ctx.lineTo(bx1, beamY);
        ctx.stroke();

        ctx.restore();
      }
    }

    // 3. Bounce Landing Flashes (STRICTLY after ball lands)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < LANDINGS.length; i++) {
      const land = LANDINGS[i];
      // Check that the bounce flashes do NOT appear before the ball lands
      if (t >= land.t && t <= land.t + 0.38) {
        const u = (t - land.t) / 0.38;
        const flashAlpha = Math.pow(1 - u, 2) * 0.85;
        const radius = 12 + u * 45;

        const flashGrad = ctx.createRadialGradient(land.x, beamY, 0, land.x, beamY, radius);
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        flashGrad.addColorStop(0.35, `rgba(120, 225, 255, ${flashAlpha * 0.6})`);
        flashGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');

        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.ellipse(land.x, beamY, radius * 1.8, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 4. Letters (Writing and Soft White Fill)
    if (t >= WRITE_START) {
      // 4a. Draw letter outlines (glowing lines)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < glyphTimings.length; i++) {
        const gt = glyphTimings[i];
        if (t < gt.tTraceStart) continue;

        let traceProgress = 1.0;
        if (t < gt.tTraceEnd) {
          traceProgress = (t - gt.tTraceStart) / gt.traceDur;
        }

        // Outlines stay visible, then gently soften as white fill takes over
        let outlineAlpha = 1.0;
        if (t > gt.tTraceEnd + 0.45) {
          outlineAlpha = 0.35; // subtle accent
        }

        const wideColor = `rgba(120, 225, 255, ${0.16 * outlineAlpha})`;
        const coreColor = `rgba(220, 245, 255, ${0.95 * outlineAlpha})`;

        const targetLen = traceProgress * gt.glyph.totalLength;
        let acc = 0;

        for (let pIdx = 0; pIdx < gt.glyph.polys.length; pIdx++) {
          const pObj = gt.glyph.polys[pIdx];
          let pFrac = 0;
          if (acc + pObj.total <= targetLen) {
            pFrac = 1.0;
          } else if (acc < targetLen) {
            pFrac = (targetLen - acc) / pObj.total;
          }

          if (pFrac > 0) {
            // Wide stroke (glow)
            ctx.strokeStyle = wideColor;
            ctx.lineWidth = minLw * 3.8;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            strokePartialPolyline(ctx, pObj.poly, pObj.segLengths, pObj.total, pFrac);

            // Core stroke
            ctx.strokeStyle = coreColor;
            ctx.lineWidth = minLw;
            strokePartialPolyline(ctx, pObj.poly, pObj.segLengths, pObj.total, pFrac);
          }
          acc += pObj.total;
        }
      }
      ctx.restore();

      // 4b. Draw soft white fill (#e8f7ff over 0.45s)
      for (let i = 0; i < glyphTimings.length; i++) {
        const gt = glyphTimings[i];
        if (t > gt.tTraceEnd) {
          const fillProgress = clamp((t - gt.tTraceEnd) / 0.45, 0, 1);
          if (fillProgress > 0) {
            const alpha = fillProgress;
            ctx.save();
            ctx.globalAlpha = alpha;
            fillGlyphPolylines(ctx, gt.glyph.polys, '#e8f7ff');
            ctx.restore();
          }
        }
      }
    }

    // 5. Logo Shapes Outlines (4.96s onwards)
    if (t >= 4.96) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Outline fadeout: starts at LOGO_FADE_START, fades out over LOGO_FADE_DUR
      let outlineFade = 1.0;
      if (t >= LOGO_FADE_START) {
        outlineFade = 1.0 - clamp((t - LOGO_FADE_START) / LOGO_FADE_DUR, 0, 1);
      }

      if (outlineFade > 0.001) {
        for (let i = 0; i < contourTimings.length; i++) {
          const ct = contourTimings[i];
          if (t < ct.tTraceStart) continue;

          let frac = 1.0;
          if (t < ct.tTraceEnd) {
            frac = (t - ct.tTraceStart) / ct.traceDur;
          }

          const wideColor = `rgba(0, 220, 255, ${0.18 * outlineFade})`;
          const coreColor = `rgba(180, 245, 255, ${0.95 * outlineFade})`;

          // Wide stroke
          ctx.strokeStyle = wideColor;
          ctx.lineWidth = minLw * 4.0;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          strokePartialPolyline(ctx, ct.contour.points, ct.contour.segLengths, ct.contour.totalLength, frac);

          // Core stroke
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = minLw;
          strokePartialPolyline(ctx, ct.contour.points, ct.contour.segLengths, ct.contour.totalLength, frac);
        }
      }
      ctx.restore();
    }

    // 6. Real Logo Image Fade-In (in 2 parts: Top above y=320, Strip below y=320)
    // Top part: letters and tagline fades in starting 0.35s before tracing ends over 0.9s
    if (img && t >= LOGO_FADE_START) {
      const topAlpha = clamp((t - LOGO_FADE_START) / LOGO_FADE_DUR, 0, 1);
      if (topAlpha > 0.001) {
        ctx.save();
        ctx.globalAlpha = topAlpha;
        // sx=0, sy=0, sw=960, sh=320 -> dx=0, dy=214, dw=960, dh=320
        ctx.drawImage(img, 0, 0, 960, scene.splitY, 0, scene.logoY, 960, scene.splitY);
        ctx.restore();
      }
    }

    // Bottom strip (underline and ring): fades in starting 0.3s after run begins over 0.8s
    if (img && t >= UNDER_FADE_START) {
      const stripAlpha = clamp((t - UNDER_FADE_START) / UNDER_FADE_DUR, 0, 1);
      if (stripAlpha > 0.001) {
        ctx.save();
        ctx.globalAlpha = stripAlpha;
        const stripHeight = scene.logoH - scene.splitY; // 359 - 320 = 39
        // sx=0, sy=320, sw=960, sh=39 -> dx=0, dy=214+320=534, dw=960, dh=39
        ctx.drawImage(
          img,
          0,
          scene.splitY,
          960,
          stripHeight,
          0,
          scene.logoY + scene.splitY,
          960,
          stripHeight
        );
        ctx.restore();
      }
    }

    // 7. Ring Flash at End of Run (t = RUN_END)
    if (t >= RUN_END && t <= RUN_END + 0.45) {
      const u = (t - RUN_END) / 0.45;
      const flashAlpha = Math.pow(1 - u, 2);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const ringGrad = ctx.createRadialGradient(
        ringCenter.cx,
        ringCenter.cy,
        ringCenter.r * 0.4,
        ringCenter.cx,
        ringCenter.cy,
        ringCenter.r * 3.5
      );
      ringGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
      ringGrad.addColorStop(0.4, `rgba(100, 220, 255, ${flashAlpha * 0.8})`);
      ringGrad.addColorStop(1, 'rgba(0, 120, 255, 0)');

      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(ringCenter.cx, ringCenter.cy, ringCenter.r * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. Ball of Light & Comet Tail (15 samples spaced 0.024s apart)
    const curLight = getLightPos(t);
    if (curLight.active && curLight.alpha > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Draw comet tail from oldest (14) to newest (1)
      for (let s = 14; s >= 1; s--) {
        const ts = t - s * 0.024;
        const tailPt = getLightPos(ts);
        if (tailPt.active) {
          const decay = Math.pow(1 - s / 15, 1.2);
          const r = tailPt.radius * decay * 0.8;
          const a = decay * 0.45;

          const tailGrad = ctx.createRadialGradient(tailPt.x, tailPt.y, 0, tailPt.x, tailPt.y, r * 2.2);
          tailGrad.addColorStop(0, `rgba(220, 250, 255, ${a})`);
          tailGrad.addColorStop(0.45, `rgba(80, 205, 255, ${a * 0.6})`);
          tailGrad.addColorStop(1, 'rgba(10, 110, 220, 0)');

          ctx.fillStyle = tailGrad;
          ctx.beginPath();
          ctx.arc(tailPt.x, tailPt.y, r * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw current main orb (white core fading to rgba(90,210,255,0))
      const orbRadius = curLight.radius;
      const orbGrad = ctx.createRadialGradient(curLight.x, curLight.y, 0, curLight.x, curLight.y, orbRadius * 3.2);
      orbGrad.addColorStop(0, `rgba(255, 255, 255, ${curLight.alpha})`);
      orbGrad.addColorStop(0.25, `rgba(200, 245, 255, ${curLight.alpha * 0.95})`);
      orbGrad.addColorStop(0.65, `rgba(90, 210, 255, ${curLight.alpha * 0.5})`);
      orbGrad.addColorStop(1, 'rgba(90, 210, 255, 0)');

      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(curLight.x, curLight.y, orbRadius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white center core
      ctx.fillStyle = `rgba(255, 255, 255, ${curLight.alpha})`;
      ctx.beginPath();
      ctx.arc(curLight.x, curLight.y, orbRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 9. Drifting Sparkles (twinkling after run ends)
    if (t >= RUN_END) {
      const sparkleFade = clamp((t - RUN_END) / 0.6, 0, 1);
      if (sparkleFade > 0.001) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const count = Math.min(sparkleLimit, SPARKLES.length);
        for (let i = 0; i < count; i++) {
          const sp = SPARKLES[i];
          const timeOffset = t - RUN_END;
          const driftX = sp.sx + Math.sin(timeOffset * sp.speed + sp.phase) * 14;
          const driftY = sp.sy - timeOffset * 4 + Math.cos(timeOffset * 0.7 + sp.phase) * 8;
          const tw = Math.sin(timeOffset * 3.5 * sp.speed + sp.phase);
          const sparkleAlpha = clamp((tw + 1) / 2, 0, 1) * sparkleFade * 0.85;

          if (sparkleAlpha > 0.02) {
            const rad = sp.r * (0.8 + 0.4 * sparkleAlpha);
            const color = sp.isCyan ? 'rgba(120, 235, 255,' : 'rgba(255, 255, 255,';

            const spGrad = ctx.createRadialGradient(driftX, driftY, 0, driftX, driftY, rad * 3);
            spGrad.addColorStop(0, `${color} ${sparkleAlpha})`);
            spGrad.addColorStop(0.4, `${color} ${sparkleAlpha * 0.5})`);
            spGrad.addColorStop(1, 'rgba(0, 140, 255, 0)');

            ctx.fillStyle = spGrad;
            ctx.beginPath();
            ctx.arc(driftX, driftY, rad * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // Button visibility helper
    const buttonOpacity = t >= BTN_FADE_START ? clamp((t - BTN_FADE_START) / 0.5, 0, 1) : 0;

    return {
      t,
      isEnded: t >= TOTAL_END,
      buttonOpacity,
      canSkip: t < BTN_FADE_START,
    };
  }

  return {
    draw,
    end: TOTAL_END,
    btnFadeStart: BTN_FADE_START,
    w: W,
    h: H,
  };
}

export default createIntro;
