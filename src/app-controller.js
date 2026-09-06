const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const keyFor = (item) => path.win32.normalize(item.path).toLowerCase();
function matches(item, process) {
  if (!process.path) return path.win32.basename(item.path).toLowerCase() === process.name.toLowerCase();
  if (keyFor(item) === path.win32.normalize(process.path).toLowerCase()) return true;
  // Squirrel launchers (including RaceLab) hand off to app-VERSION below their install folder.
  const relative = path.win32.relative(path.win32.dirname(item.path), process.path);
  return /^app-[^\\]+\\[^\\]+\.exe$/i.test(relative)
    && path.win32.basename(item.path).toLowerCase() === path.win32.basename(process.path).toLowerCase();
}

class AppController extends EventEmitter {
  constructor({ spawnProcess = spawn, exists = fs.existsSync, terminateProcess = null } = {}) {
    super();
    this.spawnProcess = spawnProcess;
    this.exists = exists;
    this.terminateProcess = terminateProcess;
    this.running = new Map();
    this.pending = new Map();
    this.errors = new Map();
    this.ownership = new Map();
    this.processes = [];
    this.disposed = false;
  }

  log(level, message) { this.emit('log', { level, message }); this.emit('change'); }

  updateProcesses(processes) {
    this.processes = processes;
    for (const [key, owner] of this.ownership) {
      const root = processes.find((process) => process.pid === owner.pid);
      const descendants = new Map();
      if (this.running.has(key) || (!root && Date.now() - owner.at < 10000)) descendants.set(owner.pid, 0);
      const previous = processes.find((process) => process.pid === owner.adopted?.pid && process.startedAt === owner.adopted?.startedAt);
      if (previous && !descendants.has(previous.pid)) descendants.set(previous.pid, 0);
      for (let pass = 0; pass < 8; pass++) {
        let changed = false;
        for (const process of processes) {
          if (descendants.has(process.parentPid) && !descendants.has(process.pid)) {
            descendants.set(process.pid, descendants.get(process.parentPid) + 1);
            changed = true;
          }
        }
        if (!changed) break;
      }
      // Prefer the top-level app to its Electron renderer/GPU subprocesses.
      const candidate = processes.filter((process) => process.path && process.startedAt && matches(owner.item, process) && descendants.has(process.pid))
        .sort((a, b) => descendants.get(a.pid) - descendants.get(b.pid))[0];
      if (candidate) {
        owner.adopted = candidate;
        if (owner.stopping) void this.stop(owner.item);
      } else if (!this.running.has(key) && Date.now() - owner.at > 10000) {
        this.ownership.delete(key);
      }
    }
    this.emit('change');
  }

  status(item) {
    const key = keyFor(item);
    if (this.pending.has(key)) return { status: 'pending', managed: false };
    const child = this.running.get(key);
    if (child) return { status: 'running', managed: true, pid: child.pid };
    const adopted = this.ownership.get(key)?.adopted;
    if (adopted && this.processes.some((process) => process.pid === adopted.pid && process.startedAt === adopted.startedAt)) {
      return { status: 'running', managed: true, pid: adopted.pid };
    }
    const external = this.processes.find((p) => matches(item, p));
    if (external) return { status: 'external', managed: false, pid: external.pid };
    if (this.errors.has(key)) return { status: 'error', managed: false, error: this.errors.get(key) };
    return { status: 'stopped', managed: false };
  }

