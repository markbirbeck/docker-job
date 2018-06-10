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
  t.end()
})
