const { EventEmitter } = require('events');

function isSimulator(process) {
  return /^iracingsim(?:64)?(?:dx11|dx12)?(?:\.exe)?$/i.test(process.name);
}

class SessionMonitor extends EventEmitter {
  constructor({ fallbackMs = 8000, disconnectMs = 3000 } = {}) {
    super();
    this.fallbackMs = fallbackMs;
    this.disconnectMs = disconnectMs;
    this.processSince = null;
    this.missingSince = null;
    this.active = false;
    this.enabled = true;
    this.state = { phase: 'checking', source: null, checkedAt: null, error: null };
  }

  update(snapshot, now = Date.now()) {
    if (snapshot.sdkError && !snapshot.connected && !snapshot.processes.some(isSimulator)) {
      this.fail(snapshot.sdkError);
      return;
    }
    const simulator = snapshot.processes.find(isSimulator);
    this.processSince = simulator ? (this.processSince ?? now) : null;
    const fallback = !!simulator && now - this.processSince >= this.fallbackMs;
    const detected = snapshot.connected || fallback;
    // A short telemetry gap must not close apps while the simulator is still open.
    const present = detected || (this.active && !!simulator);
    this.missingSince = present ? null : (this.missingSince ?? now);
    const stopped = this.missingSince !== null && now - this.missingSince >= this.disconnectMs;
    this.state = {
      phase: snapshot.connected ? 'connected' : simulator ? (fallback ? 'process' : 'loading') : 'waiting',
      source: snapshot.connected ? 'SDK' : simulator ? 'process' : null,
      checkedAt: now,
      error: snapshot.sdkError || null,
      simulator: simulator?.name || null,
    };
    if (this.enabled && detected && !this.active) {
      this.active = true;
      this.emit('session-start', this.state);
    } else if (this.active && stopped) {
      this.active = false;
      if (this.enabled) this.emit('session-stop');
    }
    this.emit('state', this.state);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.active = false;
  }

  fail(error) {
    // A failed probe is unknown, never evidence that a session has ended.
    this.state = { ...this.state, phase: 'error', error };
    this.emit('state', this.state);
  }
}

module.exports = { SessionMonitor, isSimulator };
