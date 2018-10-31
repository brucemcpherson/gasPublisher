/**
 * Returns a modules source code
 * @param {parameters} e the argument to doGet(e). should have module parameter specified
 * @param {scriptappinstance} sap an instance of scriptapp
 * @return {object} The result.
 */
function getMySource(e) {
  var results = {error : "missing module parameter"};
  if (e.hasOwnProperty("parameter")) {
    if (e.parameter.module) {
      try {
        var results = 
        { source : 
          { module : e.parameter.module, code : ScriptApp.getResource(e.parameter.module).getDataAsString() } 
        };
      }
      catch (err) {
        var results = { error : "could not open module " + e.parameter.module} ;
      }
    }
  }
  return results;
}

function testGetSource() {

  Logger.log( getMySource (  {parameter: { module: "cRest" }}));
}