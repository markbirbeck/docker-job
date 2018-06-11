#!/usr/bin/env node
const tap = require('tap')

/**
 * Get a function that returns the options for our CLI app:
 */

const options = require('../../src/lib/option-definitions')

tap.test('cli', t => {
  t.test('simple example with basic parameters', t => {
    const config = options('--replicas 7 hello-world'.split(' '))
    t.same(config, {
      replicas: 7,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('default value for replicas', t => {
    const config = options(['hello-world'])
    t.same(config, {
      replicas: 1,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('detach', t => {
    const config = options('--detach hello-world'.split(' '))
    t.same(config, {
      replicas: 1,
      detach: true,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('logs', t => {
    const config = options('--showlogs hello-world'.split(' '))
    t.same(config, {
      replicas: 1,
      showlogs: true,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('name', t => {
    const config = options('--name myservice hello-world'.split(' '))
    t.same(config, {
      replicas: 1,
      name: 'myservice',
      image: 'hello-world'
    })
    t.end()
  })
  t.end()
})

// { Name: 'test',
//   Labels: {},
//   TaskTemplate:
//    { ContainerSpec: { Image: 'hello-world', Isolation: 'default' },
//      RestartPolicy: { Condition: 'none', MaxAttempts: 0 },
//      ForceUpdate: 0,
//      Runtime: 'container' },
//   Mode: { Replicated: { Replicas: 3 } } }
