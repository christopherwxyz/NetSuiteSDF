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
    if (this.netsuiteSdf.showOutput) {
      this.outputChannel.append(stringData);
    }
    this.parseStdOut(stringData);
  }

  stderr(data: string | Buffer) {
    this.outputChannel.append(`stderr: ${data}`);
  }

  close(code: number) {
    this.netsuiteSdf.collectedData = this.collectedData;
    this.netsuiteSdf.cleanup();
  }

  private parseStdOut(data: string) {
    const lines = data.trim().split('\n').reduce((acc: string[], value: string) => {
      switch (true) {
        case value.startsWith('[INFO]'):
        case value.startsWith('SuiteCloud Development Framework CLI'):
        case value.startsWith('Done.'):
          return acc;
        case value.startsWith('Enter password:'):
          const startIndex = value.indexOf('/');
          value = value.substring(startIndex);
        default:
          acc.push(value);
          return acc;
      }
    }, []);
    this.netsuiteSdf.collectedData = this.netsuiteSdf.collectedData.concat(lines);
  }
}

