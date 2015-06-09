function createDriver (handler,siloId,driverSpecific,driverOb, accessToken) {
    return new DriverProperties(handler,siloId,driverSpecific,driverOb, accessToken);
}
function getLibraryInfo () {
  return {
    info: {
      name:'cDriverProperties',
      version:'2.0.2',
      key:'MrpyO-B3fO-b1NG3LZ4UzaKi_d-phDA33',
      share:"https://script.google.com/d/17Nh1LJKElibaoj9EvpX9s1m_vMvOG2qJN24Le-W01wtRCqc1wdHWVonC/edit?usp=sharing",
      description:"properties driver for dbabstraction"
    },
    dependencies:[
      cDriverMemory.getLibraryInfo(),
      cDelegateMemory.getLibraryInfo()
    ]
  }; 
}
/**
 * DriverProperties
 * @param {cDataHandler} handler the datahandler thats calling me
 * @param {string} keyName this is keyname in the properties ob
 * @param {string} id some id you create for identifying this collection - normally the folder path
 * @param {object} PropertiesOb the properties ob to use
 * @return {DriverProperties} self
 */

// this can be used for small datasets in place of a database
// a JSON object is stored as a Drive file and can be manipulated to provide database like characterisitcs
// data is stored as [ {key:someuniquekey, data:{},...]
 
var DriverProperties = function (handler,keyName,id,PropertiesOb) {
  var siloId = keyName;
  var dbId = id;
  var self = this;
  var parentHandler = handler;
  var enums = parentHandler.getEnums();  
  var keyOb = PropertiesOb;
  var handle, handleError, handleCode , handleIds, handleKey; 
  var transactionBox_ = null;
  
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
    return enums.DB.PROPERTIES;
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
  handle = keyOb;
  
  var delegate = new cDelegateMemory.DelegateMemory(self);
  
  /** 
   * @return {DriverProperties} the folder for the file
   */
  self.getDriveHandle =  function () {
    return handle;
  };

  
 /** set the contents to the property, creating it if necessary
  * @param {string} json content
  * @return {File} the existing or created property
  */
  self.writeContent = function (content) {
    handle.setProperty(siloId, JSON.stringify(content)) ;
    return parentHandler.makeResults(enums.CODE.OK);
  };
  
 /** get the contents of the property
  * @return {object} the parsed content of the file
  */
  self.getContent= function () {
    var file = handle.getProperty(siloId);
    return file ? delegate.getContentSimpleKeys( JSON.parse(file) ) : null;

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
   * DriverProperties.getTableName()
   * @return {string} table name or silo
   */
  self.getTableName = function () {
    return siloId;
  };
  

  self.query = function (queryOb,queryParams,keepIds) {
    return delegate.query(queryOb,queryParams,keepIds);
  };


  /**
   * DriverProperties.remove()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.remove = function (queryOb,queryParams) {
    return delegate.remove(queryOb,queryParams);
  };
     
  /**
   * DriverProperties.save()
   * @param {Array.object} obs array of objects to write
   * @return {object} results from selected handler
   */
  self.save = function (obs) {
    return delegate.save(obs, self.getMem());
  };
  
  /**
   * DriverProperties.count()
   * @param {object} queryOb some query object 
   * @param {object} queryParams additional query parameters (if available)
   * @return {object} results from selected handler
   */
  self.count = function (queryOb,queryParams) {
     return delegate.count(queryOb,queryParams);
  };
  
    
  /**
   * DriverProperties.get()
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
   * DriverMemory.removeById()
   * @param {string} keys key to remove
   * @return {object} results from selected handler
   */ 
  self.removeByIds = function (keys) {
    return delegate.removeByIds (keys,'key');
  };
  
   /**
   * DriverProperties.update()
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
