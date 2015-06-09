
function publicStuffDb() {
  return getDefaultDB();
}
function showMyScriptDb() {
  return publicStuffDb();
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
    siloid:optSilo || 'blisterAPI',
    dbid:'xliberation',
    driverob:JSON.parse(PropertiesService.getScriptProperties().getProperty("mongoLabKeys"))
  }));
}

