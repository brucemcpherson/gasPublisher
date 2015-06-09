"use strict";
/**
 * ScriptDbResult
 * @param {RipDB} parent the handler
 * @return {RipDBMap} self
 */ 
function RipDBResult (parent) {

  cUseful.validateArgs ( 
    Array.prototype.slice.call(arguments),
    [ "RipDB" ] 
  );
  
  // actually this is doesnt execute any actual queries until a hasNext() is called
  var self = this;
  var pointer_ = 0;
  var result_;
  var parent_ = parent;
  var handler_ = parent_.getHandler();

  // these can come in bits
  var params_ = {} , qob_ = {} , count_ = false;
  
  self.paginate = function (pageNumber, pageSize) {
    params_.skip = pageNumber*pageSize;
    params_.limit = pageSize;
    return self;
  };
  
  self.limit = function (limit) {
    params_.limit = limit;
    return self;
  };
  
  self.startAt = function (startAt) {
    params_.skip = startAt;
    return self;
  };
  
  //TODO - lexical sorting only implemented
  self.sortBy = function (fieldPath,direction,strategy) {

    direction = direction || parent_.ASCENDING;
    strategy =  strategy || parent_.NUMERIC;
    
    var dir = (direction == parent_.DESCENDING || strategy == parent_.DESCENDING) ? -1 : 1;
    var lex = (direction == parent_.LEXICAL || strategy == parent_.LEXICAL);
    
    params_.sort = (dir < 0 ? "-" : "") + fieldPath;
    
    return self;
  };
  
  self.setQob = function(q) {
    qob_ = q;
    return self;
  };
  
  self.setCount = function(q) {
    count_ = q;
    return self;
  };
  
  self.initiateQuery = function () {
    if (!result_) {
      result_ = handler_[count_ ? "count" : "query"] (qob_ , params_,undefined, true);
      if (!self.isGood()) throw JSON.stringify(result_);
    }
    return self;
  };
  
  self.getSize = function () {
    self.initiateQuery();
    return self.getData()[count_ ? [0] : "length"];
  };

  self.getData = function () {
    return result_.data;
  }
  
  self.isGood = function () {
    return !result_ || (result_ && result_.handleCode >= 0 );
  };
  
  self.hasNext = function () {
    self.initiateQuery();
    return self.getData().length > pointer_;
  };
  
  self.next = function () {
    self.initiateQuery();

    var r = new RipDBMap( 
      handler_.makeResults(
        result_.handleCode, 
        result_.handleError,
        [self.getData()[pointer_]],
        [result_.driverIds[pointer_]],
        [result_.handleKeys[pointer_]] )
    );
    pointer_++;
    return r;
  };
  
  self.getResult = function () {
    return result_;
  };
  
  return self;
}
