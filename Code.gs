// used by template
var eArgs;
 /** publish google apps script in various formats
  * all apply to e.parameter..
  * @param {String=} module the name of the module|scriptdb|gistfilename|filename entry to publish
  * @param {String=} library the name of the attached library|gistId that contains the module (blank/missing = local)
  * @param {String=} type the type of output required (json|html|js|jsonp|javascript) 
  * @param {String=} template the template to use - must exist in this script 
  * @param {String=} callback required for jsonp otherwise you get json
  * @param {String=} source where it comes from script|scriptdb|custom|gist|web
  * @param {String=} func comma seperated list of functions to include .. default is all
  * @param {String=} query json query to be used along with scriptdb
  * @return {object} depends on format selected
 */
function doGet(e) {

    //----------
    // need to put this in a global var for callback from template
  eArgs = e || {parameter: {}};
    // set the arg defaults
    mcpher.setGasPubDefaults (eArgs);
    // convert source to correct format
    var result = expressSource(eArgs);

    // publish as appropriate
    return mcpher.prepareGasPub(eArgs,result);
}

 /* convert source code to required format
  * @param {object} e arg to doGet(e)
  * @return {object} the source expressed according the format
  */
function expressSource(e) {
  // if a template is mentioned, we are going to do html
  if (mcpher.isNeedTemplate (e)) {
    // evaluate the template
    try {
      var template = HtmlService.createTemplateFromFile(e.parameter.template);
      return template.evaluate().getContent(); 
    }
    catch (err) {
      return  { error: 'error ' + err + 'reading template' + e.parameter.template};
    }
  }
  else {
    // this going to be Json or jSonP or javascript
    return getSource();
  }
}
 /** gets the appropriate source for the combination of requested module and requested library
  * @param {String} content the web content 
  * @return {String} the escaped content
  */
function getSource() {
  return getMySource(eArgs);
}

// -- write a getMySource() to retrieve any modules in THIS script file
/* Returns a modules source code
 * @param {parameters} e the argument to doGet(e). should have module parameter specified
 * @return {object} The result.
 */

function getMySource(e) {
  // probably doesnt need changed, except if you need a custom function
  // the purpose of all this is to execute the scriptdb/scriptapp in the correct project according to the library selected
    
  // maybe muliple modules - introduced this hack to speed up hosting javascript code
      var modules =[]; 
      if (e.parameter.module && e.parameter.type && e.parameter.type == "javascript") 
          modules = e.parameter.module.split(",");
      
      var r;
      if (modules.length > 1) {
        try {
          var cum = "";
          for (var i=0;i<modules.length;i++) {
            e.parameter.module=modules[i];
            r = getMyMod(e);
            if (r.error) break;
            cum +=r.results.data;
          }
          // subsititute the result with cumulative results
          if(r.results) r.results.data = cum;
          
       }
       catch(err) {
        return { error : err + " when trying to get module ", parameters : e.parameter };
       }
      }
      else {
        r = getMyMod(e);
      }
        
      return r;
}
// -- write a getMySource() to retrieve any modules in THIS script file
/* Returns a modules source code
 * @param {parameters} e the argument to doGet(e). should have module parameter specified
 * @return {object} The result.
 */
function getMyMod(e) {
  // probably doesnt need changed, except if you need a custom function
  // the purpose of all this is to execute the scriptdb/scriptapp in the correct project according to the library selected
    try {
      return mcpher.getGeneralSource(e,
              e.parameter.source == 'script' ? 
                eval(mcpher.addLibraryPrefix(e,"showMyScriptAppResource"))(e.parameter.module) :
                ( e.parameter.source == 'scriptdb' ? 
                  eval( mcpher.addLibraryPrefix(e,"showMyScriptDb"))() : null
                 ) ,
              function (e) { // this is a custom function if you need one 
                         return null;} 
            );
    }
    catch (err) {
      return { error : err + " when trying to get module ", parameters : e.parameter };
    }
}
