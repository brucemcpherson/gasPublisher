/** 
 * @description
 * common functions required to publish gas scripts
 * See http://ramblings.mcpher.com/Home/excelquirks/codeuse for more details
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a><a href="http://ramblings.mcpher.com"> ramblings.mcpher.com</a>
 */
/** 
 * escape and wrap html content in a function
 * @param {String} content the web content 
 * @return {String} the escaped content wrapped in a function
 */
function jsWrap(content) {
  return ("function getMyEmbedded () { return (" + getEscapedContent(content) + ") }");
}

/** 
 * do we need a template?
 * @param {object} e arg to doGet(e)
 * @return {bool} whether template is required
 */
function isNeedTemplate (e) {
  return e.parameter && e.parameter.template && (e.parameter.type == "js" || e.parameter.type == "html");
}
/** 
 * do we need a call back?
 * @param {object} e arg to doGet(e)
 * @return {bool} whether template is required
 */
function isNeedCallBack (e) {
  return e.parameter && e.parameter.callback && (e.parameter.type == "jsonp");
}
/** 
 * prepare callback if neededed
 * @param {object} e arg to doGet(e)
 * @param {String} source the formatted string
 * @return {String} result with callback if needed
 */
function prepareCallBack (e, source) {
  return isNeedCallBack (e) ? 
      e.parameter.callback + "(" + source + ");" : source  ;
}
/** 
 * escape the content for html inject
 * @param {String} content the web content 
 * @return {String} the escaped content
 */
function getEscapedContent(content) {
  var s = JSON.stringify({ content: content })
  return Mid ( (Left(s, Len(s) -1 )), InStr (1,s,":")+1);
} 
/**
 * set defaults for gas pub
 * all apply to e.parameter..
 * @param {object} e sets the default e values for gaspub
 * @return {object} returns e for chaining
 */
  
function setGasPubDefaults (e) {
    seteDefault (e, "source", "script");
    seteDefault (e, "library", "");
    seteDefault (e, "type", "html");
    seteDefault (e, "template", e.parameter.type  );
    seteDefault (e, "module", "");
    seteDefault (e, "custom", "");
    seteDefault (e, "func", "");
    seteDefault (e, "cache", "true");
    seteDefault (e, "query", "");
    return e;
}
/** 
 * set e parameter to a given default
 * @param {object} e arg to doGet(e)
 * @param {object} n name of parameter 
 * @param {object} d a default value 
 * @return {object} returns e for chaining
 */
function seteDefault (e , n , d ) {
  if (e.hasOwnProperty("parameter")) {
    if (!e.parameter.hasOwnProperty(n)) e.parameter[n] = null;
    if (!e.parameter[n])e.parameter[n] = d;
  }
  return e;
}
/**
 * prepares the result for publishing
 * @param {object} e arg to doGet(e)
 * @param {object} result the results so far
 * @return {object} returns prepared object for doGet()
 */
function prepareGasPub(e, result) {
    // now output it - note that the template selected should be appropriate for the output type
    switch (e.parameter.type) {
      // this outputs json object with the code as a string
        case 'json':
          return ContentService.createTextOutput (JSON.stringify(result))
                  .setMimeType(ContentService.MimeType.JSON) ; 
    
        case 'jsonp':
          return ContentService.createTextOutput (prepareCallBack(e,result.results.data))
                   .setMimeType(ContentService.MimeType.JAVASCRIPT) ; 

        
        // this outputs pretty code served by htmlservice
        case 'html':
          return HtmlService.createHtmlOutput(result);
          
          
        // this is escaped html content wrapped in a function- will be executed within the caller
        case 'js':
          return ContentService.createTextOutput (jsWrap(getBodyContent(result)))
                   .setMimeType(ContentService.MimeType.JAVASCRIPT) ; 
          
       // this is pure javascript
        case 'javascript':
          return ContentService.createTextOutput (result.results.data)
                   .setMimeType(ContentService.MimeType.JAVASCRIPT) ;  
                   
        // throw unknown requirement         
        default:
          throw e.parameter.type + " unknown type of output requested"; 
          
    }   
}

  
/**
 * gets source data 
 * @param {object} e arg to doGet(e)
 * @param {object} target the object from which to get the source
 * @param {function=} customFunction the function to process a custom source
 * @return {object} returns the result
 */
  
function getGeneralSource(e, target,  customFunction) {
  var results, data;

  try {
    switch(e.parameter.source) {
      case "script":
          var f = getFunctions(e, target.getDataAsString()) ;
          if (f.error) 
            results = f;
          else
            data = f.data;
          break;
       
      case "gist":
      case "web":
          f =  e.parameter.source == "gist" ? getGist(e) : getWeb (e);
          if (f.error) {
            results  = f;
          }
          else {
           var s = getFunctions(e, f.data) ;
           if (s.error) 
            results = s;
           else
            data = s.data;
            break;
          }

          break;
          
      case "scriptdb":
          // get something from a script db
          var ob;
          try {
            if (e.parameter.query) ob = JSON.parse(e.parameter.query);
            var stuff = getPubStuff (e.parameter.module, target, ob);
            if (stuff.status.code == "bad") {
              results = {  error :  "could not open module ", parameters: e.parameter , 
                    results : {status : stuff, data :null}};
            }
            else 
            // normalize it to be like the other responses
              data = JSON.stringify ( stuff , null, 2);
          }
          catch(err) {
             results = {  
               error :  "scriptb query format error ", parameters: e.parameter , 
                    results : {status : err, data :null}};
          }

             
          break;
          
      case "custom":
          // do some custom type data getting
          if (customFunction) 
            data = customFunction(e);
          else
            results = 
             { error : "custom function needs you to tell it what to do", parameters: e.parameter ,results : null } ; 
          break;
     
      default:
         results = 
           { error : "unknown  source " + e.parameter.source} 
    }
    // if we get here then we are good;
    results = results || 
        { parameters: e.parameter , parameters: e.parameter ,results : { data: data }  };

  }
  catch (err) {
    results = 
      { error : err + "could not open module ", parameters: e.parameter , results : null} ;

  }
  return results;
}
/**
 * nodifies function call to prefix with library name if given
 * @param {object} e arg to doGet(e)
 * @param {String} targetFun the function name to prefix by the library name
 * @return {String} returns the function call to be evaluted
 */
