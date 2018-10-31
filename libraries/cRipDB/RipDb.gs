"use strict";
/**
 * @param {DbAbstraction} handler a dbabstraction handler for some back end
 * @return {RipDB} self
 */
function RipDB (handler) {
  
  cUseful.validateArgs ( 
    Array.prototype.slice.call(arguments),
    [ "DbAbstraction" ] 
  );
  var self = this;
  var handler_ = handler;
  var enums = handler_.getEnums();
  
 // deprecated enums from scriptDB
  self.ASCENDING = 1;	
  self.DESCENDING = 2;
  self.LEXICAL = 3;
  self.NUMERIC = 4; 
  
 /**
  * returns the db abstraction handler associated with this object
  * @return {DbAbstraction} the handler
  */
  self.getHandler = function () {
    return handler_;
  };
  
  /**
   * save as item
   * @param {object} ob the object to be saved
   * @return {RipDBMap} a dbmap of the results
   */
  self.save = function (ob) {
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "object" ] 
    );
    var r;
    
    
    
    if (isUpdate_(ob)) {
      var keys = [ob.getId()];
      r = handler_.update (keys,ob);
      r.keys = keys;
    }
    else {
      r = matchOrThrow(handler_.save (ob));
    }
    return  new RipDBMap ( r) ;
  };

  function isUpdate_ (ob) {
    // test if an object is an update or a new save
    // scriptDB would do this by checking to see if the object being saved was a RipDbMap
    
    return cUseful.isObject(ob) && ob.constructor && ob.constructor.name === "RipDBMap";
  }
  /**
   * save a batch of items
   * @param {Array.object} obs the objects to be saved
   * @return {Array.RipDBMap} the batch of saves 
   */
  self.saveBatch = function (obs) {
    
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "Array.object" ] 
    );
    
    var r;
    if(obs.length && isUpdate_(obs[0])) {
      var keys = obs.map (function (d) { return d.getId(); });
      r = handler_.update (keys,obs);
      r.handleKeys = keys;
    }
    else {
      var r = matchOrThrow(handler_.save (obs));
    }
    return getMutationResults( r.data.map(function(d) { return new RipDBMap (d); }), r);
  };
  
  self.removeBatch = function (ripDbMaps) {
  
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "Array.RipDBMap" ] 
    );
    
    var result = handler_.removeByIds( ripDbMaps.map(function(d) { 
      return d.getId ?  d.getId() : d; 
    }));
    return getMutationResults ( ripDbMaps , result);
  };
  
  function matchOrThrow (result) {

    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "object" ] 
    );
    
    if (result.handleCode < 0) { 
      throw JSON.stringify(result);
    }
    if (result.handleKeys.length !== result.data.length) {
      throw 'number of keys doesnt match number of data items';
    }
    return result;
  }
  /**
   * query
   * @param {object} queryOb the query
   * @return {RipDBResult} the object
   */
  self.query = function (queryOb) {
    return new RipDBResult (self).setQob(queryOb).setCount(false);
  };
  /**
   * count
   * @param {object} queryOb the query
   * @return {RipDBResult} the object
   */
  self.count = function (queryOb) {
    return new RipDBResult (self).setQob(queryOb).setCount(true).getSize().count;
  };
  /**
   * removeById
   * @param {string} key key to remove
   * @return {RipDBMutationResult} the result
   */
  self.removeById = function (key) {
    
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "string" ] 
    );
    return self.removeByIds([key])[0];
  };
  
  /**
   * removeByIds
   * @param {Array.string} keys keys to remove
   * @return {RipDBMutationResult} the result
   */
  self.removeByIdBatch = function (keys) {
    
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "Array.string" ] 
    );
    
    return self.removeBatch(keys); 
  };
  
  /**
   * remove
   * @param {RipDBMap} ripDbMaps an array of id
   * @return {RipDBMap} the object
   */
  self.remove = function (ripDbMap) {
    
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "RipDBMap" ] 
    );
    
    return self.removeBatch([ripDbMap])[0];
  };
  
  /**
   * remove by ID
   * @param {string} key the id to remove
   * @return {RipDBMap} the object
   */
  self.removeById = function (key) {
    
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "string" ] 
    );
    
    return self.removeByIdBatch([key])[0];
  };
  
  
  /**
   * removeBatch
   * @param {Array.RipDBMap||Array.string} ripDbMaps an array of id or id strings
   * @return {Array.RipDBMutationResults} the results
   */
  self.removeBatch = function (ripDbMaps) {
  
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "Array" ] 
    );
    
    var result = handler_.removeByIds( ripDbMaps.map(function(d) { 
      return d.getId ?  d.getId() : d; 
    }));
   
    return getMutationResults ( ripDbMaps , result);
  };
  
  /**
   * load
   * @param {Array.string} keys an array of id
   * @return {RipDBMap} the object
   */
  self.load = function (keys) {
    
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "Array.string" ] 
    );
    
    var getKeys = Array.isArray(keys) ? keys : [keys];
    // the dbab .get function takes an object
    var result = handler_.get (getKeys.map(function(k) {
      return {key:k};
    }),undefined, true);
   
    // the dbmap stores the id
    if(result.handleCode >=0) {
      var m = result.data.map (function (d,i) {
        return new RipDBMap (handler_.makeResults (result.handleCode, result.handleError , [d] ,[result.handleKeys[i]] ,[result.handleKeys[i]] ));
      });
    }
    else {
      return new RipDBMap (result);
    }
    return Array.isArray(keys) ? m : m[0];
  };
  
  /**
   * anyof constraint
   * @param {Array.*} list of allowable values
   * @return {Array.object} an equivalent constraint object 
   */
  self.anyOf = function (list) {
    return handler_.constraints([[enums.CONSTRAINTS.IN,list]]);
  };
  
  /**
   * anyvalue constraint
   * @return {Array.object} an equivalent constraint object 
   */
  self.anyValue = function (list) {
    return handler_.constraints([[enums.CONSTRAINTS.NE,null],[enums.CONSTRAINTS.NE,''],[enums.CONSTRAINTS.NE,undefined]]);
  };
  
  /**
   * between constraint
   * @param {*} lo lower inclusive value
   * @param {*} hi higher inclusinve value
   * @return {Array.object} an equivalent constraint object 
   */
  self.between = function (lo,hi) {
    return handler_.constraints([[enums.CONSTRAINTS.GTE,lo],[enums.CONSTRAINTS.LTE,hi]]);
  };
  
  /**
   * greaterThan constraint
   * @param {*} lo lower exclusive value
   * @return {Array.object} an equivalent constraint object 
   */
  self.greaterThan = function (lo) {
    return handler_.constraints([[enums.CONSTRAINTS.GT,lo]]);
  };

  /**
   * greaterThanOrEqualTo constraint
   * @param {*} lo lower inclusive value
   * @return {Array.object} an equivalent constraint object 
   */
  self.greaterThanOrEqualTo = function (lo) {
    return handler_.constraints([[enums.CONSTRAINTS.GTE,lo]]);
  };
  
  /**
   * lessThanOrEqualTo constraint
   * @param {*} hi higher inclusive value
   * @return {Array.object} an equivalent constraint object 
   */
  self.lessThanOrEqualTo = function (hi) {
    return handler_.constraints([[enums.CONSTRAINTS.LTE,hi]]);
  };
  
  /**
   * lessThan constraint
   * @param {*} hi higher exclusive value
   * @return {Array.object} an equivalent constraint object 
   */
  self.lessThan = function (hi) {
    return handler_.constraints([[enums.CONSTRAINTS.LT,hi]]);
  };
  
  /**
   * not constraint
   * @param {*} value exclusive value
   * @return {Array.object} an equivalent constraint object 
   */
  self.not = function (value) {
    return handler_.constraints([[enums.CONSTRAINTS.NE,value]]);
  };
  /**
   * check a batch of items worked ok
   * @param {Array.RipDBMutationResults} mutationResults the batch of saves 
   * @return {boolean} whether ok 
   */
  self.allOk = function (mutationResults) {
  
    cUseful.validateArgs ( 
      Array.prototype.slice.call(arguments),
      [ "Array.RipDBMutationResult" ] 
    );
    
    return mutationResults.length > 0 ? mutationResults.every(function(d) { 
      return d.successful();
    }): true;
  }
  return self;

}

