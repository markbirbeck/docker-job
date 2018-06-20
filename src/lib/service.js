/**
 * We will:
 *
 *  * create a service with no restart policy and no replicas;
 *  * start the service with the specified number of replicas;
 *  * watch for completion of all replicas;
 *  * optionally output all the logs;
 *  * optionally remove the service.
 *
 * create:
 *  docker service create --replicas 0 --restart-condition none hello-world
 * start:
 *  docker service update --replicas 3 ${ID}
 * logs:
 *  docker service logs -f ${ID}
 * remove:
 *  docker service rm ${ID}
 */

const main = require('./main')

const options = require('./option-definitions')()
let config
if (options.sshHostname) {
  /**
   * Get the hostname and possibly a user name
   */

  let [ user, hostname ] = options.sshHostname.split('@')
  if (!hostname) {
    hostname = user
    user = undefined
  }
  config = {
    username: user,
    host: hostname
  }

  /**
   * If their is a private key then read it and add it to the config:
   */

  if (options.sshIdentityFile) {
    config.privateKey = require('fs').readFileSync(__dirname + '/' + options.sshIdentityFile, 'utf8')
  }

  /**
   * If the remote connection is via a socket then specify it:
   */

  if (options.sshRemote) {
    if (options.sshRemote[0] === '/') {
      config.socketPath = options.sshRemote
    }
  }
}

main(options, config)
