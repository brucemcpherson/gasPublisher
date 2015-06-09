
function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}

function storeKey (){
  PropertiesService.getScriptProperties().setProperty("sharedCountKeys",JSON.stringify({"restAPIKey":"386818efd71d427ff1173dfafa1449aee2da7f2b","application":"plus1stats"}));
}
