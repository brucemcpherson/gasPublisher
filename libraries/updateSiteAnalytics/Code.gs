/**
 * create an popularity page for each page on a site and update each page with it
 **/
var DEBUGGING = false;
var PAGETYPES = {
  REGULAR:4,
  SECTION:2,
  TOPICROOT:3
};

var p1SAFE = {
  id:"1181bwZspoKoP98o4KuzO0S11IsvE59qCwiw4la9kL4o",
  name:"savedplusones"
};

// keep plus ones in cache for a few hours
var cache = new cCacheHandler.CacheHandler(60*60*5,'sitePlusOnes',false);

// leave comment - hack to provoke an authorization dialog. Drive.Files.copy(resource, fileId)
  
// create tracing object - need to have enabled drive advanced service to get a properly scoped token
var trace = new cChromeTrace.ChromeTrace().setAccessToken(ScriptApp.getOAuthToken());

function onceCachePlusOnes() {
  /** dont run this again
  
  var data = getDb()

  .map  (function (d) {
    return {
      pageType:d.page.pageType,
      url: d.page.url ,
      plusOnes: d.page.plusOnes
    };
  })
  
  .filter (function (d) {
    return d.pageType !== PAGETYPES.SECTION;
  });

  
  var sheet = SpreadsheetApp.openById(p1SAFE.id).getSheetByName(p1SAFE.name)

  
  // write to sheet for safety
  new cUseful.Fiddler(sheet)
  .setData (data)
  .dumpValues();
  
  return data;
  **/
}


//dont want to lose the old data as plusOnes have disappeared
function simCachePlusOnes() {
  
  var sheet = SpreadsheetApp.openById(p1SAFE.id).getSheetByName(p1SAFE.name);
  Logger.log ('opening ' + JSON.stringify(p1SAFE));
  var data =  new cUseful.Fiddler(sheet).getData();

  var result = data.reduce (function (p,c) {
    p[c.url] = c.plusOnes;  
    return p;
  },{})

  return result;
  
}

function oldpreCachePlusOnes() {
  // if we do this first & seperately we can limit execution time
  // all this does is get the site and populate cache so that when we run the real thing it picks it up from cache
  // can be scheduled to run a couple of times to make sure it picks up everything
  
  
  
  trace.begin ("preCachePlusOnes");
  
  try {
    trace.begin ("setup");
    // get the parameters for this site
    var options = cSiteStats.getOptions('ramblings');
      // this is the site i'm working with
    var site = SitesApp.getSite(options.domain, options.site);
    trace.end ("setup");
    
    // get all the pages on the site
    trace.begin("getPages");
    var root = getPages(site);
    trace.end ("getPages");
    
    // add plus 1 counts
    trace.begin("addPlusOnes");
    addPlusOneCounts (root,options,true);
    trace.end("addPlusOnes");
    done ({args:{success:true}});
  }
  catch (err) {
    done ({args:{success:false, err:err}});
    throw err;
  }

  function done (args) {
    trace.end ('preCachePlusOnes' , args );
    trace.dump ('/Published Scripts/analytics');
  }
}
function analyzePages() {
  
  // describe the analytics and database and analytics
  var now = new Date();
  
  // get the parameters for this site
  var options = cSiteStats.getOptions('ramblings');
 
  // set the dates for this analysis
  options.periods = [ 
      { 
        name:'Past Month', 
        start:new Date(now.getYear() , now.getMonth() -1 , now.getDate()),
        end:new Date(now.getYear() , now.getMonth() , now.getDate()-1,23,59,59,999)
      },
      { 
        name:'Past Year', 
        start:new Date(now.getYear() -1 , now.getMonth() ,now.getDate()),
        end:new Date(now.getYear() , now.getMonth() , now.getDate()-1,23,59,59,999)
      },
      { 
        name:'All Time'
      }];
      
  
  // this is the site i'm working with
  var site = SitesApp.getSite(options.domain, options.site);
  
  // get all the pages on the site
  var root = getPages(site);
  
  // nowadays, the plusOnes are not updated - so just keep carrying them forward
  var plusOnes = simCachePlusOnes();
  

  
  // add plus 1 counts
  addPlusOneCounts (plusOnes,root,options,true);
  
  // add analytics objects
  addAnalyticStats (root, options);
  
  // find potential topics
  markPageTypes (root, options , site.getUrl());
  var topics = makeTopics(root,options);
  addAnalyticStats (topics, options);
  
  // create a set of analytics for each of these periods
  options.periods.forEach ( function(d,i) {
    // now get the analytics data - for each period
    matchAnalytics ( getAnalytics(options.propertyId,d.start,d.end) , root, site.getUrl(),i);
  
  });
    
  // accumulate topics
  accumulate ( topics, options);
  
  // rank within topics
  rank (topics, options);
  
  // combine the topic and page data
  var tood = combine(topics,topics, site.getUrl());
  
  // commit
  refreshDb ( options, tood);

}

