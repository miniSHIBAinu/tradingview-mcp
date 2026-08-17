import { register } from '../router.js';
import { checkBridgeStatus } from '../../bridge/status.js';
import { buildSshBridgeArgs } from '../../bridge/config.js';

register('bridge', {
  description: 'Manage and inspect the PC-to-VPS reverse CDP bridge',
  subcommands: new Map([
    ['status', {
      description: 'Check local TradingView CDP status and bridge reachability',
      options: {
        port: { type: 'string', short: 'p', description: 'CDP port (default 9333)' },
      },
      handler: (opts) => checkBridgeStatus({
        port: opts.port ? Number(opts.port) : undefined,
      }),
    }],
    ['config', {
      description: 'Generate safe SSH reverse tunnel command arguments',
      options: {
        host: { type: 'string', short: 'H', description: 'VPS hostname or IP address' },
        user: { type: 'string', short: 'u', description: 'VPS SSH username' },
        port: { type: 'string', short: 'p', description: 'SSH port (default 22)' },
        key: { type: 'string', short: 'k', description: 'Path to SSH private key' },
      },
      handler: (opts) => {
        if (!opts.host) {
          throw new Error('VPS host is required. Specify --host <vps_ip>');
        }
        const config = buildSshBridgeArgs({
          vpsHost: opts.host,
          vpsUser: opts.user,
          sshPort: opts.port ? Number(opts.port) : undefined,
          identityFile: opts.key,
        });
        return {
          success: true,
          command: `ssh ${config.args.join(' ')}`,
          forwardSpec: config.forwardSpec,
          isLoopbackOnly: config.isLoopbackOnly,
        };
      },
    }],
  ]),
});
