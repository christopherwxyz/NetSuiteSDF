import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

export class NetSuiteSDF {

  rootPath: string;
  sdfConfig: { [key: string]: any };

  constructor(private context: vscode.ExtensionContext) { }

  addDependencies() {
    vscode.window.showQuickPick(['Item1', 'Item2']).then(item => console.log(item));
  }

  deploy() {
    this.runCommand('deploy');
    // const outputChannel = vscode.window.createOutputChannel('SDF');
    // const workspaceFolders = vscode.workspace.workspaceFolders;
    // outputChannel.show();
    // if (workspaceFolders) {
    //   for (let folder of vscode.workspace.workspaceFolders) {
    //     outputChannel.append(folder.toString());
    //   }
    // } else {
    //   outputChannel.append("No workspace folders found.");
    // }
    // exec('ls -al', (error, stdout, stderr) => {
    //   outputChannel.show();
    //   if (error) {
    //     outputChannel.append(`exec error: ${error}`);
    //     return;
    //   }
    //   outputChannel.append(`stdout: ${stdout}`);
    //   outputChannel.append(`stderr: ${stderr}`);
    // });
  }

  importBundle() { }
  importFiles() { }
  importObjects() { }
  listBundles() { }
  listFiles() { }
  listMissingDependencies() { }
  listObjects() { }
  preview() { }
  refreshConfig() {
    this.getConfig({ force: true });
  }
  update() { }
  updateCustomRecordsWithInstances() { }
  validate() { }
  clearPassword() { }

  async runCommand(command: string) {
    await this.getConfig();
    if (this.sdfConfig) {

    }
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
          } catch (e) {
            vscode.window.showErrorMessage(`Unable to parse .sdfcli file found at project root: ${this.rootPath}`);
          }
        } else {
          vscode.window.showErrorMessage(`No .sdfcli file found at project root: ${this.rootPath}`);
        }
      } else {
        vscode.window.showErrorMessage("No workspace folder found. SDF plugin cannot work without a workspace folder root containing a .sdf or .sdfcli file.");
      }
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
