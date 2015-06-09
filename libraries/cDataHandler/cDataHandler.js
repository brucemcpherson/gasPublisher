/**
 * @fileOverview This is the dbabstraction data handler as described in http://ramblings.mcpher.com/Home/excelquirks/dbabstraction
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a>
 */
function getLibraryInfo () {
  return {
    info: {
      name:'cDataHandler',
      version:'2.2.0',
      key:'Mj61W-201_t_zC9fJg1IzYiz3TLx7pV4j',
    },
    dependencies:[
      cDbAbstraction.getLibraryInfo(),
      cDriverOrchestrate.getLibraryInfo(),
      cDriverParse.getLibraryInfo(),
      cDriverFusion.getLibraryInfo(),
      cDriverDrive.getLibraryInfo(),
      cDriverImportio.getLibraryInfo(),
      cDriverDataStore.getLibraryInfo(),
      cDriverSheet.getLibraryInfo(),
      cDriverScriptDB.getLibraryInfo(),
      cDriverMemory.getLibraryInfo(),
      cDriverProperties.getLibraryInfo(),
      cDriverMongoLab.getLibraryInfo(),
      cParseCom.getLibraryInfo(),
      cFlatten.getLibraryInfo(),
      cUAMeasure.getLibraryInfo(),
      cNamedLock.getLibraryInfo(),
      cCacheHandler.getLibraryInfo(),
      cDriverScratch.getLibraryInfo()
    ]
  }; 
}
/**
 * DataHandler
 * this has largely been replaced by dbAbstraction class - this is now just a pass thru
 * @class DataHandler
 * @classDesc This is the dbabstraction data handler class - the interface to all drivers
 * @this DataHandler
 * @name DataHandler
 * @param {string}  tablename or silo
 * @param {dhConstants.DB} typeOfDb type of database to handle
 * @param {number} [optExpiry] cache expiry time in seconds
 * @param {string} [optDriverSpecific] any additional driver specific item to identify it
 * @param {object} [optDriverOb] any additional driver specific object
 * @param {boolean} [optRandomSilo=false] generate a randome silo id
 * @param {boolean} [optOptOut=false] opt out of analytics
 * @param {string} [optPeanut] some unique user id for analaytics
 * @param {string} [optAccessToken] an oauth2 access token
 * @param {string} [optDisableCache=false] don't use cache at all with this one.
 */

"use strict";

