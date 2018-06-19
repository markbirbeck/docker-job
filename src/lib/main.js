const ServiceClient = require('./service-client')

const main = async (options, config) => {
  const serviceClient = await new ServiceClient.Builder(config).build()

  const id = await serviceClient.run(options.image, options.replicas, options.name)
  console.log(id)

  if (!options.detach) {
    await serviceClient.poll(id, async task => {
      /**
       * Once completed get the task's details and use them to get the logs:
       */

      if (options.showlogs) {
        const state = await serviceClient.inspectTask(task.ID)
        const logs = await serviceClient.logsContainer(state.Status.ContainerStatus.ContainerID)

        console.log(logs)
      }
    })
  }
}

module.exports = main
