export enum CLICommand {
  AddDependencies = 'project:adddependencies', // 2022.2
  CreateProject = 'project:create', // 2022.2
  Deploy = 'project:deploy', // 2022.2
  ImportBundle = 'importbundle',
  ImportFiles = 'file:import', // 2022.2
  ImportObjects = 'object:import', // 2022.2
  IssueToken = 'issuetoken',
  ListBundles = 'listbundles',
  ListConfiguration = 'listconfiguration',
  ListFiles = 'file:list', // 2022.2
  ListMissingDependencies = 'listmissingdependencies',
  ListObjects = 'object:list', // 2022.2
  Preview = 'preview',
  RevokeToken = 'revoketoken',
  SaveToken = 'authenticate',
  Update = 'update',
  UpdateCustomRecordsWithInstances = 'updatecustomrecordwithinstances',
  // UploadFolders = 'uploadfolders',
  Validate = 'project:validate' // 2022.2
}