  async start(item, automatic = false) {
    const key = keyFor(item);
    if (this.disposed || this.pending.has(key) || this.running.has(key)) return;
    if (this.processes.some((p) => matches(item, p))) {
      this.log('info', `${item.name}: já estava aberto. / was already open.`);
      return;
    }
    this.errors.delete(key);
    const job = { automatic, cancelled: false, cancel: () => {} };
    this.pending.set(key, job);
    this.emit('change');
    try {
      if (!this.exists(item.path)) throw new Error('Executável não encontrado; confira o caminho. / Executable not found; check its path.');
      if (item.delayStartSeconds > 0) {
        this.log('info', `${item.name}: abertura em ${item.delayStartSeconds}s. / launch in ${item.delayStartSeconds}s.`);
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, item.delayStartSeconds * 1000);
          job.cancel = () => { clearTimeout(timer); resolve(); };
        });
      }
      if (job.cancelled || this.disposed || this.processes.some((p) => matches(item, p))) return;
      // Pass the user's Windows argument string unchanged; do not invoke a command shell.
      const child = this.spawnProcess(item.path, item.arguments ? [item.arguments] : [], {
        cwd: path.win32.dirname(item.path), detached: true, windowsHide: item.startHidden,
        argv0: '"' + item.path + '"',
        windowsVerbatimArguments: true, stdio: 'ignore',
      });
      await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('spawn', resolve);
      });
      this.running.set(key, child);
      this.ownership.set(key, { item, pid: child.pid, at: Date.now(), adopted: null });
      child.on('error', (error) => this.log('error', `${item.name}: ${error.message}`));
      child.once('exit', (code) => {
        if (this.running.get(key) === child) this.running.delete(key);
        const failed = code && !child.launcherStopRequested;
        if (failed) this.errors.set(key, `Processo encerrado com código ${code}. / Process exited with code ${code}.`);
        this.log(failed ? 'error' : 'info', `${item.name}: processo encerrado / process exited${failed ? ` (${code})` : ''}.`);
      });
      child.unref();
      if (job.cancelled || this.disposed) { this.ownership.get(key).stopping = true; child.launcherStopRequested = true; child.kill(); }
      else this.log('success', `${item.name}: iniciado${automatic ? ' com o iRacing' : ''}. / started${automatic ? ' with iRacing' : ''}.`);
    } catch (error) {
      this.errors.set(key, error.message);
      this.log('error', `${item.name}: ${error.message}`);
    } finally {
      this.pending.delete(key);
      this.emit('change');
    }
  }

  async startMany(items, automatic = false) {
    await Promise.allSettled(items.filter((item) => item.enabled && (!automatic || item.startWithIracing))
      .map((item) => this.start(item, automatic)));
  }

  cancelPending(automaticOnly = false) {
    for (const job of this.pending.values()) {
      if (automaticOnly && !job.automatic) continue;
      job.cancelled = true;
      job.cancel();
    }
  }

  cancelApp(item) {
    const job = this.pending.get(keyFor(item));
    if (job) { job.cancelled = true; job.cancel(); }
  }

  async stop(item) {
    const key = keyFor(item);
    const job = this.pending.get(key);
    if (job) { job.cancelled = true; job.cancel(); }
    const child = this.running.get(key);
    const owner = this.ownership.get(key);
    const adopted = owner?.adopted;
    if (owner?.terminating) return;
    if (owner) owner.stopping = true;
    if (child) child.launcherStopRequested = true;
    if (adopted && this.terminateProcess && this.processes.some((process) => process.pid === adopted.pid && process.startedAt === adopted.startedAt)) {
      owner.terminating = true;
      try {
        await this.terminateProcess(adopted);
        this.log('info', `${item.name}: encerramento solicitado. / close requested.`);
      } catch (error) { this.log('error', `${item.name}: ${error.message}`); }
      finally { owner.terminating = false; owner.stopping = false; }
      return;
    }
    if (child && !child.killed) {
      try {
        if (!child.kill()) throw new Error('O Windows não permitiu encerrar. / Windows did not allow the process to be closed.');
        this.log('info', `${item.name}: encerramento solicitado. / close requested.`);
      } catch (error) { this.log('error', `${item.name}: ${error.message}`); }
    }
    this.emit('change');
  }

  async stopMany(items) { await Promise.allSettled(items.map((item) => this.stop(item))); }

  dispose() { this.disposed = true; this.cancelPending(); }
}

module.exports = { AppController, matches };
