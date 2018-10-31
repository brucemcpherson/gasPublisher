//module cParseCom skeleton created by excelLiberation@ramblings.mcpher.com at 11/27/2013 11:44:43 AM
// package should be {applicationID:"your Parse-applicationID", restAPIKey:"your Parse-REST-API-Key"}

function getLibraryInfo () {
  return {
    info: {
      name:'cParseCom',
      version:'2.2.0',
      key:'MMaKU0wHrNShUwFypY3nM8iz3TLx7pV4j',
    },
    dependencies:[
      cUseful.getLibraryInfo()
    ]
  }; 
}

function getParsed (parseClass,package) {
  return new cParseCom().init(parseClass,package);
}

var PARSELIMIT = 1000;
/**
 * @class cParseCom
 */
var CONSTRAINT = '__CONSTR$KEY$';
function cParseCom () {

    return this.classInitialize();
}
/**
 * Get parseClass
 * return {string}
 */
cParseCom.prototype.parseClass = function() {
  return this.xClass;
};

/**
 * Function resultsLength
 * @param {cJobject} [optJob= Nothing]
 * return {number}
 */
cParseCom.prototype.resultsLength = function(optJob) {
    var job = (typeof optJob == 'undefined' ? this.jObject() : optJob );
    return job.results ? job.results.length : 0;
};
/**
 * Function count
 * @param {cJobject} [optQueryJob= Nothing]
 * @param {cJobject} [optQueryParams= Nothing]
 * return {number}
 */
cParseCom.prototype.count = function(optQueryJob,optQueryParams) {
    // count rows in class
    return this.getCount(optQueryJob, optQueryParams).isOk() ? this.jObject().count : 0;
};
/**
 * Get self
 * return {cParseCom}
 */
cParseCom.prototype.self = function() {
  return this;
};
/**
 * Get jObject
 * return {*}
 */
cParseCom.prototype.jObject = function() {
  try {
    return JSON.parse(this.browser().text());
  }
  catch(err) {
    throw (err +':' + this.browser().text());
  }
};
/**
 * Get browser
 * return {*}
 */
cParseCom.prototype.browser = function() {
  return this.xBrowser;
};

cParseCom.prototype.objectDot = function (ob) {
  var self = this;
  return self.objectSplitKeys (ob).map ( function (o) {
    return {key:o.key.join("."), value:o.value};
  });
}
  
cParseCom.prototype.objectSplitKeys = function (ob,obArray,keyArray) {
  obArray = obArray || [];
  var self = this;
  //turns this {a:1,b:2,c:{d:3,e:{f:25}}}
  // into this, so that the keys can be joined to make dot syntax
  //[{key:[a], value:1},{key:[b], value:2} , {key:[c,d], value:3}, {key:[c,e,f], value:25}]
  if (self.isObject(ob)) {
    Object.keys(ob).forEach ( function (k) {
      var ka = keyArray ? keyArray.slice(0) : [];
      ka.push(k);
      if(self.isObject(ob[k]) && !ob[k][CONSTRAINT]) {
        self.objectSplitKeys (ob[k],obArray,ka);
      }
      else {
        obArray.push ( {key:ka, value:ob[k]} );
      }
    });
  }
  else {
    obArray.push(ob);
  }
  
  return obArray;
}
  
cParseCom.prototype.isObject = function (obj) {
  return obj === Object(obj);
} 

/**
 * Get isOk
 * return {boolean}
 */
cParseCom.prototype.isOk = function() {

  if (this.browser().isOk() || (!this.browser().status() && this.xBatchMode ) ) {
    if (!this.xBatchMode)
      return true;
    else {
      return !this.getError();
    }
  }
  return false;
  

};

cParseCom.prototype.getError = function () {
  var p = this.findProperty(this.jObject(), "error");
  return p ? p.error : '';
};

cParseCom.prototype.findProperty = function (j,k){

  return findProperty (j,k);
  
  function findProperty(job,key) {

      
      if (Array.isArray(job)){
        for (var i= 0; i < job.length ;i++ ) {
          var p = findProperty (job[i],key);
          if(p) return p;
        }
      }
      else if (typeof  job === 'object') {
        for ( var k in job) {
          if (k === key) return job[k];
          var p = findProperty (job[i],key);
          if(p) return p;
        }
      }
      return null;
    
  }

};
/**
 * Function init
 * @param {string} whichClass
 * @param {object} package from user credentials
 * return {cParseCom}
 */
