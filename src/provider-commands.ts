import * as _ from 'lodash';

import { NetSuiteSDF } from './netsuite-sdf';
import { SDFObjectFolder, SDFObject, SDFProvider } from './sdf-provider';

export let _importObject = (sdf: NetSuiteSDF) => (context?: SDFObject) => {
  sdf._importObjects(context.type, [context.label], context.path);
};

export let _importFile = (sdf: NetSuiteSDF) => (context?: SDFObject) => {
  sdf._importFiles([context.path]);
};

export let _importObjectFolder = (sdf: NetSuiteSDF) => async (context?: SDFObjectFolder) => {
  const children = await context.getChildren();
  const scriptIds = _.map(children, (sdfObject: SDFObject) => sdfObject.label);
  sdf._importObjects(context.object.type, scriptIds, context.object.destination);
};

export let _refresh = (provider: SDFProvider) => async (context?: any) => {
  console.log(provider);
  console.log(context);
};
