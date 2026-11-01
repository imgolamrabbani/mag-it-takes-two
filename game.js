/**
 * Antigravity MAG v2.0 — Synthesized Playable Co-op Replica ("It Takes Two" Handcrafted Edition)
 * Target: It Takes Two (1426210)
 * Characters: May (Blue-Haired Doll + Claw Hammer), Cody (Leaf-Haired Clay Doll + Giant Iron Nail), Dr. Hakim (Book of Love)
 * Architecture: Serverless WebRTC P2P + 12-Node Verlet Tether + 4-Track WebAudio + 3-Stage Boss DAG
 */
(function() {
  'use strict';

  const LEDGER_CONFIG = {
  "gameTitle": "It Takes Two",
  "gameSlug": "it-takes-two",
  "physics": {
    "solverEngine": "Phaser.Physics.Arcade + 12-Node Verlet Rope & Hooke Spring Solver",
    "gravity": {
      "x": 0,
      "y": 900
    },
    "terminalVelocity": {
      "x": 380,
      "y": 860
    },
    "coyoteTimeMs": 150,
    "jumpBufferMs": 130,
    "airDragCoefficient": 0.06,
    "verletRopeNodes": 12,
    "verletConstraintIterations": 6,
    "hookesLawTether": {
      "equation": "F = -k * (dist - l0) - c * v_rel",
      "springConstantK": 0.048,
      "dampingConstantC": 0.026,
      "naturalLength": 155,
      "maxLength": 350,
      "breakTensionThreshold": 500,
      "slingshotImpulseMultiplier": 1.9
    }
  },
  "palette": {
    "name": "It Takes Two — Handcrafted Workshop Shed & Storybook Toybox",
    "primaryP1": "#38BDF8",
    "secondaryP2": "#4ADE80",
    "accentEnergy": "#FBBF24",
    "bossCore": "#EF4444",
    "backgroundDark": "#1C110A",
    "surfacePlatforms": "#6B4226",
    "tetherGlow": "#F59E0B",
    "textLight": "#FEF3C7"
  },
  "coop": {
    "networkArchitecture": "Serverless WebRTC P2P DataChannel (PeerJS + STUN + BroadcastChannel Mirror + AI Autopilot)",
    "roleP1": {
      "roleId": "P1_ARCHITECT",
      "roleTitle": "May (Claw Hammer & Kinetic Anchor)",
      "primaryAbility": "KINETIC_ANCHOR_AND_TETHER_LOCK",
      "cooldownMs": 1800,
      "description": "Swings the Heavy Claw Hammer to slam switches, anchors onto driven nails for pendulum swings, and locks tether fulcrum."
    },
    "roleP2": {
      "roleId": "P2_CATALYST",
      "roleTitle": "Cody (Nail Driver & Resonance Dash)",
      "primaryAbility": "RESONANCE_DASH_AND_PULSE",
      "cooldownMs": 1600,
      "description": "Fires Giant Iron Nails into timber posts, executes mid-air impulse dash, and triggers remote workshop relays."
    },
    "autonomousAiPartner": {
      "enabledByDefaultWhenSolo": true,
      "SeamlessHumanHandoverOnWebRtcConnect": true,
      "behaviors": [
        "FOLLOW_PLAYER",
        "SEEK_NEAREST_UNPRESSED_PLATE",
        "AUTO_ANCHOR_NEAR_CHASM",
        "ATTACK_BOSS_EXPOSED_CORE"
      ]
    }
  },
  "stages": [
    {
      "stageId": "STAGE_01_CALIBRATION",
      "stageName": "Chapter 1: It Takes Two — The Shed: Hammer & Nails",
      "width": 2400,
      "height": 720,
      "objective": "Help May (Hammer) & Cody (Nails) swing across the dusty workbench chasms and press both Clamp Switches (A & B) to open the Fuse Barrier!",
      "puzzles": [
        "DUAL_PRESSURE_INTERLOCK",
        "CHASM_TETHER_SWING"
      ],
      "checkpointCount": 3
    },
    {
      "stageId": "STAGE_02_CRUCIBLE",
      "stageName": "Chapter 2: It Takes Two — Rose's Room & Clockwork Crucible",
      "width": 2600,
      "height": 720,
      "objective": "Coordinate May's Hammer Slam & Cody's Nail Dash across motorized toy lifts and Cuckoo Clockwork gears to open the Pillow Fort Gate!",
      "puzzles": [
        "MOVING_ELEVATOR_SYNC",
        "HIGH_TENSION_SLINGSHOT"
      ],
      "checkpointCount": 3
    },
    {
      "stageId": "STAGE_03_BOSS_FINALE",
      "stageName": "Chapter 3: It Takes Two — Possessed Vacuum Cleaner Boss (\"Biting the Dust\")",
      "width": 2200,
      "height": 720,
      "objective": "Stand on both Suction Hose Overload Pads (A & B) to drop the Giant Vacuum Cleaner's shield, then bash it with Hammer & Nails!",
      "puzzles": [
        "FLANKING_SHIELD_OVERLOAD",
        "COOP_CORE_STRIKE_FINALE"
      ],
      "bossHealth": 100
    }
  ]
};

  class ReplicaMainScene extends Phaser.Scene {
    constructor() {
      super({ key: 'ReplicaMainScene' });
      this.stageIndex = 0;
      this.stagesList = ['STAGE_01_CALIBRATION', 'STAGE_02_CRUCIBLE', 'STAGE_03_BOSS_FINALE'];
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isAnchored = false;
      this.slingshotImpulse = 1.9;
      this.plateA = false;
      this.plateB = false;
      this.gateOpen = false;
      this.bossHealth = 100;
      this.bossShieldDown = false;
      this.activeCheckpoint = { x: 140, y: 500 };
      this.lastBoopTime = 0;
      this.lastAbilityTime = 0;
    }

    create() {
      // 1. Initialize Handcrafted Doll & Workshop Textures + Post-FX Shaders
      window.AGYVFX.generateProceduralTextures(this, LEDGER_CONFIG.palette);
      window.AGYVFX.applyPostFXPipeline(this);

      // 2. Initialize Mobile Multi-Touch 5-Button HUD
      window.AGYHud.init(this, {
        roleTitle: LEDGER_CONFIG.coop.roleP1.roleTitle
      });

      // 3. Initialize Serverless WebRTC P2P + BroadcastChannel + AI Companion
      window.AGYNet.init({
        callbacks: {
          onRoleAssigned: (role) => this.updateHudBanner(),
          onPartnerConnected: () => this.updateHudBanner(),
          onPartnerDisconnected: () => this.updateHudBanner(),
          onPuzzleSync: (ev) => this.handleRemotePuzzleEvent(ev),
          onBoop: () => this.renderPartnerBoopFX()
        }
      });

      // Unlock WebAudio & 4-Track Adaptive Sequencer on first input
      this.input.once('pointerdown', () => {
        window.AGYAudio.init();
        window.AGYAudio.startAdaptiveMusic(114);
      });
      this.input.keyboard.once('keydown', () => {
        window.AGYAudio.init();
        window.AGYAudio.startAdaptiveMusic(114);
      });

      // Keyboard bindings
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        Q: Phaser.Input.Keyboard.KeyCodes.Q,
        B: Phaser.Input.Keyboard.KeyCodes.B,
        R: Phaser.Input.Keyboard.KeyCodes.R
      });

      // Build initial stage from Level Topology DAG
      this.loadStage(this.stageIndex);
    }

    loadStage(index) {
      this.stageIndex = index % this.stagesList.length;
      const stageId = this.stagesList[this.stageIndex];
      const stageMeta = LEDGER_CONFIG.stages[this.stageIndex] || LEDGER_CONFIG.stages[0];

      // Clear previous stage objects if reloading
      if (this.worldGroup) this.worldGroup.clear(true, true);
      if (this.movingPlatforms) this.movingPlatforms.clear(true, true);
      if (this.tetherGfx) this.tetherGfx.destroy();
      if (this.p1) this.p1.destroy();
      if (this.p2) this.p2.destroy();
      if (this.p1Label) this.p1Label.destroy();
      if (this.p2Label) this.p2Label.destroy();
      if (this.drHakim) this.drHakim.destroy();
      if (this.hakimBubble) this.hakimBubble.destroy();
      if (this.bossCore) { this.bossCore.destroy(); this.bossCore = null; }
      if (this.bossLabel) { this.bossLabel.destroy(); this.bossLabel = null; }
      if (this.stageBanner) this.stageBanner.destroy();
      if (this.nailPosts) { this.nailPosts.forEach(np => np.destroy()); }

      this.plateA = false;
      this.plateB = false;
      this.gateOpen = false;
      this.bossHealth = 100;
      this.bossShieldDown = false;
      this.activeCheckpoint = { x: 140, y: 500 };

      const worldW = stageMeta.width || 2400;
      const worldH = stageMeta.height || 720;
      this.physics.world.setBounds(0, 0, worldW, worldH + 250);
      this.cameras.main.setBounds(0, 0, worldW, worldH);

      window.AGYVFX.createParallaxBackground(this, worldW, worldH, LEDGER_CONFIG.palette);

      this.worldGroup = this.physics.add.staticGroup();
      this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });

      // Build Timber Workbench Ground Segments with Chasm Gaps for Hammer-Nail Tether Swings
      for (let x = 0; x < worldW; x += 64) {
        const isGap = (x >= 640 && x <= 832) || (x >= 1472 && x <= 1664);
        if (!isGap) {
          this.worldGroup.create(x + 32, worldH - 20, 'platform_tile');
        }
      }

      // Elevated Workshop Shelves, Toy Blocks & Stepping Ledges
      const ledges = [
        { x: 420, y: 540 }, { x: 484, y: 540 },
        { x: 736, y: 450 },
        { x: 1020, y: 520 }, { x: 1084, y: 520 }, { x: 1148, y: 520 },
        { x: 1568, y: 440 },
        { x: 1860, y: 520 }, { x: 1924, y: 520 }
      ];
      ledges.forEach(l => this.worldGroup.create(l.x, l.y, 'platform_tile'));

      // Driven Iron Nail Swing Posts above the two Workbench Chasms
      this.nailPosts = [
        this.add.image(736, 290, 'nail_anchor_post').setDepth(20),
        this.add.image(1568, 290, 'nail_anchor_post').setDepth(20)
      ];

      // Motorized Yellow/Black Workshop Clamp Lift
      this.elevator = this.movingPlatforms.create(736, 560, 'moving_lift');
      this.tweens.add({
        targets: this.elevator,
        y: 380,
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Dual Co-op Workshop Pound Switches (Plate A & Plate B)
      this.plateASprite = this.physics.add.staticImage(1030, 499, 'switch_plate_off');
      this.plateBSprite = this.physics.add.staticImage(1900, 499, 'switch_plate_off');

      // High-Voltage Workshop Fuse & Spark Barrier Gate
      this.gateSprite = this.physics.add.staticImage(2040, worldH - 104, 'energy_gate');

      // Chapter Exit — Golden Book of Love Portal
      this.goalZone = this.add.circle(worldW - 110, worldH - 80, 34, 0xFBBF24, 0.55);
      this.physics.add.existing(this.goalZone, true);

      // Spawn Stage 3 Possessed Vacuum Cleaner Boss if on STAGE_03_BOSS_FINALE
      if (stageId === 'STAGE_03_BOSS_FINALE') {
        window.AGYAudio.setMusicIntensity('BOSS_FINALE');
        this.bossCore = this.physics.add.image(1500, 340, 'boss_core');
        this.bossCore.body.setAllowGravity(false);
        this.bossCore.setImmovable(true);
        this.bossLabel = this.add.text(1500, 265, '⚠️ POSSESSED VACUUM BOSS — SHIELD ACTIVE (PRESS BOTH SWITCHES!)', {
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#FCA5A5',
          backgroundColor: 'rgba(127, 29, 29, 0.9)',
          padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        this.tweens.add({
          targets: this.bossCore,
          y: 440,
          x: 1620,
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else {
        window.AGYAudio.setMusicIntensity(this.stageIndex === 1 ? 'PUZZLE_TENSION' : 'EXPLORATION');
      }

      // Spawn Player 1 (MAY — Doll + Claw Hammer) & Player 2 (CODY — Clay Doll + Giant Nail)
      this.p1 = this.physics.add.sprite(140, 510, 'player_p1');
      this.p2 = this.physics.add.sprite(215, 510, 'player_p2');

      [this.p1, this.p2].forEach(p => {
        p.body.setSize(34, 58);
        p.body.setOffset(15, 10);
        p.body.setGravityY(LEDGER_CONFIG.physics.gravity.y);
        p.body.setMaxVelocity(LEDGER_CONFIG.physics.terminalVelocity.x, LEDGER_CONFIG.physics.terminalVelocity.y);
        p.setCollideWorldBounds(false);
      });

      // Character Nameplates above May & Cody
      this.p1Label = this.add.text(this.p1.x, this.p1.y - 46, '🔨 MAY (HAMMER)', {
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#38BDF8',
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(60);

      this.p2Label = this.add.text(this.p2.x, this.p2.y - 46, '🔩 CODY (NAILS)', {
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#4ADE80',
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(60);

      // Spawn Dr. Hakim (The Book of Love) floating companion guide
      this.drHakim = this.add.image(280, 410, 'dr_hakim').setDepth(55);
      this.hakimBubble = this.add.text(280, 362, '📖 Dr. Hakim: "¡CO-OP PASSION! Use Hammer & Nails together!"', {
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FEF3C7',
        backgroundColor: 'rgba(153, 27, 27, 0.88)',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(56);

      this.physics.add.collider([this.p1, this.p2], this.worldGroup);
      this.physics.add.collider([this.p1, this.p2], this.movingPlatforms);
      this.gateCollider = this.physics.add.collider([this.p1, this.p2], this.gateSprite);

      this.tetherGfx = this.add.graphics().setDepth(50);
      this.cameras.main.startFollow(this.p1, true, 0.1, 0.1);

      // Storybook Chapter Title Banner
      this.stageBanner = this.add.text(this.scale.width * 0.5, 52, stageMeta.stageName + '\n' + stageMeta.objective, {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#FEF3C7',
        backgroundColor: 'rgba(45, 27, 14, 0.90)',
        padding: { x: 16, y: 8 },
        align: 'center'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(990);

      this.updateHudBanner();
    }

    updateHudBanner() {
      const role = window.AGYNet.role === 'P2_CATALYST' ? '🔩 CODY (NAILS)' : '🔨 MAY (HAMMER)';
      const stageLabel = `CHAPTER ${this.stageIndex + 1}/3`;
      const netMode = window.AGYNet.isHumanPartnerConnected
        ? `⚡ P2P LIVE (ROOM: ${window.AGYNet.roomCode})`
        : `🤖 AI CODY PARTNER | ROOM: ${window.AGYNet.roomCode}`;
      window.AGYHud.setStatus(role, stageLabel, netMode);
    }

    handleRemotePuzzleEvent(ev) {
      if (ev.action === 'GATE_UNLOCKED' && !this.gateOpen) {
        this.unlockForceGate();
      } else if (ev.action === 'STAGE_ADVANCE') {
        this.loadStage(ev.nextStageIndex);
      } else if (ev.action === 'BOSS_DAMAGED' && this.bossCore) {
        this.bossHealth = ev.bossHealth;
        if (this.bossHealth <= 0) this.triggerVictorySequence();
      }
    }

    unlockForceGate() {
      if (this.gateOpen) return;
      this.gateOpen = true;
      window.AGYAudio.playGateOpen();
      window.AGYVFX.triggerCameraTrauma(this, 0.016, 220);
      window.AGYVFX.spawnParticleBurst(this, this.gateSprite.x, this.gateSprite.y, 0xFBBF24, 18);
      if (this.gateCollider) this.physics.world.removeCollider(this.gateCollider);
      this.gateSprite.setVisible(false);
      if (this.hakimBubble) {
        this.hakimBubble.setText('📖 Dr. Hakim: "¡MAGNIFICO! Fuse Barrier unlocked! Head to the Golden Book Portal!"');
      }
    }

    triggerPartnerBoop() {
      const now = this.time.now;
      if (now - this.lastBoopTime < 450) return;
      this.lastBoopTime = now;
      window.AGYAudio.playPartnerBoop();
      window.AGYNet.emitBoop();
      this.renderPartnerBoopFX();
    }

    renderPartnerBoopFX() {
      window.AGYVFX.spawnFloatingEmote(this, this.p1.x, this.p1.y);
      window.AGYVFX.spawnFloatingEmote(this, this.p2.x, this.p2.y);
      if (this.drHakim) {
        window.AGYVFX.spawnFloatingEmote(this, this.drHakim.x, this.drHakim.y);
      }
    }

    respawnAtCheckpoint() {
      window.AGYAudio.playTetherSnap();
      window.AGYVFX.triggerCameraTrauma(this, 0.02, 200);
      this.p1.setPosition(this.activeCheckpoint.x, this.activeCheckpoint.y);
      this.p1.body.setVelocity(0, 0);
      this.p2.setPosition(this.activeCheckpoint.x + 60, this.activeCheckpoint.y);
      this.p2.body.setVelocity(0, 0);
    }

    triggerVictorySequence() {
      window.AGYAudio.playVictoryFanfare();
      window.AGYVFX.spawnParticleBurst(this, this.p1.x, this.p1.y - 40, 0xFBBF24, 28);
      if (this.stageBanner) {
        this.stageBanner.setText('🏆 POSSESSED VACUUM CLEANER DEFEATED! MAY & CODY TRIUMPH!\nPress R to replay Chapter 1: The Shed');
      }
      if (this.bossCore) {
        this.bossCore.destroy();
        this.bossCore = null;
      }
      if (this.bossLabel) {
        this.bossLabel.destroy();
        this.bossLabel = null;
      }
      this.unlockForceGate();
    }

    spawnCodyNailShot(fromSprite, dir) {
      const nail = this.add.image(fromSprite.x + dir * 24, fromSprite.y, 'nail_projectile');
      if (dir < 0) nail.setFlipX(true);
      this.tweens.add({
        targets: nail,
        x: fromSprite.x + dir * 280,
        duration: 280,
        onComplete: () => {
          window.AGYVFX.spawnParticleBurst(this, nail.x, nail.y, 0xE2E8F0, 8);
          nail.destroy();
        }
      });
    }

    update(time, delta) {
      if (!this.p1 || !this.p2) return;

      const hudInputs = window.AGYHud.getInputs();
      const localSprite = window.AGYNet.role === 'P2_CATALYST' ? this.p2 : this.p1;
      const partnerSprite = window.AGYNet.role === 'P2_CATALYST' ? this.p1 : this.p2;

      // Stage quick-cycle for testing
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
        this.loadStage(this.stageIndex + 1);
        return;
      }

      // 1. Coyote Time & Jump Buffer Windows
      const onFloor = localSprite.body.blocked.down || localSprite.body.touching.down;
      if (onFloor) {
        this.coyoteTimer = 150;
      } else {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
      }

      const jumpPressed = this.cursors.up.isDown || this.keys.W.isDown || hudInputs.jump;
      if (jumpPressed) {
        this.jumpBufferTimer = 130;
      } else {
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
      }

      // Horizontal Movement
      let moveDir = hudInputs.moveX;
      if (this.cursors.left.isDown || this.keys.A.isDown) moveDir = -1;
      else if (this.cursors.right.isDown || this.keys.D.isDown) moveDir = 1;

      if (moveDir < -0.1) localSprite.setFlipX(true);
      else if (moveDir > 0.1) localSprite.setFlipX(false);

      this.isAnchored = this.keys.Q.isDown || hudInputs.tether;
      this.p1.isAnchored = this.isAnchored;

      if (this.isAnchored && localSprite === this.p1) {
        localSprite.body.setVelocityX(0);
        localSprite.setTint(0xFDE047);
      } else {
        localSprite.clearTint();
        localSprite.body.setVelocityX(moveDir * 290);
      }

      // Execute Jump if within Coyote & Jump Buffer Grace Windows
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        localSprite.body.setVelocityY(-540);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        window.AGYAudio.playJump();
        window.AGYVFX.applySquashStretch(this, localSprite, 0.76, 1.28, 120);
      }

      // Role Ability Execution (May's Claw Hammer Slam / Cody's Driven Iron Nail + Dash)
      if ((this.keys.E.isDown || hudInputs.ability) && time - this.lastAbilityTime > 900) {
        this.lastAbilityTime = time;
        const facingDir = localSprite.flipX ? -1 : 1;
        if (window.AGYNet.role === 'P2_CATALYST') {
          window.AGYAudio.playP2Ability();
          localSprite.body.setVelocityX((moveDir || facingDir) * 520);
          localSprite.body.setVelocityY(-220);
          this.spawnCodyNailShot(localSprite, facingDir);
          window.AGYVFX.spawnParticleBurst(this, localSprite.x, localSprite.y, 0x4ADE80, 14);
        } else {
          window.AGYAudio.playP1Ability();
          // May swings Claw Hammer + launches Cody upward on tether!
          this.tweens.add({
            targets: localSprite,
            angle: facingDir * 28,
            duration: 110,
            yoyo: true
          });
          this.spawnCodyNailShot(this.p2, 1);
          this.p2.body.setVelocityY(-460 * this.slingshotImpulse * 0.65);
          window.AGYVFX.spawnParticleBurst(this, localSprite.x + facingDir * 24, localSprite.y + 10, 0xFBBF24, 16);
        }

        // Check Possessed Vacuum Cleaner Boss damage when shield is down
        if (this.bossCore && this.bossShieldDown) {
          const distToBoss = Phaser.Math.Distance.Between(localSprite.x, localSprite.y, this.bossCore.x, this.bossCore.y);
          if (distToBoss < 260) {
            this.bossHealth = Math.max(0, this.bossHealth - 35);
            window.AGYAudio.playBossHit();
            window.AGYVFX.triggerCameraTrauma(this, 0.022, 240);
            window.AGYVFX.spawnParticleBurst(this, this.bossCore.x, this.bossCore.y, 0xEF4444, 22);
            window.AGYNet.emitPuzzleEvent({ action: 'BOSS_DAMAGED', bossHealth: this.bossHealth });
            if (this.bossHealth <= 0) this.triggerVictorySequence();
          }
        }
      }

      // Partner Boop (Book of Love Heart Burst)
      if (this.keys.B.isDown || hudInputs.boop) {
        this.triggerPartnerBoop();
      }

      // 2. Update Partner (Via Live P2P Interpolation OR Autonomous Co-op AI Cody Bot)
      if (window.AGYNet.isHumanPartnerConnected) {
        const remotePos = window.AGYNet.getInterpolatedPartner(Date.now());
        if (remotePos) {
          partnerSprite.setPosition(remotePos.x, remotePos.y);
          partnerSprite.body.setVelocity(remotePos.vx || 0, remotePos.vy || 0);
        }
      } else {
        const aiDecision = window.AGYNet.computeAiPartnerStep(localSprite, partnerSprite, {
          plates: [this.plateASprite, this.plateBSprite],
          gateOpen: this.gateOpen
        });
        partnerSprite.body.setVelocityX(aiDecision.vx);
        if (aiDecision.vx < -10) partnerSprite.setFlipX(true);
        else if (aiDecision.vx > 10) partnerSprite.setFlipX(false);

        const aiOnFloor = partnerSprite.body.blocked.down || partnerSprite.body.touching.down;
        if (aiDecision.jump && aiOnFloor) {
          partnerSprite.body.setVelocityY(-530);
        }
      }

      // Update floating character nameplates & Dr. Hakim companion position
      if (this.p1Label) this.p1Label.setPosition(this.p1.x, this.p1.y - 44);
      if (this.p2Label) this.p2Label.setPosition(this.p2.x, this.p2.y - 44);
      if (this.drHakim) {
        const midX = (this.p1.x + this.p2.x) * 0.5;
        const targetY = Math.min(this.p1.y, this.p2.y) - 110 + Math.sin(time * 0.004) * 10;
        this.drHakim.x += (midX - this.drHakim.x) * 0.04;
        this.drHakim.y += (targetY - this.drHakim.y) * 0.04;
        if (this.hakimBubble) {
          this.hakimBubble.setPosition(this.drHakim.x, this.drHakim.y - 42);
        }
      }
      if (this.bossCore && this.bossLabel) {
        this.bossLabel.setPosition(this.bossCore.x, this.bossCore.y - 72);
        this.bossLabel.setText(
          this.bossShieldDown
            ? `💥 VACUUM BOSS EXPOSED! STRIKE WITH HAMMER & NAILS (E)! HP: ${this.bossHealth}%`
            : `🛡️ VACUUM BOSS SHIELDED — STAND ON BOTH CLAMP SWITCHES! HP: ${this.bossHealth}%`
        );
      }

      // Emit 30Hz P2P state snapshot
      window.AGYNet.emitState(
        localSprite.x,
        localSprite.y,
        localSprite.body.velocity.x,
        localSprite.body.velocity.y
      );

      // 3. Apply Hooke's Law Spring-Tether Constraint & Render 12-Node Verlet Rope
      const tetherForces = window.AGYNet.solveTetherPhysics(this.p1, this.p2, LEDGER_CONFIG.physics.hookesLawTether);
      this.p1.body.velocity.x += tetherForces.fx1 * (delta / 1000);
      this.p1.body.velocity.y += tetherForces.fy1 * (delta / 1000);
      this.p2.body.velocity.x += tetherForces.fx2 * (delta / 1000);
      this.p2.body.velocity.y += tetherForces.fy2 * (delta / 1000);

      window.AGYVFX.renderVerletTether(this.tetherGfx, this.p1, this.p2, 350, 155);

      // 4. Evaluate Dual Co-op Workshop Clamp Switches (plateA & plateB -> gateOpen)
      const d1A = Phaser.Math.Distance.Between(this.p1.x, this.p1.y, this.plateASprite.x, this.plateASprite.y);
      const d2A = Phaser.Math.Distance.Between(this.p2.x, this.p2.y, this.plateASprite.x, this.plateASprite.y);
      const d1B = Phaser.Math.Distance.Between(this.p1.x, this.p1.y, this.plateBSprite.x, this.plateBSprite.y);
      const d2B = Phaser.Math.Distance.Between(this.p2.x, this.p2.y, this.plateBSprite.x, this.plateBSprite.y);

      const wasPlateA = this.plateA;
      const wasPlateB = this.plateB;
      this.plateA = (d1A < 48 || d2A < 48);
      this.plateB = (d1B < 48 || d2B < 48);

      if (this.plateA && !wasPlateA) window.AGYAudio.playSwitchActivate();
      if (this.plateB && !wasPlateB) window.AGYAudio.playSwitchActivate();

      this.plateASprite.setTexture(this.plateA ? 'switch_plate_on' : 'switch_plate_off');
      this.plateBSprite.setTexture(this.plateB ? 'switch_plate_on' : 'switch_plate_off');

      if (this.plateA && this.plateB) {
        if (!this.gateOpen) {
          this.unlockForceGate();
          window.AGYNet.emitPuzzleEvent({ action: 'GATE_UNLOCKED' });
        }
        if (this.bossCore && !this.bossShieldDown) {
          this.bossShieldDown = true;
          this.bossCore.setTint(0x4ADE80);
        }
      }

      // Update Checkpoint as May & Cody progress across the workbench
      if (this.p1.x > 1000 && this.activeCheckpoint.x < 1000) {
        this.activeCheckpoint = { x: 1030, y: 460 };
      }

      // 5. Out-of-Bounds Abyss Respawn Safety Trigger
      if (this.p1.y > 760 || this.p2.y > 760) {
        this.respawnAtCheckpoint();
      }

      // 6. Stage Progression Goal Check
      const distGoal = Phaser.Math.Distance.Between(this.p1.x, this.p1.y, this.goalZone.x, this.goalZone.y);
      if (distGoal < 52 && this.gateOpen) {
        const nextStage = (this.stageIndex + 1) % this.stagesList.length;
        window.AGYAudio.playVictoryFanfare();
        window.AGYNet.emitPuzzleEvent({ action: 'STAGE_ADVANCE', nextStageIndex: nextStage });
        this.loadStage(nextStage);
      }
    }
  }

  const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1120,
    height: 640,
    backgroundColor: LEDGER_CONFIG.palette.backgroundDark,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [ReplicaMainScene]
  };

  window.addEventListener('DOMContentLoaded', () => {
    window.AGY_GAME_INSTANCE = new Phaser.Game(gameConfig);
  });
})();