cParseCom.prototype.init = function(whichClass,package) {
    
    this.xPackage = package;
    if (!this.xPackage) throw ("credentials needed");
    this.xApplicationHeaders = this.getApplicationHeaders();
    this.xClass = whichClass;
    return this;
};
/**
 * Function getObjectById
 * @param {string} id
 * return {cParseCom}
 */
cParseCom.prototype.getObjectById = function(id) {
    return this.getStuff("/" + id);
};
/**
 * Function getObjectsByQuery
 * @param {cJobject} [optQueryJob= Nothing]
 * @param {cJobject} [optQueryParams= Nothing]
 * return {cParseCom}
 */
cParseCom.prototype.getObjectsByQuery = function(optQueryJob,optQueryParams) {
    return this.getStuff('', this.constructQueryString(optQueryJob, optQueryParams));
};
/**
 * Function constructQueryString
 * @param {cJobject} [optQueryJob= Nothing]
 * @param {cJobject} [optQueryParams= Nothing]
 * return {string}
 */
cParseCom.prototype.constructQueryString = function(optQueryJob,optQueryParams) {
    var queryJob = (typeof optQueryJob == 'undefined' ? null : optQueryJob );
    var queryParams = (typeof optQueryParams == 'undefined' ? null : optQueryParams );
    var self = this;
    
    var t ='';
    if (queryParams) {
      for (job in queryParams) {
         t += job + '=' + encodeURIComponent(queryParams[job]) + '&';
      }
    }
 
    if (queryJob) {

      var dotJob = self.objectDot(queryJob).reduce(function(p,c){

        if (c.value[CONSTRAINT]) {
          p[c.key]=c.value[CONSTRAINT].reduce(function(pp,cc){
            pp[cc.constraint] = cc.value;
            return pp; 
          },{});
          
        }
        else {
          p[c.key] = c.value;
        }
        return p;
     },{});
     
     t +=encodeURIComponent("where=" + JSON.stringify(dotJob));

    }
    if (t && t.slice(-1) === '&') t = t.substring(0, t.length - 1);
    return t ? "?" + t : t ;
    
};
/**
 * Function mergeParameters
 * @param {cJobject} [optQueryParams= Nothing]
 * @param {cJobject} [optAddParams= Nothing]
 * return {cJobject}
 */
cParseCom.prototype.mergeParameters = function(optQueryParams,optAddParams) {
    var queryParams = (typeof optQueryParams == 'undefined' ? null : optQueryParams );
    var addParams = (typeof optAddParams == 'undefined' ? null : optAddParams );
    var job;
    
    if (optQueryParams || optAddParams) {
      job = queryParams ? JSON.parse(JSON.stringify(queryParams)) : {};
    
      if (addParams) {
        job = job || {};
        for (k in addParams) {
          job[k] = addParams[k];
        }
      }
      return job;
    }
    else {
      return null;
    }

};
/**
 * Function getCount
 * @param {cJobject} [optQueryJob= Nothing]
 * @param {cJobject} [optQueryParams= Nothing]
 * return {cParseCom}
 */
cParseCom.prototype.getCount = function(optQueryJob,optQueryParams) {
    return this.getStuff('', 
        this.constructQueryString(optQueryJob, this.mergeParameters(optQueryParams, {count:1,limit:0})));
};
/**
 * Function createObject
 * @param {cJobject} addJob
 * return {cParseCom}
 */
cParseCom.prototype.createObject = function(addJob) {
    return this.postStuff('', addJob);
};
/**
 * Function updateObjects
 * @param {cJobject} [optQueryJob= Nothing]
 * @param {cJobject} [optUpdateJob= Nothing]
 * @param {cJobject} [optQueryParameters= Nothing]
 * return {cParseCom}
 */
