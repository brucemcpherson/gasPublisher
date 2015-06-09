"use strict";

function createDriver (handler,siloId,driverSpecific,driverOb, accessToken,options) {
    return new DriverScratch(handler,siloId,driverSpecific,driverOb, accessToken,options);
}
function getLibraryInfo () {
  return {
    info: {
      name:'cDriverScratch',
      version:'0.0.2',
      key:'MTnrkatWa6Lrta8eAg6_H0qi_d-phDA33',
      share:"https://script.google.com/d/1ka9ODRxrUKUOTnuv4CkL9QnBTjkrXQhP0yJF-R2wjVz-qVdEK9G2S9sH/edit?usp=sharing",
      description:"scratch driver for dbabstraction"
    },
    dependencies:[
      cDriverMemory.getLibraryInfo(),
      cDelegateMemory.getLibraryInfo(),
      cCacheHandler.getLibraryInfo()
    ]
  }; 
}
/**
 * DriverScratch
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} keyName this is the siloid - combined with dbid to create a unique key
 * @param {string} id some id you create for identifying this collection 
 * @param {string} optDriverOb somw driver options
 * @param {object] options that were passed to dbabstraction
 * @return {DriverScratch} self
 */
 
 /* options are
 * @param {Cache} [specificcache] a cache object to use, otherwise a public/private one belonging to cacheservice will be used
 * @param {string} [cachecommunity] a cache community id to restrict cache to particular groups
 * @param {boolean} [private=true] whether to use a private cache (not relevant if specificcache is passed)
 * @param {number} [scratchexpiry] in seconds - default time for db to live for 
 */

