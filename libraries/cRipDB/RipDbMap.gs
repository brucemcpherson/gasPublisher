"use strict";

function getLibraryInfo () {

  return { 
    info: {
      name:'cRipDB',
      version:'2.2.0',
      key:'MZUHVrKIC3rGLHAFDiLLGriz3TLx7pV4j',
      description:'scriptDB emulator',
      share:'https://script.google.com/d/1H6jyNqh7ZPO356OM42KBoXg16eyrr0o1vSztE-l-HbZjKZ-N4s6hUoUb/edit?usp=sharing',
      docs:'http://ramblings.mcpher.com/Home/excelquirks/dbabstraction/ripdb'
    },
    dependencies:[
      cUseful.getLibraryInfo()
    ]
  }; 
}


/**
 * this emulates the  ScriptDbMap class from ScriptDb
 * @param {object} result a results object from DbAbstraction
 * @return {RipDBMap} self
 */
function RipDBMap(result) {

  cUseful.validateArgs ( 
    Array.prototype.slice.call(arguments),
    [ "object" ] 
  );
  
  var self = this;
  var result_ = result;

  // the key
  self.getId = function () {
    return self.isGood() ? keyString(result_.handleKeys[0]) : undefined;
  };
  
  // the keys come in various shapes and sizes
  function keyString(ob) {
  
    var k =  undefined;
    if (typeof ob === "string") {
      k=ob;
    }
    else if (cUseful.isObject(ob)) {
      if (ob.hasOwnProperty("keys")) {
        k = ob.keys[result_.keyProperty];
      }
      else {
        k = ob[result_.keyProperty];
      }
    }
    
    if (cUseful.isUndefined(k)) {
      throw 'error deciphering keys in ' + JSON.stringify(result_);
    }
    
    return k;
  };
  
  // the data
  self.getData = function () {
    return self.isGood() ? result_.data[0] : undefined;
  };
  
  // converts the data part to json
  self.toJson = function () {
    return self.isGood() ? JSON.stringify(self.getData()) : undefined;
  };
  
  // this is whether its good
  self.isGood = function () {
      return result_.handleCode >= 0 && result_.data.length === 1;
  };
  
  // this is the data 
  self.getData =  function() {
    return self.isGood () ? result_.data[0] : undefined;
  };
  
  // not needed for scriptdb, but useful for debugging
  self.getResult = function() {
    return result_;
  }
  
  // make properties of each of the result properties so they are accessible directly
  if (self.isGood()) {
  
    var data = self.getData();
    if (cUseful.isObject(data)) {
      Object.keys(data).forEach(function(d) {
        self[d] = data[d];
      });
    }
    
    // if its just  string override the tostring object
    else if (typeof data === "string") {
      self.toString = function () {
        return data;
      };
    }
    
    // other wise override the valueof object
    else {
      self.valueOf = function () {
        return data;
      };
    }
  }

  return self;
  
}