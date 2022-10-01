import * as vscode from 'vscode';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as util from 'util';

import * as _ from 'lodash';
import * as glob from 'glob';
import * as rimraf from 'rimraf';
import * as tmp from 'tmp';
import * as xml2js from 'xml2js';
import { Observable, Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { spawn } from 'spawn-rx';
import * as commandExists from 'command-exists';

import { Environment } from './environment';
import { SDFConfig } from './sdf-config';
import { SdfCliJson } from './sdf-cli-json';
import { CLICommand } from './cli-command';
import { CustomObjects, CustomObject } from './custom-object';

const Bluebird = require('bluebird');
const globAsync = util.promisify(glob);
const errorMessage = "'suitecloud' not found in path. Is @oracle/suitecloud-cli installed?";

export class NetSuiteSDF {
  activeEnvironment: Environment;
  addDefaultParameters = true;
  collectedData: string[] = [];
  currentObject: CustomObject;
  doAddProjectParameter = true;
  doReturnData = false;
  doSendPassword = true;
  doShowOutput = true;
  intervalId;
  outputChannel: vscode.OutputChannel;
  password: string;
  rootPath: string;
  srcPath: string;
  savedStatus: string;
  sdfcli: any;
  sdfConfig: SDFConfig;
  sdfCliIsInstalled = true; // Prevents error messages while Code is testing SDFCLI is installed.
  statusBar: vscode.StatusBarItem;
  tempDir: tmp.SynchrounousResult;
  hasSdfCache: boolean;
  xmlBuilder = new xml2js.Builder({ headless: true });

  constructor(private context: vscode.ExtensionContext) {
    this.checkSdfCliIsInstalled().then(() => {
      if (this.sdfCliIsInstalled) {
        this.initializeStatusBar();
        this.outputChannel = vscode.window.createOutputChannel('SDF');
      }
    });
  }

  private initializeStatusBar() {
    this.statusBar = vscode.window.createStatusBarItem();
    this.statusBar.text = this.statusBarDefault;
    this.statusBar.tooltip = 'Click here to select your NetSuite environment';
    this.statusBar.command = 'extension.selectEnvironment';
    this.statusBar.show();
  }

  get statusBarDefault() {
    if (this.activeEnvironment) {
      return `SDF (${this.activeEnvironment.name})`;
    } else {
      return 'SDF';
    }
  }

  /*********************/
  /** SDF CLI Commands */
  /*********************/

  async addDependencies() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doSendPassword = false;
    this.addDefaultParameters = false;

    await this.getConfig();
    const projectName = this.sdfConfig.projectName || 'PROJECT_NAME_MISSING';
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

  async createProject() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doSendPassword = false;
    this.addDefaultParameters = false;
    this.doAddProjectParameter = false;

    const projectNamePrompt = `Please enter your project's name`;
    const projectName = await vscode.window.showInputBox({
      prompt: projectNamePrompt,
      ignoreFocusOut: true,
    });

    const projectIdPrompt = `Please enter your project's ID`;
    const projectId = await vscode.window.showInputBox({
      prompt: projectIdPrompt,
      ignoreFocusOut: true,
    });

    const publisherPrompt = `Please enter your publisher name`;
    const publisherId = await vscode.window.showInputBox({
      prompt: publisherPrompt,
      ignoreFocusOut: true,
    });

    if (projectName) {
      await this.runCommand(
        CLICommand.CreateProject,
        `--projectid ${projectId}`,
        `--projectname ${projectName}`,
        `--publisherid ${publisherId}`,
        `--projectversion 0.0.1`,
        '--type ACCOUNTCUSTOMIZATION'
      );
    }
  }

  async _generateTempDeployDirectory() {
    const deployPath = path.join(this.rootPath, 'deploy.xml');
    const deployXmlExists = await this.fileExists(deployPath);
    if (!deployXmlExists) {
      this.setDefaultDeployXml();
    }
    const deployXml = await this.openFile(deployPath);
    const deployJs = await this.parseXml(deployXml);

    const files = _.get(deployJs, 'deploy.files[0].path', []);
    const objects = _.get(deployJs, 'deploy.objects[0].path', []);
    const allFilePatterns = files.concat(objects).concat(['/deploy.xml', '/manifest.xml', '/.sdf']);
    const allFilePaths = await this.getFilePaths(allFilePatterns);

    this.tempDir = tmp.dirSync({ unsafeCleanup: true, keep: false });
    try {
      for (let filepath of allFilePaths) {
        const fromPath = path.join(filepath);
        const toPath = path.join(this.tempDir.name, filepath);
        await this.copyFile(fromPath, toPath);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async deploy() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }
    await this.getConfig();

    let config = vscode.workspace.getConfiguration('netsuitesdf');
    const useQuickDeploy = config.get('useQuickDeploy');
    if (useQuickDeploy) {
      await this._generateTempDeployDirectory();

      await this.runCommand(CLICommand.Deploy);

      await rimraf(this.rootPath + '/var', (err: Error) => {
        vscode.window.showErrorMessage(err.message);
      });
    } else {
      await this.runCommand(CLICommand.Deploy);
    }
  }

  importBundle() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    // TODO?
    this.doAddProjectParameter = false;
    this.runCommand(CLICommand.ImportBundle);
  }

  // TODO
  // importConfiguration

  async importFiles() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doAddProjectParameter = false;
    this.doReturnData = true;

    const collectedData = await this.listFiles();
    if (collectedData) {
      const filteredData = collectedData.filter((data) => data.indexOf('SuiteScripts') >= 0);
      if (filteredData.length > 0) {
        const selectedFiles = await vscode.window.showQuickPick(filteredData, {
          canPickMany: true,
          ignoreFocusOut: true,
        });
        if (selectedFiles && selectedFiles.length > 0) {
          this._importFiles(selectedFiles);
        }
      }
    }
  }

  async _importFiles(files: string[]) {
    const cleanedFiles = _.map(files, (file) => `${file}`);
    const fileString = cleanedFiles.join(' ');
    return this.runCommand(CLICommand.ImportFiles, `-paths`, `${fileString}`);
  }

  async importObjects(context?: any) {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    const collectedData = await this.listObjects();
    if (collectedData) {
      const filteredData = collectedData.filter((data) => data.indexOf('cust') >= 0);
      if (filteredData.length > 0) {
        const selectedObjects = await vscode.window.showQuickPick(filteredData, {
          canPickMany: true,
          ignoreFocusOut: true,
        });
        if (selectedObjects && selectedObjects.length > 0) {
          this.createPath(this.currentObject.destination);
          this._importObjects(this.currentObject.type, selectedObjects, this.currentObject.destination);
        }
      }
    }
  }

  async _importObjects(scriptType: string, scriptIds: string[], destination: string) {
    this.createPath(destination);
    const scriptIdString = scriptIds.join(' ');
    return this.runCommand(
      CLICommand.ImportObjects,
      `-scriptid`,
      scriptIdString,
      `-type`,
      `${scriptType}`,
      `-destinationfolder`,
      `${destination}`
    );
  }

  issueToken() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doAddProjectParameter = false;
    this.runCommand(CLICommand.IssueToken);
  }

  listBundles() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doAddProjectParameter = false;
    this.runCommand(CLICommand.ListBundles);
  }

  listConfiguration() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doAddProjectParameter = false;
    this.runCommand(CLICommand.ListConfiguration);
  }

  listFiles() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doAddProjectParameter = false;
    this.addDefaultParameters = false;
    return this.runCommand(CLICommand.ListFiles, `--folder`, `/SuiteScripts`);
  }

  listMissingDependencies() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doSendPassword = false;
    this.runCommand(CLICommand.ListMissingDependencies);
  }

  async listObjects() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.doAddProjectParameter = false;
    this.doReturnData = true;

    await this.getConfig();
    if (this.sdfConfig) {
      this.currentObject = await vscode.window.showQuickPick(CustomObjects, {
        ignoreFocusOut: true,
      });
      if (this.currentObject) {
        return this.runCommand(CLICommand.ListObjects, `-type`, `${this.currentObject.type}`);
      }
    }
  }

  preview() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.runCommand(CLICommand.Preview);
  }

  async revokeToken() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }
    const authid = await vscode.window.showInputBox({
      prompt: 'Please enter an authid to remove its token keys and secrets.',
      ignoreFocusOut: true,
    });

    if (authid) {
      this.doAddProjectParameter = false;
      this.runCommand(
        CLICommand.RevokeToken,
        `--authid`,
        `${authid}`,
      );
    }
  }

  async saveToken() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }
    const authid = await vscode.window.showInputBox({
      prompt: 'Please enter a unique authid to tie your token keys and secrets.',
      ignoreFocusOut: true,
    });

    const account = await vscode.window.showInputBox({
      prompt: 'Please enter your account associated with your token keys and secrets.',
      ignoreFocusOut: true,
    });

    const accountUrl = await vscode.window.showInputBox({
      prompt: `Specifies the NetSuite domain of the account you want to use. You only need to specify the NetSuite domain if you are not using a production account.`,
      ignoreFocusOut: true,
    });

    const tokenKey = await vscode.window.showInputBox({
      prompt: 'Please enter your token key associated with your SuiteCloud IDE & CLI integration:',
      ignoreFocusOut: true,
    });
    if (tokenKey) {
      const tokenSecret = await vscode.window.showInputBox({
        prompt: 'Please enter your token secret associated with your SuiteCloud IDE & CLI integration:',
        ignoreFocusOut: true,
      });
      if (tokenSecret) {
        this.doAddProjectParameter = false;
        this.addDefaultParameters = false;
        this.runCommand(
          CLICommand.SaveToken,
          `--account`,
          `${account}`,
          `--authid`,
          `${authid}`,
          // `-savetoken`,
          `--tokenid`,
          `${tokenKey}`,
          `--tokensecret`,
          `${tokenSecret}`,
          `--url`,
          `${accountUrl}`
        );
      }
    }
  }

  async getFiles() {
    await this.getConfig();
    this.doAddProjectParameter = true;
    if (this.sdfConfig) {
      const files = await this.listFiles();
      if (files) {
        vscode.window.showInformationMessage('Synchronizing SuiteScript folder.');
        await this._importFiles(files);
      }
    } else {
      return;
    }
  }

  async getObjectFunc(object: CustomObject) {
    await this.getConfig();
    // Ephermeral data customizations should not be supported at this time.
    if (
      object.type === 'savedsearch' ||
      object.type === 'csvimport' ||
      object.type === 'dataset' ||
      object.type === 'financiallayout' ||
      object.type === 'reportdefinition' ||
      object.type === 'translationcollection' ||
      object.type === 'workbook'
    )
      return;

    this.doAddProjectParameter = true;
    if (this.sdfConfig) {
      await this._importObjects(object.type, ['ALL'], object.destination);
    } else {
      return;
    }
  }

  async update() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    await this.getConfig();
    const objectsRecordPath = path.join(this.rootPath, 'Objects');
    const pathExists = await this.fileExists(objectsRecordPath);

    if (pathExists) {
      const filePathList = await this.getXMLFileList(['Objects'], this.rootPath);

      if (filePathList.length > 0) {
        const shortNames = filePathList.map((file) => file.path.substr(file.path.indexOf('Objects') + 8));
        const selectionArr = await vscode.window.showQuickPick(shortNames, {
          canPickMany: true,
        });

        if (selectionArr && selectionArr.length > 0) {
          const selectedFile = filePathList.filter((file) => {
            for (const selection of selectionArr) {
              if (file.path.indexOf(selection) >= 0) {
                return true;
              }
            }
          });
          const selectionStr = selectedFile
            .map((file) => file.scriptid.substring(0, file.scriptid.indexOf('.')))
            .join(' ');
          this.runCommand(CLICommand.Update, `-scriptid`, `${selectionStr}`);
        }
      }
    }
  }

  async updateCustomRecordWithInstances() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    await this.getConfig();
    const customRecordPath = path.join(this.rootPath, '/Objects/Records');
    const pathExists = await this.fileExists(customRecordPath);
    if (pathExists) {
      const rawFileList = await this.ls(customRecordPath);
      const fileList = rawFileList.map((filename: string) => filename.slice(0, -4));

      if (fileList) {
        const objectId = await vscode.window.showQuickPick(fileList, {
          ignoreFocusOut: true,
        });
        if (objectId) {
          this.runCommand(CLICommand.UpdateCustomRecordsWithInstances, `-scriptid`, `${objectId}`);
        }
      }
    } else {
      vscode.window.showErrorMessage(
        'No custom records found in /Objects/Records. Import Objects before updating with custom records.'
      );
    }
  }

  validate() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    this.runCommand(CLICommand.Validate);
  }

  /************************/
  /** Extension Commands **/
  /************************/

  async createResetDeploy(context?: any) {
    await this.getConfig();
    this.setDefaultDeployXml();
    vscode.window.showInformationMessage('Reset deploy.xml.');
  }

  async backupRestoreDeploy(context?: any) {
    if (context && context.scheme !== 'file') {
      vscode.window.showWarningMessage(`Unknown file type '${context.scheme}' to backup/restore.`);
      return;
    }
    await this.getConfig();

    let currentFile: string;
    if (context && context.fsPath) {
      currentFile = fs.lstatSync(context.fsPath).isDirectory() ? `${context.fsPath}${path.sep}*` : context.fsPath;
    } else {
      currentFile = vscode.window.activeTextEditor.document.fileName;
    }

    const currentFileName = path.basename(currentFile);
    const isDeployXML = _.includes(currentFileName, 'deploy.xml');
    if (!isDeployXML) {
      vscode.window.showErrorMessage('File does not appear to be a valid deploy.xml file.');
      return;
    }

    let config = vscode.workspace.getConfiguration('netsuitesdf');
    const onBackupResetDeployXML = config.get('onBackupResetDeployXML');
    const onRestoreDeleteBackupDeployXML = config.get('onRestoreDeleteBackupDeployXML');

    if (currentFileName === 'deploy.xml') {
      const prompt =
        'Enter filename prefix (i.e. PREFIX.deploy.xml). Entering no value will use current date and time.';
      let filenamePrefix = await vscode.window.showInputBox({
        prompt: prompt,
        ignoreFocusOut: true,
      });
      const now = new Date();
      filenamePrefix =
        filenamePrefix ||
        `${now.toISOString().slice(0, 10).replace(/-/g, '')}_${('0' + now.getHours()).slice(-2)}${(
          '0' + now.getMinutes()
        ).slice(-2)}${('0' + now.getSeconds()).slice(-2)}`;
      await fs.copyFile(path.join(this.rootPath, 'deploy.xml'), path.join(this.rootPath, `${filenamePrefix}.deploy.xml`));
      if (onBackupResetDeployXML) {
        await this.createResetDeploy(context);
      }
      vscode.window.showInformationMessage(`Backed up deploy.xml to ${filenamePrefix}.deploy.xml`);
    } else {
      let answer: string;
      const deployXMLExists = await fs.pathExists(path.join(this.rootPath, 'deploy.xml'));
      if (deployXMLExists) {
        const prompt = 'Deploy.xml already exists. Type OK to overwrite the existing file.';
        answer = await vscode.window.showInputBox({
          prompt: prompt,
          ignoreFocusOut: true,
        });
      } else answer = 'OK';
      if (answer === 'OK') {
        await fs.copyFile(currentFile, path.join(this.rootPath, 'deploy.xml'));
        if (onRestoreDeleteBackupDeployXML) {
          await fs.remove(currentFile);
        }
        vscode.window.showInformationMessage(`Restored ${currentFileName} to deploy.xml`);
      }
    }
  }

  async addFileToDeploy(context?: any) {
    if (context && context.scheme !== 'file') {
      vscode.window.showWarningMessage(`Unknown file type '${context.scheme}' to add to deploy.xml`);
      return;
    }
    await this.getConfig();
    const deployPath = path.join(this.rootPath, 'deploy.xml');

    let currentFile: string;
    if (context && context.fsPath) {
      currentFile = fs.lstatSync(context.fsPath).isDirectory() ? `${context.fsPath}${path.sep}*` : context.fsPath;
    } else {
      currentFile = vscode.window.activeTextEditor.document.fileName;
    }

    let config = vscode.workspace.getConfiguration('netsuitesdf');
    const addMatchingJSWhenAddingTSToDeployXML = config.get('addMatchingJavascriptWhenAddingTypescriptToDeployXML');

    const isFileInFileCabinet = _.includes(currentFile, path.join(this.rootPath, '/FileCabinet/SuiteScripts'));
    let isJavaScript = isFileInFileCabinet && _.includes(currentFile, '.js');
    const isTypeScript = _.includes(currentFile, '.ts');
    const isObject = _.includes(currentFile, path.join(this.rootPath, '/Objects')) && _.includes(currentFile, '.xml');
    let matchedJavaScriptFile: string;

    if (!isFileInFileCabinet && !isJavaScript && !isObject) {
      if (isTypeScript && addMatchingJSWhenAddingTSToDeployXML) {
        const matchedJavaScriptFiles: string[] = [];
        const currentFileName = path.basename(currentFile);

        const getFiles = async (dir: string): Promise<string[]> => {
          const subdirs = (await util.promisify(fs.readdir)(dir)) as string[];
          const f = await Promise.all(
            subdirs.map(async (subdir) => {
              const res = path.resolve(dir, subdir);
              return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
            })
          );
          return Array.prototype.concat.apply([], f);
        };

        const files: string[] = await getFiles(path.join(this.rootPath, '/FileCabinet/SuiteScripts'));
        for (const file of files) {
          const fileName = path.basename(file);
          if (fileName.replace(/\.[^/.]+$/, '') === currentFileName.replace(/\.[^/.]+$/, '')) {
            matchedJavaScriptFiles.push(file);
          }
        }

        if (matchedJavaScriptFiles.length) {
          isJavaScript = true;
          const currentFileParentDir = path.basename(path.dirname(currentFile));
          for (const file of matchedJavaScriptFiles) {
            const fileParentDir = path.basename(path.dirname(file));
            if (fileParentDir === currentFileParentDir) {
              matchedJavaScriptFile = file;
              break;
            }
          }
          if (!matchedJavaScriptFile && matchedJavaScriptFiles.length === 1)
            matchedJavaScriptFile = matchedJavaScriptFiles[0];
          if (matchedJavaScriptFile) currentFile = matchedJavaScriptFile;
          else {
            vscode.window.showErrorMessage(
              'No matching compiled JavaScript file found in FileCabinet/SuiteScripts/**.'
            );
            return;
          }
        } else {
          vscode.window.showErrorMessage('No matching compiled JavaScript file found in FileCabinet/SuiteScripts/**.');
          return;
        }
      } else {
        vscode.window.showErrorMessage('Invalid file to add to deploy.xml. File is not a Script or an Object.');
        return;
      }
    }

    const xmlPath = isFileInFileCabinet || isJavaScript ? 'deploy.files[0].path' : 'deploy.objects[0].path';
    const relativePath = _.replace(currentFile, this.rootPath, '~').replace(/\\/gi, '/');

    const deployXmlExists = await this.fileExists(deployPath);
    if (!deployXmlExists) {
      this.setDefaultDeployXml();
    }
    const deployXml = await this.openFile(deployPath);
    const deployJs = await this.parseXml(deployXml);
    const elements = _.get(deployJs, xmlPath, []);
    if (_.includes(elements, relativePath)) {
      vscode.window.showInformationMessage(`${isObject ? 'Object' : 'File'} already exists in deploy.xml.`);
    } else {
      elements.push(relativePath);
      _.set(deployJs, xmlPath, elements);

      const newXml = this.xmlBuilder.buildObject(deployJs);
      fs.writeFile(deployPath, newXml, function (err) {
        if (err) throw err;
        vscode.window.showInformationMessage(
          `Added ${matchedJavaScriptFile ? 'matching compiled JavaScript' : ''} ${isObject ? 'object' : 'file'
          } to deploy.xml.`
        );
      });
    }
  }

  refreshConfig() {
    this.getConfig({ force: true });
  }

  async removeFolders() {
    await this.getConfig();

    if (this.sdfConfig) {
      vscode.window.showInformationMessage('Emptying: ' + this.rootPath + '/Objects/');
      await rimraf(this.rootPath + '/Objects/*', (err: Error) => {
        vscode.window.showErrorMessage(err.message);
      });
      vscode.window.showInformationMessage('Emptying: ' + this.rootPath + '/FileCabinet/SuiteScripts/');
      await rimraf(this.rootPath + '/FileCabinet/SuiteScripts/*', (err: Error) => {
        vscode.window.showErrorMessage(err.message);
      });
    }
  }

  async resetPassword() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    const _resetPassword = async () => {
      const prompt = `Please enter your password for your ${this.activeEnvironment.name} account.`;
      const password = await vscode.window.showInputBox({
        prompt: prompt,
        password: true,
        ignoreFocusOut: true,
      });
      this.password = password;
    };

    if (this.sdfConfig) {
      await _resetPassword();
    } else {
      await this.getConfig({ force: true });
      await _resetPassword();
    }
  }

  async selectEnvironment() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    const _selectEnvironment = async () => {
      try {
        const environments = this.sdfConfig.environments.reduce((acc, curr: Environment) => {
          acc[curr.name] = curr;
          return acc;
        }, {});
        const environmentNames = Object.keys(environments);
        if (environmentNames.length === 1) {
          const environmentName = environmentNames[0];
          this.activeEnvironment = environments[environmentName];
          this.statusBar.text = this.statusBarDefault;
          vscode.window.showInformationMessage(`Found only one environment. Using ${environmentName}`);
        } else {
          const environmentName = await vscode.window.showQuickPick(environmentNames, { ignoreFocusOut: true });
          if (environmentName) {
            this.activeEnvironment = environments[environmentName];
            if (this.activeEnvironment.account === '00000000') {
              vscode.window.showErrorMessage(
                '.sdfcli.json account number appears to be wrong. Are you still using the blank template?'
              );
              this.sdfConfig = undefined;
              this.activeEnvironment = undefined;
              this.clearStatus();
            } else {
              this.statusBar.text = this.statusBarDefault;
            }
          }
        }
      } catch (e) {
        vscode.window.showErrorMessage(
          'Unable to parse .sdfcli.json environments. Please check repo for .sdfcli.json formatting.'
        );
        this.clearStatus();
      }
    };

    if (this.sdfConfig) {
      await _selectEnvironment();
    } else {
      await this.getConfig({ force: true });
    }
  }

  setDefaultDeployXml() {
    const defaultXml = `<deploy></deploy>`;
    fs.writeFile(path.join(this.rootPath, 'deploy.xml'), defaultXml, function (err) {
      if (err) throw err;
    });
  }

  async sync() {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }
    const prompt = 'Warning! Syncing to NetSuite will delete File Cabinet and Object contents. Type OK to proceed.';
    const answer = await vscode.window.showInputBox({
      prompt: prompt,
      ignoreFocusOut: true,
    });
    if (answer === 'OK') {
      vscode.window.showInformationMessage('Beginning sync.');
    } else {
      this.outputChannel.append('Cancelling sync.\n');
      return;
    }

    await this.getConfig();
    await this.removeFolders();
    try {
      if (this.sdfConfig) {
        await Bluebird.map([this.getFiles.bind(this)], (func) => func(), { concurrency: 5 });
        const objectCommands = _.map(CustomObjects, (object: CustomObject) => this.getObjectFunc(object));
        await Bluebird.map([objectCommands], (func) => func(), { concurrency: 5 });

        vscode.window.showInformationMessage('Synchronization complete!');
      }
    } catch (e) {
    } finally {
      this.cleanup();
    }
  }

  /*********************/
  /** VS Code Helpers **/
  /*********************/

  async checkSdfCliIsInstalled() {
    try {
      commandExists('suitecloud', function (err, commandExists) {
        if (commandExists) {
          this.sdfCliIsInstalled = true;
        } else {
          throw err;
        }
      });
    } catch (e) {
      this.sdfCliIsInstalled = false;
      vscode.window.showWarningMessage(
        `NOTICE: The NetSuiteSDF extension no longer uses sdfcli. 
        Instead, it uses suitecloud-cli. So you will need to install this separately.
        See: https://www.npmjs.com/package/@oracle/suitecloud-cli`
      );
      if (e.code === 'ENOENT') {
        vscode.window.showErrorMessage("'sdfcli' not found in path! Check repo for install directions.");
      } else {
        throw e;
      }
    }
  }

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
    if (this.tempDir && this.tempDir.name !== '') {
      this.tempDir.removeCallback();
    }
    this.tempDir = undefined;
    this.addDefaultParameters = true;
  }

  clearStatus() {
    if (this.savedStatus) {
      this.statusBar.text = this.savedStatus;
      this.savedStatus = undefined;
    } else {
      this.statusBar.text = this.statusBarDefault;
    }
  }

  async getConfig({ force = false }: { force?: boolean } = {}) {
    if (!this.sdfCliIsInstalled) {
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    if (force || !this.sdfConfig) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        this.rootPath = workspaceFolders[0].uri.fsPath;
        this.srcPath = this.rootPath + '/src'
        console.log(this.rootPath);

        const sdfTokenPath = path.join(this.rootPath, '.clicache');
        const sdfCacheExists = await this.fileExists(sdfTokenPath);

        if (sdfCacheExists) {
          this.hasSdfCache = true;
        }

        const sdfPath = path.join(this.rootPath, '.sdfcli.json');
        const sdfPathExists = await this.fileExists(sdfPath);
        if (sdfPathExists) {
          const buffer = await this.openFile(path.join(this.rootPath, '.sdfcli.json'));
          const jsonString = buffer.toString();
          try {
            this.sdfConfig = JSON.parse(jsonString);
            await this.selectEnvironment();
          } catch (e) {
            vscode.window.showErrorMessage(`Unable to parse .sdfcli.json file found at project root: ${this.rootPath}`);
          }
        } else {
          fs.writeFileSync(path.join(this.rootPath, '.sdfcli.json'), SdfCliJson);
          vscode.window.showErrorMessage(
            `No .sdfcli.json file found at project root: ${this.rootPath}. Generated a blank .sdfcli.json template.`
          );
        }
      } else {
        vscode.window.showErrorMessage(
          'No workspace folder found. SDF plugin cannot work without a workspace folder root containing a .sdfcli.json file.'
        );
      }
    } else if (!this.activeEnvironment) {
      await this.selectEnvironment();
    }
  }

  handlePassword(line: string, command: CLICommand, stdinSubject: Subject<string>) {
    if (line.startsWith('Enter password:')) {
      line = line.substring(15);
    }
    if (line.includes('You have entered an invalid email address or password. Please try again.')) {
      this.password = undefined;
      vscode.window.showErrorMessage('Invalid email or password. Be careful! Too many attempts will lock you out!');
    }
    return line;
  }

  async handleStdIn(line: string, command: CLICommand, stdinSubject: Subject<string>) {
    switch (true) {
      case line.includes('Using user credentials.') && this.doSendPassword:
        if (!this.password) {
          await this.resetPassword();
        }
        stdinSubject.next(`${this.password}\n`);
        break;
      case line.includes('WARNING! You are deploying to a Production account, enter YES to continue'):
        const prompt = "Please type 'Deploy' to deploy to production.";
        const answer = await vscode.window.showInputBox({
          prompt: prompt,
          ignoreFocusOut: true,
        });
        if (answer === 'Deploy') {
          stdinSubject.next('YES\n');
        } else {
          this.outputChannel.append('Cancelling deployment.\n');
          stdinSubject.next('NO\n');
        }
        break;
      case line.includes('Type YES to continue'):
      case line.includes('enter YES to continue'):
      case line.includes('Type YES to update the manifest file'):
      case line.includes('Proceed with deploy?'):
      case line.includes('Type Yes (Y) to continue.'):
        stdinSubject.next('YES\n');
        break;
      default:
        break;
    }
  }

  async handleStdOut(line: string, command: CLICommand) {
    switch (true) {
      case line.includes('That record does not exist.'):
        break;
      case line.includes('does not exist.'):
        vscode.window.showErrorMessage('Custom record does not exist for updating. Please Import Object first.');
        break;
      case line.includes('Installation COMPLETE'):
        vscode.window.showInformationMessage('Installation of deployment was completed.');
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

  async runCommand(command: CLICommand, ...args): Promise<any> {
    await this.getConfig();
    if (this.sdfConfig && this.activeEnvironment) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (this.doShowOutput) {
        this.outputChannel.show();
      }

      let workPath = this.rootPath;
      if (this.tempDir) {
        workPath = path.join(workPath, this.tempDir.name);
      }

      let commandArray: string[] = [command];
      if (this.addDefaultParameters) {
        commandArray = commandArray.concat([
          /**
           * As of 2020.2, this plugin will no longer support
           * username and password for authentication.
           * Please use the sdfcli manageauth -savetoken option
           * to add accounts to your environment.
           */

          // TODO: REFACTOR TO SWITCH TO SELECTED ENV!!!
          `-authid`,
          `${this.activeEnvironment.authid}`,
        ]);
      }

      if (this.doAddProjectParameter) {
        commandArray.push(`-p`, `${workPath}`);
      }
      for (let arg of args) {
        let argArray = arg.split(' ');
        argArray.map((a) => commandArray.push(`${a}`));
      }

      const stdinSubject = new Subject<string>();

      this.sdfcli = spawn('suitecloud', commandArray, {
        cwd: workPath,
        stdin: stdinSubject,
        windowsVerbatimArguments: true,
      });

      this.showStatus();

      let streamWrapper: Observable<any> = new Observable((observer) => {
        let acc = '';

        return this.sdfcli.subscribe(
          (value) => {
            acc = acc + value;
            let lines = acc.split('\n');

            // Check if the last line is a password entry line - this is only an issue with Object and File imports
            const endingPhrases = ['Enter password:'];
            const endingLine = lines.filter((line) => {
              for (let phrase of endingPhrases) {
                return line === phrase;
              }
            });
            for (let line of lines.slice(0, -1).concat(endingLine)) {
              observer.next(line);
            }
            acc = endingLine.length > 0 ? '' : lines[lines.length - 1];
          },
          (error) => observer.error(error),
          () => observer.complete()
        );
      });

      const collectedData = await streamWrapper
        .map((line) => this.handlePassword(line, command, stdinSubject))
        .do((line) => (this.doShowOutput ? this.outputChannel.append(`${line}\n`) : null))
        .do((line) => this.handleStdIn(line, command, stdinSubject))
        .do((line) => this.handleStdOut(line, command))
        .filter(
          (line) =>
            !(
              !line ||
              line.startsWith('[INFO]') ||
              line.startsWith('SuiteCloud Development Framework CLI') ||
              line.startsWith('Done.') ||
              line.startsWith('Using ')
            )
        )
        .map((line) => this.mapCommandOutput(command, line))
        .reduce((acc: string[], curr: string) => acc.concat([curr]), [])
        .toPromise()
        .catch((err) => this.cleanup());

      this.cleanup();
      return collectedData;
    }
  }

  showStatus() {
    this.savedStatus = this.statusBar.text;
    const mode1 = ' [= ]';
    const mode2 = ' [ =]';
    let currentMode = mode1;
    this.intervalId = setInterval(() => {
      currentMode = currentMode === mode1 ? mode2 : mode1;
      this.statusBar.text = this.savedStatus + currentMode;
    }, 500);
  }

  /**************/
  /*** UTILS ****/
  /**************/

  async copyFile(relativeFrom: string, relativeTo: string) {
    const toDir = relativeTo.split('/').slice(0, -1).join('/');
    this.createPath(toDir);
    const from = path.join(this.rootPath, relativeFrom);
    const to = path.join(this.rootPath, relativeTo);
    return fs.copyFile(from, to);
  }

  createPath(targetDir) {
    // Strip leading '/'
    targetDir = targetDir.substring(1);
    const initDir = this.rootPath;
    const baseDir = this.rootPath;

    targetDir.split('/').reduce((parentDir, childDir) => {
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

  async getFilePaths(filePatterns: string[]): Promise<string[]> {
    const globPromises = filePatterns.map((filePattern) => {
      filePattern = filePattern.replace('~', '');
      filePattern = filePattern.replace('*', '**'); // NetSuite's * glob pattern functions the same as a traditional ** pattern
      return globAsync(path.join(this.rootPath, filePattern), { nodir: true });
    });
    const matchArr = await Promise.all(globPromises);
    const filePaths: string[] = matchArr.reduce((filePathAccum: string[], matches) => {
      for (const match of matches) {
        // Make sure there are no duplicates
        if (filePathAccum.indexOf(match) === -1) {
          filePathAccum.push(match);
        }
      }
      return filePathAccum;
    }, []);
    const relativeFilePaths = filePaths.map((fullPath) => `${path.sep}${path.relative(this.rootPath, fullPath)}`);
    return relativeFilePaths;
  }

  fileExists(p: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        fs.exists(p, (exists) => resolve(exists));
      } catch (e) {
        reject(e);
      }
    });
  }

  openFile(p: string): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(p, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }

  ls(p: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(p, (err, items) => {
        if (err) {
          reject(err);
        }
        resolve(items);
      });
    });
  }

  parseXml(xml: string): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, function (err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }

  async getXMLFileList(dirList: string[], root: string): Promise<{ path: string; scriptid: string }[]> {
    const fileList: { path: string; scriptid: string }[] = [];
    const traverseFolders = async (folders: string[], root: string) => {
      if (folders.length > 0) {
        for (const folder of folders) {
          const rawFileList = await this.ls(path.join(root, folder));
          const dirList: string[] = [];
          for (const fileName of rawFileList) {
            const lstat = fs.lstatSync(path.join(root, folder, fileName));
            if (lstat.isDirectory()) {
              dirList.push(fileName);
            } else {
              if (fileName.slice(fileName.length - 4) === '.xml') {
                fileList.push({
                  path: path.join(root, folder, fileName),
                  scriptid: fileName,
                });
              }
            }
          }
          await traverseFolders(dirList, path.join(root, folder));
        }
      } else {
        return folders;
      }
    };
    try {
      await traverseFolders(dirList, root);
      return fileList;
    } catch (err) {
      vscode.window.showErrorMessage('Unable to get file list: ', err.message);
    }
  }
}
