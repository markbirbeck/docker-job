# docker-job

Bare minimum is to provide the name of an image, which will be launched on your local Docker Swarm:

```shell
node ./src/lib/service.js hello-world
```

The app will provide an identifier for the service, and then wait until it completes before exiting. To show the logs on exit use the `--showlogs` option:

```shell
node ./src/lib/service.js --showlogs hello-world
```

Alternatively, to exit immediately without waiting for completion, use the detach option (`--detach` or `-d`):

```shell
node ./src/lib/service.js --detach hello-world
```

To launch a number of instances of the image, add the `--replicas` option:

```shell
node ./src/lib/service.js --replicas 5 hello-world
```

Again, the `--showlogs` option can be used to show the logs at the end, as each instance finishes. (This is different to the way `docker service logs` behaves, where the logs from each instance are interleaved by time.)