cParseCom.prototype.updateObjects = function(optQueryJob,optUpdateJob,optQueryParameters) {

    var skip = 0, jobSkip = {skip:0};
    while (true) {
      var w = this.getObjectsByQuery(optQueryJob, this.mergeParameters(optQueryParameters, jobSkip)).jObject();
      var number = this.resultsLength(w);
      if (number) {
          skip += number;
          jobSkip.skip = skip;
          this.updateObjectsPart (w, optUpdateJob);
      }
      if (!number || !this.isOk()) return this;
    }

};
/**
 * Function updateObjectsPart
 * @param {cJobject} queryResponse
 * @param {cJobject} updateJob
 * return {cParseCom}
 */
cParseCom.prototype.updateObjectsPart = function(queryResponse,updateJob) {

    if (this.isOk() && queryResponse) {
      for (var i =0; i < queryResponse.results.length ; i++ ) {
        this.postStuff(queryResponse.results[i].objectId, updateJob , "PUT");
      }
    }
    return this;


};
/**
 * Function deleteObjects
 * @param {cJobject} [optQueryJob= Nothing]
 * return {cParseCom}
 */
cParseCom.prototype.deleteObjects = function(optQueryJob) {
  var self = this;
  while (this.count(optQueryJob) > 0) {
    var queryResponse = this.getObjectsByQuery(optQueryJob).jObject();
    this.deleteObjectsPart (queryResponse);
    if (!this.isOk()) throw ("failed to flush:" + this.browser().status() + ":" + self.getError() + ":" + this.browser().text() );
  }
  return this;

};
/**
 * Function deleteObjectsPart
 * @param {cJobject} queryResponse
 * return {cParseCom}
 */
cParseCom.prototype.deleteObjectsPart = function(queryResponse) {
  
  
    if (this.isOk()) {
      for (var i = 0 ; i < queryResponse.results.length; i++ ) {
        this.deleteObject (queryResponse.results[i].objectId);
      }
    }

    return this;

};
/**
 * Function deleteObject
 * @param {string} id
 * return {cParseCom}
 */
cParseCom.prototype.deleteObject = function(id) {

    if (this.xBatchMode) {
      return this.postStuff (id, undefined, "DELETE");
    }
    else {
      return this.getStuff("/" + id, undefined, "DELETE")  ;
    }

};
/**
 * Function postStuff
 * @param {string} what
 * @param {cJobject} [optData= Nothing]
 * @param {string} [optMethod= "POST"]
 * return {cParseCom}
 */
cParseCom.prototype.postStuff = function(what,optData,optMethod) {
    var data = (typeof optData == 'undefined' ? null : optData );
    var method = (typeof optMethod == 'undefined' ? "POST" : optMethod );
    
    if (this.xBatchMode) {
      if (this.isEmptyBatchNeeded() ) this.flush();
      this.addToBatch (method, this.xClassPoint +this.parseClass() + "/" + what, data);
    }
    else {
      this.doPost (this.xEndPoint + this.xClassPoint + this.parseClass() + "/" + what, data, optMethod);
    }

    return this;

};
/**
 * Function getStuff
 * @param {string} what
 * @param {string} [optParams= vbNullString]
 * @param {string} [optMethod= "GET"]
 * return {cParseCom}
 */
cParseCom.prototype.getStuff = function(what,optParams,optMethod) {

    var params = (typeof optParams == 'undefined' ? '' : optParams );
    var method = (typeof optMethod == 'undefined' ? "GET" : optMethod );

    this.flush();
    this.browser().execute (this.xEndPoint + this.xClassPoint + this.parseClass() + what + params,method,undefined,this.xApplicationHeaders);
    return this;

};
/**
 * Function doPost
 * @param {string} url
 * @param {cJobject} [optData= Nothing]
 * @param {string} [optMethod= "POST"]
 * return {cParseCom}
 */
cParseCom.prototype.doPost = function(url,optData,optMethod) {

    var data = (typeof optData == 'undefined' ? null : optData );
    var method = (typeof optMethod == 'undefined' ? "POST" : optMethod );
    var dString= data ? JSON.stringify(data) : '';
    this.browser().execute(url,  method, dString, this.xApplicationHeaders);
    return this;

};
/**
 * Function clearDown
 * @param {Object} o
 * return {cParseCom}
 */
