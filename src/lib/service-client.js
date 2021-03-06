const debug = require('debug')('docker-job:service-client')
const dockerEngine = require('docker-engine')
const { poll } = require('./poll')

class ServiceClient {
  constructor(builder) {
    this.client = builder.engine
  }

  /**
   * Create a service:
   */

  async create(image, args, name, env, volume, config) {
    const defaultSpec = {
      TaskTemplate: {
        ContainerSpec: {
          Image: image,
          Args: args,
          Env: env,
          Configs: config && await Promise.all(config.map(
            async params => {

              /**
               * Lookup the config's ID from the name:
               */

              const configList = await this.client.ConfigList({
                filters: `{"name": {"${params.source}": true}}`
              })
              if (!configList.length) {
                throw new Error(`config not found: ${params.source}`)
              }
              const ConfigID = configList[0].ID

              /**
               * Finally, return the structure needed for a config when creating
               * a service:
               */

              return {
                File: {
                  Name: params.target,
                  UID: params.uid,
                  GID: params.gid,
                  Mode: params.mode
                },
                ConfigID,
                ConfigName: params.source
              }
            }
          )),
          Mounts: volume && volume.map(
            v => {
              const [Source, Target] = v.split(':')

              if (!Target) {
                throw new Error('Only bound volumes are supported')
              }

              return {
                Source,
                Target,
                type: 'bind'
              }
            }
          )
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

    const service = await this.client.ServiceCreate({
      body: {
        Name: name,
        ...defaultSpec
      }
    });

    return service.ID;
  }

  /**
   * Delete a service:
   */

  delete(id) {
    return this.client.ServiceDelete({id});
  }

  /**
   * Get info about a service:
   */

  async inspect(id) {
    return await this.client.ServiceInspect({id});
  }

  /**
   * Get info about a task:
   */

  async inspectTask(id) {
    return await this.client.TaskInspect({id});
  }

  /**
   * Access logs for a service:
   */

  async logs(id, follow = false) {
    return await this.client
    .ServiceLogs({
      id,
      stdout: true, stderr: true, follow
    })
  }

  /**
   * Access logs for a container:
   */

  async logsContainer(id, follow = false) {
    return await this.client
    .ContainerLogs({
      id,
      stdout: true, stderr: true, follow
    })
  }

  /**
   * Access logs for a task:
   */

  async logsTask(id, follow = false) {
    return await this.client
    .TaskLogs({
      id,
      stdout: true, stderr: true, follow
    })
  }

  /**
   * Poll a service until all of its tasks are complete:
   */

  async poll(id, cb, showlogs = false) {
    let ret
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

        let res
        try {
          /**
           * If we are to show the logs then get a stream from the Docker Engine:
           */

          if (showlogs) {
            res = await this.logsTask(task.ID, true)
            res.on('data', chunk => {
              const STREAM_TYPE_OFFSET = 0
              const FRAME_SIZE_OFFSET = 4
              const STREAM_HEADER_SIZE = 8

              /**
               * Establish the frame of text:
               */

              const frameSize = chunk.readUInt32BE(FRAME_SIZE_OFFSET)
              const frame = chunk.toString('utf8', STREAM_HEADER_SIZE, STREAM_HEADER_SIZE + frameSize)

              /**
               * Work out where to send the logs to (stderr or stdout)
               */

              let streamType = chunk.readInt8(STREAM_TYPE_OFFSET)
              switch (streamType) {
                /**
                 * stdin goes to stdout:
                 */

                case 0:
                  streamType = 'stdout'
                  break

                /**
                 * stdout goes to stdout:
                 */

                case 1:
                  streamType = 'stdout'
                  break

                /**
                 * stderr goes to stderr:
                 */

                case 2:
                  streamType = 'stderr'
                  break
              }

              /**
               * Write the frame to the relevant stream:
               */

              process[streamType].write(frame)
            })
          }
          await poll(this.taskState.bind(this), task.ID)
          ret = await cb(task)
        } catch(e) {
          process.exitCode = -1
          /**
           * If we've had an error then get the task's status for the error
           * message:
           */

          const state = await this.inspectTask(task.ID)
          console.error(`${task.ID}: ${e.message}: "${state.Status.Err} (${state.Status.State})"`)
        } finally {
          if (res) {
            res.destroy()
          }
        }
      }
    } while (!foundTask)
    return ret
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

  async start(id, replicas, pull) {
    /**
     * To update a service we need the current spec and version number:
     */

    const info = await this.inspect(id);
    const version = info.Version.Index;
    const spec = info.Spec;

    /**
     * The image might need to be pulled first:
     */

    if (pull) {
      const fromImage = info.Spec.TaskTemplate.ContainerSpec.Image
      debug(`About to pull ${fromImage}`)
      const pulled = await this.client.ImageCreate({ fromImage })
      debug(`Pull result: ${pulled}`)
    }

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

    return await this.client
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
    return await this.client
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
