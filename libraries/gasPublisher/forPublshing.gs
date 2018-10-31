
function showMyScriptDb() {
  return publicStuffDb();
}
function publicStuffDb() {
  return ScriptDb.getMyDb();
}
function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}
function test(e) {

    //----------
    // need to put this in a global var for callback from template
    eArgs = {parameter:{type:"json",module:"accounts",library:"useMultipleDB",
      source:"scriptdb",query:'{"data":{"customer":{"name":"john"}}}'}};

    // set the arg defaults
    mcpher.setGasPubDefaults (eArgs);
    // convert source to correct format
    var result = expressSource(eArgs);
    Logger.log(result);
    // publish as appropriate
    return mcpher.prepareGasPub(eArgs,result);
}
function t2() {
   var silo= mcpher.scriptDbSilo("accounts",useMultipleDB.showMyScriptDb()); 
   var q = JSON.parse('{"data":{"customer":{"name":"john"}}}');

   var customerResults = silo.query(q);
   while (customerResults.hasNext()) {
    var c = customerResults.next();
      Logger.log (JSON.stringify(c));
    }
}