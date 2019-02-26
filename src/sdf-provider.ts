import * as vscode from 'vscode';

import * as _ from 'lodash';
import { NetSuiteSDF } from './netsuite-sdf';
import { CustomObjects, CustomObject } from './custom-object';
import { CLICommand } from './cli-command';

export class SDFProvider implements vscode.TreeDataProvider<SDFFile> {
  private _onDidChangeTreeData: vscode.EventEmitter<SDFFile | undefined> = new vscode.EventEmitter<
    SDFFile | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<SDFFile | undefined> = this._onDidChangeTreeData.event;

  constructor(private sdf: NetSuiteSDF) {}

  refresh(event?: any): void {
    console.log(event);
    console.log(event);
  }

  getTreeItem(element: SDFFile): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SDFFile | SDFFolder | SDFObjectFolder) {
    if (element && element.label === 'SuiteScripts') {
      await this.getSuiteScripts(<SDFFolder>element);
      return (<SDFFolder>element).getChildren();
    } else if (element) {
      return (<SDFFolder | SDFObjectFolder>element).getChildren();
    } else {
      return [this.getObjectFolders(), new SDFFolder('SuiteScripts')];
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
    }
  }

  private getObjectFolders() {
    const objects = new SDFFolder('Objects');
    const objectsMap = _.reduce(
      CustomObjects,
      (acc, customObject) => {
        const folderName = customObject._destination[0];
        let child: SDFFolder | SDFObjectFolder;
        if (customObject._destination.length > 1) {
          child = folderName in acc ? acc[folderName] : new SDFFolder(folderName);
          const grandchild = customObject._destination[1];
          (<SDFFolder>child).children.push(new SDFObjectFolder(this.sdf, grandchild, customObject));
        } else {
          child = new SDFObjectFolder(this.sdf, folderName, customObject);
        }
        acc[folderName] = child;
        return acc;
      },
      {}
    );
    objects.children = _.sortBy(Object.values(objectsMap), 'label');
    return objects;
  }
}

export class SDFFile extends vscode.TreeItem {
  constructor(public readonly label: string, private path: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  contextValue = 'sdf-file';
}

export class SDFObject extends vscode.TreeItem {
  constructor(public readonly label: string, public path: string, public type: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  contextValue = 'sdf-object';
}

export class SDFFolder extends vscode.TreeItem {
  children: Array<SDFFolder | SDFFile | SDFObjectFolder> = [];

  constructor(public label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
  }

  get tooltip(): string {
    return `${this.label}`;
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

export class SDFObjectFolder extends vscode.TreeItem {
  constructor(public sdf: NetSuiteSDF, public label: string, public object: CustomObject) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  async getChildren() {
    this.sdf.doAddProjectParameter = false;
    this.sdf.doReturnData = true;

    await this.sdf.getConfig();
    if (this.sdf.sdfConfig) {
      const files = await this.sdf.runCommand(CLICommand.ListObjects, `-type ${this.object.type}`);
      return _.map(files, (file: string) => new SDFObject(file, this.object.destination, this.object.type));
    }
  }

  contextValue = 'sdf-object-folder';
}
