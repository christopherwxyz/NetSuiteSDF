import { QuickPickItem } from "vscode";

export interface CustomObject extends QuickPickItem {
  destination: string;
  type: string;
}

export const CustomObjects: CustomObject[] = [
  {
    label: 'Bundle Installation Script',
    type: 'bundleinstallationscript',
    destination: '/Objects/BundleInstallation',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Centers',
    type: 'center',
    destination: '/Objects/CentersAndTabs/Centers',
    detail: 'custcenter',
    description: ''
  },
  {
    label: 'Center Categories',
    type: 'centercategory',
    destination: '/Objects/CentersAndTabs/Categories',
    detail: 'custcentercategory',
    description: ''
  },
  {
    label: 'Center Tabs',
    type: 'centertab',
    destination: '/Objects/CentersAndTabs/Tab',
    detail: 'custcentertab',
    description: ''
  },
  {
    label: 'Client Scripts',
    type: 'clientscript',
    destination: '/Objects/Scripts/Client',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'CRM Custom Fields',
    type: 'crmcustomfield',
    destination: '/Objects/Fields/CRM',
    detail: 'custevent',
    description: ''
  },
  {
    label: 'Custom Plugins',
    type: 'customglplugin',
    destination: '/Objects/Plugins/Custom',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Custom Lists',
    type: 'customlist',
    destination: '/Objects/Lists',
    detail: 'customlist',
    description: ''
  },
  {
    label: 'Custom Records',
    type: 'customrecordtype',
    destination: '/Objects/Records',
    detail: 'customrecord',
    description: ''
  },
  {
    label: 'Email Capture Plugins',
    type: 'emailcaptureplugin',
    destination: '/Objects/Plugins/Email',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Entity Custom Fields',
    type: 'entitycustomfield',
    destination: '/Objects/Fields/Entity',
    detail: 'custentity',
    description: ''
  },
  {
    label: 'Entity Forms',
    type: 'entryForm',
    destination: '/Objects/Forms/EntryForm',
    detail: 'custform',
    description: ''
  },
  {
    label: 'Transaction Forms',
    type: 'transactionForm',
    destination: '/Objects/Forms/TransactionForm',
    detail: 'custform',
    description: ''
  },
  {
    label: 'Item Custom Fields',
    type: 'itemcustomfield',
    destination: '/Objects/Fields/Item',
    detail: 'custitem',
    description: ''
  },
  {
    label: 'Item Number Custom Fields',
    type: 'itemnumbercustomfield',
    destination: '/Objects/Fields/ItemNumber',
    detail: 'custitem',
    description: ''
  },
  {
    label: 'Item Option Custom Fields',
    type: 'itemoptioncustomfield',
    destination: '/Objects/Fields/ItemOption',
    detail: 'custitemoption',
    description: ''
  },
  {
    label: 'Map Reduce Script',
    type: 'mapreducescript',
    destination: '/Objects/Scripts/MapReduce',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Mass Update Script',
    type: 'massupdatescript',
    destination: '/Objects/Scripts/MassUpdate',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Other Custom Field',
    type: 'othercustomfield',
    destination: '/Objects/Fields/Other',
    detail: 'custrecord',
    description: ''
  },
  {
    label: 'Portlets',
    type: 'portlet',
    destination: '/Objects/Scripts/Portlet',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Promotions Plugins',
    type: 'promotionsplugin',
    destination: '/Objects/Plugins/Promotions',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Restlets',
    type: 'restlet',
    destination: '/Objects/Scripts/Restlet',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Roles',
    type: 'role',
    destination: '/Objects/Roles',
    detail: 'customrole',
    description: ''
  },
  {
    label: 'Saved Searches',
    type: 'savedsearch',
    destination: '/Objects/SavedSearches',
    detail: 'customsearch',
    description: ''
  },
  {
    label: 'Scheduled Scripts',
    type: 'scheduledscript',
    destination: '/Objects/Scripts/Scheduled',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'SubTabs',
    type: 'subtab',
    destination: '/Objects/CentersAndTabs/SubTab',
    detail: 'custtab',
    description: ''
  },
  {
    label: 'Suitelet',
    type: 'suitelet',
    destination: '/Objects/Scripts/Suitelet',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Transaction Body Custom Field',
    type: 'transactionbodycustomfield',
    destination: '/Objects/Fields/TransactionBody',
    detail: 'transactionbodycustomfield',
    description: ''
  },
  {
    label: 'Transaction Column Custom Field',
    type: 'transactioncolumncustomfield',
    destination: '/Objects/Fields/TransactionColumn',
    detail: 'custcol',
    description: ''
  },
  {
    label: 'User Event Script',
    type: 'usereventscript',
    destination: '/Objects/Scripts/UserEvent',
    detail: 'customscript',
    description: ''
  },
  {
    label: 'Workflows',
    type: 'workflow',
    destination: '/Objects/Workflows',
    detail: 'customworkflow',
    description: ''
  },
  {
    label: 'Workflow Action Scripts',
    type: 'workflowactionscript',
    destination: '/Objects/Scripts/WorkflowAction',
    detail: 'customscript',
    description: ''
  }
]
