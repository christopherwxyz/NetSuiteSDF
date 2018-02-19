import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { chdir } from 'process';
import { ChildProcess } from 'child_process';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { spawn } from 'spawn-rx';

import { Environment } from './environment';
import { SDFConfig } from './sdf-config';
import { SdfCliJson } from './sdf-cli-json';
import { CLICommand } from './cli-command';
import { CustomObjects, CustomObject } from './custom-object';

export class NetSuiteSDF {

  activeEnvironment: Environment;
  collectedData: string[] = [];
  currentObject: CustomObject;
  doAddProjectParameter = true;
  doReturnData = false;
  doSendPassword = true;
  doShowOutput = true;
  intervalId;
  password: string;
  rootPath: string;
  sdfcli: Observable<string>;
  sdfConfig: SDFConfig;

  constructor(private context: vscode.ExtensionContext) { }

  /*********************/
  /** SDF CLI Commands */
  /*********************/

  async addDependencies() {
    this.doSendPassword = false;

    await this.getConfig();
    const projectName = this.sdfConfig.projectName || "PROJECT_NAME_MISSING";
    const defaultXml = `
    <manifest projecttype="ACCOUNTCUSTOMIZATION">
      <projectname>${projectName}</projectname>
      <frameworkversion>1.0</frameworkversion>
    </manifest>
    `;
    fs.writeFile(path.join(this.rootPath, 'manifest.xml'), defaultXml, function (err) {
      if (err) throw err;
    });
    await this.runCommand(CLICommand.AddDependencies, '-all');
  }

  deploy() {
    this.runCommand(CLICommand.Deploy);
  }

  importBundle() {
    this.doAddProjectParameter = false;
    this.runCommand(CLICommand.ImportBundle);
  }

  async importFiles() {
    this.doAddProjectParameter = false;
    this.doReturnData = true;

    const collectedData = await this.listFiles();
    if (collectedData) {
      const selectedFile = await vscode.window.showQuickPick(collectedData);
      if (selectedFile) {
        this.runCommand(CLICommand.ImportFiles, `-paths ${selectedFile}`);
      }
    }
  }

  async importObjects() {
    const collectedData = await this.listObjects();

    if (collectedData) {
      this.createPath(this.currentObject.destination);
      const objectId = await vscode.window.showQuickPick(collectedData);
      if (objectId) {
        this.runCommand(
          CLICommand.ImportObjects,
          `-scriptid ${objectId}`,
          `-type ${this.currentObject.type}`,
          `-destinationfolder ${this.currentObject.destination}`
        );
      }
    }

  }

  listBundles() {
    this.doAddProjectParameter = false;
    this.runCommand(CLICommand.ListBundles);
  }

  listFiles() {
    this.doAddProjectParameter = false;
    return this.runCommand(CLICommand.ListFiles, '-folder "/SuiteScripts"');
  }

  listMissingDependencies() {
    this.doSendPassword = false;
    this.runCommand(CLICommand.ListMissingDependencies);
  }

  async listObjects() {
    this.doAddProjectParameter = false;
    this.doReturnData = true;

    await this.getConfig();
    this.currentObject = await vscode.window.showQuickPick(CustomObjects);
    if (this.currentObject) {
      return this.runCommand(CLICommand.ListObjects, `-type ${this.currentObject.type}`);
    }
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
    // Clean up default instance variables (or other matters) after thread closes.
    if (!this.doReturnData) {
      this.collectedData = [];
      this.currentObject = undefined;
    }
    clearInterval(this.intervalId);
    this.clearStatus();

    this.doAddProjectParameter = true;
    this.doReturnData = false;
    this.doSendPassword = true;
    this.intervalId = undefined;
    this.sdfcli = undefined;
    this.doShowOutput = true;
  }

  clearStatus() {
    vscode.window.setStatusBarMessage('SDF');
  }