// the model for the stats package
function newAnalyticObject(periodName) {
  return { 
      varieties:0,
      name: periodName,
      pageViews:0,
      favorite:'',
      favoriteTitle:'',
      universe:0,
      rank:0
    };
}

function rank (topicRoot, options) {

  options.periods.forEach (function(period, j ) {

    [topicRoot.pages, topicRoot.children].forEach (function (m) {
      cUseful.arrayRank( m,
        function (a,b) {
          return b.analytics[j].pageViews - a.analytics[j].pageViews;
        },
        function (d,r,a) {
          d.analytics[j].rank = r; 
          d.analytics[j].universe = a.length;
          d.analytics[j].favorite = a[0].getUrl();
          d.analytics[j].favoriteTitle = a[0].getTitle();
          return d;
        },
        function (d) {
          return d.analytics[j].rank;
        });
      });
  });
  
  topicRoot.children.forEach (function (d) {
    rank (d, options);
  });
  return topicRoot;
}

// discovers which pages are topic roots
function markPageTypes (root, options, siteUrl) {

  // identify urls that can be used as topics
  var url = root.getUrl();
  
  if (!root.getParent()) {
    root.setPageType ( PAGETYPES.TOPICROOT);
  }
  else if (url === siteUrl + options.base + options.root || url === siteUrl ) {
    root.setPageType (PAGETYPES.SECTION);
  }

  root.children.forEach (function (d) {
    if (root.getPageType() === PAGETYPES.SECTION) {
      d.setPageType (PAGETYPES.TOPICROOT);
    }
    markPageTypes (d , options, siteUrl);
  });
  
}

/**
 * this is a stats package to accumulate pageview summaries in
 * @param {PageTreeObject} root the top of the branch to look at
 * @param {object} options
 */
function addAnalyticStats (root, options) {
  
  options.periods.forEach (function (d) {
    root.analytics.push(newAnalyticObject(d.name));
  });
  root.children.forEach (function (d) {
    addAnalyticStats ( d , options);
  });
}

function addPlusOneCounts (plusOnes,root) {

  root.plusOnes = plusOnes [root.getUrl()] || 1;  
  
  root.children.forEach( function (d) {
    addPlusOneCounts (plusOnes,d);
  });
  
 
}

/**
 * this add gplus summaries
 * @param {PageTreeObject} root the top of the branch to look at
 * @param {Object} options site options for alternate roots
 * @return {PageTreeObject} root
 */
function oldAddPlusOneCounts (root,options,optCache) {
  
  trace.begin (root.getUrl());
  root.plusOnes = canonPlusOnes ( root.getUrl() , options, optCache);
  
  trace.counter("recurseChildren",{args:{ childrenCount:root.children.length}});
  root.children.forEach( function (d) {
    addPlusOneCounts (d,options,optCache);
  });
  
  trace.end (root.getUrl());
  return root;
} 

