/**
 * Antigravity MAG v2.0 — WebGL Shader Post-FX, 12-Node Verlet Rope & Handcrafted "It Takes Two" Texture Factory
 */
(function(root) {
  'use strict';

  const BLOOM_FRAGMENT_SHADER = `
    precision mediump float;
    uniform sampler2D uMainSampler;
    varying vec2 outTexCoord;
    void main(void) {
      vec4 color = texture2D(uMainSampler, outTexCoord);
      vec4 sum = vec4(0.0);
      for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
          vec2 offset = vec2(float(x), float(y)) * 0.0022;
          sum += texture2D(uMainSampler, outTexCoord + offset);
        }
      }
      gl_FragColor = color + (sum / 25.0) * 0.35;
    }
  `;

  class AGYVFXPipeline {
    constructor() {
      this.verletNodes = [];
      this.nodeCount = 12;
      this.fragmentShader = BLOOM_FRAGMENT_SHADER;
    }

    initVerletRope(x1, y1, x2, y2, count = 12) {
      this.nodeCount = count;
      this.verletNodes = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const nx = x1 + (x2 - x1) * t;
        const ny = y1 + (y2 - y1) * t;
        this.verletNodes.push({ x: nx, y: ny, oldX: nx, oldY: ny });
      }
    }

    /**
     * Steps 12-node Verlet integration with iterative constraint relaxation.
     */
    stepVerletRope(p1, p2, naturalLength = 155, iterations = 6) {
      if (this.verletNodes.length !== this.nodeCount) {
        this.initVerletRope(p1.x, p1.y, p2.x, p2.y, this.nodeCount);
      }

      const segLen = naturalLength / (this.nodeCount - 1);
      const gravity = 0.45;
      const damping = 0.92;

      for (let i = 1; i < this.nodeCount - 1; i++) {
        const n = this.verletNodes[i];
        const vx = (n.x - n.oldX) * damping;
        const vy = (n.y - n.oldY) * damping;
        n.oldX = n.x;
        n.oldY = n.y;
        n.x += vx;
        n.y += vy + gravity;
      }

      // Pin endpoints to P1 and P2
      this.verletNodes[0].x = p1.x;
      this.verletNodes[0].y = p1.y;
      this.verletNodes[this.nodeCount - 1].x = p2.x;
      this.verletNodes[this.nodeCount - 1].y = p2.y;

      // Iterative distance constraint relaxation
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < this.nodeCount - 1; i++) {
          const n1 = this.verletNodes[i];
          const n2 = this.verletNodes[i + 1];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = (dist - segLen) / dist;

          if (i !== 0) {
            n1.x += dx * diff * 0.5;
            n1.y += dy * diff * 0.5;
          }
          if (i + 1 !== this.nodeCount - 1) {
            n2.x -= dx * diff * 0.5;
            n2.y -= dy * diff * 0.5;
          }
        }
      }

      return this.verletNodes;
    }

    /**
     * Renders the 12-node Verlet rope as a braided workshop cord + golden Book of Love sparks.
     */
    renderVerletTether(graphics, p1, p2, maxLen = 350, naturalLen = 155) {
      if (!graphics || !p1 || !p2) return;
      this.stepVerletRope(p1, p2, naturalLen, 6);

      graphics.clear();
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const ratio = Math.min(dist / maxLen, 1.0);

      let glowColor = 0xFBBF24;
      let coreColor = 0xD97706;
      let width = 3.5;
      if (ratio > 0.85) {
        glowColor = 0xFF1744;
        coreColor = 0xFCA5A5;
        width = 4.8;
      } else if (ratio > 0.62) {
        glowColor = 0xF59E0B;
        coreColor = 0xFDE68A;
        width = 4.0;
      }

      // Outer warm magical glow pass
      graphics.lineStyle(width + 5, glowColor, 0.28);
      graphics.beginPath();
      graphics.moveTo(this.verletNodes[0].x, this.verletNodes[0].y);
      for (let i = 1; i < this.verletNodes.length; i++) {
        graphics.lineTo(this.verletNodes[i].x, this.verletNodes[i].y);
      }
      graphics.strokePath();

      // Braided workshop cord core
      graphics.lineStyle(width, coreColor, 0.96);
      graphics.beginPath();
      graphics.moveTo(this.verletNodes[0].x, this.verletNodes[0].y);
      for (let i = 1; i < this.verletNodes.length; i++) {
        graphics.lineTo(this.verletNodes[i].x, this.verletNodes[i].y);
      }
      graphics.strokePath();

      // Golden stitch / knot beads along the cord
      for (let i = 0; i < this.verletNodes.length; i += 2) {
        graphics.fillStyle(i % 4 === 0 ? 0xFEF08A : 0xB45309, 0.95);
        graphics.fillCircle(this.verletNodes[i].x, this.verletNodes[i].y, 2.8);
      }
    }

    /**
     * Generates High-DPI handcrafted character & prop textures modeled directly on "It Takes Two":
     * - player_p1: May (Wooden/Plastic Doll with Blue Knitted Hair, Pink Scarf, Blue Coat, Yellow Boots & Claw Hammer)
     * - player_p2: Cody (Clay/Garden Doll with Green Leafy Sprout Hair, Green Sweater, Brown Overalls & Giant Iron Nail)
     * - dr_hakim: Dr. Hakim (The Book of Love with Crimson/Gold Cover, Mustache & Fluttering Pages)
     * - boss_core: Possessed Vacuum Cleaner Boss ("Tower of Suction" Canister, Red Eyes & Hose Arms)
     * - platform_tile: Handcrafted Timber Workbench Plank with Wood Grain & Brass Screws
     * - moving_lift: Motorized Yellow/Black Hazard-Striped Workshop Clamp Lift
     * - switch_plate_off / switch_plate_on: Brass & Red/Green Workshop Pound Switches
     * - energy_gate: Electrified Workshop Fuse & Copper Coil Barrier
     */
    generateProceduralTextures(scene, palette = {}) {
      if (!scene || !scene.textures) return;

      const makeTex = (key, w, h, fn) => {
        if (scene.textures.exists(key)) scene.textures.remove(key);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        fn(canvas.getContext('2d'), w, h);
        scene.textures.addCanvas(key, canvas);
      };

      // 1. player_p1 — MAY (Handcrafted Doll + Claw Hammer)
      makeTex('player_p1', 64, 72, (ctx) => {
        // Subtle warm golden rim aura
        const aura = ctx.createRadialGradient(32, 38, 6, 32, 38, 30);
        aura.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(32, 38, 30, 0, Math.PI * 2); ctx.fill();

        // Claw Hammer strapped/held on right side
        ctx.save();
        ctx.translate(48, 36);
        ctx.rotate(0.28);
        // Hammer wooden/rubberized handle
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(-3, -18, 6, 32);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-3, 2, 6, 12);
        // Steel Claw Hammer Head
        ctx.fillStyle = '#CBD5E1';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-14, -25, 26, 9, 3);
        ctx.fill();
        ctx.stroke();
        // Hammer striking face & curved claw
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(8, -26, 5, 11);
        ctx.restore();

        // Legs & Dark Blue Jeans
        ctx.fillStyle = '#1E3A8A';
        ctx.fillRect(22, 48, 7, 13);
        ctx.fillRect(33, 48, 7, 13);
        // Doll wooden knee joints
        ctx.fillStyle = '#D97706';
        ctx.beginPath(); ctx.arc(25.5, 53, 2.5, 0, Math.PI * 2); ctx.arc(36.5, 53, 2.5, 0, Math.PI * 2); ctx.fill();

        // Iconic Yellow Work/Rain Boots
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(19, 59, 11, 8, 3);
        ctx.roundRect(32, 59, 11, 8, 3);
        ctx.fill();
        ctx.stroke();

        // Torso — May's Blue Coat over Yellow Shirt
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(24, 31, 14, 18);
        ctx.fillStyle = '#2563EB';
        ctx.beginPath();
        ctx.roundRect(20, 31, 22, 19, 4);
        ctx.fill();
        ctx.strokeStyle = '#1D4ED8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Coat center seam & wooden buttons
        ctx.fillStyle = '#FDE68A';
        ctx.beginPath(); ctx.arc(31, 37, 1.6, 0, Math.PI * 2); ctx.arc(31, 43, 1.6, 0, Math.PI * 2); ctx.fill();

        // Articulated Doll Arms
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(14, 33, 6, 13);
        ctx.fillRect(42, 33, 6, 13);
        // Carved Wooden Hands
        ctx.fillStyle = '#FCD34D';
        ctx.beginPath(); ctx.arc(17, 47, 3.2, 0, Math.PI * 2); ctx.arc(45, 47, 3.2, 0, Math.PI * 2); ctx.fill();

        // Iconic Pink/Magenta Knitted Scarf + Tail
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.roundRect(19, 27, 24, 7, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(15, 30, 7, 11, 2);
        ctx.fill();
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 28, 22, 5);

        // Sculpted Wooden/Plastic Doll Head
        const headGrad = ctx.createRadialGradient(29, 17, 2, 31, 19, 13);
        headGrad.addColorStop(0, '#FEF3C7');
        headGrad.addColorStop(0.7, '#FCD34D');
        headGrad.addColorStop(1, '#D97706');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(31, 19, 11.5, 0, Math.PI * 2);
        ctx.fill();

        // Rosy Doll Cheeks
        ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
        ctx.beginPath(); ctx.arc(24, 21, 2.5, 0, Math.PI * 2); ctx.arc(38, 21, 2.5, 0, Math.PI * 2); ctx.fill();

        // Expressive Doll Eyes & Glasses Rim
        ctx.fillStyle = '#0F172A';
        ctx.beginPath(); ctx.arc(27, 18, 2.3, 0, Math.PI * 2); ctx.arc(35, 18, 2.3, 0, Math.PI * 2); ctx.fill();
        // Eye catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(27.7, 17.2, 0.9, 0, Math.PI * 2); ctx.arc(35.7, 17.2, 0.9, 0, Math.PI * 2); ctx.fill();
        // Confident smile
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(31, 20.5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

        // Iconic Vibrant Blue Knitted Yarn Hair + Side Buns
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.arc(18, 16, 6.5, 0, Math.PI * 2); // Left yarn bun
        ctx.arc(44, 16, 6.5, 0, Math.PI * 2); // Right yarn bun
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(31, 14, 12, Math.PI * 0.95, Math.PI * 2.05);
        ctx.fill();
        // Swept blue yarn bangs
        ctx.beginPath();
        ctx.ellipse(26, 12, 7, 4, -0.3, 0, Math.PI * 2);
        ctx.ellipse(36, 12, 7, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Yarn texture highlights
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(31, 11, 9, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });

      // 2. player_p2 — CODY (Handcrafted Clay/Garden Doll + Giant Iron Nail)
      makeTex('player_p2', 64, 72, (ctx) => {
        // Subtle leafy green aura
        const aura = ctx.createRadialGradient(32, 38, 6, 32, 38, 30);
        aura.addColorStop(0, 'rgba(74, 222, 128, 0.25)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(32, 38, 30, 0, Math.PI * 2); ctx.fill();

        // Giant Iron Nail strapped/held on Cody's side
        ctx.save();
        ctx.translate(49, 36);
        ctx.rotate(-0.25);
        // Nail flat head
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(-7, -22, 14, 4);
        // Nail steel shaft & sharp point
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.moveTo(-3.5, -18);
        ctx.lineTo(3.5, -18);
        ctx.lineTo(3.5, 6);
        ctx.lineTo(0, 15);
        ctx.lineTo(-3.5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Brass nail holder band
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-4.5, -6, 9, 5);
        ctx.restore();

        // Legs & Brown Gardening Overalls Pants
        ctx.fillStyle = '#78350F';
        ctx.fillRect(22, 48, 7, 13);
        ctx.fillRect(33, 48, 7, 13);

        // Sturdy Tan/Brown Garden Boots
        ctx.fillStyle = '#451A03';
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(19, 59, 11, 8, 3);
        ctx.roundRect(32, 59, 11, 8, 3);
        ctx.fill();
        ctx.stroke();

        // Torso — Lime Green Sweater + Brown Denim Overalls
        ctx.fillStyle = '#65A30D';
        ctx.beginPath();
        ctx.roundRect(19, 30, 24, 19, 4);
        ctx.fill();
        // Overalls bib & straps
        ctx.fillStyle = '#92400E';
        ctx.beginPath();
        ctx.roundRect(22, 34, 18, 16, 3);
        ctx.fill();
        ctx.fillRect(23, 29, 4, 7);
        ctx.fillRect(35, 29, 4, 7);
        // Brass overall buttons & pocket
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath(); ctx.arc(25, 34, 1.7, 0, Math.PI * 2); ctx.arc(37, 34, 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 1;
        ctx.strokeRect(26, 39, 10, 7);

        // Clay Doll Arms in Green Sweater Sleeves
        ctx.fillStyle = '#84CC16';
        ctx.fillRect(14, 32, 6, 13);
        ctx.fillRect(42, 32, 6, 13);
        // Terracotta Clay Hands
        ctx.fillStyle = '#FDBA74';
        ctx.beginPath(); ctx.arc(17, 46, 3.2, 0, Math.PI * 2); ctx.arc(45, 46, 3.2, 0, Math.PI * 2); ctx.fill();

        // Sculpted Terracotta Clay Head
        const clayGrad = ctx.createRadialGradient(29, 17, 2, 31, 19, 13);
        clayGrad.addColorStop(0, '#FED7AA');
        clayGrad.addColorStop(0.65, '#FB923C');
        clayGrad.addColorStop(1, '#C2410C');
        ctx.fillStyle = clayGrad;
        ctx.beginPath();
        ctx.ellipse(31, 19, 11.5, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sculpted clay nose & friendly grin
        ctx.fillStyle = '#EA580C';
        ctx.beginPath(); ctx.arc(31, 19.5, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.beginPath(); ctx.arc(26.5, 17.5, 2.2, 0, Math.PI * 2); ctx.arc(35.5, 17.5, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(27.2, 16.8, 0.9, 0, Math.PI * 2); ctx.arc(36.2, 16.8, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(31, 21.5, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();

        // Iconic Bright Green Leafy Plant Hair + Top Sprout
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.ellipse(24, 10, 9, 4.5, -0.35, 0, Math.PI * 2);
        ctx.ellipse(38, 10, 9, 4.5, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4ADE80';
        ctx.beginPath();
        ctx.ellipse(27, 8.5, 7, 3.5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(35, 8.5, 7, 3.5, 0.2, 0, Math.PI * 2);
        ctx.ellipse(31, 4.5, 4, 5, 0, 0, Math.PI * 2); // Top sprout leaf
        ctx.fill();
        // Leaf center veins
        ctx.strokeStyle = '#BBF7D0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(31, 8); ctx.lineTo(22, 11);
        ctx.moveTo(31, 8); ctx.lineTo(40, 11);
        ctx.stroke();
      });

      // 3. dr_hakim — DR. HAKIM (The Book of Love)
      makeTex('dr_hakim', 64, 64, (ctx) => {
        // Golden love aura
        const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
        g.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
        g.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();

        // Crimson & Gold Hardcover Book Body
        ctx.fillStyle = '#991B1B';
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(12, 12, 40, 42, 5);
        ctx.fill();
        ctx.stroke();

        // Ivory Book Pages at top edge
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(15, 9, 34, 5);

        // Gold Heart Emblem on Cover
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(29, 42, 4, 0, Math.PI * 2);
        ctx.arc(35, 42, 4, 0, Math.PI * 2);
        ctx.moveTo(25, 43);
        ctx.lineTo(32, 50);
        ctx.lineTo(39, 43);
        ctx.fill();

        // Expressive Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(25, 24, 5, 0, Math.PI * 2); ctx.arc(39, 24, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1E293B';
        ctx.beginPath(); ctx.arc(25, 24, 2.4, 0, Math.PI * 2); ctx.arc(39, 24, 2.4, 0, Math.PI * 2); ctx.fill();

        // Iconic Curled Black Handlebar Mustache
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(32, 32);
        ctx.quadraticCurveTo(22, 30, 16, 35);
        ctx.moveTo(32, 32);
        ctx.quadraticCurveTo(42, 30, 48, 35);
        ctx.stroke();
      });

      // 4. boss_core — POSSESSED VACUUM CLEANER BOSS ("Tower of Suction")
      makeTex('boss_core', 120, 120, (ctx) => {
        // Swirling suction dust aura
        const g = ctx.createRadialGradient(60, 60, 12, 60, 60, 58);
        g.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
        g.addColorStop(0.6, 'rgba(185, 28, 28, 0.25)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(60, 60, 58, 0, Math.PI * 2); ctx.fill();

        // Corrugated Vacuum Hose Arms (Left & Right)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(28, 62);
        ctx.quadraticCurveTo(6, 42, 14, 22);
        ctx.moveTo(92, 62);
        ctx.quadraticCurveTo(114, 42, 106, 22);
        ctx.stroke();

        // Vacuum Cleaner Steel Dome & Red Canister Body
        ctx.fillStyle = '#991B1B';
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(30, 26, 60, 72, 18);
        ctx.fill();
        ctx.stroke();

        // Chrome Trim Band
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(28, 52, 64, 8);

        // Angry Glowing Vacuum Eyes
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(46, 40, 8, 0, Math.PI * 2);
        ctx.arc(74, 40, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(46, 40, 4, 0, Math.PI * 2);
        ctx.arc(74, 40, 4, 0, Math.PI * 2);
        ctx.fill();
        // Furrowed metallic brow
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(35, 31); ctx.lineTo(54, 37);
        ctx.moveTo(85, 31); ctx.lineTo(66, 37);
        ctx.stroke();

        // Jagged Suction Nozzle Mouth
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(40, 66, 40, 18);
        ctx.fillStyle = '#E2E8F0';
        for (let tx = 42; tx < 78; tx += 8) {
          ctx.beginPath();
          ctx.moveTo(tx, 66); ctx.lineTo(tx + 4, 73); ctx.lineTo(tx + 8, 66);
          ctx.fill();
        }
      });

      // 5. platform_tile — HANDCRAFTED TIMBER WORKBENCH PLANK
      makeTex('platform_tile', 64, 28, (ctx) => {
        // Warm timber base
        const woodGrad = ctx.createLinearGradient(0, 0, 0, 28);
        woodGrad.addColorStop(0, '#9A5B25');
        woodGrad.addColorStop(0.5, '#78350F');
        woodGrad.addColorStop(1, '#451A03');
        ctx.fillStyle = woodGrad;
        ctx.fillRect(0, 0, 64, 28);

        // Top varnished wood highlight
        ctx.fillStyle = '#D97706';
        ctx.fillRect(0, 0, 64, 4);

        // Wood grain lines
        ctx.strokeStyle = 'rgba(254, 243, 199, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(4, 10); ctx.lineTo(58, 10);
        ctx.moveTo(10, 18); ctx.lineTo(52, 18);
        ctx.stroke();

        // Brass corner wood screws
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(6, 7, 2.2, 0, Math.PI * 2);
        ctx.arc(58, 7, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0.75, 0.75, 62.5, 26.5);
      });

      // 6. moving_lift — YELLOW/BLACK HAZARD WORKSHOP LIFT
      makeTex('moving_lift', 112, 22, (ctx) => {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 0, 112, 22);
        // Diagonal yellow hazard stripes
        ctx.fillStyle = '#FACC15';
        for (let x = -10; x < 112; x += 18) {
          ctx.beginPath();
          ctx.moveTo(x, 22);
          ctx.lineTo(x + 9, 22);
          ctx.lineTo(x + 16, 0);
          ctx.lineTo(x + 7, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(1.5, 1.5, 109, 19);
      });

      // 7. switch_plate_off — BRASS & RED WORKSHOP CLAMP BUTTON (UNPRESSED)
      makeTex('switch_plate_off', 52, 16, (ctx) => {
        ctx.fillStyle = '#B45309';
        ctx.fillRect(2, 9, 48, 7);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(7, 2, 38, 8, 3);
        ctx.fill();
        ctx.strokeStyle = '#FCA5A5';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 8. switch_plate_on — BRASS & GREEN WORKSHOP CLAMP BUTTON (PRESSED)
      makeTex('switch_plate_on', 52, 16, (ctx) => {
        ctx.fillStyle = '#B45309';
        ctx.fillRect(2, 9, 48, 7);
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.roundRect(7, 6, 38, 5, 2);
        ctx.fill();
      });

      // 9. energy_gate — HIGH-VOLTAGE WORKSHOP FUSE & SPARK BARRIER
      makeTex('energy_gate', 28, 140, (ctx) => {
        // Top & Bottom Copper Coil Terminals
        ctx.fillStyle = '#D97706';
        ctx.fillRect(2, 0, 24, 16);
        ctx.fillRect(2, 124, 24, 16);
        // Crackling electric field
        ctx.fillStyle = 'rgba(239, 68, 68, 0.32)';
        ctx.fillRect(4, 16, 20, 108);
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(14, 16);
        ctx.lineTo(7, 42);
        ctx.lineTo(21, 70);
        ctx.lineTo(8, 98);
        ctx.lineTo(14, 124);
        ctx.stroke();
      });

      // 10. particle_spark — GOLDEN SAWDUST / WORKSHOP SPARK
      makeTex('particle_spark', 12, 12, (ctx) => {
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath(); ctx.arc(6, 6, 5, 0, Math.PI * 2); ctx.fill();
      });

      // 11. heart_emote — BOOK OF LOVE GOLDEN/CRIMSON HEART
      makeTex('heart_emote', 32, 32, (ctx) => {
        ctx.fillStyle = '#EC4899';
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(11, 12, 6, 0, Math.PI * 2);
        ctx.arc(21, 12, 6, 0, Math.PI * 2);
        ctx.moveTo(5, 14);
        ctx.lineTo(16, 27);
        ctx.lineTo(27, 14);
        ctx.fill();
        ctx.stroke();
      });

      // 12. nail_projectile — CODY'S DRIVEN IRON NAIL
      makeTex('nail_projectile', 34, 12, (ctx) => {
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(0, 1, 5, 10);
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.moveTo(5, 3);
        ctx.lineTo(25, 3);
        ctx.lineTo(33, 6);
        ctx.lineTo(25, 9);
        ctx.lineTo(5, 9);
        ctx.closePath();
        ctx.fill();
      });

      // 13. nail_anchor_post — WOODEN CHASM SWING HOOK WITH DRIVEN NAIL
      makeTex('nail_anchor_post', 48, 48, (ctx) => {
        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Driven Iron Nail center
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(24, 24, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    /**
     * Applies WebGL Post-FX Vignette & Warm Workshop Storybook Frame overlay.
     */
    applyPostFXPipeline(scene) {
      if (!scene || !scene.add) return;
      const { width, height } = scene.scale;
      const fxOverlay = scene.add.graphics();
      fxOverlay.setScrollFactor(0).setDepth(950);
      fxOverlay.lineStyle(3, 0xF59E0B, 0.22);
      fxOverlay.strokeRect(2, 2, width - 4, height - 4);
      return fxOverlay;
    }

    /**
     * Creates a rich 3-layer "It Takes Two" Miniature Workshop Shed & Cuckoo Clockwork Parallax Background.
     */
    createParallaxBackground(scene, worldWidth = 2600, worldHeight = 720, palette = {}) {
      if (!scene || !scene.add) return;

      // Layer 1: Warm Workshop Shed Timber Wall & Volumetric Work-Lamp Light Shafts
      const bgGfx = scene.add.graphics().setDepth(-30).setScrollFactor(0.18);
      for (let x = 0; x < worldWidth; x += 380) {
        // Warm overhead tungsten light cone
        bgGfx.fillStyle(0xFBBF24, 0.06);
        bgGfx.fillTriangle(x + 190, 0, x + 20, worldHeight, x + 360, worldHeight);
        // Lamp shade silhouette at top
        bgGfx.fillStyle(0x451A03, 0.85);
        bgGfx.fillRect(x + 165, 0, 50, 18);
        bgGfx.fillStyle(0xFEF08A, 0.75);
        bgGfx.fillCircle(x + 190, 20, 10);
      }

      // Floating golden sawdust motes in the sunbeams
      bgGfx.fillStyle(0xFDE68A, 0.32);
      for (let i = 0; i < 80; i++) {
        const sx = (i * 89) % worldWidth;
        const sy = (i * 47) % worldHeight;
        bgGfx.fillCircle(sx, sy, (i % 3) + 1.2);
      }

      // Layer 2: Workshop Pegboard, Hanging Giant Tools & Cuckoo Clockwork Gears
      const midGfx = scene.add.graphics().setDepth(-18).setScrollFactor(0.42);
      midGfx.lineStyle(2, 0x451A03, 0.55);
      for (let x = 0; x < worldWidth; x += 160) {
        // Vertical timber wall studs
        midGfx.beginPath();
        midGfx.moveTo(x, 0);
        midGfx.lineTo(x, worldHeight);
        midGfx.strokePath();

        // Giant Clockwork Gears & Pegboard Silhouettes
        if (x % 320 === 0) {
          midGfx.lineStyle(4, 0x92400E, 0.35);
          midGfx.strokeCircle(x + 80, 210, 58);
          midGfx.strokeCircle(x + 80, 210, 24);
          // Giant background Books & Paint Cans on shelf
          midGfx.fillStyle(0x7C2D12, 0.4);
          midGfx.fillRect(x + 20, 310, 120, 12);
          midGfx.fillStyle(0x991B1B, 0.38);
          midGfx.fillRect(x + 32, 245, 24, 65);
          midGfx.fillStyle(0x1E40AF, 0.38);
          midGfx.fillRect(x + 60, 255, 22, 55);
          midGfx.fillStyle(0x166534, 0.38);
          midGfx.fillRect(x + 86, 238, 26, 72);
        }
      }
    }

    applySquashStretch(scene, sprite, scaleX = 1.28, scaleY = 0.74, duration = 120) {
      if (!scene || !sprite || !scene.tweens) return;
      scene.tweens.killTweensOf(sprite);
      scene.tweens.add({
        targets: sprite,
        scaleX,
        scaleY,
        duration: duration * 0.5,
        yoyo: true,
        onComplete: () => sprite.setScale(1, 1)
      });
    }

    triggerCameraTrauma(scene, intensity = 0.014, duration = 160) {
      if (scene && scene.cameras && scene.cameras.main) {
        scene.cameras.main.shake(duration, intensity);
      }
    }

    spawnParticleBurst(scene, x, y, color = 0xFBBF24, count = 12) {
      if (!scene || !scene.add) return;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count;
        const spd = 35 + Math.random() * 85;
        const p = scene.add.circle(x, y, 3.5, color, 0.92);
        scene.tweens.add({
          targets: p,
          x: x + Math.cos(a) * spd,
          y: y + Math.sin(a) * spd,
          alpha: 0,
          scale: 0.2,
          duration: 360,
          onComplete: () => p.destroy()
        });
      }
    }

    spawnFloatingEmote(scene, x, y) {
      if (!scene || !scene.add) return;
      const em = scene.add.image(x, y - 32, 'heart_emote').setScale(0.6);
      scene.tweens.add({
        targets: em,
        y: y - 95,
        alpha: 0,
        scale: 1.2,
        duration: 850,
        onComplete: () => em.destroy()
      });
    }
  }

  const instance = new AGYVFXPipeline();
  if (typeof window !== 'undefined') {
    window.AGYVFX = instance;
    window.MAGVFX = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
