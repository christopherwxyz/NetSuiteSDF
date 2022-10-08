export enum CLICommand {
  AddDependencies = 'project:adddependencies', // 2022.2
  CreateProject = 'project:create', // 2022.2
  Deploy = 'project:deploy', // 2022.2
  ImportFiles = 'file:import', // 2022.2
  ImportObjects = 'object:import', // 2022.2
  ListFiles = 'file:list', // 2022.2
  ListObjects = 'object:list', // 2022.2
  RevokeToken = 'account:manageauth', // TODO: Setup this per environment.
  SaveToken = 'account:savetoken', // 2022.2
  Setup = 'account:setup', // TODO: Setup this per environment.
  Update = 'object:update', // 2022.2
  Validate = 'project:validate' // 2022.2
}
