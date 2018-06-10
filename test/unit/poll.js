const tap = require('tap')

const uut = require('../../src/lib/poll')

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
