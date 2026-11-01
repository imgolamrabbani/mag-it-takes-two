/**
 * Antigravity MAG v2.0 — 4-Pointer Multi-Touch HUD, 5-Button Action Cluster & P2P Invite Modal
 */
(function(root) {
  'use strict';

  class AGYMobilePwaHud {
    constructor() {
      this.scene = null;
      this.inputState = {
        moveX: 0,
        moveY: 0,
        jump: false,
        ability: false,
        tether: false,
        boop: false,
        aiCommandToggle: false
      };
      this.joystick = {
        active: false,
        pointerId: null,
        baseX: 125,
        baseY: 560,
        radius: 62,
        deadzone: 10,
        baseGfx: null,
        knobGfx: null
      };
      this.actionButtons = {};
    }

    init(scene, options = {}) {
      this.scene = scene;
      this.options = options;

      if (scene.input) {
        scene.input.addPointer(4);
      }

      this.buildJoystick();
      this.buildFiveButtonCluster();
      this.buildTopBar();
      this.bindJoystickTouch();
      return this;
    }

    buildJoystick() {
      const { height } = this.scene.scale;
      this.joystick.baseX = 125;
      this.joystick.baseY = height - 125;

      this.joystick.baseGfx = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
      this.joystick.baseGfx.lineStyle(2.5, 0x38BDF8, 0.45);
      this.joystick.baseGfx.strokeCircle(this.joystick.baseX, this.joystick.baseY, this.joystick.radius);
      this.joystick.baseGfx.fillStyle(0x38BDF8, 0.08);
      this.joystick.baseGfx.fillCircle(this.joystick.baseX, this.joystick.baseY, this.joystick.radius);

      this.joystick.knobGfx = this.scene.add.graphics().setScrollFactor(0).setDepth(1001);
      this.drawKnob(this.joystick.baseX, this.joystick.baseY);
    }

    drawKnob(x, y) {
      if (!this.joystick.knobGfx) return;
      this.joystick.knobGfx.clear();
      this.joystick.knobGfx.fillStyle(0x38BDF8, 0.75);
      this.joystick.knobGfx.fillCircle(x, y, 25);
      this.joystick.knobGfx.lineStyle(2, 0xFFFFFF, 0.9);
      this.joystick.knobGfx.strokeCircle(x, y, 25);
    }

    buildFiveButtonCluster() {
      const { width, height } = this.scene.scale;
      const cx = width - 145;
      const cy = height - 125;
      const spread = 54;

      const specs = [
        { key: 'btnJump', field: 'jump', label: 'JUMP', col: 0x10B981, x: cx, y: cy + spread },
        { key: 'btnAbility', field: 'ability', label: 'SKILL', col: 0x3B82F6, x: cx + spread, y: cy },
        { key: 'btnTether', field: 'tether', label: 'ANCHOR', col: 0xF59E0B, x: cx - spread, y: cy },
        { key: 'btnBoop', field: 'boop', label: '♥ BOOP', col: 0xEC4899, x: cx, y: cy - spread },
        { key: 'btnAiCommand', field: 'aiCommandToggle', label: '🤖 AI', col: 0x8B5CF6, x: cx - spread * 1.65, y: cy - spread * 0.85 }
      ];

      specs.forEach(s => {
        const circle = this.scene.add.circle(s.x, s.y, 26, s.col, 0.72)
          .setScrollFactor(0)
          .setDepth(1000)
          .setInteractive();

        const lbl = this.scene.add.text(s.x, s.y, s.label, {
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#FFFFFF'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        circle.on('pointerdown', () => {
          this.inputState[s.field] = true;
          circle.setScale(0.9).setAlpha(1.0);
        });

        const release = () => {
          this.inputState[s.field] = false;
          circle.setScale(1.0).setAlpha(0.72);
        };
        circle.on('pointerup', release);
        circle.on('pointerout', release);

        this.actionButtons[s.key] = { circle, lbl };
      });
    }

    buildTopBar() {
      const { width } = this.scene.scale;
      const bar = this.scene.add.graphics().setScrollFactor(0).setDepth(999);
      bar.fillStyle(0x090D16, 0.88);
      bar.fillRect(0, 0, width, 42);

      this.statusText = this.scene.add.text(14, 12, 'ROLE: P1 ARCHITECT | STAGE 1', {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#38BDF8'
      }).setScrollFactor(0).setDepth(1001);

      this.netBadge = this.scene.add.text(width * 0.5, 12, 'MODE: AI CO-OP PARTNER (P2P READY)', {
        fontSize: '12px',
        color: '#10B981'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1001);

      const inviteBtn = this.scene.add.text(width - 135, 9, '🔗 INVITE P2', {
        fontSize: '12px',
        fontStyle: 'bold',
        backgroundColor: '#1E293B',
        padding: { x: 8, y: 4 },
        color: '#FBBF24'
      }).setScrollFactor(0).setDepth(1001).setInteractive();

      inviteBtn.on('pointerdown', () => {
        this.copyInviteLink();
        this.showInviteModal();
      });
    }

    setStatus(roleText, stageText, netModeText) {
      if (this.statusText) this.statusText.setText(`${roleText} | ${stageText}`);
      if (this.netBadge && netModeText) this.netBadge.setText(netModeText);
    }

    copyInviteLink() {
      if (typeof window === 'undefined') return;
      const href = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(href).catch(() => {});
      }
    }

    showInviteModal() {
      if (typeof document === 'undefined') return;
      let modal = document.getElementById('agy-invite-modal');
      if (modal) {
        modal.style.display = 'flex';
        return;
      }

      const inviteUrl = window.location.href;
      modal = document.createElement('div');
      modal.id = 'agy-invite-modal';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(9,13,22,0.92); z-index: 100000;
        display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif;
      `;
      modal.innerHTML = `
        <div style="background:#1E293B; border:2px solid #38BDF8; border-radius:14px; padding:24px; max-width:440px; width:90%; color:#F8FAFC; text-align:center;">
          <h3 style="margin:0 0 8px 0; color:#38BDF8;">⚡ Serverless WebRTC Co-op Invite</h3>
          <p style="font-size:13px; color:#94A3B8; margin:0 0 14px 0;">
            Link copied to clipboard! Send this URL to Player 2 (or open in a 2nd tab) for instant Peer-to-Peer Co-op:
          </p>
          <input readonly value="${inviteUrl}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #475569; background:#090D16; color:#00E676; font-family:monospace; font-size:12px; box-sizing:border-box; margin-bottom:16px;" />
          <button id="agy-close-modal" style="background:#38BDF8; color:#090D16; font-weight:bold; border:none; padding:10px 24px; border-radius:8px; cursor:pointer;">
            RESUME GAME
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('agy-close-modal').onclick = () => {
        modal.style.display = 'none';
      };
    }

    bindJoystickTouch() {
      const { width } = this.scene.scale;
      this.scene.input.on('pointerdown', (p) => {
        if (p.x < width * 0.48 && p.y > 70 && !this.joystick.active) {
          this.joystick.active = true;
          this.joystick.pointerId = p.id;
          this.updateJoystickPosition(p.x, p.y);
        }
      });

      this.scene.input.on('pointermove', (p) => {
        if (this.joystick.active && p.id === this.joystick.pointerId) {
          this.updateJoystickPosition(p.x, p.y);
        }
      });

      const reset = (p) => {
        if (this.joystick.active && p.id === this.joystick.pointerId) {
          this.joystick.active = false;
          this.joystick.pointerId = null;
          this.inputState.moveX = 0;
          this.inputState.moveY = 0;
          this.drawKnob(this.joystick.baseX, this.joystick.baseY);
        }
      };
      this.scene.input.on('pointerup', reset);
      this.scene.input.on('pointerupoutside', reset);
    }

    updateJoystickPosition(x, y) {
      const dx = x - this.joystick.baseX;
      const dy = y - this.joystick.baseY;
      const dist = Math.hypot(dx, dy);

      if (dist < this.joystick.deadzone) {
        this.inputState.moveX = 0;
        this.inputState.moveY = 0;
        this.drawKnob(this.joystick.baseX, this.joystick.baseY);
        return;
      }

      const clamped = Math.min(dist, this.joystick.radius);
      const angle = Math.atan2(dy, dx);
      this.drawKnob(
        this.joystick.baseX + Math.cos(angle) * clamped,
        this.joystick.baseY + Math.sin(angle) * clamped
      );
      this.inputState.moveX = Math.cos(angle) * (clamped / this.joystick.radius);
      this.inputState.moveY = Math.sin(angle) * (clamped / this.joystick.radius);
    }

    getInputs() {
      return { ...this.inputState };
    }
  }

  const instance = new AGYMobilePwaHud();
  if (typeof window !== 'undefined') {
    window.AGYHud = instance;
    window.MAGHud = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
