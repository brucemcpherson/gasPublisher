// -- parse specific
/**
 * creates a new object to interact with parse.com
 * @param {object} keys the parse.com .applicationId & . restKey
 * @return {cParseCom} The object
 */
function cParseCom(keys) {
  this.xKeys = keys;
  this.keys = function () {
    return this.xKeys;
  }

  return this;
} 
/**
 * creates headers needed to authorize parse.com
 * @return {string} The headers
 */
cParseCom.prototype.restHeaders = function () {
  return { headers: {
    "X-Parse-Application-Id" : this.keys().applicationId,
    "X-Parse-REST-API-Key" : this.keys().restKey }
  };
  
}

function getFromParse(e) {
  var results;
  results= { results: new cParseCom(getKeys()).queryArray("ColorTable",makeQuery(e),
      e.parameter.limit,e.parameter.useCache) };
  return results;
}
/**
 * gets a JSON string response from parser.com
 * @param {string} class the parse.com class name
 * @param {object=} optQuery the object with the query constraint key/value pairs
 * @param {number} optLim limit 
 * @param {boolean} optCache useCache 
 * @return {Array} the results
 */

cParseCom.prototype.queryArray = function(class,optQuery,optLim,optCache) {
  
  // this is the max I'll take in one go to be compatible with parse.com
  var maxLimit = 1000;
  var q ,limit = mcpher.fixOptional(optLim,0), useCache = mcpher.fixOptional (optCache, true);
  var results =[];
  var options = this.restHeaders();
  
  while(true) {
    q = "?limit=" + (limit > 0 ? limit-results.length : maxLimit);
    q+= "&skip=" + results.length;
    q+= "&where="+mcpher.URLEncode(JSON.stringify(optQuery));
    
    qr = new mcpher.cBrowser().get("https://api.parse.com/1/classes/" + class + q, options, useCache);
    qo = JSON.parse(qr);
    if (qo.results.length <= 0 ) return results;
    
    for (var i=0; i < qo.results.length && (limit==0 || results.length < limit);i++ ) {
      results.push(qo.results[i]);
    }

  }
  
};



