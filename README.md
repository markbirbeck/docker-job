# docker-job

Run one-shot services on a Docker Swarm.

When using a Docker Swarm, if a container is launched with `docker run` it is not actually run by the swarm--it is run as a *standalone container*. This means that the lifecycle of the container's execution is not managed by the orchestrator or scheduler.

The `docker-job` command-line application launches an image by wrapping it in a service and running it. Options are available to determine whether to output the logs when the job has completed, run more than one replica at the same time, and so on.

# Installation

Ensure you actually have a Docker Swarm, as per [Run Docker Engine in swarm mode](https://docs.docker.com/engine/swarm/swarm-mode/).

Install `docker-job` from NPM with:

```shell
npm i -g docker-job
```

# Usage

Bare minimum is to provide the name of an image, which will be launched on your local Docker Swarm:

```shell
dj hello-world
```

Any parameters after the image name will be passed to the launched job:

```shell
dh alpine echo hello world
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

To run the job *repeatedly* until some condition is met, use `--repeat-until` with a regular expression:

```shell
dj --showlogs --repeat-until '20:0[05]' alpine date
```

When the job has finished running the logs are checked and the presence of '20:00' or '20:05' *anywhere* in the logs will prevent `docker-job` from running the job again.

The logs can be shown on each iteration, and more than one replica can be run:

```shell
dj --showlogs --replicas 5 --repeat-until 'workflows?' hello-world
```

The sequence will terminate if *any* of the replicas outputs a string that matches the regular expression provided.

To repeat a job as long as some string exists in the logs, then use the `--repeat-while` option. The following example will run as long as the time is 8pm and any number of seconds:

```shell
dj --repeat-while '20:00:\d\d' alpine date
```

When a job has finished the service that supports it can be removed automatically with the `--rm` option:

```shell
dj --rm --repeat-while '20:00:\d\d' alpine date
```

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
