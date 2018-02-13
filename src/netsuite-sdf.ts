import * as vscode from 'vscode';

export class NetSuiteSDF {

  constructor(private context: vscode.ExtensionContext) { }

  addDependencies() {
    vscode.window.showQuickPick(['Item1', 'Item2']);
  }

  deploy() { }
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


}
