const querystring = require('querystring')
const commandLineArgs = require('command-line-args')

class Params {
  constructor(s) {
    /**
     * Parse the parameter as a set of comma-separated name/value
     * pairs:
     */

    const params = querystring.parse(s, ',')

    /**
     * Set our options to these values:
     */

    Object.assign(this, params)
  }
}

class ConfigParams extends Params {
  constructor(s) {
    /**
     * If there are no name/value pairs then treat the entire input as the source:
     */

    super(s.includes('=') ? s : `source=${s}`)

    /**
     * If there is no 'source' value...
     */

    if (!this.source) {

      /**
       * ...then check whether we have 'src' instead...
       */

      if (this.src) {
        this.source = this.src
        delete this.src
      }

      /**
       * ...otherwise we have an error:
       */

      else {
        throw new Error(`invalid argument "${s}" for "--config" flag: no source was found`)
      }
    }

    /**
     * If there is no 'target' value then use the name of the source, but in
     * the root folder:
     */

    if (!this.target) {
      this.target = `/${this.source}`
    }

    /**
     * The 'gid' and 'uid' values default to '0' (a string):
     */

    if (!this.gid) {
      this.gid = '0'
    }

    if (!this.uid) {
      this.uid = '0'
    }

    /**
     * The 'mode' value defaults to 292 (a number):
     */

    if (this.mode === undefined) {
      this.mode = 292
    }
    this.mode = Number(this.mode)
  }
}

const optionDefinitions = [
  { name: 'config', type: params => new ConfigParams(params), lazyMultiple: true },
  { name: 'detach', alias: 'd', type: Boolean },
  { name: 'env', alias: 'e', type: String, lazyMultiple: true },
  { name: 'host', alias: 'H', type: String },
  { name: 'name', type: String },
  { name: 'replicas', type: Number, defaultValue: 1 },
  { name: 'repeat-until', type: String },
  { name: 'repeat-while', type: String },
  { name: 'rm', type: Boolean },
  { name: 'showlogs', type: Boolean },
  { name: 'ssh-identity-file', type: String },
  { name: 'ssh-remote', type: String },
  { name: 'ssh-hostname', type: String },
  { name: 'volume', alias: 'v', type: String, lazyMultiple: true },
  { name: 'image', type: String, defaultOption: true }
]

const options = (argv) => {
  const config = commandLineArgs(optionDefinitions, { argv, camelCase: true,
    stopAtFirstUnknown: true })

  if (config.detach && config.showlogs) {
    throw new Error('Cannot set both --detach and --showlogs')
  }

  if (config.detach && config.rm) {
    throw new Error('Cannot set both --detach and --rm')
  }

  /**
   * If there are values in the 'unknown' bucket...
   */

  if (config._unknown) {

    /**
     * ...then either we have unknown options (which is an error)...
     */

    if (!config.image) {
      throw new Error(`UNKNOWN_OPTION: Unknown option: ${config._unknown[0]}`)
    }

    /**
     * ...or we have some parameters to pass to the image:
     */

    config.args = config._unknown
    delete config._unknown
  } else {
    config.args = []
  }
  return config
}

module.exports = options