function canonPlusOnes (pageUrl,options,optCache) {

  var r = getPlusOneCount (pageUrl,true);
  Logger.log(pageUrl + r);
  // if you have a Google Site with redirection .. eg 
  // https://sites.google.com/a/mcpher.com/share/Home/excelquirks/somewhere
  // mapping to 
  // http://ramblings.mcpher.com/Home/excelquirks/somewhere
  // then for g+ stats they are not recognized as the same after the base of the site
  // so this is about trying various variants if we get a zero
  
  if (options) {
    // add alternate roots
    options.alternateRoots.forEach ( function(d) {
      if (!r) {
        var qPage = pageUrl.replace (options.siteRoot + options.domain + '/' + options.site, d);
        if (qPage !== pageUrl) { 
          r += getPlusOneCount(qPage,optCache); 
        }
      }
    });
  }
  
  return r;
}

// match up the site pages to the analytics pages
function matchAnalytics ( analytics, root, siteUrl, period) {

  // create somewhere to store non-matches
  var base = siteUrl.replace(/\/$/,"");
  
  // for each analytics record, attempt to match it to a site url 
  var x =0;
  analytics.forEach (function(d) {
    var pto = matchToPto (root , d ,base);
    if (!pto) {
      // could not find a good match
      Logger.log('no match for ' + JSON.stringify(d));
    }
    else {
      // found a good match add the counts
      addAnalytics(pto,d,period);
    }
    x+=parseInt(d.pageViews,10);
  });
 
  
  function addAnalytics(pto,d,period){
    // find the period for this item or add it
    var p = pto.analytics[period] ;
    // we have some pageviews for this site page
    p.pageViews += parseInt(d.pageViews,10);
    p.varieties ++;
  }
  
}

function matchToPto( root, data ,base) {
  // match analytics url to page url so far
  var match;
  
  // objective is to find the best match .. continuing to drill down until no more.
  if (root.getUrl() === (base + data.pagePath).slice (0,root.getUrl().length)) {
    match = root;
    // may it matches the children of this guy
    root.children.forEach (function (d) {
      var m = matchToPto (d , data , base);
       // pick the match with the longest url (for example x/y/long would match, but x/y/longer would be better.
      if (match && m && m.getUrl().length > match.getUrl().length) match = m;
    });
  }
  return match;
}


function TopicTreeObject(parent,pto) {
  var page_ = pto;
  var parent_ = parent;
  var self = this;
  this.pages = [];
  this.children = [];
  this.analytics = [];
  this.plusOnes = 0;
  
  this.getPage = function() {
    return page_;
  };

  self.getParent = function () {
    return parent_;
  };
  
  self.getUrl = function () {
    return self.getPage().getUrl();
  };
  
  self.getTitle = function () {
    return self.getPage().getTitle();
  };
  
  self.getName = function () {
    return self.getPage().getName();
  };
  
  this.express = function () {
    return {
      url: self.getUrl(),
      numChildren: self.children.length,
      analytics: self.analytics,
      name: self.getName(),
      title: self.getTitle(),
      plusOnes:self.plusOnes
    };
  };
}


function accumulate(topicRoot,options) {

  topicRoot.pages.forEach(function(d) {
    for (t = topicRoot ; t && t.analytics ; t = t.getParent() ) {
      accumulateItems (t , d , options);
    }
  });
  
  topicRoot.children.forEach(function(d) {
    accumulate (d,options);
  });
  
  return topicRoot;
  
  
  function accumulateItems (topicRoot, item , options) {
  
    options.periods.forEach(function(p,j) {
      topicRoot.analytics[j].pageViews += item.analytics[j].pageViews;
      topicRoot.analytics[j].varieties += item.analytics[j].varieties;
    });
    
    topicRoot.plusOnes += item.plusOnes;
  }

}

/**
 * make an array of single rows for each page with the stats of its opic and the site
 * @param {object} topics the root of the topics object
 * @param {object} topicRoot the currently processing the topics object
 * @param {string} siteUrl the url of the site
 * @return {Array.object} the results ready for storing
 */
