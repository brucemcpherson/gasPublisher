function tester() {
  var options = cSiteStats.getOptions('ramblings');
  var handler = cSiteStats.getDataHandle(options.siteCode);
  
  var result = handler.query();
  var handle2 = new cDbAbstraction.DbAbstraction ( cDriverSheet , {
    siloid:'site',
    dbid:'1yTQFdN_O2nFb9obm7AHCTmPKpf5cwAd78uNQJiCcjPk'
  });
  handle2.remove();
  var r2 = handle2.save (result.data.map(function(d) {
    return d.page;
  }));
  
}
function comparePlusOnes() {
  // get the parameters for this site
  var options = cSiteStats.getOptions('ramblings');

  
  // for debugging use this to a spreadsheet
  var debugOptions = cUseful.clone(options);
  debugOptions.dbid = '11cwvSmkgWJPzPyoxPycVI_3W1OkSoEsLfVHlA7ppW1g';
  var handler = new cDbAbstraction.DbAbstraction ( cDriverSheet , debugOptions );
  if (!handler.isHappy()) throw 'unable to get handler' + JSON.stringify(options);
  
  var hackTest = true;
  var scTest = true;
  var plusOnes;
  
  // add plusones
  if (hackTest) {
    // this is the site i'm working with
    var site = SitesApp.getSite(options.domain, options.site);
  
    // get all the pages on the site
    var root = getPages(site);
    
    // get the plusones, hack version
    plusOnes = plusOnesCheck (root,0,options);
  }
  
 
  
  if (scTest) {
    
    if(!hackTest) { 
      // if not running this at same time, pick up last results from sheet
      var result = handler.query();
      if (result.handleCode < 0) throw result;
      plusOnes = result.data;
    }
    plusOnes = sharedCountCheck (plusOnes);
  }
  
  
  // delete all thats there
  var result  = handler.remove();
  if (result.handleCode < 0) throw result;
  
  //save
  var result = handler.save(plusOnes);
  if (result.handleCode < 0) throw result;
  
}



function sharedCountCheck (data) {

  var key = JSON.parse(PropertiesService.getScriptProperties().getProperty("sharedCountKeys")).restAPIKey;
  return data.map (function (d) {
    var then = new Date().getTime();
    d.sharedCount = d.sharedCount || {};
    d.sharedCount.pluses = getSharedCount (d.url,key,true).GooglePlusOne;
    d.sharedCount.time = new Date().getTime() - then;
    return d;
  });
}
function plusOnesCheck (root,max,options,result) {

  
  result = result || [];
  if(!max || result.length < max ) {
    var then = new Date().getTime();
    var r = canonPlusOnes (root.getUrl(),options, true);
    result.push ({url:root.getUrl(),hack:{time: new Date().getTime() - then,pluses:r}});
    root.children.forEach(function(p) {
      plusOnesCheck (p , max,options,result);
    });
  }
  return result;
  
}

function getSharedCount(url,key,optCache) {
  // this is hack from how the plus 1 button with count on a page gets its data. 
  // the g+ api doesnt seem to have this capability, so here's a workaround
 
  // we'll use cache if we can since these calls take up to a second to deal with
  var query = "http://free.sharedcount.com/?apikey="+key+"&url=" + encodeURIComponent(url);
  Logger.log(query);
  var cached;
  if (optCache) {
    cached = cache.getCache(query);
  }
  if (!cached) {
    // do ab exp backoff in case this is called loads of times
    var result = cUseful.rateLimitExpBackoff(function () {
      return UrlFetchApp.fetch ( query);
    },undefined,undefined,undefined,true); 
    
   
    // find the result and return - XML service is unable to parse, so I'll just use a regex
    var r = result.getContentText();
    

    if(optCache) {
      cache.putCache (r,query);
    }
  }
  else {
    var r = cached;
   
  }

  return JSON.parse(r);
}