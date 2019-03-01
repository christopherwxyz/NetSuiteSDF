import { QuickPickItem } from 'vscode';

export interface ICustomObject extends QuickPickItem {
  _destination: string[];
  type: string;
}

export class CustomObject implements ICustomObject {
  label: string;
  type: string;
  _destination: string[];
  detail: string;
  description: string;

  constructor(customObject: ICustomObject) {
    return Object.assign(this, customObject);
  }

  get destination() {
    return `/Objects/${this._destination.join('/')}`;
  }
}

export const CustomObjects: CustomObject[] = [
  new CustomObject({
    label: 'Advanced PDF Template',
    type: 'advancedpdftemplate',
    _destination: ['Templates', 'AdvancedPDFs'],
    detail: 'custtmpl',
    description: ''
  }),
  new CustomObject({
    label: 'Bundle Installation Script',
    type: 'bundleinstallationscript',
    _destination: ['BundleInstallation'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Centers',
    type: 'center',
    _destination: ['CentersAndTabs', 'Centers'],
    detail: 'custcenter',
    description: ''
  }),
  new CustomObject({
    label: 'Center Categories',
    type: 'centercategory',
    _destination: ['CentersAndTabs', 'Categories'],
    detail: 'custcentercategory',
    description: ''
  }),
  new CustomObject({
    label: 'Center Tabs',
    type: 'centertab',
    _destination: ['CentersAndTabs', 'Tab'],
    detail: 'custcentertab',
    description: ''
  }),
  new CustomObject({
    label: 'Client Scripts',
    type: 'clientscript',
    _destination: ['Scripts', 'Client'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'CRM Custom Fields',
    type: 'crmcustomfield',
    _destination: ['Fields', 'CRM'],
    detail: 'custevent',
    description: ''
  }),
  new CustomObject({
    label: 'Custom Plugins',
    type: 'customglplugin',
    _destination: ['Plugins', 'Custom'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Custom Lists',
    type: 'customlist',
    _destination: ['Lists'],
    detail: 'customlist',
    description: ''
  }),
  new CustomObject({
    label: 'Custom Records',
    type: 'customrecordtype',
    _destination: ['Records'],
    detail: 'customrecord',
    description: ''
  }),
  new CustomObject({
    label: 'Custom Segment',
    type: 'customsegment',
    _destination: ['CustomSegments'],
    detail: 'cseg',
    description: ''
  }),
  new CustomObject({
    label: 'Custom Transactions',
    type: 'customtransactiontype',
    _destination: ['CustomTransactions'],
    detail: 'customtransaction',
    description: ''
  }),
  new CustomObject({
    label: 'Email Capture Plugins',
    type: 'emailcaptureplugin',
    _destination: ['Plugins', 'Email'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Email Template',
    type: 'emailtemplate',
    _destination: ['Templates', 'Email'],
    detail: 'custemailtmpl',
    description: ''
  }),
  new CustomObject({
    label: 'Entity Custom Fields',
    type: 'entitycustomfield',
    _destination: ['Fields', 'Entity'],
    detail: 'custentity',
    description: ''
  }),
  new CustomObject({
    label: 'Entity Forms',
    type: 'entryForm',
    _destination: ['Forms', 'EntryForm'],
    detail: 'custform',
    description: ''
  }),
  new CustomObject({
    label: 'Item Custom Fields',
    type: 'itemcustomfield',
    _destination: ['Fields', 'Item'],
    detail: 'custitem',
    description: ''
  }),
  new CustomObject({
    label: 'Item Number Custom Fields',
    type: 'itemnumbercustomfield',
    _destination: ['Fields', 'ItemNumber'],
    detail: 'custitem',
    description: ''
  }),
  new CustomObject({
    label: 'Item Option Custom Fields',
    type: 'itemoptioncustomfield',
    _destination: ['Fields', 'ItemOption'],
    detail: 'custitemoption',
    description: ''
  }),
  new CustomObject({
    label: 'KPI Scorecard',
    type: 'kpiscorecard',
    _destination: ['KPIScorecards'],
    detail: 'custkpiscorecard',
    description: ''
  }),
  new CustomObject({
    label: 'Map Reduce Script',
    type: 'mapreducescript',
    _destination: ['Scripts', 'MapReduce'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Mass Update Script',
    type: 'massupdatescript',
    _destination: ['Scripts', 'MassUpdate'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Other Custom Field',
    type: 'othercustomfield',
    _destination: ['Fields', 'Other'],
    detail: 'custrecord',
    description: ''
  }),
  new CustomObject({
    label: 'Plugin Implementation',
    type: 'pluginimplementation',
    _destination: ['PluginImplementations'],
    detail: 'customscript',
    description: ''
  }),

  new CustomObject({
    label: 'Plugin Type',
    type: 'plugintype',
    _destination: ['PluginTypes'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Portlets',
    type: 'portlet',
    _destination: ['Scripts', 'Portlet'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Promotions Plugins',
    type: 'promotionsplugin',
    _destination: ['Plugins', 'Promotions'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Publish Dashboards',
    type: 'publisheddashboard',
    _destination: ['PublishDashboards'],
    detail: 'custpubdashboard',
    description: ''
  }),
  new CustomObject({
    label: 'Restlets',
    type: 'restlet',
    _destination: ['Scripts', 'Restlet'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Roles',
    type: 'role',
    _destination: ['Roles'],
    detail: 'customrole',
    description: ''
  }),
  new CustomObject({
    label: 'Saved CSV Import',
    type: 'csvimport',
    _destination: ['CSVImports'],
    detail: 'custimport',
    description: ''
  }),
  new CustomObject({
    label: 'Saved Searches',
    type: 'savedsearch',
    _destination: ['SavedSearches'],
    detail: 'customsearch',
    description: ''
  }),
  new CustomObject({
    label: 'Scheduled Scripts',
    type: 'scheduledscript',
    _destination: ['Scripts', 'Scheduled'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'SSP Applications',
    type: 'sspapplication',
    _destination: ['SSPApplications'],
    detail: 'webapp',
    description: ''
  }),
  new CustomObject({
    label: 'Sublists',
    type: 'sublist',
    _destination: ['Sublists'],
    detail: 'custsublist',
    description: ''
  }),
  new CustomObject({
    label: 'SubTabs',
    type: 'subtab',
    _destination: ['CentersAndTabs', 'SubTab'],
    detail: 'custtab',
    description: ''
  }),
  new CustomObject({
    label: 'Suitelet',
    type: 'suitelet',
    _destination: ['Scripts', 'Suitelet'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Transaction Forms',
    type: 'transactionForm',
    _destination: ['Forms', 'TransactionForm'],
    detail: 'custform',
    description: ''
  }),
  new CustomObject({
    label: 'Transaction Body Custom Field',
    type: 'transactionbodycustomfield',
    _destination: ['Fields', 'TransactionBody'],
    detail: 'transactionbodycustomfield',
    description: ''
  }),
  new CustomObject({
    label: 'Transaction Column Custom Field',
    type: 'transactioncolumncustomfield',
    _destination: ['Fields', 'TransactionColumn'],
    detail: 'custcol',
    description: ''
  }),
  new CustomObject({
    label: 'User Event Script',
    type: 'usereventscript',
    _destination: ['Scripts', 'UserEvent'],
    detail: 'customscript',
    description: ''
  }),
  new CustomObject({
    label: 'Workflows',
    type: 'workflow',
    _destination: ['Workflows'],
    detail: 'customworkflow',
    description: ''
  }),
  new CustomObject({
    label: 'Workflow Action Scripts',
    type: 'workflowactionscript',
    _destination: ['Scripts', 'WorkflowAction'],
    detail: 'customscript',
    description: ''
  })
];
