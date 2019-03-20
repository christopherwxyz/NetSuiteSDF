# NetSuiteSDF Extension

## Introduction

This is a Visual Studio Code wrapper around the NetSuite SDF command-line interface. It also provides a series of defaults for the SDF CLI to make utilizing the CLI more user-friendly.

## Inspiration

This is a port of the functionality provided by [tjtyrrell](https://github.com/tjtyrrell)'s Sublime SDF plugin (<https://github.com/limebox/sublime-sdf>). And we are borrowing the work he did in getting the Windows and Mac SDFCLI installers working.

## Features

- Currently updated to work with 2018.2.1 (2019.1 in the works)
- Wraps SDF CLI commands
- Environment (Sandbox, Production, etc.) selector
- Output window integrated with VS Code
- _Now webpacked to speed up VS Code load time_
- (BETA) Quick Deploy option available in Extension Preferences

## Status

All commands can be found with the `SDF` prefix in the Command Palette (Win: Ctrl+Shift+P, Mac: Cmd+Shift+P).

### SDF CLI Commands

| _Command_                       | _Implemented_          | _Shortcut_ |
| ------------------------------- | ---------------------- | ---------- |
| adddependencies                 | ✔                      |
| deploy                          | ✔                      |
| importbundle                    |                        |
| importconfiguration             |                        |
| importfiles                     | ✔                      |
| importobjects                   | ✔                      |
| issuetoken                      | ✔                      |
| listbundles                     | ✔                      |
| listconfiguration               | ✔                      |
| listfiles                       | ✔                      |
| listmissingdependencies         | ✔                      |
| listObjects                     | ✔                      |
| preview                         | ✔                      |
| project                         | (Handled by extension) |
| revoketoken                     | ✔                      |
| savetoken                       | ✔                      |
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
| remove folders    | Removes all created folders from the current directory. Used in conjunction with sync.          |

### Hotkeys

_Note: All hotkeys are preceded by Ctrl-; on Windows or Cmd-; on Mac._
For example, if I wanted to run the command `addDependencies` on a Mac, I would press Cmd-;, then press a.
`<p>` below stands for that OS-specific prefix. These commands are case sensitive.

| _Command_                       | _Shortcut_ |
| ------------------------------- | ---------- |
| addDependencies                 | `<p> a`    |
| addFileToDeploy                 | `<p> +`    |
| deploy                          | `<p> d`    |
| importBundle                    | `<p> d`    |
| importFiles                     | `<p> F`    |
| importObjects                   | `<p> O`    |
| issueToken                      | `<p> t`    |
| listBundles                     | `<p> b`    |
| listConfiguration               | `<p> c`    |
| listFiles                       | `<p> f`    |
| listMissingDependencies         | `<p> m`    |
| listObjects                     | `<p> o`    |
| preview                         | `<p> p`    |
| refreshConfig                   | `<p> r`    |
| revokeToken                     | `<p> R`    |
| saveToken                       | `<p> T`    |
| selectEnvironment               | `<p> s`    |
| update                          | `<p> u`    |
| updateCustomRecordWithInstances | `<p> U`    |
| validate                        | `<p> v`    |
| resetPassword                   | `<p> P`    |

### (BETA) Quick Deploy

Enable this feature in VS Code settings. Currently it is opt-in, as it is a beta feature.

If enabled, when a `Deploy` is triggered, the files and objects listed in the `deploy.xml` will be copied to a subdirectory along with the `manifest.xml`, and the deploy will be triggered from there.

To facilitate more rapid development, there is a command to add a file directly to your `deploy.xml`. Either through selecting it in the File Browser, right-clicking, and selecting `Add File to Deploy.xml`, or by running the command while the file is being edited to add it.

Pros:

- Avoids the node_modules issue
- Allows for larger SDF projects
- Reduction in deploy time from 8-10 minutes down to 8-10 seconds
  Cons:
- Untested on Windows
- Does not work with globs `(SuiteScripts/*)` in deploy.xml

### ToDo

| _Command_   | _Description_                                                                       |
| ----------- | ----------------------------------------------------------------------------------- |
| New Project | Will generate SDF project file structure in the same manner as sdfcli-createproject |
| Update .sdf | Automatically update .sdf with active environment information                       |

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
