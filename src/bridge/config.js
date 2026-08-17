/**
 * Bridge configuration helpers for PC-to-VPS reverse SSH tunnel.
 */

export const DEFAULT_CDP_PORT = 9333;
export const DEFAULT_LOOPBACK = '127.0.0.1';

/**
 * Builds safe SSH command-line arguments for establishing a reverse CDP bridge.
 * Enforces loopback binding on both the remote (VPS) and local (PC) interfaces.
 */
export function buildSshBridgeArgs(options = {}) {
  const vpsHost = options.vpsHost || options.host;
  if (!vpsHost) {
    throw new Error('VPS host is required to build bridge arguments');
  }

  const vpsUser = options.vpsUser || options.user;
  const sshPort = Number(options.sshPort || options.port) || 22;
  const identityFile = options.identityFile || options.keyPath;
  const localPort = Number(options.localPort) || DEFAULT_CDP_PORT;
  const remotePort = Number(options.remotePort) || DEFAULT_CDP_PORT;

  // Strict enforcement: bind remote and local only to loopback 127.0.0.1
  const forwardSpec = `${DEFAULT_LOOPBACK}:${remotePort}:${DEFAULT_LOOPBACK}:${localPort}`;

  const args = [
    '-N', // Do not execute a remote command
    '-T', // Disable pseudo-terminal allocation
    '-R', forwardSpec,
    '-p', String(sshPort),
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=3',
    '-o', 'ExitOnForwardFailure=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
  ];

  if (identityFile) {
    args.push('-i', identityFile);
  }

  const target = vpsUser ? `${vpsUser}@${vpsHost}` : vpsHost;
  args.push(target);

  return {
    forwardSpec,
    args,
    target,
    remotePort,
    localPort,
    isLoopbackOnly: true,
  };
}
