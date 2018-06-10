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

(async () => {
  const client = await dockerEngine()
  const { poll } = require('./poll');

  /**
   * Get info about a service:
   */

  const inspectService = async id => {
    return await client.Service.ServiceInspect({id});
  }

  /**
   * Get a list of tasks for a service:
   */

  const taskList = async (id) => {
    return await client.Task
    .TaskList({
      filters: `{"service": {"${id}": true}}`
    });
  }

  /**
   * Get the state of a task:
   */

  const taskState = async (id) => {
    const state = await client.Task
    .TaskInspect({id});

    return state.Status.State
  }

  /**
   * Create a service:
   */

  const createService = async (name, image) => {
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
     * If we can successfully load information about a service by this name
     * then throw an error because it obviously already exists:
     */

    try {
      await client.Service.ServiceInspect({id: name});
      throw new Error('name conflicts with an existing object')
    }

    /**
     * If the error was anything other than being unable to find the service
     * then rethrow it:
     */

    catch(e) {
      if (e.message !== 'Not Found') throw e
    }

    /**
     * Otherwise we're good to go:
     */

    const service = await client.Service.ServiceCreate({
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
    return await client.Service
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
    return await client.Container
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

    return await client.Service
    .ServiceUpdate({
      id,
      body: taskSpec,
      version: '' + version
    });
  }

  const main = async (name, image, replicas=1, showlogs=false) => {
    let id;

    try {
      id = await createService(name, image);
    } catch(e) {
      console.error(`Failed to create service: ${e}`)
      process.exit(-1)
    }

    let response;

    try {
      response = await startService(id, replicas);
      console.log(id);
    } catch(e) {
      console.error(`Failed to start service: ${e}`)
      process.exit(-1)
    }

    if (response.Warnings === null) {

      /**
       * Get a list of the tasks for this service:
       */

      const tasks = await taskList(id);

      /**
       * Now poll each task until it has completed:
       */

      for (const task of tasks) {
        await poll(taskState, task.ID);

        /**
         * Once completed get the task's details and use them to get the logs:
         */

        if (showlogs) {
          const state = await client.Task.TaskInspect({id: task.ID});
          const logs = await logsContainer(state.Status.ContainerStatus.ContainerID);

          console.log(logs)
        }
      }
    } else {
      throw new Error(response);
    }
  }

  await main('test', 'hello-world', 3);
})()
