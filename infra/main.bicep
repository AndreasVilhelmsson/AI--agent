@description('Location for all resources.')
param location string = resourceGroup().location

@description('Globally unique web app name (also becomes <name>.azurewebsites.net).')
param appName string

@description('App Service plan name.')
param planName string = '${appName}-plan'

@description('SKU for App Service plan. For cheap demo: B1. (F1 is not available for Linux App Service).')
@allowed([
  'B1'
  'S1'
  'P1v3'
])
param planSkuName string = 'B1'

@description('Your API will listen on this port inside App Service (ASP.NET uses 8080 by default in Linux).')
param port string = '8080'

@secure()
@description('OpenAI API key (keep out of git).')
param openAiApiKey string

@description('OpenAI model name, e.g. gpt-4o-mini.')
param openAiModel string = 'gpt-4o-mini'

var linuxFxVersion = 'DOTNETCORE|9.0'

resource plan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: planSkuName
    tier: (planSkuName == 'B1') ? 'Basic' : (planSkuName == 'S1') ? 'Standard' : 'PremiumV3'
    size: planSkuName
    capacity: 1
  }
  properties: {
    reserved: true // required for Linux
  }
}

resource web 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appSettings: [
        // Required by many ASP.NET Linux setups
        { name: 'WEBSITES_PORT', value: port }
        { name: 'ASPNETCORE_URLS', value: 'http://0.0.0.0:${port}' }

        // Your config keys
        { name: 'OpenAI__ApiKey', value: openAiApiKey }
        { name: 'OpenAI__Model', value: openAiModel }

        // Optional: make logs easier during demo
        { name: 'Logging__LogLevel__Default', value: 'Information' }
        { name: 'Logging__LogLevel__Microsoft', value: 'Warning' }
      ]
    }
  }
}

output appUrl string = 'https://${web.name}.azurewebsites.net'