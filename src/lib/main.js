const ServiceClient = require('./service-client')

const main = async (options, config) => {
  const serviceClient = await new ServiceClient.Builder(config).build()
  let shouldRepeat = false

  const id = await serviceClient.run(options.image, options.replicas, options.name)
  console.log(id)

  if (!options.detach) {
    await serviceClient.poll(id, async task => {
      /**
       * Once completed get the task's details and use them to get the logs:
       */

      let logs
      if (options.showlogs || options.repeatUntil) {
        const state = await serviceClient.inspectTask(task.ID)
        logs = await serviceClient.logsContainer(state.Status.ContainerStatus.ContainerID)
      }

      if (options.showLogs) {
        console.log(logs)
      }

      /**
       * If the task is to be repeated until a certain string is found then
       * check for that in the logs:
       */

      if (options.repeatUntil) {
        const re = new RegExp(options.repeatUntil)
        const m = logs.match(re)
        if (!m) {
          shouldRepeat = true
        }
      }
    })
  }
}

module.exports = main
