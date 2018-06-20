const dockerEngine = require('docker-engine')
const { poll } = require('./poll')

class ServiceClient {
  constructor(builder) {
    this.client = builder.engine
  }

  /**
   * Create a service:
   */

  async create(image, name) {
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
    }

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
        await this.inspect({id: name});
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

    const service = await this.client.Service.ServiceCreate({
      body: {
        Name: name,
        ...defaultSpec
      }
    });

    return service.ID;
  }

  /**
   * Get info about a service:
   */

  async inspect(id) {
    return await this.client.Service.ServiceInspect({id});
  }

  /**
   * Get info about a task:
   */

  async inspectTask(id) {
    return await this.client.Task.TaskInspect({id});
  }

  /**
   * Access logs for a service:
   */

  async logs(id) {
    return await this.client.Service
    .ServiceLogs({
      id,
      stdout: true, stderr: true, follow: false
    })
  }

  /**
   * Access logs for a container:
   */

  async logsContainer(id) {
    return await this.client.Container
    .ContainerLogs({
      id,
      stdout: true, stderr: true, follow: false
    })
  }

  /**
   * Poll a service until all of its tasks are complete:
   */

  async poll(id, cb) {
    let foundTask = false

    do {
      /**
       * Get a list of the tasks for this service:
       */

      const tasks = await this.taskList(id)

      for (const task of tasks) {
        /**
         * Since old tasks will be in the list we need to check for a
         * matching ForceUpdate value to find the most recent:
         */

        if (task.Spec.ForceUpdate !== this.forceUpdate) {
          continue
        }

        /**
         * However, it's possible that the last task run is not yet in
         * the list, so we also need to be prepared to try again. We do
         * this by tracking with a 'foundTask' flag:
         */

        foundTask = true

        /**
         * If we found the latest task then we can now do the polling:
         */

        try {
          await poll(this.taskState.bind(this), task.ID)
          await cb(task)
        } catch(e) {
          process.exitCode = -1
          console.error(`${task.ID}: ${e.message}`)
        }
      }
    } while (!foundTask)
  }

  /**
   * Run an image as a service:
   */

  async run(image, replicas, name) {
    let id
    try {
      id = await this.create(image, name)
    } catch(e) {
      throw new Error(`Failed to create service: ${e}`)
    }

    let response
    try {
      response = await this.start(id, replicas)
    } catch(e) {
      throw new Error(`Failed to start service: ${e}`)
    }

    if (response.Warnings !== null) throw new Error(response)

    return id
  }

  /**
   * Run a service:
   */

  async start(id, replicas) {
    /**
     * To update a service we need the current spec and version number:
     */

    const info = await this.inspect(id);
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
     * To ensure that the update is processed by the Swarm we need to increment
     * the ForceUpdate value:
     */

    ++taskSpec.TaskTemplate.ForceUpdate

    /**
     * Finally, keep track of this value for later when we're trying to find
     * the last task that ran:
     */

    this.forceUpdate = taskSpec.TaskTemplate.ForceUpdate

    /**
     * Now we can update the service with the new spec:
     */

    return await this.client.Service
    .ServiceUpdate({
      id,
      body: taskSpec,
      version: '' + version
    });
  }

  /**
   * Get a list of tasks for a service:
   */

  async taskList(id) {
    return await this.client.Task
    .TaskList({
      filters: `{"service": {"${id}": true}}`
    })
  }

  /**
   * Get the state of a task:
   */

  async taskState(id) {
    const state = await this.inspectTask(id)

    return state.Status.State
  }

  static get Builder() {
    class Builder {
      constructor(config) {
        this.config = config
      }

      async build() {
        this.engine = await dockerEngine(this.config)
        return new ServiceClient(this)
      }
    }
    return Builder
  }
}

module.exports = ServiceClient
