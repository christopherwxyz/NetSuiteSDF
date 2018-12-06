# NetSuiteSDF Extension

## Introduction

This is a Visual Studio Code wrapper around the NetSuite SDF command-line interface. It also provides a series of defaults for the SDF CLI to make utilizing the CLI more user-friendly.

## Inspiration

This is a port of the functionality provided by [tjtyrrell](https://github.com/tjtyrrell)'s Sublime SDF plugin (<https://github.com/limebox/sublime-sdf>). And we are borrowing the work he did in getting the Windows and Mac SDFCLI installers working.

## Features

- Wraps SDF CLI commands
- Environment (Sandbox, Production, etc.) selector
- Output window integrated with VS Code

## Status

All commands can be found with the `SDF` prefix in the Command Palette (Win: Ctrl+Shift+P, Mac: Cmd+Shift+P).

### SDF CLI Commands

| _Command_                       | _Implemented_          |
| ------------------------------- | ---------------------- |
| adddependencies                 | ✔                      |
| deploy                          | ✔                      |
| importbundle                    |                        |
| importconfiguration             |                        |
| importfiles                     | ✔                      |
| importobjects                   | ✔                      |
| issuetoken                      | ✔                      |
| listbundles                     |                        |
| listconfiguration               |                        |
| listfiles                       | ✔                      |
| listmissingdependencies         | ✔                      |
| listObjects                     | ✔                      |
| preview                         | ✔                      |
| project                         | (Handled by extension) |
| revoketoken                     | ✔                      |
| update                          | ✔                      |
| updatecustomrecordwithinstances | ✔                      |
| validate                        | ✔                      |

### VS Code Commands

| _Command_         | _Description_                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Refresh Config    | Force the extension to re-read .sdfcli.json                                                     |
| resetPassword     | Enter password for use with environment                                                         |
| selectEnvironment | Select active environment from list in .sdfcli.json. If only one, will automatically select it. |
| sync              | Grabs all available customizations from NetSuite that is normally possible by the plugin.       |

### ToDo

| _Command_   | _Description_                                                                       |
| ----------- | ----------------------------------------------------------------------------------- |
| New Project | Will generate SDF project file structure in the same manner as sdfcli-createproject |
| Update .sdf | Automatically update .sdf with active environment information                       |
| _HOTKEYS_   | Add hotkeys                                                                         |

## Installation

1. Install SDFCLI. Either use the SDF documentation or tjtyrrell's _brew_ or _chocolatey_. I recommend tjtyrell's.

#### Windows

Install via [Chocolatey](https://chocolatey.org)

```bash
choco install sdfcli # This installs Java 8 and Maven 3.5
```

#### Mac

Install via [Homebrew](https://brew.sh)

_Warning: the Brew Cask has been renamed. If you used it previously as `sdfcli`, please untap the cask and uninstall:_

```bash
brew untap limebox/netsuite
brew uninstall sdfcli
```

Install SDFSDK:

```bash
brew cask install caskroom/versions/java8 # Unless you already have Java 8 installed.
brew install limebox/netsuite/sdfsdk
```

2. The plugin is activated when a project is opened that has a `.sdf` or `.sdfcli.json` file in the root directory. So open a SDF project folder that contains a `.sdf` file.

3) If the Extension is activated, you should see a `SDF` button in the bottom left status bar. Click the button to open up the Select Environment inputs. This will generate a .sdfcli.json in your root directory of your project.

4) Fill in your environments that you want to be able to switch between inside of the extension inside of the .sdfcli.json.

5) Hit Ctrl+Shift+P for Windows, or Cmd+Shift+P to bring up the command palette again, and type `SDF` to see all the options.