var DriverScratch = function (handler,keyName,id,optDriverOb,accessToken, options) {
  var siloId = keyName;
  var dbId = id;
  var self = this;
  var driverOb = options || {};
  var cacheSilo = 'd' + dbId + 's' + siloId;
  
  var DATAEXPIRY = 60 * 60 * 6; // data will always live max time
  var READEXTENSION = 60 * 5; // a read will only cause an extension if there hasnt been one for a while
  
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var handle, handleError, handleCode , handleIds, handleKey; 
  var transactionBox_ = null;
  var scratch_;

  // this is the scratch data store
  var cacheData = new cCacheHandler.CacheHandler(DATAEXPIRY,cacheSilo,driverOb.private,false,driverOb.specificcache,driverOb.cachecommunity);
  
  // this is the scratch key store
  var cacheScratch = new cCacheHandler.CacheHandler(DATAEXPIRY,'s' + cacheSilo,driverOb.private,false,driverOb.specificcache,driverOb.cachecommunity);
  
  // im able to do transactions
  self.transactionCapable = true;
  
  // i definitely need transaction locking
  self.lockingBypass = false;
  
  // i am aware of transactions and know about the locking i should do
  self.transactionAware = true;
  
 /**
  * checks that the transaction matches the one stored
  * @param {string} id transaction id
  * @return {boolean} whether id matches
  */ 
  self.isTransaction = function (id) {
    return transactionBox_ && transactionBox_.id === id ;
  };
  
 /**
  * begins transaction and store current content
  * @param {string} id transaction id
  */ 
  self.beginTransaction = function (id) {
    transactionBox_ = delegate.beginTransaction (id);
  };
  
  self.transactionData = function (){
    return delegate.transactionData();
  };
  
  /**
  * commits transaction
  * @param {string} id transaction id
  * @return {object} a normal result package
  */ 
  self.commitTransaction = function (id) {
    return delegate.commitTransaction(id);
  };
  
  self.clearTransactionBox = function () {
    transactionBox_ = null;
  };
  
 /**
  * roll back transaction - resets memory to beginnging of transaction
  * @param {string} id transaction id
  * @return {object} a normal result package
  */ 
  self.rollbackTransaction = function (id) {
    return delegate.rollbackTransaction(id);
  };
  
  
  self.getTransactionBox = function () {
    return transactionBox_;
  };
  
  self.getSiloId = function () {
    return siloId;
  };
  
  self.getParentHandler = function () {
    return parentHandler;
  };
  
  self.getType = function () {
    return enums.DB.SCRATCH;
  };
  
  /** each saved records gets a unique key
   * @return {string} a unique key
   */
  self.generateKey = function () {
    return parentHandler.generateUniqueString();
  };
  
  self.getDbId = function () {
    return dbId;
  };
  
  handle = cacheScratch;
  
  var delegate = new cDelegateMemory.DelegateMemory(self);
  
  /** 
   * @return {DriverScratch} the folder for the file
   */
  self.getDriveHandle =  function () {
    return handle;
  };


 self.isExpired = function(entry) {
   var expired = !entry || entry.lastUpdated + entry.scratchExpiry * 1000 < new Date().getTime(); 
   
   // clean up any detected expired data
   if (expired && entry) { 
     cacheData.removeCache (entry.data);
     cacheScratch.removeCache();
   }
   
   return expired;
 };
 
 self.getScratch =function() {
   var entry = cacheScratch.getCache();
   return self.isExpired(entry) ? null : entry;
 };
 
 self.getData = function (entry) {
   return entry ? cacheData.getCache (entry.data) : null;
 }
 
 self.putScratch = function (entry, data) {
   var now = new Date().getTime();
   entry = entry || {};
   entry.lastUpdated = now;
   entry.dataUpdated = now;
   entry.scratchExpiry =   driverOb.scratchexpiry || entry.scratchExpiry || 60 * 60; // the key will by default live an hour
   entry.data = entry.data || self.generateKey();
   cacheData.putCache (data , entry.data);
   cacheScratch.putCache (entry);
   return entry;
 }

 self.resetExpiry= function (entry) {
   // we'll reset the expiry time on a read, but not too often
   if (entry) {
     var now = new Date().getTime();
     if (entry.lastUpdated + READEXTENSION*1000 < now) {
       parentHandler.writeGuts ('reset expiry' , 
         function (bypass) {
           // time for a complete refresh if the data is nearing expiration
           if ( entry.dataUpdated + DATAEXPIRY * 1000  <= now + entry.scratchExpiry * 1000) {
             Logger.log('doing a full reset of expiry');
             self.putScratch (entry , self.getData(entry)) ; 
           }
           else {
           // no need to write the data, just the key
           Logger.log('doing a key reset of expiry');
             entry.lastUpdated = now;
             cacheScratch.putCache (entry);
           }
         },
         function(bypass) {
           // do nothing if in a transaction
         });
     }
   }
 }
  
 /** set the contents to the property, creating it if necessary
  * @param {string} json content
  * @return {File} the existing or created entry
  */
  self.writeContent = function (content) {
    return self.putScratch (scratch_ , content) ;
  };
  
 /** get the contents of the property
  * @return {object} the parsed content of the file
  */
  self.getContent= function () {
    scratch_ = self.getScratch();
    return scratch_ ? delegate.getContentSimpleKeys( self.getData(scratch_) ) : null;
  };

  /**
   * get the memory - if its a transaction we already have it, if not read the sheet and make one
   * @return {DriverMemory} the men object
   */
  self.getMem = function () {
       
    return parentHandler.inTransaction() ? 
      transactionBox_.content :
      self.take(new cDriverMemory.DriverMemory(parentHandler, siloId)) ;
  
  };
  
    
  /**
   * --------------------------------
   * DriverSheet.replace ()
   * replaces current sheet with whats in memory
   * @param {DriverMemory} mem to be saved
   * @return {Object} headingOb with indexes
   */
  self.replaceWithMemory = function (mem) {
    return self.putBack(mem);
  };
  
  self.putBack = function (mem) {
    return delegate.putBackSimpleKeys(mem);
  };
  
  self.take = function (mem) {
    return mem.makeContent ( 
      parentHandler.rateLimitExpBackoff ( function () { 
        return (self.getContent() || []);
      }));
  }; 
  
 /** create the driver version
  * @return {string} the driver version
  */ 
  self.getVersion = function () {
    var v = getLibraryInfo().info;
    return v.name + ':' + v.version;
  };
  
  /**
   * DriverScratch.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };
  

  self.query = function (queryOb,queryParams,keepIds) {
    var result = delegate.query(queryOb,queryParams,keepIds);
    self.resetExpiry(scratch_);
    return result;
  };

  /**
   * DriverScratch.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.remove = function (queryOb,queryParams) {
    return delegate.remove(queryOb,queryParams);
  };
  
  /**
   * DriverMemory.removeById()
   * @param {string} keys key to remove
   * @return {object} results from selected handler
   */ 
  self.removeByIds = function (keys) {
    return delegate.removeByIds (keys,'key');
  };
  
  /**
   * DriverScratch.save()
   * @param {Array.object} obs array of objects to write
   * @return {object} results from selected handler
   */
  self.save = function (obs) {
    return delegate.save(obs, self.getMem());
  };
  
  /**
   * DriverScratch.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.count = function (queryOb,queryParams) {
     return delegate.count(queryOb,queryParams);
  };
  
    
  /**
   * DriverScratch.get()
   * @param {string} keys the unique return in handleKeys for this object
   * @return {object} results from selected handler
   */
  self.get = function (keys) {
   return delegate.get (keys);
  };
  
  self.getGuts = function (keys) {
    return self.getMem().get ( keys,true,'key');
  };

   /**
   * DriverScratch.update()
   * @param {string} keys the unique return in handleKeys for this object
   * @param {object} obs what to update it to
   * @return {object} results from selected handler
   */
  self.update = function (keys,obs) {   
    return delegate.update(keys,obs);
  };
  
  self.updateGuts = function (keys,obs) {
    var memory = self.getMem();
    var r = memory.update (keys,obs,'key');
    return r.handleCode < 0 ? r : self.putBack (memory);
  }
  
  return self;
  
}
