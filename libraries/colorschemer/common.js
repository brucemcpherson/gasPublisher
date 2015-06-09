// get color data from colortable stored in parse.com
// will return json or jsonp.
// typical usage
// ?key|rgb|hex=something&closest=n&scheme=s   will return the 'n' closest colors in scheme x to the given target
// ?scheme|key|name|label|code|rgb|hex=s&limit=n will return up to n colors as per the filter
// ??key|rgb|hex=something&palette=n
//      &scheme=|s&type=hue|saturation|lightness&model=hsl|lch 
//      will return a palette (within scheme if specified)
// in each case, various color model properties are returned for each one
function doGet(e) {
    return ContentService
            .createTextOutput(pit(e,getColorStuff(e)))
              .setMimeType(ContentService.MimeType.JSON);  
}
function pit(e,s) {
// jsonp?
    return e.parameter.callback ? e.parameter.callback + "(" + s + ");" : s;
}
function printStuff(){
  Logger.log(getColorStuff());
}

// get results and convert to json
function getColorStuff(e) {
  var ea = argAlign(e);
  return JSON.stringify({ p: ea, 
          c: processColorRequest(ea) } );
}
function getTargetRgb(e) {
    var rgb,error,results;
    if (e.parameter.access == "key") {
      results = getSomehow (e,e.parameter.access);
      if (!results.results.length) {
        error = "could not find key " + e.parameter.key;
      }
      else {
        rgb =  mcpher.htmlHexToRgb(results.results[0].hex);
      }
    }
    else {
      if(e.parameter.access == "rgb")
        rgb = e.parameter.rgb ;
      else if (e.parameter.access == "hex")
        rgb = mcpher.htmlHexToRgb(e.parameter.hex);
      else
        error = "access type invalid for closest match " + e.parameter.access ;
      if (!error) {
        results = {};
        results.results = [];
        results.results.push ( { hex: mcpher.rgbToHTMLHex(rgb)} );
      }
    }
    return { rgb: rgb, error: error , results: results } ;
}
function getFromSomewhere(e) {
  if (e.parameter.access == "hex") 
    return {results:[{hex:e.parameter.hex}]};
  else 
    if (e.parameter.access == "rgb") 
      return {results:[{ hex: mcpher.rgbToHTMLHex(e.parameter.rgb)}]};
    else
      return e.parameter.provider == "parse" ? getFromParse(e) : getFromScriptDb(e) ;
}
function limitArray(a,n) {
  var results =[];
  for (var i=0;i<n && i < a.length ; i++) results.push(a[i]);
  return results;
}
function processColorRequest(e) { 
  var results,limited;
  if (e.parameter.action == "closest") {
    var rgb = getTargetRgb(e);
    
    if (!rgb.error) {
      // take the first 'n' sorted colors plus the original query
      var scheme = getSomehow (e,"scheme").results; 
      var a = sortClosestColors ( rgb.rgb, scheme);
      limited = [rgb.results.results[0]].concat(limitArray(a,e.parameter.closest));
    }
    results = { results : limited , error:rgb.error }; 
  }
  else {
    results = getFromSomewhere(e);
  }
  return formatColorRequest(e, results);
}
// put all results to array
function formatColorRequest(e, results) {
    var propArray = [];
    // return the original
    if (results.results) {                    
      for (var i = 0; i < results.results.length; i++ ) {
        var r = results.results[i];
        try { 
          propArray.push( {colortable:r, 
                          properties: mcpher.makeColorProps (mcpher.htmlHexToRgb(r.hex))});
        } 
        catch(err) {
          propArray.push( {colortable:r,properties:null, error: "invalid color " + err} );
        }
      }
    }
    else
      propArray.push( {error:"no results",properties:null,colortable:null} );
      
    return propArray;  
}
function makeQuery(e) {
  var eArgs = e.parameter;
  var model = ["key","scheme","code","label","name"];

  // build query
  var query;
  for (var k=0; k < model.length ; k++ ) {
    if (eArgs[model[k]]) {
      query = query || {};
      query[model[k]]  = eArgs[model[k]];
    } 
  } 
  return query;
}
function getSomehow (e,k) {
    var result, ob = {};
    ob[k] = e.parameter[k];
    // get a single record based on a single property
    if (e.parameter.provider == "parse") {
      ob[k] = e.parameter[k];
      result = new cParseCom(getKeys()).queryArray("ColorTable",
              ob,0,e.parameter.useCache);
    }
    else {  
      result = mcpher.scriptDbSilo("colorSchemes",publicStuffDb())
                .queryArray(ob) ;
    }
    return { results: result };
}
function timeIt() {
  var scheme = "dulux";
  var provider = "parse";
  
  var e = {parameter:{provider:provider,scheme:scheme,useCache:false}};
  mcpher.useTimer("scheme").start("Using GAS to getting scheme " +
      e.parameter.scheme + " from " + e.parameter.provider);
  
  var r = getSomehow(e,"scheme");
  
  mcpher.useTimer("scheme").stop();
  Logger.log("found "+r.results.length+" rows in scheme " + 
      e.parameter.scheme + " using provider " + e.parameter.provider);
  Logger.log(mcpher.useTimer().report(false));
}

function sortClosestColors (targetRgb, schemeArray) {
  
  var targetProps = mcpher.makeColorProps (targetRgb);
  for (var i= 0; i < schemeArray.length ; i++) {
    schemeArray[i].comparison = mcpher.compareColors (targetRgb, mcpher.htmlHexToRgb(schemeArray[i].hex));
  }
  return schemeArray.sort (comparisonSort);
}
function comparisonSort(a,b) {
  if (a.comparison < b.comparison)
     return -1;
  if (a.comparison > b.comparison)
    return 1;
  return 0;
}

// set the arg defaults
function argAlign(e) {
  eArgs = e || {};
  eArgs.parameter = eArgs.parameter || {};
  // testing
   //eArgs.parameter.hex = "#282821";
   //eArgs.parameter.rgb = 1234;
   //eArgs.parameter.closest = 5;
   //eArgs.parameter.scheme = "htm";
   //eArgs.parameter.key = "dulux-crushed raspberry";
   //eArgs.parameter.provider = "parse";
   //eArgs.parameter.limit = 0;
  eArgs.parameter.action = eArgs.parameter.action || 
    (eArgs.parameter.hasOwnProperty("closest") ? 
      "closest" : (eArgs.parameter.hasOwnProperty("palette") ? "palette" : "get" ));

  eArgs.parameter.access = eArgs.parameter.access || 
    (eArgs.parameter.hasOwnProperty("key") ? 
      "key" : (eArgs.parameter.hasOwnProperty("hex") ? 
      "hex" : (eArgs.parameter.hasOwnProperty("rgb") ? "rgb" : "multi" )));
      
  eArgs.parameter.cache = mcpher.LCase(eArgs.parameter.cache) || "yes";
  eArgs.parameter.useCache = eArgs.parameter.cache == "yes"; 
  eArgs.parameter.limit = eArgs.parameter.limit || "0"; 

  eArgs.parameter.provider = eArgs.parameter.provider || "scriptdb";

  eArgs.parameter.type = eArgs.parameter.type || "hue";
  eArgs.parameter.closest = eArgs.parameter.closest || 5;

  eArgs.parameter.palette = eArgs.parameter.palette || 5;
  eArgs.parameter.model = eArgs.parameter.model || "lch";
  return eArgs; 
} 