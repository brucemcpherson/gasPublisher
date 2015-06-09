/**TODO
 * immediate queries after write are too quick .. update not yet done - maybe transactional is needed
 * indexes required for filter/sort combination
 */
/** wrapper
 */
function createDriver (handler,siloId,driverSpecific,driverOb, accessToken) {
    return new DriverDataStore(handler,siloId,driverSpecific,driverOb, accessToken);
}

/** TODO
 * having problems with 412 and predefined indexes
 */
function getLibraryInfo () {
  return {
    info: {
      name:'cDriverDataStore',
      version:'2.0.1',
      key:'MPZF_EC6nOZFAjMRqCxEaUyz3TLx7pV4j',
      share:'https://script.google.com/d/1gKZkk4zuouPmIf1JYAFGTfCW0AmMtbL5eTohuLmcOE2WqIDxLudAMrxB/edit?usp=sharing',
      description:'cloud datastore driver for dbabstraction'
    },
    dependencies:[
      cFlatten.getLibraryInfo()
    ]
  }; 
}
/**
 * DriverDataStore
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} tableName this is the DataStore collection
 * @param {string} id some id you create for identifying this collection
 * @param {object} dataStoreOb a DataStoreOb ob if required  ( { restAPIKey:"your DataStore developer key"} )
 * @param {string} [accessToken] an oauth2 access token
 * @return {DriverDataStore} self
 */
 
