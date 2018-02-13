'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { NetSuiteSDF } from './netsuite-sdf';

export function activate(context: vscode.ExtensionContext) {

    const netsuiteSdf = new NetSuiteSDF(context);

    let addDependencies = vscode.commands.registerCommand('extension.addDependencies', netsuiteSdf.addDependencies);
    let clearPassword = vscode.commands.registerCommand('extension.clearPassword', netsuiteSdf.clearPassword);
    let deploy = vscode.commands.registerCommand('extension.deploy', netsuiteSdf.deploy);
    let importBundle = vscode.commands.registerCommand('extension.importBundle', netsuiteSdf.importBundle);
    let importFiles = vscode.commands.registerCommand('extension.importFiles', netsuiteSdf.importFiles);
    let importObjects = vscode.commands.registerCommand('extension.importObjects', netsuiteSdf.importObjects);
    let listBundles = vscode.commands.registerCommand('extension.listBundles', netsuiteSdf.listBundles);
    let listFiles = vscode.commands.registerCommand('extension.listFiles', netsuiteSdf.listFiles);
    let listMissingDependencies = vscode.commands.registerCommand('extension.listMissingDependencies', netsuiteSdf.listMissingDependencies);
    let listObjects = vscode.commands.registerCommand('extension.listObjects', netsuiteSdf.listObjects);
    let preview = vscode.commands.registerCommand('extension.preview', netsuiteSdf.preview);
    let update = vscode.commands.registerCommand('extension.update', netsuiteSdf.update);
    let updateCustomRecordsWithInstances = vscode.commands.registerCommand('extension.updateCustomRecordsWithInstances', netsuiteSdf.updateCustomRecordsWithInstances);
    let validate = vscode.commands.registerCommand('extension.validate', netsuiteSdf.validate);

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
