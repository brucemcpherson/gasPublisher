"use strict";
/**
 * @param {object} result overall dbabstraction result
 * @return {RipDBMap} self
 */ 
function RipDBMutationResult (result) {
  var self = this;
  var result_ = result;
  
  cUseful.validateArgs ( 
    Array.prototype.slice.call(arguments),
    [ "object" ] 
  );
  
  self.successful = function () {
    return result_ && result_.handleCode >=0;
  };
  
  return self;
  
}

/**
 * @param {array.object||string} obs the objects being written - bit of a hack .. all fails or all succeeds
 * @param {object} result overall result
 * @return {RipDBMap} self
 */ 
function getMutationResults(obs,result) {

  cUseful.validateArgs ( 
    Array.prototype.slice.call(arguments),
    [ "Array" , "object" ] 
  );
  
  return obs.map (function (d) {
    return new RipDBMutationResult (result);
  });
}
