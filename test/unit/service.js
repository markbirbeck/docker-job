const tap = require('tap')

const uut = require('../../src/lib/service')

tap.test('service', t => {
  t.test('regression #15', t => {
    /**
     * Create a service:
     */

    const id = await createService('hello-world', 'some-random-name');

    /**
     * Now create it again and ensure it fails:
     */

    /**
     * Remove it, so as not to clutter things up:
     */


  })
})
