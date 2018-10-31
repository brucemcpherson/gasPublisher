
function showMyScriptDb() {
  return publicStuffDb();
}
function publicStuffDb() {
  return getDefaultDB();
}

function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}
function getDefaultDB (optSilo) {

  return new cRipDB.RipDB (new cDbAbstraction.DbAbstraction ( cDriverMongoLab , {
    siloid:optSilo || 'university',
    dbid:'xliberation',
    driverob:JSON.parse(PropertiesService.getScriptProperties().getProperty("mongoLabKeys"))
  }));
}
