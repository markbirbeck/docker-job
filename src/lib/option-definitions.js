const commandLineArgs = require('command-line-args')

/**
 * dj \
 *   --ssh-remote /var/run/docker.sock \
 *   --ssh-identify-file ./docker-swarm.pem \
 *   --ssh-hostname docker@ec2-54-183-237-159.us-west.compute-1.amazonaws.com \
 *     hello-world
 */

const optionDefinitions = [
  { name: 'detach', alias: 'd', type: Boolean },
  { name: 'name', type: String },
  { name: 'replicas', type: Number, defaultValue: 1 },
  { name: 'showlogs', type: Boolean },
  { name: 'ssh-identity-file', type: String },
  { name: 'ssh-remote', type: String },
  { name: 'ssh-hostname', type: String },
  { name: 'image', type: String, defaultOption: true }
]

const options = (argv) => {
  const config = commandLineArgs(optionDefinitions, { argv, camelCase: true })

  if (config.detach && config.showlogs) {
    throw new Error('Cannot set both --detach and --showlogs')
  }
  return config
}

module.exports = options
