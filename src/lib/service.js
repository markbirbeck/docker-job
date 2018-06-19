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

const dockerEngine = require('docker-engine');

class Service {
  constructor(builder) {
    this.client = builder.engine
  }

  static get Builder() {
    class Builder {
      constructor(config) {
        this.config = config
      }

      async build() {
        this.engine = await dockerEngine(this.config)
        return new Service(this)
      }
    }
    return Builder
  }
}

(async () => {
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
  const serviceClient = await new Service.Builder(config).build()

  /**
   * Get info about a service:
   */

  const inspectService = async id => {
    return await serviceClient.client.Service.ServiceInspect({id});
  }

  /**
   * Get a list of tasks for a service:
   */

  const taskList = async (id) => {
    return await serviceClient.client.Task
    .TaskList({
      filters: `{"service": {"${id}": true}}`
    });
  }

  /**
   * Get the state of a task:
   */

  const taskState = async (id) => {
    const state = await serviceClient.client.Task
    .TaskInspect({id});

    return state.Status.State
  }

  /**
   * Create a service:
   */

  const createService = async (image, name) => {
    const defaultSpec = {
      TaskTemplate: {
        ContainerSpec: {
          Image: image
        },
        RestartPolicy: {
          Condition: 'none'
        }
      },
      Mode: {
        Replicated: {
          Replicas: 0
        }
      }
    };

    /**
     * The name is optional, but if it is present then check that a service
     * with this name doesn't already exist:
     */

    if (name) {

      /**
       * If we can successfully load information about a service by this name
       * then throw an error because it obviously already exists:
       */

      try {
        await serviceClient.client.Service.ServiceInspect({id: name});
        throw new Error('name conflicts with an existing object')
      }

      /**
       * If the error was anything other than being unable to find the service
       * then rethrow it:
       */

      catch(e) {
        /**
         * NOTE: There's an oddity here that doing a string comparison always
         * returns false, but using '.includes()' works ok. So change this with
         * care!
         */

        if (!e.message.includes(`service ${name} not found`)) {
          throw e
        }
      }
    }

    /**
     * Otherwise we're good to go:
     */

    const service = await serviceClient.client.Service.ServiceCreate({
      body: {
        Name: name,
        ...defaultSpec
      }
    });

    return service.ID;
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

  /**
   * Access logs for a container:
   */

  const logsContainer = async id => {
    console.log('About to get logs for container:', id);
    return await serviceClient.client.Container
    .ContainerLogs({
      id,
      stdout: true, stderr: true, follow: false
    });
  };

  /**
   * Run a service:
   */

  const startService = async (id, replicas) => {
    /**
     * To update a service we need the current spec and version number:
     */

    const info = await inspectService(id);
    const version = info.Version.Index;
    const spec = info.Spec;

    /**
     * Next we create a new spec with a modified replicas value:
     */

    const taskSpec = {
      ...spec,
      Mode: {Replicated: {Replicas: replicas}}
    };

    /**
     * Now we can update the service with the new spec:
     */

    return await serviceClient.client.Service
    .ServiceUpdate({
      id,
      body: taskSpec,
      version: '' + version
    });
  }

  const main = async () => {
    let id;

    try {
      id = await createService(options.image, options.name);
    } catch(e) {
      console.error(`Failed to create service: ${e}`)
      process.exit(-1)
    }

    let response;

    try {
      response = await startService(id, options.replicas);
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

        const tasks = await taskList(id);

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
              const state = await serviceClient.client.Task.TaskInspect({id: task.ID});
              const logs = await logsContainer(state.Status.ContainerStatus.ContainerID);

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
