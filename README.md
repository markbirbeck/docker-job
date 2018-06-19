# docker-job

Run one-shot services on a Docker Swarm.

When using a Docker Swarm, if a container is launched with `docker run` it is not actually run by the swarm--it is run as a *standalone container*. This means that the lifecycle of the container's execution is not managed by the orchestrator or scheduler.

The `docker-job` command-line application launches an image by wrapping it in a service and running it. Options are available to determine whether to output the logs when the job has completed, run more than one replica at the same time, and so on.

# Installation

Ensure you actually have a Docker Swarm, as per [](https://docs.docker.com/engine/swarm/swarm-mode/).

Install `docker-job` from NPM with:

```shell
npm i -g docker-job
```

# Usage

Bare minimum is to provide the name of an image, which will be launched on your local Docker Swarm:

```shell
dj hello-world
```

The app will provide an identifier for the service, and then wait until it completes before exiting. To show the logs on exit use the `--showlogs` option:

```shell
dj --showlogs hello-world
```

Alternatively, to exit immediately without waiting for completion, use the detach option (`--detach` or `-d`):

```shell
dj --detach hello-world
```

To launch a number of instances of the image, add the `--replicas` option:

```shell
dj --replicas 5 hello-world
```

Again, the `--showlogs` option can be used to show the logs at the end, as each instance finishes. (This is different to the way `docker service logs` behaves, where the logs from each instance are interleaved by time.)

## Swarm on AWS

To use a swarm that is running on AWS, create an SSH tunnel with the `---ssh-*` options. For example:

```shell
dj \
  --ssh-remote /var/run/docker.sock \
  --ssh-identify-file ./docker-swarm.pem \
  --ssh-hostname docker@ec2-54-183-237-159.us-west.compute-1.amazonaws.com \
    hello-world
```

Note that there is [an issue with logs not being available when using AWS](https://github.com/markbirbeck/docker-job/issues/19).
