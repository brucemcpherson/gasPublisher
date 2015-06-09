/** wrapper
 */
function createDriver (handler,siloId,driverSpecific,driverOb, accessToken) {
    return new DriverDrive(handler,siloId,driverSpecific,driverOb, accessToken);
}

/**
 * DriverDrive
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} tableName this is filename
 * @param {string} id some id you create for identifying this collection - normally the folder path
 * @param {object} DriveOb a DriveOb ob if required 
 * @return {DriverDrive} self
 */

function getLibraryInfo () {
  return {
    info: {
      name:'cDriverDrive',
      version:'2.2.0',
      key:'Ma__4vH--nQ_FPsuNF1BFuyz3TLx7pV4j',
      share:'https://script.google.com/d/1ss0gwqczeLddH0pqwzB-VntGbMZzEh3DgUMwCpMYAhTGqXJFkZzBihd4/edit?usp=sharing',
      description:'driver for DRIVE dbabstraction'
    },
    dependencies:[
      cDriverMemory.getLibraryInfo(),
      cDelegateMemory.getLibraryInfo()
    ]
  }; 
}

      

// this can be used for small datasets in place of a database
// a JSON object is stored as a Drive file and can be manipulated to provide database like characterisitcs
// data is stored as [ {key:someuniquekey, data:{},...]
 
var DriverDrive = function (handler,tableName,id,DriveOb) {
  var siloId = tableName;
  var dbId = id;
  var self = this;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var keyOb = DriveOb;
  var handle, handleError, handleCode , handleIds, handleKey; 
  var transactionBox_ = null;
  
    // im able to do transactions
  self.transactionCapable = true;
  
  // i definitely need transaction locking
  self.lockingBypass = false;
  
  // i am aware of transactions and know about the locking i should do
  self.transactionAware = true;
  
  self.getType = function () {
    return enums.DB.DRIVE;
  };
  
  self.getDbId = function () {
    return dbId;
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
  
  self.getDriveFolderFromPath = function (path)  {
    return (path || "/").split("/").reduce ( function(prev,current) {
        if (prev && current) {
          var fldrs = prev.getFoldersByName(current);
          return fldrs.hasNext() ? fldrs.next() : null;
        }
        else { 
          return current ? null : prev; 
        }
    },DriveApp.getRootFolder()); 
  };
  
  handle = self.getDriveFolderFromPath(dbId);
  var delegate = new cDelegateMemory.DelegateMemory(self);
  
  /** return folder for the file
   * @return {DriverDrive} the folder for the file
   */
  self.getDriveHandle =  function () {
    return handle;
  };

 /** get the current file if it exists
  * @return {File} the file
  *
  */
  self.getDriveFile = function () {
    var file = handle.getFilesByName(siloId);
    return file.hasNext() ? file.next() : null;
  };
  
 /** set the contents to the file, creating it if necessary
  * @param {string} json content
  * @return {File} the existing or created file
  */
  self.writeContent = function (content) {
    var file = self.getDriveFile();
    if (!file) {
      file = handle.createFile(siloId,content,MimeType.JSON);
    }
    file.setContent(JSON.stringify(content));
    return file;
  };
  
 /** get the contents of the file
  * @return {object} the parsed content of the file
  */
  self.getContent = function () {
    var file = self.getDriveFile();
    return file ? delegate.getContentSimpleKeys( JSON.parse(file.getBlob().getDataAsString()) ) : null;
  };

  
 /** create the driver version
  * @return {string} the driver version
  */ 
  self.getVersion = function () {
    var v = getLibraryInfo().info;
    return v.name + ':' + v.version;
  };
  

  /**
   * DriverDrive.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
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
   * DriverDrive.query()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @param {boolean} keepIds whether or not to keep driver specifc ids in the results
   * @return {object} results from selected handler
   */
  self.query = function (queryOb,queryParams,keepIds) {
    return delegate.query(queryOb,queryParams,keepIds);
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
   * DriverDrive.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.remove = function (queryOb,queryParams) {
    return delegate.remove(queryOb,queryParams);
  };

 /**
  * DriverDrive.save()
  * @param {Array.object} obs array of objects to write
  * @return {object} results from selected handler
  */ 
  self.save = function (obs) {
    return delegate.save(obs,self.getMem());
  };
  
  /**
   * DriverSheet.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.count = function (queryOb,queryParams) {
     return delegate.count(queryOb,queryParams);
  };
  
  /**
   * Driver.get()
   * @param {string} keys the unique return in handleKeys for this object
   * @return {object} results from selected handler
   */
  self.get = function (keys) {
    return delegate.get (keys);
  };
  
  self.getGuts = function (keys) {
    return self.getMem().get ( keys,true,'key')
  };
   /**
   * Driver.update()
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
