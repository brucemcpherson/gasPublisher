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


function getKeys() {
  return {
    applicationId : "a7aXU5fBuULjvRNKZpE2QM5EdhjmR133BnURHNn8",
    restKey : "uHgHV7tu2m95TNTuspOC1V8YnjtHLnMOcSaTXjMT"} ;
}