var DriverDataStore = function (handler,tableName,id,dataStoreOb,optAccessToken) {
  var siloId = tableName;  // the kind
  var dbId = id;           // cloud datastore project id    
  var self = this;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var keyOb = dataStoreOb; 
  var handleError, handleCode; 
  var accessToken = optAccessToken || null;
  var handle = new DatastoreWorker(parentHandler, accessToken, dbId,siloId);
  var complex_ = false;
  
  // im not able to do transactions
  self.transactionCapable = false;
  
  // i  need transaction locking
  self.lockingBypass = false;
  
  // i am aware of transactions and know about the locking i should do
  self.transactionAware = true;
  
  self.getType = function () {
    return enums.DB.DATASTORE;
  };
  
  self.getDbId = function () {
    return dbId;
  };
  
  /** no persistent handle for this rest query - just return self
   * @return {DriverDataStore} self
   */
  self.getDriveHandle =  function () {
    return handle;
  };  

  
  /**
   * DriverDataStore.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };
 /** create the driver version
  * @return {string} the driver version
  */ 
  self.getVersion = function () {
    var v = getLibraryInfo().info;
    return v.name + ':' + v.version;
  };

   /**
   * DriverDataStore.query()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  self.query = function (queryOb,queryParams,keepIds) {
  
    return parentHandler.readGuts ( 'query' , function() {
      return queryGuts_(queryOb,queryParams,keepIds);
    });
  };

function queryGuts_(queryOb,queryParams,keepIds) {

  var result,driverIds, handleKeys;
  handleCode = enums.CODE.OK, handleError='',qp=null;
  complex_ = false;
  if (queryParams) {
    result= self.sortOutParams(queryOb,queryParams);
    if (result.handleCode !== enums.CODE.OK) return result;
    qp = result.data;
  }
  
  result = handle.runQuery(queryOb,qp);

  
  if (result.handleCode !== enums.CODE.OK) {
    return parentHandler.makeResults (result.handleCode,result.handleError);
  }
  
  // apply anyfilters
  var pr = parentHandler.processFilters (queryOb, result.data); 
  handleCode =pr.handleCode;
  handleError = pr.handleError;
  if (handleCode === enums.CODE.OK) {
    result.data = pr.data;
    // fix up the result
    if (keepIds) {
      var d = handle.getIds(result);
      driverIds = pr.handleKeys.map(function(k) {
        return d[k];
      });
      handleKeys= driverIds;
    }
  }
  
  // next fix up parameters datastore couldnt handle
  
  if (complex_ ) {
    var npr = parentHandler.processParams( queryParams,result.data);
    if (handleCode === enums.CODE.OK) {
      result.data = npr.data;
      // fix up the result
      if (keepIds) {
        driverIds = npr.handleKeys.map(function(k) {
          return driverIds[k];
        });
        handleKeys= driverIds;
      }
    }
  }
  return parentHandler.makeResults (handleCode,handleError,result.data,keepIds ? driverIds :null,keepIds ? handleKeys:null);
}

  /**
   * DriverDataStore.removeByIds()
   * @memberof DriverDataStore
   * @param {Array.string} ids list of handleKey ids to remove
   * @return {object} results from selected handler
   */
  self.removeByIds = function (ids) {

    var result = {};
    
    try {
    Logger.log('removing by ids');
    Logger.log(ids);
      result = handle.remove (ids);
    Logger.log(result);
    }
    catch(err) {
      result.handleError = err;
      result.handleCode =  enums.CODE.DRIVER;
    }
    
    return parentHandler.makeResults (result.handleCode,result.handleError,result);
  };
  

   /**
   * DriverDataStore.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.remove = function (queryOb,queryParams) {
    return parentHandler.writeGuts ( 'remove' , function() {

      try { 
        var result;
        try {
          // start with a query
          result = queryGuts_ (queryOb, queryParams , true);
          if (result.handleCode === enums.CODE.OK) {
            result = self.removeByIds (result.handleKeys);
          }

        }
        catch(err) {
          result = {
            handleError: err,
            handleCode:  enums.CODE.DRIVER
          };
        }
        return parentHandler.makeResults (result.handleCode,result.handleError,result);
      }
      catch (err) {
        return parentHandler.makeResults(enums.CODE.LOCK,err);
      }
    });
  };

  /**
   * DriverDataStore.save()
   * @param {Array.object} obs array of objects to write
   * @return {object} results from selected handler
   */
  self.save = function (obs) {
    return parentHandler.writeGuts ( 'save' , function() {
      var result = null;
      handleError='', handleCode=enums.CODE.OK;
      
      if(handleCode === enums.CODE.OK) {
        try {
          result = handle.insert(obs);
          if (result.handleCode !== enums.CODE.OK) {
            handleError = result.handleError;
            handleCode = result.handleCode;
          }
        }
        catch(err) {
          handleError = err ;
          handleCode =  enums.CODE.DRIVER;
        }
      
      }
      return parentHandler.makeResults (handleCode,handleError,result);
    });
  };
 

  /**
   * DriverDataStore.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.count = function (queryOb,queryParams) {
    return parentHandler.readGuts ( 'count' , function() {
      var c=0, result= self.query(queryOb,queryParams);
      if(result.handleCode >= 0) { 
        c = result.data.length;
      }
      return parentHandler.makeResults (handleCode,handleError,[{count:c}]);
    });
  };
  
  /**
   * Driver.get()
   * @param {string} key the unique return in handleKeys for this object
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */

  self.get = function (key,keepIds) {
    return parentHandler.readGuts ( 'get' , function() {
      var result =null;
      handleError='', handleCode=enums.CODE.OK;
      var driverIds, handleKeys;
  
      try {
        result = handle.lookup(key);
        if (result.handleCode !== enums.CODE.OK) {
          handleError = result.handleError;
          handleCode = result.handleCode;
        }
      }
      catch(err) {
        handleError = err ;
        handleCode =  enums.CODE.DRIVER;
      }
      
      // fix up the result
      if (keepIds) {
          driverIds= handle.getIds(result);
          handleKeys= driverIds;
      }
      return parentHandler.makeResults (handleCode,handleError,result.data,keepIds ? driverIds :null,keepIds ? handleKeys:null);
    }); 
  };
  
  /**
   * Driver.update()
   * @param {string} key the unique return in handleKeys for this object
   * @param {object} ob what to update it to
   * @return {object} results from selected handler
   */
  self.update = function (key,ob) {
    return parentHandler.writeGuts ( 'update' , function() {

      try {
        var result;
        try {
          // do the update
          result = handle.update(key,ob);
        }
        catch(err) {
          result = {
            handleError: err,
            handleCode:  enums.CODE.DRIVER
          };
        }
        return parentHandler.makeResults (result.handleCode,result.handleError,result);
      }
      catch (err) {
        return parentHandler.makeResults(enums.CODE.LOCK,err);
      }
    });
  };
  
  /**
   * sort out query params
   * @param {object} queryParams parameters
   * @return 
   */
   self.sortOutParams = function (queryOb,queryParams) {
     
     var pOb = null;
     if (queryParams) {
     
       // we cant rely on datastore to do limits and skips if there are complex queries with no index
      complex_ = queryOb && Object.keys(queryOb).some (function(k) {
        return (parentHandler.isObject (queryOb[k]) );
      });
      
       var result = parentHandler.getQueryParams(handle.flatten(queryParams));
       if(result.handleCode === enums.CODE.OK) {
          pOb = result.data.reduce (function (p,c) {
            if (c.param === 'sort') {
                p.order = [{property:{name:c.sortKey},direction: c.sortDescending ?  'DESCENDING' : 'ASCENDING' }];
            }
            else if (!complex_ && c.param === 'limit' ) {
              p.limit = c.limit;
            }
            else if (!complex_ && c.param === 'skip') {
              p.offset = c.skip;
            }
            return p; }, {});
            
          return parentHandler.makeResults (enums.CODE.OK,'',pOb);
       }
       else {
         return result;
       }
     }
     return (enums.CODE.OK);  
   }

  return self;
  
}
