const ServiceClient = require('./service-client')
const { poll } = require('./poll');

const main = async (options, config) => {
  const serviceClient = await new ServiceClient.Builder(config).build()
  let id;

  try {
    id = await serviceClient.create(options.image, options.name);
  } catch(e) {
    throw new Error(`Failed to create service: ${e}`)
  }

  let response;

  try {
    response = await serviceClient.start(id, options.replicas);
    console.log(id);
  } catch(e) {
    throw new Error(`Failed to start service: ${e}`)
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
          await poll(serviceClient.taskState.bind(serviceClient), task.ID);

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

module.exports = main
