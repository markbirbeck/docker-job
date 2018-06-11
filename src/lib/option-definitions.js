const commandLineArgs = require('command-line-args')

const optionDefinitions = [
  { name: 'detach', alias: 'd', type: Boolean },
  { name: 'name', type: String },
  { name: 'replicas', type: Number, defaultValue: 1 },
  { name: 'showlogs', type: Boolean },
  { name: 'image', type: String, defaultOption: true }
]

const options = (argv) => {
  return commandLineArgs(optionDefinitions, { argv })
}

module.exports = options
