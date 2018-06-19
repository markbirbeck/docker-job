const commandLineArgs = require('command-line-args')
const optionDefinitions = [
  { name: 'detach', alias: 'd', type: Boolean },
  { name: 'name', type: String },
  { name: 'replicas', type: Number, defaultValue: 1 },
  { name: 'repeat-until', type: String },
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
