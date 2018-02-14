'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { NetSuiteSDF } from './netsuite-sdf';

export function activate(context: vscode.ExtensionContext) {

    const netsuiteSdf = new NetSuiteSDF(context);

    let addDependencies = vscode.commands.registerCommand('extension.addDependencies', netsuiteSdf.addDependencies.bind(netsuiteSdf));
    let clearPassword = vscode.commands.registerCommand('extension.clearPassword', netsuiteSdf.clearPassword.bind(netsuiteSdf));
    let deploy = vscode.commands.registerCommand('extension.deploy', netsuiteSdf.deploy.bind(netsuiteSdf));
    let importBundle = vscode.commands.registerCommand('extension.importBundle', netsuiteSdf.importBundle.bind(netsuiteSdf));
    let importFiles = vscode.commands.registerCommand('extension.importFiles', netsuiteSdf.importFiles.bind(netsuiteSdf));
    let importObjects = vscode.commands.registerCommand('extension.importObjects', netsuiteSdf.importObjects.bind(netsuiteSdf));
    let listBundles = vscode.commands.registerCommand('extension.listBundles', netsuiteSdf.listBundles.bind(netsuiteSdf));
    let listFiles = vscode.commands.registerCommand('extension.listFiles', netsuiteSdf.listFiles.bind(netsuiteSdf));
    let listMissingDependencies = vscode.commands.registerCommand('extension.listMissingDependencies', netsuiteSdf.listMissingDependencies.bind(netsuiteSdf));
    let listObjects = vscode.commands.registerCommand('extension.listObjects', netsuiteSdf.listObjects.bind(netsuiteSdf));
    let preview = vscode.commands.registerCommand('extension.preview', netsuiteSdf.preview.bind(netsuiteSdf));
    let refreshConfig = vscode.commands.registerCommand('extension.refreshConfig', netsuiteSdf.refreshConfig.bind(netsuiteSdf));
    let update = vscode.commands.registerCommand('extension.update', netsuiteSdf.update.bind(netsuiteSdf));
    let updateCustomRecordsWithInstances = vscode.commands.registerCommand('extension.updateCustomRecordsWithInstances', netsuiteSdf.updateCustomRecordsWithInstances.bind(netsuiteSdf));
    let validate = vscode.commands.registerCommand('extension.validate', netsuiteSdf.validate.bind(netsuiteSdf));

    context.subscriptions.push(addDependencies);
    context.subscriptions.push(clearPassword);
    context.subscriptions.push(deploy);
    context.subscriptions.push(importBundle);
    context.subscriptions.push(importFiles);
    context.subscriptions.push(importObjects);
    context.subscriptions.push(listBundles);
    context.subscriptions.push(listFiles);
    context.subscriptions.push(listMissingDependencies);
    context.subscriptions.push(listObjects);
    context.subscriptions.push(preview);
    context.subscriptions.push(update);
    context.subscriptions.push(updateCustomRecordsWithInstances);
    context.subscriptions.push(validate);

}

// this method is called when your extension is deactivated
export function deactivate() {
}
