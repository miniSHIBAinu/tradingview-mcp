import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSshBridgeArgs } from '../src/bridge/config.js';
import { checkBridgeStatus, probeLocalCdp } from '../src/bridge/status.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('PC-to-VPS CDP Bridge (Ticket 03)', () => {
  describe('buildSshBridgeArgs', () => {
    it('enforces loopback-only forward binding 127.0.0.1:9333 -> 127.0.0.1:9333', () => {
      const config = buildSshBridgeArgs({
        vpsHost: 'vps.example.com',
        vpsUser: 'ubuntu',
        sshPort: 2222,
        identityFile: '/home/user/.ssh/id_ed25519',
      });

      assert.equal(config.isLoopbackOnly, true);
      assert.equal(config.forwardSpec, '127.0.0.1:9333:127.0.0.1:9333');
      assert.equal(config.target, 'ubuntu@vps.example.com');
      assert.ok(config.args.includes('-R'));
      assert.ok(config.args.includes('127.0.0.1:9333:127.0.0.1:9333'));
      assert.ok(config.args.includes('-N'));
      assert.ok(config.args.includes('-T'));
      assert.ok(config.args.includes('ExitOnForwardFailure=yes'));
      assert.ok(config.args.includes('ServerAliveInterval=15'));
      assert.ok(config.args.includes('-i'));
      assert.ok(config.args.includes('/home/user/.ssh/id_ed25519'));
    });

    it('throws error when VPS host is missing', () => {
      assert.throws(() => buildSshBridgeArgs({}), /VPS host is required/);
    });

    it('supports default options and custom ports', () => {
      const config = buildSshBridgeArgs({
        vpsHost: '1.2.3.4',
        localPort: 9444,
        remotePort: 9444,
      });

      assert.equal(config.forwardSpec, '127.0.0.1:9444:127.0.0.1:9444');
      assert.equal(config.target, '1.2.3.4');
    });
  });

  describe('checkBridgeStatus & probeLocalCdp', () => {
    it('returns structured status distinguishing CDP availability', async () => {
      const status = await checkBridgeStatus({ host: '127.0.0.1', port: 19333 }); // unreachable port
      assert.equal(status.success, true);
      assert.equal(status.local_cdp_online, false);
      assert.ok(status.status_summary.includes('waiting for user to open TradingView manually'));
      assert.ok(status.bridge_target.includes('VPS 127.0.0.1:19333'));
    });
  });

  describe('Bridge Supervisor Script Safety Audit', () => {
    it('bridge-supervisor.ps1 contains NO TradingView auto-launch, kill, or restart code', () => {
      const psScript = readFileSync(join(__dirname, '../scripts/bridge/bridge-supervisor.ps1'), 'utf-8');

      assert.doesNotMatch(psScript, /tv_launch/i);
      assert.doesNotMatch(psScript, /taskkill/i);
      assert.doesNotMatch(psScript, /TradingView\.exe/i);
      assert.doesNotMatch(psScript, /Get-AppxPackage/i);
      assert.match(psScript, /127\.0\.0\.1/);
    });

    it('bridge-supervisor.sh contains NO TradingView auto-launch, kill, or restart code', () => {
      const shScript = readFileSync(join(__dirname, '../scripts/bridge/bridge-supervisor.sh'), 'utf-8');

      assert.doesNotMatch(shScript, /tv_launch/i);
      assert.doesNotMatch(shScript, /pkill/i);
      assert.doesNotMatch(shScript, /killall/i);
      assert.doesNotMatch(shScript, /open -a/i);
      assert.doesNotMatch(shScript, /\/opt\/TradingView/i);
      assert.match(shScript, /127\.0\.0\.1/);
    });
  });
});
