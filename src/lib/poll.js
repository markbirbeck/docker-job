/**
 * Repeatedly poll until a certain state is reached:
 */

const poll = (fn, id, delay=500) => {
  return new Promise((resolve, reject) => {
    const poller = async () => {
      const state = await fn(id);

      switch (state) {
        case 'complete':
          resolve(state)
          break;

        case 'failed':
          reject(new Error('The task exited with an error code.'))
          break

        case 'rejected':
          reject(new Error('Unable to launch service due to bad paramters. Check the image exists.'))
          break

        case 'orphaned':
          reject(new Error('The node was down too long.'))
          break

        case 'accepted':
        case 'assigned':
        case 'new':
        case 'pending':
        case 'preparing':
        case 'ready':
        case 'remove':
        case 'running':
        case 'shutdown':
        case 'starting':
          setTimeout(poller, delay);
          break;

        default:
          reject(new Error(`Unknown state: '${state}'`))
          break
      }
    };
    poller();
  });
};

module.exports = { poll };