cParseCom.prototype.clearDown = function(o) {
  return this;
};
/**
 * Function isEmptyBatchNeeded
 * return {boolean}
 */
cParseCom.prototype.isEmptyBatchNeeded = function() {
    return this.xBatch && this.xBatch.requests.length >= this.xBatchMax

};
/**
 * Function addToBatch
 * @param {string} method
 * @param {string} path
 * @param {cJobject} [optBody= Nothing]
 * return {*}
 */
cParseCom.prototype.addToBatch = function(method,path,optBody) {
    var body = (typeof optBody == 'undefined' ? null : optBody );
    
    // first time in
    this.xBatch = this.xBatch || {};
    this.xBatch.requests = this.xBatch.requests || [];
    
    // trim any trailing - not valid in batchmode
    if (path && path.slice(-1) === '/') path = path.substring(0, path.length - 1);
    
    //add body to batched item
    var b = { method:method, path:path };
    if (body) b.body = body;
    
    // add to pending batch list
    this.xBatch.requests.push (b);
    return this;
    

};
/**
 * Function batch
 * @param {boolean} [optBatchItUp= True]
 * return {cParseCom}
 */
cParseCom.prototype.batch = function(optBatchItUp) {
    var batchItUp = (typeof optBatchItUp == 'undefined' ? true : optBatchItUp );
    
    // if batching being turned off, then flush
    if (!batchItUp) this.flush();
    
    // reset mode
    this.xBatchMode = batchItUp;

    return this;

};
/**
 * Get batchMode
 * return {boolean}
 */
cParseCom.prototype.batchMode = function() {

  return this.xBatchMode;

};
/**
 * Function flush
 * return {*}
 */
cParseCom.prototype.flush = function() {

 // flush anything in batch
  var self = this;
  if (this.xBatch && this.xBatch.requests) {
    cUseful.rateLimitExpBackoff(function () {
      self.doPost (self.xEndPoint + self.xBatchPoint , self.xBatch , "POST");
      if (!self.isOk()) { 
        var t = JSON.parse(self.browser().text());
 
        // generate a retry
        if (t.code === 155) {
          throw ("Exception: Rate Limit Exceeded");
        }
        else {
          throw ("failed to flush:" + self.browser().status() + ":" +  self.getError()  + ":" + t);
        }
      }
      else {
        self.xBatch = null;
      }
    });
  }
  return this;

};
/**
 * Sub tearDown
 * return {void}
 */
cParseCom.prototype.tearDown = function() {
  // not relevant in javaScript implementation
  return this;
};
/**
 * Sub Class_Initialize
 * return {void}
 */
cParseCom.prototype.classInitialize = function() {

  // will be callsed by constructor
    this.xBrowser = new cParseBrowser(); //TODO
    this.xEndPoint = "https://api.parse.com";
    this.xClassPoint = "/1/classes/";
    this.xBatchPoint = "/1/batch";
    this.xSalt = "xLiberation";
    this.xBatchMode = false;
    this.xBatchMax = 50;
    return this;
};

/**
 * Function getApplicationHeaders
 * return {cJobject}
 */
cParseCom.prototype.getApplicationHeaders = function() {
    return {"X-Parse-Application-Id": this.xPackage.applicationID,"X-Parse-REST-API-Key": this.xPackage.restAPIKey}
};


function cParseBrowser () {
    
    var self = this;
    
    self.execute = function (url,method,data,headers) {
      self.xUrl = url;
      var options = {
        "method" : method,
        contentType: "application/json",
        muteHttpExceptions: true
      };
      // posting data
      if (data) options.payload = data;
      
      // parse headers
      if (headers) {
        options.headers = headers;
      }

      // do it
      try {
        cUseful.rateLimitExpBackoff (function() {
          self.xResponse = UrlFetchApp.fetch(self.url(),options);
        });
      }
      catch(err) {
        throw (err+" fetching "+ self.url());
      
      }
      return self;
    }
    
    self.text = function () {
      return self.xResponse.getContentText();
    }
    self.url = function () {
      return self.xUrl;
    }
    
    self.status = function () {
      return self.xResponse.getResponseCode()
    }
    
    self.isOk = function () {
      return (self.status() == 200 || self.status()  == 201);
    }
    return self;
}
