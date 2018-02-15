import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { chdir } from 'process';
import { spawn } from 'child_process';

import { Environment } from './environment';
import { SDFConfig } from './sdf-config';

export class NetSuiteSDF {

  activeEnvironment: Environment;
  addProjectParameter = true;
  pw: string;
  rootPath: string;
  sdfConfig: SDFConfig;

  constructor(private context: vscode.ExtensionContext) { }

  addDependencies() {
    this.runCommand('adddependencies', '-all')
  }

  async deploy() {
    this.runCommand('deploy');
  }

  importBundle() {
    this.addProjectParameter = false;
    this.runCommand('importbundle');
  }

  importFiles() {
    this.runCommand('importfiles');
  }

  importObjects() {
    this.runCommand('importobjects');
  }

  listBundles() {
    this.addProjectParameter = false;
    this.runCommand('listbundles');
  }

  listFiles() {
    this.addProjectParameter = false;
    this.runCommand('listfiles', '-folder "/SuiteScripts"');
  }

  listMissingDependencies() {
    this.runCommand('listmissingdependencies');
  }

  listObjects() {
    this.runCommand('listobjects');
  }

  preview() {
    this.runCommand('preview');
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

  update() {
    this.runCommand('update');
  }

  updateCustomRecordsWithInstances() {
    this.runCommand('updatecustomrecordswithinstances');
  }

  validate() {
    this.runCommand('validate');
  }

  async runCommand(command: string, ...args) {
    await this.getConfig();
    if (this.sdfConfig && this.activeEnvironment && this.pw) {
      const outputChannel = vscode.window.createOutputChannel('SDF');
      const workspaceFolders = vscode.workspace.workspaceFolders;
      outputChannel.clear();
      outputChannel.show();

      const commandArray: string[] = [
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

      const sdfcli = spawn('sdfcli', commandArray, { cwd: this.rootPath });

      sdfcli.stdout.on('data', (data) => {
        if (data.toString().includes('SuiteCloud Development Framework CLI')) {
          sdfcli.stdin.write(`${this.pw}\n`);
        }
        outputChannel.append(`stdout: ${data}`);
      });

      sdfcli.stderr.on('data', (data) => {
        outputChannel.append(`stderr: ${data}`);
      });

      sdfcli.on('close', (code) => {
        outputChannel.append(`child process exited with code ${code}`);
        this.cleanup();
      });
    }
  }

  cleanup() {
    this.addProjectParameter = true;
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