function combine (topics,topicRoot,siteUrl,result) {

  result = result || [];
  
  topicRoot.pages.forEach(function(d) {
    result.push ( {siteUrl:siteUrl, topic:topicRoot.express(), page:d.express(), site:topics.express()} ) ;
  });
  
  topicRoot.children.forEach(function(d) {
    combine (topics,d,siteUrl,result);
  });
  
  return result;

}

/**
 * make a topic tree with each page belonging to it
 * @param {object} root the page to add
 * @param {object} topicRoot the currently processing the topics object
 * @return {Array.object} the results ready for storing
 */
function makeTopics(root,topicRoot) {  
  // make a topic tree
  
  if ( root.getTopicRoot()) {
    var link = topicRoot ? topicRoot.children : null;
    topicRoot = new TopicTreeObject (topicRoot, root);
    if (link) link.push (topicRoot);
  }
  topicRoot.pages.push (root);
  
  root.children.forEach(function(d) {
    makeTopics (d,topicRoot);
  });
  
  return topicRoot;
}


/**
 * PageTreeObject
 * @constructor
 * @param {PageTreeObject} parent the parent
 * @param {Page} page a Sites Page
 * @return {PageTreeObject} self
 */
function PageTreeObject (parent,page) {
  // one of these for each known page
  var parent_ = parent;
  var page_ = page;
  var topicRoot_ = false;
  var topic_;
  var self = this;
  var url_, pageType_=  PAGETYPES.REGULAR;

  
  this.analytics =[];
  this.children = [];
  this.plusOnes = 0;
  
  this.getParent = function() {
    return parent;
  };
  
  this.getPage = function () {
    return page_;
  };
  
  this.getPageType = function () {
    return pageType_;
  };
   
  this.setPageType = function (pageType) {
    pageType_ = pageType;
  };

  
  this.getTopicRoot = function () {
    return pageType_ === PAGETYPES.TOPICROOT ;
  };
  
  this.setTopic = function (topic) {
    topic_ = topic;
  };
  
  this.getTopic = function () {
    return topic_;
  };
  
  this.getName = function () {
    return page_ ? page_.getName() : null;
  };
  
  this.getUrl = function () {
    if(!url_) {
      url_ = page_ ? page_.getUrl() : null;
    }
    return url_;
  };
  
  this.getTitle = function () {
    return page_ ? page_.getTitle() : null;
  };
  
  
  
  this.express = function () {
   
    return {
      url: self.getUrl(),
      numChildren: self.children.length,
      pageType:self.getPageType(),
      analytics: self.getAnalytics(),
      topicRoot: self.getTopicRoot(),
      name:self.getName(),
      title:self.getTitle(),
      plusOnes:self.plusOnes,
      dates:{
        created: page_  && page_.getDatePublished ? page_.getDatePublished().getTime() : null,
        updates: page_  && page_.getLastUpdated ? page_.getLastUpdated().getTime() : null
      }
    };
  };
  
  this.getAnalytics = function () {
    return this.analytics ;
  }
  this.stringify = function () {
    return JSON.stringify(this.express());
  };
  
  function express (ob) {
      return ob ? { name: ob.getName(), url:ob.getUrl() , title:ob.getTitle()} : null;
  }
}
/**
 * get all the pages on my site - into a heirach object
 * @param {Site} site the site
 * @return {Array.Page} all the pages on the site
 **/
function getPages(site) {

  var root = new PageTreeObject (null, site);
  getChildPages (root, site);
  // assume the site has a top level page
  if (root.children.length != 1 ) throw 'site has no root page';
  return root;
  
  function getChildPages (parent,page) {
    var result,start = 0,pages=[];
    var pto = new PageTreeObject (parent,page);
    parent.children.push (pto);

    // this deals with any limits to get all the children
    while (!result || result.length) {
      Logger.log("working on " + page.getUrl());

      var result = cUseful.rateLimitExpBackoff(function () {
        return page.getChildren({
          start: start
        });
      },undefined,undefined,undefined,true);
      Array.prototype.push.apply (pages,result);
      start = pages.length;
    }
    
    // now pages contain all the direct children of this ob - get each of their children
    pages.forEach (function(d,i) {
      if (!DEBUGGING || i < 9) {
        getChildPages(pto , d);
      }
    });
    
    return pto;
  }
 
}

