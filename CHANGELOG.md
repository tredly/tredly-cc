# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.0] - 2016-06-23
#### Changed
- `Tredlyfile` replaced with `tredly.yaml` for 1.0.0 of Tredly
- Change rc.d script location from /etc/rc.d to /usr/local/etc/rc.d. Closes tredly/tredly-cc#4
- Changed --path to --location for Tredly v1.0

#### Added
- Add nginx to REQUIRE in rc.d script. Closes tredly/tredly-cc#3
- Add full paths to installer

#### Fixed
- Fixed path to gem

## [0.3.0] - 2016-06-17
#### Changed
- Changed rc.d script location from /etc/rc.d to /usr/local/etc/rc.d
- Changed --path= to --location= in rc.d script

#### Added
- Added nginx require as this container relies on the layer 7 proxy

## [0.2.0] - 2016-06-09
#### Added
- Integration with Tredly Host installation scripts

#### Changed
- "tredly-ui" renamed to "tredly-cc"

## v0.1.0 - 2016-05-26
#### Added
- Initial release of Tredly Command Center

[1.0.0]: https://github.com/tredly/tredly-cc/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/tredly/tredly-cc/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tredly/tredly-cc/compare/v0.1.0...v0.2.0
