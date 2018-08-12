const ServiceClient = require('./service-client')

const main = async (options, config) => {
  if (options.host) {
    process.env.DOCKER_HOST = options.host
  }

  const serviceClient = await new ServiceClient.Builder(config).build()
  let id;

  try {
    id = await serviceClient.create(options.image, options.args, options.name,
      options.env, options.volume, options.config)
  } catch(e) {
    throw new Error(`Failed to create service: ${e}`)
  }
  console.log(id)

  /**
   * Function to call when polled task is complete:
   */

  const onTaskComplete = async task => {
    let shouldRepeat = false

    /**
     * If the task is to be repeated until a certain string is found (or whilst
     * a certain string is *not* found) then check for that in the logs:
     */

    const repeat = options.repeatUntil || options.repeatWhile
    if (repeat) {
      const logs = await serviceClient.logsTask(task.ID)
      const until = options.repeatUntil ? true : false
      const re = new RegExp(repeat)
      const m = logs.match(re)
      if (until ? !m : m) {
        shouldRepeat = true
      }
    }
    return shouldRepeat
  }

  let shouldRepeat = false
  do {
    let response

    try {
      response = await serviceClient.start(id, options.replicas)
    } catch(e) {
      throw new Error(`Failed to start service: ${e}`)
    }

    if (response.Warnings !== null) throw new Error(response)

    if (!options.detach) {
      shouldRepeat = await serviceClient.poll(id, onTaskComplete, options.showlogs)
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
