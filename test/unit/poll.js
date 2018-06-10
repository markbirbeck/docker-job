const tap = require('tap')

const uut = require('../../src/lib/poll')

/**
 * A little helper function that creates a generator for a list of
 * items:
 */

const stateGenerator = function* (states) {
  for (const state of states) {
    yield state
  }
}

tap.test('poll', t => {
  tap.test('status complete', async t => {
    const p = uut.poll(async id => {

      /**
       * Check that we get back the ID that we passed in:
       */

      t.equal(id, 'abcdef')

      /**
       * Return the status for 'complete':
       */

      return 'complete'
    }, 'abcdef', 1)

    /**
     * Check that the result is the same as the original state:
     */

    t.equal(await p, 'complete')
    t.end()
  })

  tap.test('status transitions', async t => {
    /**
     * We need to provide the polling function with a set of states that
     * end with 'complete'. The polling function shouldn't resolve until
     * it gets that final state:
     */

    const states = ['pending', 'running', 'complete']
    let count = states.length
    const gen = stateGenerator(states)
    const p = uut.poll(async id => {

      /**
       * Check that we get back the ID that we passed in:
       */

      t.equal(id, 'ID')

      /**
       * Keep track of the number of times through so that we know we've processed
       * all of the states:
       */

      count--

      /**
       * Return the next status:
       */

      return gen.next().value
    }, 'ID', 1)

    /**
     * Check that the polling function was called the correct number
     * of times (i.e., count is zero) and that the result is 'complete':
     */

    t.equal(await p, 'complete')
    t.equal(count, 0)
    t.end()
  })

  tap.test('status unknown', async t => {
    const p = uut.poll(async id => {

      /**
       * Check that we get back the ID that we passed in:
       */

      t.equal(id, 'ghijkl')

      /**
       * Return some unknown status:
       */

      return 'unknown state'
    }, 'ghijkl', 1)

    /**
     * Check that the polling rejects with the value of the
     * unknown state:
     */

    try {
      await p
    } catch(e) {
      t.equal(e.message, 'Unknown state: \'unknown state\'')
    }
  })
  t.end()
})
