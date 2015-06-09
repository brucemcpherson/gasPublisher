/** services requests for scriptDb from the cDataHandler
 * build this up as needed
 */

/**
 * DriverScriptDb
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} tableName table name or silo
 * @param {string} id some id to uniquely identify this scriptdb
 * @param {ScriptDbInstance} scriptDbOb a scriptDb to use
 * @return {DriverScriptDb} self
 */
function getLibraryInfo () {
  return {
    info: {
      name:'cDriverScriptDb',
      version:'2.00',
      key:'MQS7yEChG0mh1Ucf_UhV-vKi_d-phDA33',
    },
    dependencies:[
      cFlatten.getLibraryInfo()
    ]
  }; 
}
var DriverScriptDb = function (handler,tableName,id,scriptDbOb) {
  var siloId = tableName;
  var self = this;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var handle = scriptDbOb;
  var handleError, handleCode;
  var SAVECHUNK = 250;
    
  self.getDriveHandle =  function () {
    return handle;
  };
  
  self.getVersion = function () {
    return 'DriverScriptDb-v1.0';
  };
  /**
   * DriverScriptDb.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };
  
  self.getDbId = function () {
    return id;
  };

  self.unFlatten = function(ob) {
    return new cFlatten.Flattener().unFlatten(ob);
  }
  /**
   * DriverScriptDb.removeByIds()
   * @memberof DataHandler
   * @param {Array.string} ids list of handleKey ids to remove
   * @return {object} results from selected handler
   */
  self.removeByIds = function (ids) {
    handleError='', handleCode=enums.CODE.OK;
    
    var qr = handle.removeByIdBatch(ids, false);
    if (!handle.allOk(qr)) {
      handleCode = enums.CODE.ASSERT;
      handleError = 'not all items got removed';
    }  
    return parentHandler.makeResults(handleCode,handleError);
  };
  
   /**
   * DriverScriptDb.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */ 
  self.remove = function (queryOb,queryParams) {
    handleError='', handleCode=enums.CODE.OK;
    
    try {
      // do the query
      var queryResult = self.query (queryOb,queryParams,true);

      if (handleCode === enums.CODE.OK) {
        // store all the results
        if (queryResult.handleKeys.length) {
          var qr = handle.removeByIdBatch(queryResult.handleKeys, false);
          if (!handle.allOk(qr)) {
            handleCode = enums.CODE.ASSERT;
            handleError = 'not all items got removed';
          }
        }
        else {
          handleCode =  enums.CODE.NOMATCH;
        }

      }
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }

    return parentHandler.makeResults (handleCode,handleError);
  };
  
  /**
   * DriverScriptDb.save()
   * @param {Array.object} obs array of objects to write
   * @return {object} results from selected handler
   */
  self.save = function (obs) {
    var result =null,  done=0;
    handleError='', handleCode=enums.CODE.OK;
    try {
      while (handleCode === enums.CODE.OK && done < obs.length ) {
        var part = obs.slice(done, Math.min(obs.length, SAVECHUNK + done));
        
        var result = parentHandler.rateLimitExpBackoff ( function () {
          return handle.saveBatch(part.map( function (d) {
            return siloId === enums.SETTINGS.NOSILO ? d : {siloId:siloId, data:d} ;
          }),false);
        });
        
        done += part.length;
        if (!handle.allOk(result)) {
          handleCode = enums.CODE.ASSERT;
          handleError = 'not all items got saved';
        }
      }
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }
    return parentHandler.makeResults (handleCode,handleError,result);
  };
 
  self.treatParams =function (dbResult,queryParams) {
          
      // trivial implementation of queryParams
      // LIMIT & SORT
    handleError='', handleCode=enums.CODE.OK;
    
    var params = parentHandler.getQueryParams(queryParams);
    if (params.handleCode === enums.CODE.OK) {
      // we have an array of good query params (params get sorted in sensible order)
      params.data.forEach( function (e) {
        if(e.param === 'sort') {
          dbResult = dbResult.sortBy("data."+e.sortKey, e.sortDescending ? handle.DESCENDING : handle.ASCENDING);
        }
        else if (e.param === 'limit') {
          dbResult = dbResult.limit(e.limit);
        }
        else if (e.param === 'skip') {
          dbResult = dbResult.startAt(e.skip);
        }
        else {
          handleError = e.param;
          handleCode = enums.CODE.PARAMNOTIMPLEMENTED;
        }
      });
    }
    else {
      handleError = params.handleError;
      handleCode = params.handleCode;
    }
    return parentHandler.makeResults (handleCode,handleError,{dbResult:dbResult});
  }
 /**
   * DriverScriptDb.query()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  
  self.query = function (queryOb,queryParams,keepIds) {
    var result =null;
    handleError='', handleCode=enums.CODE.OK;
    var driverIds = [], handleKeys = [];
    try {
      //clone query

      var cloneQuery = queryOb ? {data:JSON.parse(JSON.stringify(self.unFlatten(queryOb)))} : {};

      // add siloid
      if (siloId !== enums.SETTINGS.NOSILO) { 
        cloneQuery.siloId = siloId;
      }
      else {
        cloneQuery = cloneQuery.data || cloneQuery;
      }

      var paramResult = self.treatParams (handle.query (cloneQuery),queryParams) ;
      handleError = paramResult.handleError;
      handleCode = paramResult.handleCode;
      result = [];
      
      // if all is still good after  that
      if (handleCode === enums.CODE.OK) {
        var r = paramResult.data.dbResult;
        while (r.hasNext()) {
          var rec = r.next();
          if (keepIds) {
            var id = rec.getId();
            driverIds.push({id:id});
            handleKeys.push(id);
          }
          result.push(rec.data ? rec.data : rec);
        }
      }
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }
    
    return parentHandler.makeResults (handleCode,handleError,result,keepIds ? driverIds :null,keepIds ? handleKeys:null);
  };
  
  /**
   * DriverScriptDb.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  
  self.count = function (queryOb,queryParams) {
    var result =null;
    handleError=null, handleCode=0;
    
    try {
      var data =[];
      //clone query
      var cloneQuery = queryOb ? {data:JSON.parse(JSON.stringify(self.unFlatten(queryOb)))} : {};

      // add siloid
      if (siloId !== enums.SETTINGS.NOSILO) { 
        cloneQuery.siloId = siloId;
      }
      else {
        cloneQuery = cloneQuery.data || cloneQuery;
      }
     
      result = [];
      result.push({count:handle.count (cloneQuery)});
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }
    
    return parentHandler.makeResults (handleCode,handleError,result);
  };
  
  
  /**
   * Driver.get()
   * @param {string} key the unique return in handleKeys for this object
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */

  self.get = function (key,keepIds) {
    var result =null;
    handleError='', handleCode=enums.CODE.OK
    var driverIds = [], handleKeys = [];
    
    try {
      var result = handle.load(key);
      if (result) {
        if (keepIds) {
          driverIds.push({id:key});
          handleKeys.push(key);
        }
      }
      else {
        handleCode = enums.CODE.NOMATCH;
      }
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }

    return parentHandler.makeResults (handleCode,handleError,result,keepIds ? driverIds :null,keepIds ? handleKeys:null);
  };
  
  /**
   * Driver.update()
   * @param {string} key the unique return in handleKeys for this object
   * @param {object} ob what to update it to
   * @return {object} results from selected handler
   */

  self.update = function (key,ob) {
    var result =null;
    handleError='', handleCode=enums.CODE.OK
    
    try {
      var result = handle.load(key);
      if (result) {
        // all this is because we can only save the same object we retrieved
        for (var k in result) {
          if (result.hasOwnProperty(k)) {
            delete result[k];
          }
        }
        for (var k in ob) {
          result[k] = ob[k];
        }
        handle.save(result);
      }
      else {
        handleCode = enums.CODE.NOMATCH;
      }
    }
    catch(err) {
      handleError = err;
      handleCode =  enums.CODE.DRIVER;
    }
    
    return parentHandler.makeResults (handleCode,handleError,result);
  };
  
  return self;
  
}
