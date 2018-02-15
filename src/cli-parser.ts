import { ChildProcess } from 'child_process';

import * as vscode from 'vscode';
import { OutputChannel } from 'vscode';

import { CLICommand } from './cli-command';
import { NetSuiteSDF } from './netsuite-sdf';

export class CLIParser {

  collectedData: string[];

  // TODO: Figure out what environment variables the CLIParser needs from netsuite-sdf
  constructor(
    private sdfcli: ChildProcess,
    private command: CLICommand,
    private outputChannel: OutputChannel,
    private netsuiteSdf: NetSuiteSDF,
  ) {
    this.collectedData = [];
  }

  stdout(data: string | Buffer) {
    const stringData = data.toString();
    if (stringData.includes('SuiteCloud Development Framework CLI')) {
      this.sdfcli.stdin.write(`${this.netsuiteSdf.pw}\n`);
    }
    this.outputChannel.append(stringData);
    if (stringData.startsWith('[INFO]') || stringData.startsWith('Done.')) {
      // Do nothing
    } else {
      this.collectedData.push(stringData);
    }
  }

  stderr(data: string | Buffer) {
    this.outputChannel.append(`stderr: ${data}`);
  }

  close(code: number) {
    this.outputChannel.append(`child process exited with code ${code}`);
    this.netsuiteSdf.cleanup();
  }

}
