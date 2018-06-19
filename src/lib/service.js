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

const ServiceClient = require('./service-client')

;(async () => {
  const { poll } = require('./poll');
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
  const serviceClient = await new ServiceClient.Builder(config).build()

  /**
   * Get the state of a task:
   */

  const taskState = async (id) => {
    const state = await serviceClient.client.Task
    .TaskInspect({id});

    return state.Status.State
  }

  /**
   * Access logs for a service:
   */

  const logsService = async id => {
    return await serviceClient.client.Service
    .ServiceLogs({
      id,
      stdout: true, stderr: true, follow: false
    });
  };

  const main = async () => {
    let id;

    try {
      id = await serviceClient.create(options.image, options.name);
    } catch(e) {
      console.error(`Failed to create service: ${e}`)
      process.exit(-1)
    }

    let response;

    try {
      response = await serviceClient.start(id, options.replicas);
      console.log(id);
    } catch(e) {
      console.error(`Failed to start service: ${e}`)
      process.exit(-1)
    }

    if (response.Warnings === null) {
      if (!options.detach) {
        /**
         * Get a list of the tasks for this service:
         */

        const tasks = await serviceClient.taskList(id);

        /**
         * Now poll each task until it has completed:
         */

        for (const task of tasks) {
          try {
            await poll(taskState, task.ID);

            /**
             * Once completed get the task's details and use them to get the logs:
             */

            if (options.showlogs) {
              const state = await serviceClient.inspectTask(task.ID);
              const logs = await serviceClient.logsContainer(state.Status.ContainerStatus.ContainerID)

              console.log(logs)
            }
          } catch(e) {
            process.exitCode = -1
            console.error(`${task.ID}: ${e.message}`)
          }
        }
      }
    } else {
      throw new Error(response);
    }
  }

  await main();
})()
