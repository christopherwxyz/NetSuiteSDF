import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import { NetSuiteSDF } from './netsuite-sdf';

type FilePath = string;
type CustomObject = string;

export class SDFProvider implements vscode.TreeDataProvider<SDFFile> {

  private _onDidChangeTreeData: vscode.EventEmitter<SDFFile | undefined> = new vscode.EventEmitter<SDFFile | undefined>();
  readonly onDidChangeTreeData: vscode.Event<SDFFile | undefined> = this._onDidChangeTreeData.event;

  constructor(private sdf: NetSuiteSDF) { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SDFFile): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SDFFile | SDFFolder) {
    if (element && element.label === 'SuiteScripts') {
      await this.getSuiteScripts(<SDFFolder>element);
      return (<SDFFolder>element).getChildren();
    } else if (element) {
      return (<SDFFolder>element).getChildren();
    } else {
      return [new SDFFolder('SuiteScripts', [])]
    }
  }

  private async getSuiteScripts(suiteScriptsFolder: SDFFolder) {
    this.sdf.doAddProjectParameter = false;
    this.sdf.doReturnData = true;

    const collectedData = await this.sdf.listFiles();
    if (collectedData) {
      const reducedData = _(collectedData)
        .filter(path => path)
        .map(path => path.split('/').slice(2))
        .reduce((acc, pathParts, index) => {
          const path = collectedData[index];
          const fileName = pathParts[pathParts.length - 1];

          if (pathParts.length === 1) {
            acc.children.push(new SDFFile(fileName, path));
          } else {
            const dirParts = pathParts.slice(0, -1);

            let dirObj = acc;
            while (!_.isEmpty(dirParts)) {
              let dir = dirParts.shift();
              if (!_.has(dirObj, dir)) {
                dirObj[dir] = new SDFFolder(dir);
              }
              dirObj = dirObj[dir];
            }

            dirObj['children'].push(new SDFFile(fileName, path));
          }
          return acc;
        }, suiteScriptsFolder);
      console.log(reducedData);
    }
  }

  private parsePath(path: string) {
    const pathList = path.split('/').slice(2);
    if (pathList.length === 1) {

    }
  }
}

export class SDFFile extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    // public readonly command?: vscode.Command
    private path: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }

  get tooltip(): string {
    return `${this.label}`
  }

  contextValue = 'sdf-object';

}

export class SDFFolder extends vscode.TreeItem {

  children: Array<SDFFolder | SDFFile> = [];

  constructor(
    public label: string,
    // public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
  }

  get tooltip(): string {
    return `${this.label}`
  }

  getChildren() {
    const keys = Object.keys(this);
    const folderKeys = _.filter(keys, key => !['collapsibleState', 'label', 'contextValue', 'children'].includes(key));
    const folders = _.map(folderKeys, folderKey => this[folderKey]);
    const concatted = folders.concat(this.children);
    return concatted;
  }

  contextValue = 'sdf-folder';

}
