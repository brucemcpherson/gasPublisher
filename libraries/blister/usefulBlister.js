/**delete everything**/
function deleteAll() {
  var p = publicStuffDb() ;
  var results = p.query({});
  while (results.hasNext()) {
    p.remove(results.next());
  }
}
/**
 * throw an exception if not true
 * @param {*} arg given value
 * @param {*} defaultValue value to use if given value IsMissing
 * @return {*} the new value 
 */
function fixOptional (arg, defaultValue) {
  if (isUndefined(arg) ){
    return defaultValue;
  }
  else 
    return arg;
}

// got this here 
// https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
/**
 * get detailed type of javaScript var
 * @param {*} obj given item
 * @return {string} type
 */
function toType(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}
function isObject (x) {
  return typeof x === 'object';
}
/**
 * Check if a value is an array
 * @param {*} arg given item
 * @return {boolean} true if array
 */
function isArray (arg) {
  return toType(arg) === 'array';
}

/**
 * Check if a value is defined
 * @param {*} arg given value
 * @return {boolean} true if undefined
 */
function isUndefined ( arg) {
  return typeof arg === 'undefined';
}
function transposeArray (a) {
  if (!a) return a;
  if (!isArray(a)  ) return a;
  if(!a.length) return [[]];
  if (!isArray(a[0])) a = [a];
  return Object.keys(a[0]).map(function (c) { return a.map(function (r) { return r[c]; }); });
}

/**
 * return the db silo item associated with the given key
 * @param {string} k the key
 * @param {ScriptDbInstance=} db the  scriptDB
 * @return {siloItem} the cScriptDbSiloItem
 */
function siloItem(k,db) {
// find the Silo associated with this key
    var pdb = db;
    var self = this;
    var pSiloId =k;
    
/**
 * remove the silo item with the given key
 * @param {object} optOb the item to remove, default all of them
 * @return {siloItem} the siloItem
 */
    self.remove = function (optOb) {
      var qob = self.template(optOb);
    
  // delete all matches
      var result = pdb.query(qob);
      while (result.hasNext()) {
        pdb.remove(result.next());
      }
      return self;
    }

  
/**
 * create template for this silo
 * @param {object|null=} optOb the item to add to the template, default none
 * @return {object} the cScriptDbSiloItem
 */
    self.template = function (optOb) {
      var qob = fixOptional(optOb,{});
      if(pSiloId)qob.siloId = pSiloId;
      return qob;
    }
    
/**
 * do a query within the silo for this siloItem
 * @param {object|null=} optOb the query by example (default all data)
 * @return {ScriptDBquery} a query by example to silo the data
 */
    self.query = function (optOb) {
      return pdb.query(self.template(optOb));
    }

/**
 * do a save within the silo for this siloItem
 * @param {object} ob the bject to save
 * @return {object} the object that was saved
 */
    self.save = function (ob) {
      return pdb.save(self.template(ob));
    }
    

    return self;
}

function getBlisterPackages (options) {
  // get all blisters in a given db
  var o = options || {};
  var s = new siloItem("", o.db || getDefaultDB("blister"));
  var r = s.query(), t = [];
  while (r.hasNext()) {
    t.push (r.next());
  }
  return t;
}
function getRangeFromItem (item) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(item.sheet).getRange(item.range);
}