/** 
 * refreshDb
 * @param {object} options with properties needed to open a dbabstraction database
 * @param {Array.object} pages and array of pages with their stats;
 */
function refreshDb (options,pages) {
  
  if (DEBUGGING) {

    // for debugging use this to a spreadsheet
    var debugOptions = cUseful.clone(options);
    debugOptions.dbid = '11cwvSmkgWJPzPyoxPycVI_3W1OkSoEsLfVHlA7ppW1g';
    
    var handler = new cDbAbstraction.DbAbstraction ( cDriverSheet , debugOptions );

  }
  else {
    // whatever the normal database is
    var handler = cSiteStats.getDataHandle(options.siteCode);
  }
  
  if (!handler.isHappy()) throw 'unable to get handler' + JSON.stringify(options);
      
  // delete all thats there
  var result  = handler.remove();
  if (result.handleCode < 0) throw result;
  
  //save
  var result = handler.save(pages);
  if (result.handleCode < 0) throw result;
  
}

/**
 * get current data
 */
function getDb () {

  var options = cSiteStats.getOptions('ramblings');
  // whatever the normal database is
  var handler = cSiteStats.getDataHandle(options.siteCode);
  if (!handler.isHappy()) throw 'unable to get handler' + JSON.stringify(options);
      
  // delete all thats there
  var result  = handler.query ();
  if (result.handleCode < 0) throw result;
  
  return result.data;
  
}


/**
 * get analytics data
 * @param {string} propertyId the analytics property id
 * @param {Date} optStart start date
 * @param {Date} optEnd end date
 * @return {Array.objects} array of objects showing url and pageviews
 **/
function getAnalytics(propertyId,optStart,optEnd,optDimension) {

  // get all data ever for this property
  var data = pageViews (propertyId, optStart || new Date(2010,0 ,1 ), optEnd || new Date(), optDimension || 'ga:pagePath');
  // clean up into a json object
  return data.rows.map ( function (row) {
    var i =0;
    return row.reduce(function (p,c) {
      p[data.columnHeaders[i++]['name'].replace("ga:","")] = c;
      return p;
    },{});
  })
  .sort ( function (a,b) {
    return (a.pagePath > b.pagePath ? 1 : (a.pagePath === b.pagePath ? 0 : -1)) ;
  });
}

function pageViews (propertyId, start , finish, dimensions) {
  return cUseful.rateLimitExpBackoff(function () { 
    return Analytics.Data.Ga.get('ga:' + propertyId , gaDate(start), gaDate(finish),  'ga:pageViews', {
      "dimensions":  dimensions,
        "max-results":20000
    })});
}

function gaDate (dt) {
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
/**
 * @param {string} url the url to get the plus 1 count for
 * @return {number} the plus one count
 */
 
 // thanks to http://www.helmutgranda.com/2011/11/01/get-a-url-google-count-via-php/ for his PHP hack for the idea.
 
function getPlusOneCount(url,optCache) {
  // this is hack from how the plus 1 button with count on a page gets its data. 
  // the g+ api doesnt seem to have this capability, so here's a workaround

  // we'll use cache if we can since these calls take up to a second to deal with
  var query = "https://plusone.google.com/u/0/_/+1/fastbutton?count=true&url=" + encodeURIComponent(url);
  
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
    var match = /.*<div.*id=["']aggregateCount["'].*>\s*(\d+)\s*<.*/i.exec(result.getContentText());
    if (match.length < 2) {
      Logger.log ("no g+ found for " + url);
    }
    var r = match.length === 2 ? match[1] : '0' ;
    if(optCache) {
      cache.putCache (r,query);
    }
    console.log('uncached',r);
  }
  else {
    var r = cached;
   console.log('cached',r);
  }
  return Number(r);
}
