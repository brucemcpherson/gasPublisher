/** wrapper
 */
function createDriver (handler,siloId,driverSpecific,driverOb, accessToken) {
    return new DriverParse(handler,siloId,driverSpecific,driverOb, accessToken);
}
/**
 * DriverParse
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} tableName table name or silo
 * @param {string} id some id to uniquely identify this parse instance
 * @param {object} credentials parse credentials ( {applicationID:"your Parse-applicationID", restAPIKey:"your Parse-REST-API-Key"} )
 * @return {DriverParse} self
 */
function getLibraryInfo () {
  return {
    info: {
      name:'cDriverParse',
      version:'2.2.0',
      key:'Mhr42c9etIE-fQb2D9pwW0ai_d-phDA33',
      share:'https://script.google.com/d/17R_UVC7g6aWPGcQutcEK5e2o1YRJOXp2AA_qgv52qGcivryrEpiM_x9O/edit?usp=sharing',
      description:'parse.com abstraction library for apps script'
    },
    dependencies:[
      cParseCom.getLibraryInfo()
    ]
  }; 
}
var DriverParse = function (handler,tableName,id,credentials) {
  var siloId = tableName;
  var self = this;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var DRIVERFIELDS = ['objectId', 'createdAt' , 'updatedAt'];
  var PARSELIMIT = 1000;
  var handle = (function () {
    return new cParseCom.cParseCom().init(siloId,credentials);
  })();
  var handleError, handleCode; 
  
  // im not able to do transactions
  self.transactionCapable = false;
  
  // i  need transaction locking
  self.lockingBypass = false;
  
  // i am aware of transactions and know about the locking i should do
  self.transactionAware = true;
  
 /** create the driver version
  * @return {string} the driver version
  */ 
  self.getVersion = function () {
    var v = getLibraryInfo().info;
    return v.name + ':' + v.version;
  };
  self.getType = function () {
    return enums.DB.PARSE;
  }
  self.getDriveHandle =  function () {
    return handle;
  };

  self.getDbId = function () {
    return id;
  };
  
  /**
   * DriverParse.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };
 
 /**
   * DriverParse.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
   
  self.count = function (queryOb,queryParams) {

    return parentHandler.readGuts ( 'count', function () {
    
      var result =null;
      handleError='', handleCode=enums.CODE.OK;
      try {
      
        var params = parentHandler.getQueryParams(queryParams);
        if (params.handleCode === enums.CODE.OK) {
          if (params.data.length) {
            handleCode = enums.CODE.PARAMNOTIMPLEMENTED;
            handleError = 'no query params allowed on remove for parse.com';
          }
          else {
            var w = handle.count(queryOb,queryParams);
            result = [{count:w}];
          }
        }
        else {
          handleError = params.handleError;
          handleCode = params.handleCode;
        }
      }
      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
      return parentHandler.makeResults (handleCode,handleError,result);
    
    });
    

  };
  
   /**
   * DriverParse.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
   
  self.remove = function (queryOb,queryParams) {
    
    return parentHandler.writeGuts ( 'remove', function () {
    
      var result =null;
      handleError='', handleCode=enums.CODE.OK;
      
      try {
        
        var params = parentHandler.getQueryParams(queryParams);

        if (params.handleCode === enums.CODE.OK) {
          if (params.data.length) {
            handleCode = enums.CODE.PARAMNOTIMPLEMENTED;
            handleError = 'no query params allowed on remove for parse.com';
          }
          else {

            var w = handle.batch(true).deleteObjects(queryOb).batch(false).flush();

            if (!w.isOk()) {
              handleError = w.browser().status();
              handleCode =  enums.CODE.HTTP;
            }
            else {
              result = w.jObject().results;
            }
            
          }
        }
        else {
          handleError = params.handleError;
          handleCode = params.handleCode;
        }
      }
      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
      return parentHandler.makeResults (handleCode,handleError,result);
    });
    
  };
  
   /**
   * DriverParse.removeByIds()
   * @param {array.string} keys delete these
   * @return {object} results from selected handler
   */ 
  self.removeByIds = function (keys) {
    
    return parentHandler.writeGuts ( 'removebyids', function () {
    
      var result =null;
      handleError='', handleCode=enums.CODE.OK;
      
      try {
        handle.batch(true);
        var dr = keys.map ( function (k) { 
          return handle.deleteObject (k) ; 
        });
        var w = handle.flush().batch(false);

        if (!w.isOk()) {
          handleError = w.browser().status();
          handleCode =  enums.CODE.HTTP;
        }
        else {
          result = w.jObject().results;
        }
      }

      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
      return parentHandler.makeResults (handleCode,handleError,result);
    });
    
  };
  
  self.constructParseError = function (parsecomOb) {
    var p = parsecomOb.getError();
    return parsecomOb.browser().status() + '(' + handle.status() + ') : ' + JSON.stringify(p);
  };
  /**
   * DriverParse.save()
   * @param {Array.object} obs array of objects to write
   * @return {object} results from selected handler
   */
  self.save = function (obs) {

    return parentHandler.writeGuts ( 'save', function () {
    
      var result =null;
      handleError='', handleCode=enums.CODE.OK;
      var keys;
      try {
        handle.batch(true);
        obs.forEach(function(d) {
          handle.createObject(d);
        });
        var w = handle.flush().batch(false);

        if (!w.isOk()) {
          handleError = self.constructParseError (w) ;
          handleCode =  enums.CODE.HTTP;
        }
        else {
          var wob = w.jObject();
          keys = wob.map(function(d) {
            return d.success.objectId;
          });
        }
      }
      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
      return parentHandler.makeResults (handleCode,handleError,obs,null,keys);
    });
    
  };

  
 /**
   * DriverParse.query()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  self.query = function (queryOb,queryParams,keepIds) {
    

    return parentHandler.readGuts ( 'query', function () {
    
      var result =null;
      handleError='', handleCode=enums.CODE.OK
      var driverIds = [], handleKeys = [];
      
      try {
        // take a copy of params so as not to disturb what's passed
        var cloneParams = queryParams ? JSON.parse(JSON.stringify(queryParams)) : {};
        var params = parentHandler.getQueryParams(cloneParams);
        
  
        if (params.handleCode === enums.CODE.OK) {
          // we have an array of good query params (params get sorted in sensible order)
          // get the data from parse
  
          var useParams = params.data.reduce (function (p,c) {
            // in parse we use order instead of sort
            var k = (c.param === "sort" ?  "order" : c.param);
            p[k] = c.value;
            return p;
          } ,{});
  
          // this is chunking to get over limits
          var skip = useParams.skip || 0,  limit = useParams.limit || 0,exhausted = false;
          var result = [];
          
          while (handleCode === enums.CODE.OK && (result.length < limit || limit ===0) && !exhausted) {
            useParams.skip = skip + result.length;
            useParams.limit = limit || PARSELIMIT;
            var w = handle.getObjectsByQuery(queryOb,useParams);
            
            if (!w.isOk()) {
              handleError = w.browser().status();
              handleCode = enums.CODE.HTTP;
            }
            else {
              var chunk = w.jObject().results;
              exhausted = (chunk.length === 0 );
              if (!exhausted) {
  
                chunk = chunk.map(function(d) {
                  // get rid of driver specific fields
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
                  handleKeys.push(d.objectId);
                  driverIds.push(driverId);
                  return o;
                });
              }
              chunk.forEach( function(d) {
                if (result.length < limit || limit ===0) {
                  result.push(d);
                }
              });
  
            }
          }
        }
        else {
          handleError = params.handleError;
          handleCode = params.handleCode;
        }
      }
      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
  
      return parentHandler.makeResults (handleCode,handleError,result,keepIds ? driverIds :null,keepIds ? handleKeys:null);
    });
  };
  
  
 /**
   * DriverParse.update()
   * @param {string} key the unique return in handleKeys for this object
   * @param {object} ob what to replace the contents with
   * @return {object} results from selected handler
   */
  self.update = function (key,ob) {
  
    return parentHandler.writeGuts ( 'update', function () {
      var result =null;
      
      handleError='', handleCode=enums.CODE.OK
   
      try {
        if (!Array.isArray(key)) key = [key];
        if (!Array.isArray(ob)) ob = [ob];
        handle.batch(true);
        key.forEach (function(k,i) {
          var w = handle.updateObjects ({objectId:k}, ob[i]) ; 
          if (w.jObject().code === 101 ) {
            handleCode = enums.CODE.NOMATCH;
          }
          else if (!w.isOk()) {
            handleError = w.browser().status();
            handleCode = enums.CODE.HTTP;
          }
          else {
            result = w.jObject();
          }
        });
        result = handle.flush().jObject();
  
      }
      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
      return parentHandler.makeResults (handleCode,handleError,result);
    });
  }
  /**
   * DriverParse.splitKeys()
   * take a result and remove special fields and move handlekeys
   * @param {object} qResult standard result
   * @return {object} modified standard result
   */
  self.splitKeys = function (qResult) {
    
    if (qResult.handleCode >=0) {
      var s = parentHandler.dropFields ( DRIVERFIELDS , 'objectId' , qResult.data);
      qResult.data = s.obs;
      qResult.handleKeys = s.keys;
    }
    
    return qResult;
  };
  /**
   * DriverParse.get()
   * @param {string} keys the unique return in handleKeys for this object
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */

  self.get = function (keys) {
  
    return parentHandler.readGuts ( 'get', function () {
    
      if(!Array.isArray(keys)) keys = [keys];
      var result =null;
      handleError='', handleCode=enums.CODE.OK
      
      try {
        result = keys.map(function(t) {
          // ripdb handler passes an object
          var k = parentHandler.isObject(t) ? t.key : t;
          
          var w = handle.getObjectById(k);
          
          if (w.jObject().code === 101 ) {
            handleCode = enums.CODE.NOMATCH;
          }
          else if (!w.isOk() ) {
            handleError = w.browser().status();
            handleCode = enums.CODE.HTTP;
          }
          else {
            return w.jObject();
          }
        });
      }
      catch(err) {
        handleError = err;
        handleCode =  enums.CODE.DRIVER;
      }
      return self.splitKeys(parentHandler.makeResults (handleCode,handleError,result));
    });
  };
  
  
  return self;
  
}


