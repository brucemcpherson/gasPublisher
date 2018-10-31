// translation of VBA cbrowser class. much of this is not relevant in gas
var cBrowser = function(){
	return this;
};
// this one supercedes httpget - it takes headoptions as an object
cBrowser.prototype.get  = function ( fn,optOptions, optUseCache) {
  
  this.xOptions = fixOptional ( optOptions, {});
  this.xHtml = fn;
  //Logger.log(fn);
  // include the headers when making a cache key
  var useCache = fixOptional ( optUseCache ,true) ;
  var key =  Utilities.base64Encode( Utilities.computeDigest( Utilities.DigestAlgorithm.MD2, this.xHtml + 
                (this.xOptions ? JSON.stringify(this.xOptions) : '') ));  
                
  this.xResult = null;
  this.xResponse = null;
  var cache = null;
      
  // maybe get it from google cache service
  if (useCache) {
      var cache = CacheService.getPublicCache();
      this.xResult = cache.get(key);
  }
  // didnt get anything from cache
  if (!this.xResult) {
    try {
      
      this.xResponse = UrlFetchApp.fetch(this.xHtml,this.xOptions);
      this.xResult = this.xResponse.getContentText();
    }
    catch (err) {
      this.xResponse = null;
      this.xResult = JSON.stringify(err);
    }
    //Logger.log(JSON.stringify(this.xResponse.getAllHeaders()));
  }
  // put result to 10 minute cache - even if no cache this time, maybe next time will be
  // apparently theres a limit to size of data - http://code.google.com/p/google-apps-script-issues/issues/detail?id=1327
  try {
    cache.put(key, this.xResult, 600); 
  }
  catch(err) {
  }

  return this.xResult;
}
// for legacy and vba compatibility
cBrowser.prototype.httpGET = function ( fn,optAuthUser,optAuthPass, optAccept, optUseCache) {
  
  var authUser = fixOptional ( optAuthUser, null);
  var authPass = fixOptional ( optAuthPass, null);
  var accept = fixOptional ( optAccept,null);
  
  // only use cache for public regular requests
  var useCache = fixOptional ( optUseCache ,true) && ! (authUser || authPass || accept ) ;  
  var options = {} ;
  if (accept) options.headers = { "Accept" : accept} ;

  return this.get(fn, options, useCache);
  
  
}
cBrowser.prototype.xhttpGET = function ( fn,optAuthUser,optAuthPass, optAccept, optUseCache) {
  authUser = fixOptional ( optAuthUser, null);
  authPass = fixOptional ( optAuthPass, null);
  accept = fixOptional ( optAccept,null);

  // only use cache for public regular requests
  useCache = fixOptional ( optUseCache ,true) && ! (authUser || authPass || accept ) ;
  this.xHtml = fn;
  
  var options = {} ;
  if (accept) options.headers = { "Accept" : accept};

  
  this.xResult = null;
  var cache = null;
      
  var key =  Utilities.base64Encode( Utilities.computeDigest( Utilities.DigestAlgorithm.MD2, this.xHtml));
  // maybe get it from google cache service
  if (useCache) {
      var cache = CacheService.getPublicCache();
      this.xResult = cache.get(key);
  }
  // didnt get anything from cache
  if (!this.xResult) {
    this.xResponse = UrlFetchApp.fetch(this.xHtml,options);
    this.xResult = this.xResponse.getContentText();
   
  }
  // put result to 10 minute cache
  if (cache) {
      // apparently theres a limit to size of data - http://code.google.com/p/google-apps-script-issues/issues/detail?id=1327
      try {
        cache.put(key, this.xResult, 600); 
      }
      catch(err) {
      }
  }
  return this.xResult;
}
