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
      args: [],
      replicas: 7,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('default value for replicas', t => {
    const config = options(['hello-world'])
    t.same(config, {
      args: [],
      replicas: 1,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('detach', t => {
    const config = options('--detach hello-world'.split(' '))
    t.same(config, {
      args: [],
      replicas: 1,
      detach: true,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('logs', t => {
    const config = options('--showlogs hello-world'.split(' '))
    t.same(config, {
      args: [],
      replicas: 1,
      showlogs: true,
      image: 'hello-world'
    })
    t.end()
  })

  t.test('name', t => {
    const config = options('--name myservice hello-world'.split(' '))
    t.same(config, {
      args: [],
      replicas: 1,
      name: 'myservice',
      image: 'hello-world'
    })
    t.end()
  })

  t.test('throw if both detach AND showlogs are set', t => {
    t.throws(() => options('--detach --showlogs hello-world'.split(' ')),
      new Error('Cannot set both --detach and --showlogs'))
    t.end()
  })

  t.test('SSH tunneling', t => {
    const config = options(
      (
        '--ssh-remote /var/run/docker.sock ' +
        '--ssh-identity-file ./docker-swarm.pem ' +
        '--ssh-hostname docker@amazonaws.com ' +
        'hello-world'
      )
      .split(' '))
    t.same(config, {
      image: 'hello-world',
      args: [],
      replicas: 1,
      sshHostname: 'docker@amazonaws.com',
      sshIdentityFile: './docker-swarm.pem',
      sshRemote: '/var/run/docker.sock'
    })
    t.end()
  })

  t.test('args for image', t => {
    const config = options(
      (
        '--showlogs ' +
        '--repeat-until done ' +
        '--replicas 2 ' +
        'alpine date'
      )
      .split(' '))
    t.same(config, {
      image: 'alpine',
      args: ['date'],
      repeatUntil: 'done',
      replicas: 2,
      showlogs: true
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
