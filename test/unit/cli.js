#!/usr/bin/env node
const tap = require('tap')
const commandLineArgs = require('command-line-args')

/**
 * Create the option definitions for our CLI app:
 */

const optionDefinitions = [
  { name: 'replicas', type: Number },
  { name: 'image', type: String, defaultOption: true }
]

tap.test('cli', t => {
  t.test('simple example with basic parameters', t => {
    process.argv = [
      '/usr/local/bin/node',
      '/usr/src/app/test/unit/cli.js',
      '--replicas', '7',
      'hello-world'
    ]
    t.same(commandLineArgs(optionDefinitions), {
      replicas: 7, image: 'hello-world'
    })
    t.end()
  })

  t.test('default value for replicas', t => {
    process.argv = [
      '/usr/local/bin/node',
      '/usr/src/app/test/unit/cli.js',
      'hello-world'
    ]
    t.same(commandLineArgs(optionDefinitions), {
      replicas: 1, image: 'hello-world'
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
