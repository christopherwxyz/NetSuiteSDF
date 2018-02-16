import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { chdir } from 'process';
import { spawn, ChildProcess } from 'child_process';

import { Environment } from './environment';
import { SDFConfig } from './sdf-config';
import { CLIParser } from './cli-parser';
import { CLICommand } from './cli-command';

export class NetSuiteSDF {

  activeEnvironment: Environment;
  addProjectParameter = true;
  collectedData: string[] = [];
  intervalId;
  pw: string;
  returnData = false;
  rootPath: string;
  sdfcli: ChildProcess;
  sdfConfig: SDFConfig;
  showOutput = true;

  constructor(private context: vscode.ExtensionContext) { }

  /*********************/
  /** SDF CLI Commands */
  /*********************/

  addDependencies() {
    this.runCommand(CLICommand.AddDependencies, '-all')
  }

  deploy() {
    this.runCommand(CLICommand.Deploy);
  }

  importBundle() {
    this.addProjectParameter = false;
    this.runCommand(CLICommand.ImportBundle);
  }

  async importFiles() {
    this.addProjectParameter = false;
    this.returnData = true;
    this.showOutput = false;

    await this.listFiles();
    const selectedFile = await vscode.window.showQuickPick(this.collectedData);
    this.runCommand(CLICommand.ImportFiles);
  }

  importObjects() {
    this.runCommand(CLICommand.ImportObjects);
  }

  listBundles() {
    this.addProjectParameter = false;
    this.runCommand(CLICommand.ListBundles);
  }

  listFiles() {
    this.addProjectParameter = false;
    return this.runCommand(CLICommand.ListFiles, '-folder "/SuiteScripts"');
  }

  listMissingDependencies() {
    this.runCommand(CLICommand.ListMissingDependencies);
  }

  listObjects() {
    this.runCommand(CLICommand.ListObjects);
  }

  preview() {
    this.runCommand(CLICommand.Preview);
  }

  update() {
    this.runCommand(CLICommand.Update);
  }

  updateCustomRecordWithInstances() {
    this.runCommand(CLICommand.UpdateCustomRecordsWithInstances);
  }

  validate() {
    this.runCommand(CLICommand.Validate);
  }

  /*********************/
  /** VS Code Helpers **/
  /*********************/

  cleanup() {
    // Clean up instance variables (or other matters) after thread closes.
    if (!this.returnData) {
      this.collectedData = [];
    }
    clearInterval(this.intervalId);
    this.clearStatus();

    this.addProjectParameter = true;
    this.intervalId = undefined;
    this.returnData = false;
    this.sdfcli = undefined;
    this.showOutput = true;
  }

  clearStatus() {
    vscode.window.setStatusBarMessage('SDF');
  }

  async getConfig({ force = false }: { force?: boolean } = {}) {
    if (force || !this.sdfConfig) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        this.rootPath = workspaceFolders[0].uri.path;
        const sdfPath = path.join(this.rootPath, '.sdfcli');
        const sdfPathExists = await this.fileExists(sdfPath)
        if (sdfPathExists) {
          const buffer = await this.openFile(path.join(this.rootPath, '.sdfcli'));
          const jsonString = buffer.toString();
          try {
            this.sdfConfig = JSON.parse(jsonString);
            await this.selectEnvironment();
            if (this.activeEnvironment) {
              await this.resetPassword();
            }
          } catch (e) {
            vscode.window.showErrorMessage(`Unable to parse .sdfcli file found at project root: ${this.rootPath}`);
          }
        } else {
          vscode.window.showErrorMessage(`No .sdfcli file found at project root: ${this.rootPath}`);
        }
      } else {
        vscode.window.showErrorMessage("No workspace folder found. SDF plugin cannot work without a workspace folder root containing a .sdfcli file.");
      }
    } else if (!this.activeEnvironment) {
      await this.selectEnvironment();
      if (this.activeEnvironment) {
        await this.resetPassword();
      }
    } else if (!this.pw) {
      await this.resetPassword();
    }
  }

  refreshConfig() {
    this.getConfig({ force: true });
  }

  async resetPassword() {
    const _resetPassword = async () => {
      const prompt = `Please enter your password for your ${this.activeEnvironment.name} account.`
      const pw = await vscode.window.showInputBox({ prompt: prompt, password: true });
      this.pw = pw;
    }

    if (this.sdfConfig) {
      await _resetPassword();
    } else {
      await this.getConfig({ force: true });
      await _resetPassword();
    }
  }

  async runCommand(command: CLICommand, ...args): Promise<any> {
    await this.getConfig();
    if (this.sdfConfig && this.activeEnvironment && this.pw) {
      const outputChannel = vscode.window.createOutputChannel('SDF');
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (this.showOutput) {
        outputChannel.clear();
        outputChannel.show();
      }

      const commandArray: [CLICommand, string, string, string, string] = [
        command,
        `-account ${this.activeEnvironment.account}`,
        `-email ${this.activeEnvironment.email}`,
        `-role ${this.activeEnvironment.role}`,
        `-url ${this.activeEnvironment.url}`,
      ];

      if (this.addProjectParameter) {
        commandArray.push(`-p "${this.rootPath}"`);
      }
      for (let arg of args) {
        commandArray.push(arg);
      }

      this.sdfcli = spawn('sdfcli', commandArray, { cwd: this.rootPath });
      this.showStatus();

      const cliParser = new CLIParser(this.sdfcli, command, outputChannel, this);

      let collectedData = [];

      this.sdfcli.stdout.on('data', cliParser.stdout.bind(cliParser));
      this.sdfcli.stderr.on('data', cliParser.stderr.bind(cliParser));
      // this.sdfcli.on('close', cliParser.close.bind(cliParser));
      return new Promise(resolve => {
        this.sdfcli.on('close', (code: number, signal: string) => {
          outputChannel.append(`Child process exited with code ${code}`);
          this.cleanup();
          resolve(code);
        })
      })

    }
  }

  async selectEnvironment() {
    const _selectEnvironment = async () => {
      try {
        const environments = this.sdfConfig.environments.reduce((acc, curr: Environment) => { acc[curr.name] = curr; return acc }, {});
        const environmentNames = Object.keys(environments);
        const environmentName = await vscode.window.showQuickPick(environmentNames);
        this.activeEnvironment = environments[environmentName];
      } catch (e) {
        vscode.window.showErrorMessage('Unable to parse .sdfcli environments. Please check repo for .sdfcli JSON formatting.');
      }
    }

    if (this.sdfConfig) {
      await _selectEnvironment();
    } else {
      await this.getConfig({ force: true });
      await _selectEnvironment();
    }
  }

  showStatus(msg = "SDF ") {
    const mode1 = "[= ]";
    const mode2 = "[ =]";
    let currentMode = mode1;
    this.intervalId = setInterval(() => {
      currentMode = currentMode === mode1 ? mode2 : mode1;
      vscode.window.setStatusBarMessage(msg + currentMode);
    }, 500);
  }

  /**************/
  /*** UTILS ****/
  /**************/

  openFile(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data);
      });
    })
  }

  fileExists(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        fs.exists(path, exists => resolve(exists));
      } catch (e) {
        reject(e);
      }
    })
  }

}
