/**
 * Antigravity MAG v2.0 — Serverless WebRTC P2P DataChannel Engine + BroadcastChannel Mirror + AI Co-op Bot
 * Enables 100% free static hosting on GitHub Pages / Cloudflare Pages with real-time multiplayer sync.
 */
(function(root) {
  'use strict';

  class AGYNetP2P {
    constructor() {
      this.roomCode = 'AGY1';
      this.role = 'P1_ARCHITECT';
      this.sessionToken = null;
      this.peer = null;
      this.dataConn = null;
      this.broadcastChannel = null;
      this.isHumanPartnerConnected = false;
      this.aiPartnerMode = 'AUTO_COOP'; // AUTO_COOP | HOLD_POSITION
      this.remoteSnapshots = [];
      this.interpolationDelayMs = 55;
      this.connectedPeers = new Set();

      this.callbacks = {
        onRoleAssigned: null,
        onPartnerConnected: null,
        onPartnerDisconnected: null,
        onRemoteState: null,
        onPuzzleSync: null,
        onBoop: null,
        onError: null
      };
    }

    init(options = {}) {
      this.callbacks = { ...this.callbacks, ...(options.callbacks || {}) };

      if (typeof window !== 'undefined') {
        this.sessionToken = localStorage.getItem('agy_mag_session') || ('sess_' + Math.random().toString(36).slice(2, 10));
        localStorage.setItem('agy_mag_session', this.sessionToken);

        const params = new URLSearchParams(window.location.search);
        let code = params.get('room');
        if (!code) {
          code = Math.random().toString(36).substring(2, 6).toUpperCase();
          params.set('room', code);
          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
        this.roomCode = code.toUpperCase();
      } else if (options.roomCode) {
        this.roomCode = options.roomCode;
      }

      this.initBroadcastChannel();
      this.initWebRTCPeer();
      this.setupVisibilityRecovery();
      return this;
    }

    /**
     * Zero-latency same-device multi-tab transport via BroadcastChannel API.
     */
    initBroadcastChannel() {
      if (typeof BroadcastChannel === 'undefined') return;
      this.broadcastChannel = new BroadcastChannel(`mag_p2p_${this.roomCode}`);

      this.broadcastChannel.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || msg.senderToken === this.sessionToken) return;
        this.handleIncomingPacket(msg);
      };

      // Announce presence on local channel
      this.broadcastChannel.postMessage({
        type: 'HELLO_PROBE',
        senderToken: this.sessionToken,
        timestamp: Date.now()
      });
    }

    /**
     * Serverless WebRTC P2P DataChannel setup using PeerJS + Google/Twilio STUN servers.
     */
    initWebRTCPeer() {
      if (typeof window === 'undefined' || typeof window.Peer === 'undefined') {
        return;
      }

      const hostPeerId = `agy-mag-v2-${this.roomCode.toLowerCase()}-host`;
      const iceConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      };

      try {
        this.peer = new window.Peer(hostPeerId, { config: iceConfig });

        this.peer.on('open', () => {
          this.role = 'P1_ARCHITECT';
          if (this.callbacks.onRoleAssigned) this.callbacks.onRoleAssigned(this.role);
        });

        this.peer.on('connection', (conn) => {
          // Enforce 2-player maximum capacity (3rd-peer intrusion guard)
          if (this.dataConn && this.dataConn.open && this.connectedPeers.size >= 1 && !this.connectedPeers.has(conn.peer)) {
            conn.on('open', () => {
              conn.send({ type: 'ERROR', code: 'ROOM_FULL', message: 'ROOM_FULL' });
              setTimeout(() => conn.close(), 150);
            });
            return;
          }

          this.dataConn = conn;
          this.connectedPeers.add(conn.peer);
          this.bindDataChannel(conn);
        });

        // If hostPeerId is already claimed on PeerJS broker, join as P2_CATALYST!
        this.peer.on('error', (err) => {
          if (err && err.type === 'unavailable-id') {
            this.connectAsClientP2(hostPeerId, iceConfig);
          }
        });
      } catch (_) {
        // Fallback smoothly to BroadcastChannel + AI Companion
      }
    }

    connectAsClientP2(hostPeerId, iceConfig) {
      this.role = 'P2_CATALYST';
      if (this.callbacks.onRoleAssigned) this.callbacks.onRoleAssigned(this.role);

      const clientPeerId = `agy-mag-v2-${this.roomCode.toLowerCase()}-p2-${Math.random().toString(36).slice(2, 6)}`;
      this.peer = new window.Peer(clientPeerId, { config: iceConfig });

      this.peer.on('open', () => {
        const conn = this.peer.connect(hostPeerId, { reliable: false });
        this.dataConn = conn;
        this.bindDataChannel(conn);
      });
    }

    bindDataChannel(conn) {
      conn.on('open', () => {
        this.isHumanPartnerConnected = true;
        conn.send({
          type: 'HANDSHAKE_ACK',
          senderToken: this.sessionToken,
          role: this.role
        });
        if (this.callbacks.onPartnerConnected) {
          this.callbacks.onPartnerConnected({ transport: 'WEBRTC_DATACHANNEL' });
        }
      });

      conn.on('data', (data) => {
        this.handleIncomingPacket(data);
      });

      conn.on('close', () => {
        this.isHumanPartnerConnected = false;
        if (this.callbacks.onPartnerDisconnected) {
          this.callbacks.onPartnerDisconnected();
        }
      });
    }

    handleIncomingPacket(packet) {
      if (!packet) return;

      if (packet.type === 'ERROR' && packet.code === 'ROOM_FULL') {
        if (this.callbacks.onError) this.callbacks.onError(packet);
        return;
      }

      if (packet.type === 'HELLO_PROBE') {
        if (!this.isHumanPartnerConnected) {
          this.role = 'P1_ARCHITECT';
          this.isHumanPartnerConnected = true;
          this.connectedPeers.add(packet.senderToken);
          this.sendPacket({
            type: 'HELLO_ACK',
            targetToken: packet.senderToken,
            assignedPartnerRole: 'P2_CATALYST',
            senderToken: this.sessionToken
          });
          if (this.callbacks.onRoleAssigned) this.callbacks.onRoleAssigned(this.role);
          if (this.callbacks.onPartnerConnected) this.callbacks.onPartnerConnected({ transport: 'BROADCAST_CHANNEL' });
        } else if (this.connectedPeers.size >= 1 && !this.connectedPeers.has(packet.senderToken)) {
          this.sendPacket({
            type: 'ERROR',
            code: 'ROOM_FULL',
            targetToken: packet.senderToken
          });
        }
        return;
      }

      if (packet.type === 'HELLO_ACK') {
        if (packet.targetToken && packet.targetToken !== this.sessionToken) return;
        this.role = packet.assignedPartnerRole || 'P2_CATALYST';
        this.isHumanPartnerConnected = true;
        this.connectedPeers.add(packet.senderToken);
        if (this.callbacks.onRoleAssigned) this.callbacks.onRoleAssigned(this.role);
        if (this.callbacks.onPartnerConnected) this.callbacks.onPartnerConnected({ transport: 'BROADCAST_CHANNEL' });
        return;
      }

      if (packet.type === 'STATE_TICK') {
        this.pushRemoteSnapshot(packet);
        if (this.callbacks.onRemoteState) this.callbacks.onRemoteState(packet);
      } else if (packet.type === 'PUZZLE_SYNC') {
        if (this.callbacks.onPuzzleSync) this.callbacks.onPuzzleSync(packet);
      } else if (packet.type === 'PARTNER_BOOP') {
        if (this.callbacks.onBoop) this.callbacks.onBoop(packet);
      }
    }

    sendPacket(payload) {
      const enriched = { ...payload, senderToken: this.sessionToken, serverTimestamp: Date.now() };
      if (this.dataConn && this.dataConn.open) {
        try { this.dataConn.send(enriched); } catch (_) {}
      }
      if (this.broadcastChannel) {
        try { this.broadcastChannel.postMessage(enriched); } catch (_) {}
      }
    }

    emitState(x, y, vx, vy, extra = {}) {
      this.sendPacket({
        type: 'STATE_TICK',
        partnerPosition: { x, y, vx, vy },
        ...extra
      });
    }

    emitPuzzleEvent(eventData) {
      this.sendPacket({
        type: 'PUZZLE_SYNC',
        ...eventData
      });
    }

    emitBoop() {
      this.sendPacket({
        type: 'PARTNER_BOOP',
        role: this.role
      });
    }

    pushRemoteSnapshot(snap) {
      snap.receivedAt = Date.now();
      this.remoteSnapshots.push(snap);
      if (this.remoteSnapshots.length > 24) {
        this.remoteSnapshots.shift();
      }
    }

    /**
     * 30Hz Snapshot Linear Interpolation Buffer
     */
    getInterpolatedPartner(now = Date.now()) {
      if (this.remoteSnapshots.length === 0) return null;
      const latest = this.remoteSnapshots[this.remoteSnapshots.length - 1];
      if (this.remoteSnapshots.length === 1) return latest.partnerPosition;

      const prev = this.remoteSnapshots[this.remoteSnapshots.length - 2];
      const dt = Math.max(1, (latest.receivedAt || now) - (prev.receivedAt || now - 33));
      const elapsed = Math.min(dt, now - (latest.receivedAt || now) + this.interpolationDelayMs);
      const t = Math.max(0, Math.min(1, elapsed / dt));

      return {
        x: prev.partnerPosition.x + (latest.partnerPosition.x - prev.partnerPosition.x) * t,
        y: prev.partnerPosition.y + (latest.partnerPosition.y - prev.partnerPosition.y) * t,
        vx: latest.partnerPosition.vx,
        vy: latest.partnerPosition.vy
      };
    }

    setupVisibilityRecovery() {
      if (typeof document === 'undefined') return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.reclaimSession();
        }
      });
    }

    reclaimSession() {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'HELLO_PROBE',
          senderToken: this.sessionToken,
          reclaim: true
        });
      }
    }

    /**
     * Autonomous Co-op AI Partner Bot State Machine (Active when solo / before Human P2 joins)
     * Behaviors: SEEK_PLATE (stands on unoccupied pressure plate) or FOLLOW (traverses with P1).
     */
    computeAiPartnerStep(p1, aiSprite, worldContext = {}) {
      if (!p1 || !aiSprite) return { vx: 0, jump: false, state: 'IDLE' };

      const plates = worldContext.plates || [];
      const gateOpen = !!worldContext.gateOpen;

      let targetX = p1.x - 65;
      let state = 'FOLLOW';

      // If puzzle gate is closed and there is an unpressed switch plate, AI seeks the plate!
      if (!gateOpen && plates.length >= 2) {
        const distP1ToA = Math.abs(p1.x - plates[0].x);
        const targetPlate = distP1ToA < 180 ? plates[1] : plates[0];
        if (Math.abs(p1.x - targetPlate.x) < 950 || Math.abs(aiSprite.x - targetPlate.x) < 950) {
          targetX = targetPlate.x;
          state = 'SEEK_PLATE';
        }
      }

      if (this.aiPartnerMode === 'HOLD_POSITION') {
        return { vx: 0, jump: false, state: 'HOLD_POSITION' };
      }

      const dx = targetX - aiSprite.x;
      const dy = p1.y - aiSprite.y;
      let vx = 0;

      if (Math.abs(dx) > 10) {
        vx = Math.max(-240, Math.min(240, dx * 3.2));
      }

      const shouldJump = (dy < -48 && Math.abs(dx) < 160) || (Math.abs(dx) > 90 && Math.abs(aiSprite.body ? aiSprite.body.velocity.x : 10) < 5);
      return { vx, jump: shouldJump, state };
    }

    /**
     * Hooke's Law Spring-Tether Physics Solver
     * F = -k * (dist - l0) - c * v_rel
     */
    solveTetherPhysics(p1, p2, options = {}) {
      const k = options.springConstantK || 0.048;
      const c = options.dampingConstantC || 0.026;
      const naturalLen = options.naturalLength || 155;
      const maxLen = options.maxLength || 350;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy) || 0.0001;

      if (dist <= naturalLen) {
        return { fx1: 0, fy1: 0, fx2: 0, fy2: 0, tension: 0, overstretched: false };
      }

      const stretch = dist - naturalLen;
      const nx = dx / dist;
      const ny = dy / dist;

      const vx1 = p1.body ? p1.body.velocity.x : (p1.vx || 0);
      const vy1 = p1.body ? p1.body.velocity.y : (p1.vy || 0);
      const vx2 = p2.body ? p2.body.velocity.x : (p2.vx || 0);
      const vy2 = p2.body ? p2.body.velocity.y : (p2.vy || 0);

      const relVel = (vx2 - vx1) * nx + (vy2 - vy1) * ny;
      const forceMag = Math.min(480, stretch * k + relVel * c);

      const fx = nx * forceMag * 55;
      const fy = ny * forceMag * 55;

      return {
        fx1: p1.isAnchored ? 0 : fx,
        fy1: p1.isAnchored ? 0 : fy,
        fx2: p1.isAnchored ? -fx * 1.85 : -fx,
        fy2: p1.isAnchored ? -fy * 1.85 : -fy,
        tension: forceMag,
        overstretched: dist > maxLen
      };
    }
  }

  const instance = new AGYNetP2P();
  if (typeof window !== 'undefined') {
    window.AGYNet = instance;
    window.MAGNet = instance;
    window.AGYNetP2P = AGYNetP2P;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
    module.exports.AGYNetP2P = AGYNetP2P;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
