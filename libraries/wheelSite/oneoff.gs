function oneOffSetting() { 
  
  // Provoke Driveapp.getFileById() permission dialog with this comment
  
  // used by all using this script
  var propertyStore = PropertiesService.getScriptProperties();
  
  // service account for cloud vision
  cGoa.GoaApp.setPackage (
    propertyStore , 
    cGoa.GoaApp.createServiceAccount (DriveApp , {
      packageName: 'xliberation-store',
      fileId:'0B92ExLh4POiZS1ZSbmFQcmFMZU0',
      scopes : cGoa.GoaApp.scopesGoogleExpand (['cloud-platform']),
      service:'google_service'
    }));
  
}