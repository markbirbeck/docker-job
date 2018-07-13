# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v0.7.1] - 2018-07-13
### Fixed
- Unable to obtain logs on remote swarm (#44).

## [v0.7.0] - 2018-07-12
### Added
- Add option to specify host/swarm (#42).

## [v0.6.0] - 2018-07-12
### Added
- Add option to remove service when complete (#5).
- Add option to pass environment variables to service (#31).
- Add option to pass volume mapping to a service (#32).
- Add option to repeat a job while a condition exists (#36).

## [v0.5.0] - 2018-06-21
### Added
- Pass parameters after the image through as arguments (#25).

## [v0.4.1] - 2018-06-20
### Added
- Add option to repeat a job until a condition exists (#14).
- When repeating tasks, relaunch job rather than creating new one (#21).
### Fixed
- Unknown states cause run to exit (#11).

## [v0.3.1] - 2018-06-19
### Added
- Add options to enable selection of tunneling (#17).

## [v0.2.1] - 2018-06-14
### Fixed
- Running command fails when trying to update service (#9).

## [v0.2.0] - 2018-06-13
### Added
- Add CLI script (#3).

## v0.1.0 - 2018-06-13
### Added
- Add CLI parameters (#1).

[v0.2.0]: https://github.com/markbirbeck/docker-job/compare/v0.1.0...v0.2.0
[v0.2.1]: https://github.com/markbirbeck/docker-job/compare/v0.2.0...v0.2.1
[v0.3.1]: https://github.com/markbirbeck/docker-job/compare/v0.2.1...v0.3.1
[v0.4.1]: https://github.com/markbirbeck/docker-job/compare/v0.3.1...v0.4.1
[v0.5.0]: https://github.com/markbirbeck/docker-job/compare/v0.4.1...v0.5.0
[v0.6.0]: https://github.com/markbirbeck/docker-job/compare/v0.5.0...v0.6.0
[v0.7.0]: https://github.com/markbirbeck/docker-job/compare/v0.6.0...v0.7.0
[v0.7.1]: https://github.com/markbirbeck/docker-job/compare/v0.7.0...v0.7.1
[Unreleased]: https://github.com/markbirbeck/docker-job/compare/v0.7.1...HEAD