  async getConfig({ force = false }: { force?: boolean } = {}) {
    if (force || !this.sdfConfig) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        this.rootPath = workspaceFolders[0].uri.path;
        const sdfPath = path.join(this.rootPath, '.sdfcli.json');
        const sdfPathExists = await this.fileExists(sdfPath)
        if (sdfPathExists) {
          const buffer = await this.openFile(path.join(this.rootPath, '.sdfcli.json'));
          const jsonString = buffer.toString();
          try {
            this.sdfConfig = JSON.parse(jsonString);
            await this.selectEnvironment();
            if (this.activeEnvironment) {
              await this.resetPassword();
            }
          } catch (e) {
            vscode.window.showErrorMessage(`Unable to parse .sdfcli.json file found at project root: ${this.rootPath}`);
          }
        } else {
          fs.writeFileSync(path.join(this.rootPath, '.sdfcli.json'), SdfCliJson);
          vscode.window.showErrorMessage(`No .sdfcli.json file found at project root: ${this.rootPath}. Generated a blank .sdfcli.json template.`);
        }
      } else {
        vscode.window.showErrorMessage("No workspace folder found. SDF plugin cannot work without a workspace folder root containing a .sdfcli file.");
      }
    } else if (!this.activeEnvironment) {
      await this.selectEnvironment();
      if (this.activeEnvironment) {
        await this.resetPassword();
      }
    } else if (!this.password) {
      await this.resetPassword();
    }
  }

  handlePassword(line: string, command: CLICommand, stdinSubject: Subject<string>) {
    if (line.startsWith('Enter password:')) {
      line = line.substring(15);
    }
    if (line.includes('You have entered an invalid email address or password. Please try again.')) {
      this.password = undefined;
      vscode.window.showErrorMessage("Invalid email or password. Be careful! Too many attempts will lock you out!");
    }
    return line;
  }

  handleStdIn(line: string, command: CLICommand, stdinSubject: Subject<string>) {
    switch (true) {
      case (line.includes('SuiteCloud Development Framework CLI') && this.doSendPassword):
        stdinSubject.next(`${this.password}\n`);
        break;
      case line.includes('Type YES to continue'):
      case line.includes('enter YES to continue'):
      case line.includes('Type YES to update the manifest file'):
      case line.includes('Proceed with deploy?'):
        stdinSubject.next('YES\n');
        break;
      default:
        break;
    }
  }

  mapCommandOutput(command: CLICommand, line: string) {
    switch (command) {
      case CLICommand.ListObjects:
        return line.includes(':') ? line.split(':')[1] : line;
      default:
        return line;
    }
  }

  refreshConfig() {
    this.getConfig({ force: true });
  }

  async resetPassword() {
    const _resetPassword = async () => {
      const prompt = `Please enter your password for your ${this.activeEnvironment.name} account.`
      const password = await vscode.window.showInputBox({ prompt: prompt, password: true });
      this.password = password;
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
    if (this.sdfConfig && this.activeEnvironment && this.password) {
      const outputChannel = vscode.window.createOutputChannel('SDF');
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (this.doShowOutput) {
        outputChannel.show();
      }

      const commandArray: [CLICommand, string, string, string, string] = [
        command,
        `-account ${this.activeEnvironment.account}`,
        `-email ${this.activeEnvironment.email}`,
        `-role ${this.activeEnvironment.role}`,
        `-url ${this.activeEnvironment.url}`,
      ];

      if (this.doAddProjectParameter) {
        commandArray.push(`-p "${this.rootPath}"`);
      }
      for (let arg of args) {
        commandArray.push(arg);
      }

      const stdinSubject = new Subject<string>();

      this.sdfcli = spawn('sdfcli', commandArray, { cwd: this.rootPath, stdin: stdinSubject });

      this.showStatus();

      const collectedData = await this.sdfcli
        .concatMap(data => data.trim().split('\n'))
        .map(line => this.handlePassword(line, command, stdinSubject))
        .do(line => this.doShowOutput ? outputChannel.append(`${line}\n`) : null)
        .do(line => this.handleStdIn(line, command, stdinSubject))
        .filter(line => !(line.startsWith('[INFO]') || line.startsWith('SuiteCloud Development Framework CLI') || line.startsWith('SuiteCloud Development Framework CLI') || line.startsWith('Done.')))
        .map(line => this.mapCommandOutput(command, line))
        .reduce((acc: string[], curr: string) => acc.concat([curr]), [])
        .toPromise();

      this.cleanup();
      return collectedData;
    }
  }

  async selectEnvironment() {
    const _selectEnvironment = async () => {
      try {
        const environments = this.sdfConfig.environments.reduce((acc, curr: Environment) => { acc[curr.name] = curr; return acc }, {});
        const environmentNames = Object.keys(environments);
        if (environmentNames.length === 1) {
          this.activeEnvironment = environments[environmentNames[0]]
        } else {
          const environmentName = await vscode.window.showQuickPick(environmentNames);
          this.activeEnvironment = environments[environmentName];
          if (this.activeEnvironment.account === '00000000') {
            vscode.window.showErrorMessage('.sdfcli.json account number appears to be wrong. Are you still using the blank template?');
            this.activeEnvironment = undefined;
          }
        }
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

  createPath(targetDir) {
    // Strip leading '/'
    targetDir = targetDir.substring(1);
    const sep = path.sep;
    const initDir = this.rootPath;
    const baseDir = this.rootPath;

    targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(baseDir, parentDir, childDir);
      try {
        fs.mkdirSync(curDir);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }

      return curDir;
    }, initDir);
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

}
