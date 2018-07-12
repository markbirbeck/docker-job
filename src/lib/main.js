const ServiceClient = require('./service-client')

const main = async (options, config) => {
  const serviceClient = await new ServiceClient.Builder(config).build()
  let id;

  try {
    id = await serviceClient.create(options.image, options.args, options.name, options.env, options.volume)
  } catch(e) {
    throw new Error(`Failed to create service: ${e}`)
  }
  console.log(id)

  let shouldRepeat

  do {
    shouldRepeat = false
    let response

    try {
      response = await serviceClient.start(id, options.replicas)
    } catch(e) {
      throw new Error(`Failed to start service: ${e}`)
    }

    if (response.Warnings !== null) throw new Error(response)

    if (!options.detach) {
      await serviceClient.poll(id, async task => {
        /**
         * Once completed get the task's details and use them to get the logs:
         */

        let logs
        if (options.showlogs || options.repeatUntil || options.repeatWhile) {
          const state = await serviceClient.inspectTask(task.ID)
          logs = await serviceClient.logsContainer(state.Status.ContainerStatus.ContainerID)
        }

        if (options.showlogs) {
          console.log(logs)
        }

        /**
         * If the task is to be repeated until a certain string is found (or whilst
         * a certain string is *not* found) then check for that in the logs:
         */

        const repeat = options.repeatUntil || options.repeatWhile
        if (repeat) {
          const until = options.repeatUntil ? true : false
          const re = new RegExp(repeat)
          const m = logs.match(re)
          if (until ? !m : m) {
            shouldRepeat = true
          }
        }
      })
    }
  } while (shouldRepeat)

  if (options.rm) {
    try {
      await serviceClient.delete(id)
    } catch(e) {
      throw new Error(`Failed to delete service: ${e}`)
    }
  }
}

module.exports = main
