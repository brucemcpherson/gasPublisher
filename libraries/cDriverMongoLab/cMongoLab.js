/** wrapper
 */
function createDriver (handler,siloId,driverSpecific,driverOb, accessToken) {
    return new DriverMongoLab(handler,siloId,driverSpecific,driverOb, accessToken);
}

function getLibraryInfo () {
  return {
    info: {
      name:'cDriverMongoLab',
      version:'2.2.0',
      key:'MPAHw_-cHNDxsYAg263J7Fai_d-phDA33',
      description:'mongolab driver for dbabstraction',
      share:'https://script.google.com/d/11N6camwOikILS28dwqvIlv44D1y0JMCTL9IeeUKkDV1amGvjWIeg-KbH/edit?usp=sharing'
    },
    dependencies:[
    ]
  }; 
}

/**
 * DriverMongoLab
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} collection the name of the mongodb collection
 * @param {string} database the mongo database
 * @param {object} database the mongo credential object
 * @return {object} result with handle or some error
 */ 
var DriverMongoLab = function (handler,collection,database,credentials) {
  var siloId = collection;
  var self = this;
  var uniqueKey = database;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();
  var keyOb = credentials;
  var handleError, handleCode;
  var DRIVERFIELDS = ['_id'];
  
  // im not able to do transactions
  self.transactionCapable = false;
  
  // i  need transaction locking
  self.lockingBypass = false;
  
  // i am aware of transactions and know about the locking i should do
  self.transactionAware = true;
  
  self.getDbId = function () {
    return uniqueKey;
  };
  
  // create connection to mongo
  self.createHandle = function() {
    return uniqueKey;
  }

  var handle = self.createHandle();

  self.getVersion = function () {
    var v = getLibraryInfo().info;
    return v.name + ':' + v.version;
  };
  
  self.getDriveHandle =  function () {
    return handle;
  };
  
  self.getType = function () {
    return enums.DB.MONGOLAB;
  };
  
  /**
   * DriverMongoLab.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };

  self.getEndPoint = function (optExtras) {
    extras = optExtras ? "/" + optExtras : "";
    return  "https://api.mongolab.com/api/1/databases/" + self.getDbId() + "/collections/" + self.getTableName() + extras + "?apiKey=" + keyOb.restAPIKey;
  };
  
/** create the urlfetch options 
 * @param {object} options any additional options to add
 * @return {object} the urlfetch options
 */
  self.getOptions = function (options) {
    var options = options || {};
    options.contentType = "application/json" ;
    options.muteHttpExceptions = true;
    return options;
  }
  
  self.execute = function (url,options) {
    handleCode = enums.CODE.OK;
    handleError ="";
    
    var result = parentHandler.rateLimitExpBackoff ( function () {

      var h = UrlFetchApp.fetch(url,options);

      if (h.getResponseCode() !== 201 && h.getResponseCode() !== 200 && h.getResponseCode() !== 204) {
        handleCode = enums.CODE.HTTP;
        handleError = h.getContentText() +"(http error code:" + h.getResponseCode()+ ")(url:" +url+")";
      }
      var t = h.getContentText();

      if (t) {
        var o = JSON.parse(t);

        if (o && o.message) {
          handleCode = enums.CODE.DRIVER;
          handleError = JSON.stringify(o.message);
          return null;
        }
        else { 
          return o;
        }
      }
      else {
        return h.getResponseCode();
      }

    });

    return result;
  }
  
  
  /**
   * DriverMongoLab.save()
   * @param {Array.object} obs array of objects to write
   * @return {object} results from selected handler
   */
   
   self.save = function (obs) {

    // save it after adding my own id fields
    var obd = obs.map(function(d) { 
      var o = parentHandler.clone(d);
      o._id = parentHandler.generateUniqueString() ; 
      return o; 
    });
    
    // lock the entire transaction
    var result =  parentHandler.writeGuts ( 'save', function () {
      return self.execute (self.getEndPoint() , self.getOptions ({
        method: "POST",
        payload: JSON.stringify(obd)
      }));
    // the result property of the lock protect is the result of the function that was protected
   });
   return parentHandler.makeResults ( handleCode, handleError, obs , null , obd.map(function(d) { 
     return getMixedId_(d);
   }));
       
  };

  /**
   * DriverMongoLab.removeByIds()
   * @param {array.string} keys  list of keys to delete
   * @return {object} results from selected handler
   */   
  self.removeByIds = function (keys) {

    var options = self.getOptions({
      method: "DELETE"
    });
    
    var r = parentHandler.writeGuts ( 'removeByIds', function () {    
      var dr = keys.map( function (d) {
        return self.execute (self.getEndPoint(d) , options);
      });
      return dr;
    });
    
   r.keys = keys;
   return r;
    
  };

  /**
   * DriverMongoLab.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @param {Array.object} optReplaceWith adding this makes it a replace
   * @return {object} results from selected handler
   */   
  self.remove = function (queryOb,queryParams,optReplaceWith) {

    var obs = optReplaceWith || [];
    var params = parentHandler.getQueryParams(parentHandler.clone(queryParams));
    handleCode = params.handleCode;
    handleError = params.handleError;
    
    // lock the entire transaction
    if (handleCode === enums.CODE.OK) {
      var useParams = parentHandler.makeUseParams(params.data);
      var options = self.getOptions({
        method: "PUT",
        payload: JSON.stringify(obs)
      });
        
      var result =  parentHandler.writeGuts ( 'remove', function () {
        return self.execute (self.getEndPoint() + makeQueryString_(queryOb) + makeParamString_(useParams) , options);
      });
    }
    return parentHandler.makeResults (  handleCode, handleError, result);
  };
   /**
   * DriverMongoLab.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
   
  self.count = function (queryOb,queryParams) {
  
    var params = parentHandler.getQueryParams(parentHandler.clone(queryParams)), result;
    handleCode = params.handleCode;
    handleError = params.handleError;

    if (handleCode === enums.CODE.OK) {
      var useParams = parentHandler.makeUseParams(params.data);
      try {
        var r = parentHandler.readGuts ( 'count', function () {
          return self.execute (self.getEndPoint() + makeQueryString_(queryOb) + makeParamString_(useParams) + "&c=true" , 
            self.getOptions({
              method: "GET",
            }));
        });
        result = [{count:r}];
      }
      catch(err) {
        handleError = JSON.stringify(err);
        handleCode =  enums.CODE.DRIVER;
      }
    }
    return parentHandler.makeResults (  handleCode, handleError, result);
  };

//-------------------------- 
   /**
   * DriverMongoLab.query()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  self.query = function (queryOb,queryParams,keepIds,optFlatten) {
  
    // take a copy of params so as not to disturb what's passed
    var exhausted = false;
    var driverIds = [], handleKeys = [];
    
    var queryString = makeQueryString_(queryOb,optFlatten);
    var params = parentHandler.getQueryParams(parentHandler.clone(queryParams));
    handleCode = params.handleCode;
    handleError = params.handleError;
    
    try {
      if (handleCode === enums.CODE.OK) {
        
        var result = parentHandler.readGuts ( 'query', function () {
          // this is chunking to get over limits
          var useParams = parentHandler.makeUseParams(params.data);
          
          var skip = useParams.skip.skip ,  limit = useParams.limit.limit ,exhausted = false;
          var result = [];
          
          while (handleCode === enums.CODE.OK && (result.length < limit || limit ===0) && !exhausted) {
            
            useParams.skip.skip = skip + result.length;
            var paramString = makeParamString_(useParams);
            
            var w = self.execute ( 
              self.getEndPoint() + queryString + paramString , self.getOptions ({
              method: "GET"
              }));
            
            exhausted = !w || (w.length === 0 );
            
            if (handleCode === enums.CODE.OK && !exhausted) {
              
              w.forEach (function(d) {
                if( result.length < limit || limit ===0) {
                  var o ={};
                  driverId ={};
                  for (var k in d) {
                    if (DRIVERFIELDS.indexOf(k) === -1) {
                      o[k] = d[k];
                    }
                    else {
                      driverId[k] = d[k];
                    }
                  }
                  handleKeys.push(getMixedId_ (d) );
                  driverIds.push(driverId);
                  result.push(o);
                }
              });
            }
          }
          return result;
        });
      }
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }
    
    return parentHandler.makeResults (handleCode,handleError,result,keepIds ? driverIds :null,keepIds ? handleKeys:null);
  };
  function getMixedId_ (ob) {
    return parentHandler.isObject(ob._id) ? ob._id["$oid"] : ob._id; 
  }
  function makeParamString_(ps) {

      // fix with mongo api equivalents
    p='';
    
    if (ps.sort) {
      p+= '&s=' + encodeURIComponent('{"' + ps.sort.sortKey + '":' + (ps.sort.sortDescending ?  -1:1) +'}'); 
    }
    if (ps.limit) {
        p+= '&l=' + ps.limit.limit;
    }
    if (ps.skip) {
        p+= '&sk=' + ps.skip.skip;
    }
    
    return p;
  }

  function makeQueryString_(queryOb, optFlatten) {
  
    // special case - we dont flatten $or
    var flatten = typeof optFlatten === 'undefined' ? true: optFlatten;
    var q='';
    if (queryOb) {
      var qb = flatten ? parentHandler.flatten(queryOb,true) : queryOb;

      var qob = Object.keys(qb).reduce(function(p,c) {
        if  (qb[c].hasOwnProperty (enums.SETTINGS.CONSTRAINT)) {
          p[c] = qb[c][enums.SETTINGS.CONSTRAINT].reduce( function (a,b) {
            a[b.constraint] = b.value; 
            return a;
          },{});
        }
        else {
          p[c]=qb[c];
        }
        return p;
      },{});
      return '&q=' + encodeURIComponent(JSON.stringify(qob));
    }
    else {
      return '';
    }

  };
  
    
  /**
   * Driver.get()
   * @param {Array.string} keys the unique return in handleKeys for this object
   * @return {object} results from selected handler
   */


  self.get = function (keys) {
   
   // this kind of sucks, since we have to to a separate update for each key

   if(!Array.isArray(keys)) keys = [keys];

   handleCode=enums.CODE.OK;
   handleError='';
   var result;
   try {
     result = parentHandler.readGuts ( 'get', function () {
      return keys.map (function(d) {
        var k = parentHandler.isObject(d) ? d.key : d;
        var r = self.execute (self.getEndPoint(k)  , self.getOptions({
          method: "GET"
        }));
        if (!r || r.length === 0) handleCode = enums.CODE.NOMATCH;
        return r;
      });
     });
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }

    return self.splitKeys(parentHandler.makeResults (handleCode,handleError,result));
  };
  
  /**
   * DriverSheet.splitKeys()
   * take a result and remove special fields and move handlekeys
   * @param {object} qResult standard result
   * @return {object} modified standard result
   */
  self.splitKeys = function (qResult) {
    
    if (qResult.handleCode >=0) {
      var s = parentHandler.dropFields ( DRIVERFIELDS , '_id' , qResult.data);
      qResult.data = s.obs;
      qResult.handleKeys = s.keys;
    }
    
    return qResult;
  };

  /**
   * Driver.update()
   * @param {Array.string} keys the unique return in handleKeys for this object
   * @param {object} obs what to update it to
   * @return {object} results from selected handler
   */
  self.update = function (keys,obs) {
   
   // this kind of sucks, since we have to to a separate update for each key

   if(!Array.isArray(keys)) keys = [keys];
   if(!Array.isArray(obs)) obs = [obs];
   
   if(keys.length !== obs.length && obs.length !== 1)  {
     return parentHandler.makeResults (enums.CODE.KEYS_AND_OBJECTS,'objects- ' + obs.length + ' keys- ' + keys.length,result);
   }
   
   
   handleCode=enums.CODE.OK;
   handleError='';
   var result;
   try {
      result = parentHandler.writeGuts ( 'update', function () { 
        return keys.map (function(d,i) {
          var r = self.execute (self.getEndPoint(d)  , self.getOptions({
            method: "PUT",
            payload: JSON.stringify(obs.length === 1 ? obs[0] : obs[i])
          }));
          if (!r || r.length === 0) handleCode = enums.CODE.NOMATCH;
          return r;
        });
      });
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }

    return parentHandler.makeResults (handleCode,handleError,result);
  };
  
  return self;
  
}
