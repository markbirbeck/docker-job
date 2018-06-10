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

        case 'assigned':
        case 'pending':
        case 'preparing':
        case 'ready':
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
