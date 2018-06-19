const dockerEngine = require('docker-engine')

class ServiceClient {
  constructor(builder) {
    this.client = builder.engine
  }

  /**
   * Get info about a service:
   */

  async inspect(id) {
    return await this.client.Service.ServiceInspect({id});
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
     * Now we can update the service with the new spec:
     */

    return await this.client.Service
    .ServiceUpdate({
      id,
      body: taskSpec,
      version: '' + version
    });
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