var DataHandler = function (
      tableName,
      typeOfDb,
      optExpiry,
      optDriverSpecific,
      optDriverOb,
      optRandomSilo,
      optOptOut,
      optPeanut,
      optAccessToken,
      optDisableCache) {

  var self = this;
  var type = typeOfDb;
  /** 
   * give access to constants
   * @memberof DataHandler
   * @return {object} constant enums
   */
  self.getEnums = function (){
    return dhConstants;
  };
  
  var enums = self.getEnums();

  /** 
   * return version number
   * @memberof DataHandler
   * @return {string} the version number
   */
  self.getVersion = function () {
    return driver.getVersion();
  };

  
  /** 
   * select and open handler for the backend driver
   * @memberof DataHandler
   * @return {cDbAbstraction.DbAbstraction||DataHandler} driver for the database - normally used only inside this class
   */
   
  self.setDriver = function () {
  
  // this is the migration to the new abstraction handler.
      var t = [
          {type:enums.DB.SCRIPTDB , lib:cDriverScriptDB},
          {type:enums.DB.PARSE , lib:cDriverParse},
          {type:enums.DB.SHEET , lib:cDriverSheet},
          {type:enums.DB.FUSION , lib:cDriverFusion},
          {type:enums.DB.ORCHESTRATE , lib:cDriverOrchestrate},
          {type:enums.DB.DRIVE , lib:cDriverDrive},
          {type:enums.DB.MEMORY , lib:cDriverMemory},
          {type:enums.DB.MONGOLAB , lib:cDriverMongoLab},
          {type:enums.DB.IMPORTIO , lib:cDriverImportio},
          {type:enums.DB.PROPERTIES , lib:cDriverProperties},
          {type:enums.DB.DATASTORE , lib:cDriverDataStore},
      ].filter (function(d) { 
        return d.lib && d.type === type ;
      });
      
      if (t.length) {

        return new cDbAbstraction.DbAbstraction ( t[0].lib, {
            siloid: tableName,
            expiry:optExpiry,
            dbid:optDriverSpecific,           
            driverob:optDriverOb,
            disablecache:optDisableCache,
            optout:optOptOut,
            accesstoken:optAccessToken,
            peanut:optPeanut,
            randomsilo:optRandomSilo
          });   
      }
      else {
        throw type + ' is an unknown database type';
      }
      
  };
  
  var driver = self.setDriver();
  
  /** 
   * return the back end handler
   * @memberof DataHandler
   * @return {object} driver for the database 
   */
   
  self.getDriver = function () {
    return driver.getDriver();
  };
  
  /** 
   * DataHandler.getTableName()
   * @memberof DataHandler
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return driver.getTableName();
  };
  
  
  self.getDBName = function () {
    return driver.getDBName();
  };
 
 /**
   * DataHandler.remove()
   * @memberof DataHandler
   * @param {object} [queryOb] some query object 
   * @param {object} [queryParams] additional query parameters (if available)
   * @param {boolean} [noCache=0] whether to suppress cache
   * @return {object} results from selected handler
   */
  
  self.remove = function (queryOb,queryParams) {

    return driver.remove(queryOb,queryParams);

  };
   /**
   * DataHandler.removeByIds()
   * @memberof DataHandler
   * @param {Array.string} ids list of handleKey ids to remove
   * @return {object} results from selected handler
   */
  
  self.removeByIds = function (ids) {
    return driver.removeByIds(ids);

  };
  /**
   * DataHandler.save()
   * @memberof DataHandler
   * @param {object[]} obs array of objects to write
   * @return {object} results from selected handler
   */
  
  self.save = function (obs) {
    
    return driver.save(obs);

  };
  

  /**
   * DataHandler.count()
   * @memberof DataHandler
   * @param {object} [queryOb] some query object 
   * @param {object} [queryParams] additional query parameters (if available)
   * @param {boolean} [noCache=0] whether to suppress cache
   * @return {object} results from selected handler
   */
  
  self.count = function (queryOb,queryParams,noCache) {
    
    return driver.count(queryOb,queryParams,noCache);
    
  };
 /**
   * DataHandler.query()
   * @memberof DataHandler
   * @param {object} [queryOb] some query object 
   * @param {object} [queryParams] additional query parameters (if available)
   * @param {boolean} [noCache=0] whether to suppress cache
   * @param {boolean} [optKeepIds=false] whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  
  self.query = function (queryOb,queryParams,noCache,optKeepIds) {
    
    return driver.query(queryOb,queryParams,noCache,optKeepIds);
    
  };
   /**
   * DataHandler.get()
   * @memberof DataHandler
   * @param {string} key some unqiue key as returned by handleKeys
   * @param {boolean} [noCache=0] whether to suppress cache
   * @param {boolean} [keepIds=false] whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  
  self.get = function (key,noCache,optKeepIds) {
  
    return driver.get(key,noCache,optKeepIds);

  };
 /**
   * DataHandler.update()
   * @memberof DataHandler
   * @param {string} key some unqiue key as returned by handleKeys
   * @param {object}  ob what to update it to
   * @return {object} results from selected handler
   */
  
  self.update = function (key,ob) {
  
    return driver.update(key,ob);

    
  };
  /**
   * DataHandler.getDriveHandle()
   * @memberof DataHandler
   * @return {object} the driver handle
   */
  self.getDriveHandle = function () {
    return  driver.getDriveHandle() ;
  };
  
   /**
   * DataHandler.isHappy()
   * @memberof DataHandler
   * @return {boolean} whether the driver is ready to use
   */
  self.isHappy = function () {
    return driver.isHappy();
  };
  
  /** 
   * organize given constraints
   * @memberof DbAbstraction
   * @param {object|object[]} constraints constratints to be organized
   * @return {object} an object containing all the constraints
   */

  self.constraints = function (constraints) {
    return driver.constraints(constraints);
  };
  return self;
  
};
