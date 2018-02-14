import * as vscode from 'vscode';

import { exec } from 'child_process';

export class NetSuiteSDF {

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
  update() { }
  updateCustomRecordsWithInstances() { }
  validate() { }
  clearPassword() { }

  runCommand(command: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      vscode.window.showInformationMessage(`Workspace folder: ${workspaceFolders[0].uri.path}`);
    } else {
      vscode.window.showErrorMessage("No workspace folder found. SDF plugin cannot work without a workspace folder root containing a .sdf or .sdfcli file.");
    }
  }
}
