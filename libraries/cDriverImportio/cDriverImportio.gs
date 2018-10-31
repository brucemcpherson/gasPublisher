/** wrapper
 */
function createDriver (handler,siloId,driverSpecific,driverOb, accessToken) {
    return new DriverImportio(handler,siloId,driverSpecific,driverOb, accessToken);
}
function getLibraryInfo () {
  return {
    info: {
      name:'cDriverImportio',
      version:'2.0.0',
      key:'MJWmIWvhOOsv401piLKzeNai_d-phDA33',
    },
    dependencies:[
      { info: {name:'importio', version:'foreign library', key:'unknown'}}
    ]
  }; 
}
/**
 * DriverImportio
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} tableName this is filename
 * @param {string} id some id you create for identifying this collection - normally the folder path
 * @param {object} DriveOb a DriveOb ob if required 
 * @return {DriverImportio} self
 */

// this can be used for small datasets in place of a database
// a JSON object is stored as a Drive file and can be manipulated to provide database like characterisitcs
// data is stored as [ {key:someuniquekey, data:{},...]
 
var DriverImportio = function (handler,tableName,id,importioOb) {
  var siloId = tableName;
  var dbId = id;
  var self = this;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var keyOb = importioOb;
  var handle, handleError, handleCode , handleIds, handleKey; 

  self.getType = function () {
    return enums.DB.IMPORTIO;
  };
  
  
  handle = tableName;
  
  /** return folder for the file
   * @return {string} the table name 
   */
  self.getDriveHandle =  function () {
    return tableName;
  };

  self.getDbId = function () {
    return id;
  };
  
 /** create the driver version
  * @return {string} the driver version
  */ 
  self.getVersion = function () {
    return 'DriverImportio-v0.0';
  };
  
  /**
   * DriverImportio.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };
  

   /**
   * DriverImportio.query()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */


  self.query = function (queryOb,queryParams) {
    var result =null,driverIds=[],handleKeys=[];
    handleCode = enums.CODE.OK, handleError='';
    
    try {
      var queryResult = importio.query(siloId, queryOb , keyOb.userId, keyOb.restAPIKey, false);
      result = parentHandler.cleanPropertyNames(queryResult.results.map(function(d) {
        return d;
      }));  
      
      // apply anyfilters
      if (handleCode===enums.CODE.OK) {    
        var pr = parentHandler.processFilters (queryOb, result); 
        handleCode =pr.handleCode;
        handleError = pr.handleError;
        if (handleCode === enums.CODE.OK) {
          result = pr.data;
        }
      }
      // LIMIT & SORT & skip

      if (handleCode===enums.CODE.OK) {
        var pr = parentHandler.processParams( queryParams,result);
        handleCode =pr.handleCode;
        handleError = pr.handleError;
        result = pr.data;
      }
      
    }

    catch(err) {
      handleError = err;
      handleCode = enums.CODE.DRIVER;
    }
      

    return parentHandler.makeResults (handleCode,handleError,result);
  };
  self.save = function () {
    return parentHandler.makeResults (enums.CODE.OPERATION_UNSUPPORTED,'save');
  };
  self.remove = function () {
    return parentHandler.makeResults (enums.CODE.OPERATION_UNSUPPORTED,'remove');
  };
  self.get = function () {
    return parentHandler.makeResults (enums.CODE.OPERATION_UNSUPPORTED,'get');
  };
  self.count = function () {
    return parentHandler.makeResults (enums.CODE.OPERATION_UNSUPPORTED,'count');
  };
  self.update = function () {
    return parentHandler.makeResults (enums.CODE.OPERATION_UNSUPPORTED,'update');
  };
 
  return self;
  
}

