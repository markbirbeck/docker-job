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
      }
    };
    poller();
  });
};

module.exports = { poll };