function addLibraryPrefix (e, targetFun) {
  return (e.parameter.library ? e.parameter.library + "." : "" ) + targetFun;
}
/**
 * required in every script that might need to provide scriptdb data
 * @return {ScriptDBInstance} returns the scriptdb associated with this script
 */
function showMyScriptDb() {
  return publicStuffDb();
}
/**
 * required in every script that might need to provide scriptdb data
 * @param {String} s the name of the resource
 * @return {ScriptAppResource} returns the resource 
 */
function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}
/**
 * get the gist with id e.parameter.library and optionally file name e.parameter.module
 * @param {object} e the doget eargs
 * @return {object} returns source in .data
 */  
function getGist(e) {
  var fn = "https://gist.github.com/raw/" + e.parameter.library + 
              (e.parameter.module ? "/" + e.parameter.module : "");
  try {
    var data = new cBrowser().httpGET  ( fn,undefined,undefined,undefined, e.parameter.cache=="true" );
    return { data : data } ;
  }
  catch (err) {
    return {error: "failed to get gist at " + fn, data:null };
  }
  
}
/**
 * get the web with file name e.parameter.module
 * @param {object} e the doget eargs
 * @return {object} returns source in .data
 */
function getWeb(e) {
  var fn = e.parameter.module;
  try {
    var data = new cBrowser().httpGET  ( fn,undefined,undefined,undefined, e.parameter.cache=="true" );
    return { data : data } ;
  }
  catch (err) {
    return {error: "failed to get file at " + fn, data:null };
  }
  
}
function getFunPos(target, input) {
  var fund = {};
  //----try javascript/GAS  .. support function x() and c.prototype.x = function()
  fund = {language: 'js', pos :input.search ( new RegExp( "(function\\s*?" + target + 
            "\\s*?\\()|(\\w.prototype." + target + "\\s*?=\\s*?function\\s*?\\()" ) ) } ;
  //----try VBA  support private/public// function//sub/property
  if (fund.pos < 0) {
  
  
    var r = "(public|private|\\s*?)\\s+?(function|sub|(property\\s*?(get|let|set|\\s*?)))\\s*?("
                + target + "\\s*?\\()" ;
    fund = { language: 'vba', 
              pos : input.search ( new RegExp(r ,"i") ) } ;
  }

  return fund.pos < 0 ? null : fund;  
}

/**
 * extracts the code for all the functions named in e from module source TODO
 * @param {object} e arg to doGet(e)
 * @param {String} moduleSource the source that contains the func
 * @return {object} returns an object containing source strings and error code if there is one
 */
function getFunctions(e,moduleSource) {
 
  if (e.parameter.func) {
    var s = "";
    var a = Split(e.parameter.func);
    for ( var i=0;i<a.length;i++) {
      var o = getFunction(a[i],moduleSource);
      if (o.error) return o;
      s += (s ? "\n" : "" ) + o.data;
    }
    return {data: s};
  }
  else
    return {data: moduleSource};
}

/**
 * extracts the code for a single function out of a module TODO
 * @param {String} functionName the name of the function
 * @param {String} moduleSource the source that contains the function
 * @return {object} returns an object containing source string and error code if there is one
 */
function getFunction(functionName, moduleSource) {
  var fund = getFunPos ( functionName, moduleSource ), f="",pos;
  if (!fund) return {error : "function " + functionName + " not found in " + moduleSource, data : null};
  
  // we found it
  pos = fund.pos;
  switch (fund.language) {
    case 'js':
      var depth = undefined;
      
      while (  pos < Len(moduleSource) && ( depth || isUndefined(depth) ) ) {
        var s = Mid (moduleSource, ++pos,1);
        if (s == "{" ) 
          depth = isUndefined (depth) ? 1 : depth + 1;
        else if (s== "}") {
          if (isUndefined(depth)) return {error : "function " + functionName + " invalid {} " + moduleSource, data : null} ;
          depth --;
        }
        f += s;
      }
      break;
      
    case 'vba':
      f = Mid(moduleSource, ++pos);
      var rx  = new RegExp("\\nend\\s*?(function|sub|property)","i");
      var x = f.search(rx);
      if (x < 0) return {error : "function " + functionName + " invalid {} " + moduleSource, data : null} ;
      // length of string is pos end is found at plus length of end
      f = Mid(f,1,Len(rx.exec(f)[0])+x);
      break;
      
    default:
        mcpher.DebugAssert (false, "Unknown language " + fund.language);
        break;
  }
  return ( {data : f} );
}
