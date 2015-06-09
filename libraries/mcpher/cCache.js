/** @description
 * client caching for GAS worksheet access
 * will cache all calls to get..(), set...() methods so they can be done in a single call
 * a separate cache is created for each type of method (getValues,getBackGroundColors) etc.
 * See http://ramblings.mcpher.com/Home/excelquirks/codeuse for more details
 */
 
/**
 * cCache
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a><a href="http://ramblings.mcpher.com"> ramblings.mcpher.com</a>
 */
 
/**
 * @static
 */
var worksheetCache;
/**
 * Creates the cache container if not already known
 * @return {cCache} a new cache container
 */
function createSheetCache(){
  return worksheetCache ? 
      worksheetCache : 
      (worksheetCache = new cCache());
}
/**
 * finds (or creates) a cache for the identified worksheet
 * @param {string|Sheet|Range} ob Identifies the worksheet target
 * @param {string=} method the required method (default get/setValues())
 * @return {cCache} a new cache container
 */
function sheetCache(ob,method) {
  return createSheetCache().getCache(ob,fixOptional (method,'getValues'));
}

/**
 * a cCache
 * @class 
 * @implements {cCache}
 * @return {cCache} a new cache container
 */
function cCache() {
  var pCaches = new collection();
  this.caches = function () {
    return pCaches;
  }
  return this;
};

/**
 * generate a unique Key to use to identify the cache - used internally
 * @param {string} wn the worksheet name
 * @param {string} method the requested method
 * @return {string} the key
 */
cCache.prototype.getKey = function (wn,method) {
  // will use the same cache for both set and get methods
  return wn + '@' + (Left(method,3) == 'set' ? 'get' + Right(method,Len(method) - 3) : method ) ;
};

/**
 * resolve the type of object being used to identify the cache required and return its worksheet name
 * @param {string|Sheet|Range} ob Identifies the worksheet target
 * @return {string} the worksheet name
 */
cCache.prototype.getWn = function (ob) {
  return  this.getSheetObj(ob).getName().toString();          
 };
 
/**
 * resolve the type of object being used to identify the cache required and return its Sheet
 * @param {string|Sheet|Range} ob Identifies the worksheet target
 * @return {Sheet} the worksheet
 */
cCache.prototype.getSheetObj = function (ob) {
  // this one detects the object type & gets the sheet being referred to
  return  DebugAssert
      (isTypeString(ob) ?                          
          Sheets(ob) :      //its a sheet name
          ob.getSheet ?                        
            ob.getSheet() : //its a range 
              ob.getName ?                          
                ob  :       //its a sheet 
                null,'unknown object making getSheetObj cache request' )   ;  // dont know what it is - give up
                
 };
 
 /**
 * return the cache given an item and its method
 * @param {string|Sheet|Range} ob Identifies the worksheet target
 * @param {string} method the required method
 * @return {cCacheItem} a single cache
 */
cCache.prototype.getCache = function (ob,method) {
  // find the existing cache or create it.
  var wn = this.getWn(ob);
  var key = this.getKey(wn,method);
  var cache = this.caches().item(key,false);
  if (!cache) {
    cache = new cCacheItem(this,method);
    var cache = this.caches().add (cache,key);
    cache.xName = wn ;
    cache.xKey = key;
    cache.xWsRange = wholeWs(this.getSheetObj(ob));
  }
  DebugAssert(cache.xName == wn, "somehow using the wrong cache");
  return cache;
};
/**
 * create a new cCacheItem
 * @class 
 * @param {string|Sheet|Range} p the parent cCache container
 * @param {string} method the required method
 * @return {cCacheItem} a new cacheitem
 */
function cCacheItem(p,method) {
  this.xValues = null;   // will hold cached values  
  this.xParent = p;
  this.xMethod = method;
  this.xActive = false;
  this.xDirty = true; // force a refresh
};
/**
 * return the values for an entire row
 * @param {number} rn the row number (Base 1)
 * @return {<Array>.*} array of values for the given row
 */
cCacheItem.prototype.getEntireRow = function(rn) {
  return this.getValues()[rn-1];
};
/**
 * return the values for the range given
 * @param {Range=} r the target range (default the whole sheet)
 * @return {<Array>.*} array of values for the given range
 */
cCacheItem.prototype.getValues = function(r) {
  // get from sheet if we dont have it already
  if (this.dirty() || !this.xActive) { 
    DebugAssert(this.xWsRange[this.xMethod], this.xMethod + 
          ' method does not exist for range' + sad(this.xWsRange));
    this.xValues = this.xWsRange[this.xMethod](); 
    this.xActive = true;
    this.setDirty(false);
  }
  return isUndefined (r) ? this.xValues : this.getValuesOfRange(r);
};

/**
 * return the first value of the range given
 * @param {Range=} r the target range (default the whole sheet)
 * @return {*} value of first cell in the given range
 */
cCacheItem.prototype.getFirstValueOfRange = function (r) {
  // get from cache or if outside range return empty - only returns 1 value
  return this.getValue (r.getRow(),r.getColumn()); 
};

/**
 * return a single value
 * @param {number} rn the row number (Base 1)
 * @param {number} cn the column number (Base 1)
 * @return {*} value at rn,cn
 */
cCacheItem.prototype.getValue = function (rn,cn) {
  // get from cache or if outside range return empty
  return (rn > this.getRowCount() || cn > this.getColumnCount() ) ? 
    Empty() :
    this.getValues()[rn-1][cn-1];
};
/**
 * set a single value
 * @param {*} value the value to set
 * @param {number} rn the row number (Base 1)
 * @param {number} cn the column number (Base 1)
 * @return {*} the value that was set
 */
cCacheItem.prototype.setValue = function (value,rn,cn) {
  return (this.extend (rn,cn).setTouched().xValues[rn-1][cn-1] = value);
};
/**
 * set multiple cells to the same value
 * @param {*} value the value to set
 * @param {range} r the range to set it in
 * @return {cCacheItem} self
 */
cCacheItem.prototype.setRepeatValue = function (value,r) {
  var nc = r.getNumColumns();
  var nr = r.getNumRows();
  var sr = r.getRow();
  var sc = r.getColumn();
  var self = this;
  for (var i = 0; i < nr ; i++ )
  for (var j = 0; j < nc ; j++ )
    self.setValue(value,i+sr,j+sc);
  
  return self;
};
/**
 * set multiple cells to the same rowheight
 * @param {*} value the height to set it to
 * @param {range} optr the range to set it in
 * @return {cCacheItem} self
 */
cCacheItem.prototype.setRowHeight = function (value,optr) {
  var r = fixOptional (optr, this.xWsRange);
  var nr = r.getNumRows();
  var sr = r.getRow();
  var self = this;
  var sheet = r.getSheet();
  for (var i = 0; i < nr ; i++ )
    sheet.setRowHeight(i+sr,value);
  
  return self;
};
/**
 * set multiple cells to the same columnWidth
 * @param {*} value the height to set it to
 * @param {range} optr the range to set it in
 * @return {cCacheItem} self
 */
cCacheItem.prototype.setColumnWidth = function (value,optr) {
  var r = fixOptional (optr, this.xWsRange);
  var nc = r.getNumColumns();
  var sc = r.getColumn();
  var self = this;
  var sheet = r.getSheet();
  for (var i = 0; i < nc ; i++ )
    sheet.setColumnWidth(i+sc,value);
  
  return self;
};
/**
 * commit the contents of the cCacheItem back to the sheet
 * @param {string|Sheet|Range=} if specified will clone the cache to a different sheet
 * @return {cCacheItem} the cCacheItem
 */
cCacheItem.prototype.commit = function (optOut) {

  if ( this.touched()  || !IsMissing(optOut) ) {
    var oRange = DebugAssert( IsMissing(optOut) ? 
                   this.xWsRange :
                     this.xParent.getSheetObj(optOut) ?
                       wholeWs(this.xParent.getSheetObj(optOut)) :
                       null, 
                   'invalid cache clone attempt');

    var r = vResize(oRange,this.getRowCount(),this.getColumnCount());
    var m = 'set' + Mid(this.xMethod,4) ;
    DebugAssert(r[m], m + ' method does not exist for range' + sad(r));
    r[m](this.xValues); 
    // if this is the same sheet as cache then its now clean
    if (IsMissing(optOut))this.setTouched(false);
  }
  return this;
};

/**
 * clear the cCacheItem and delete it without committing the contents
 */
cCacheItem.prototype.quit = function () {
  // abandon changes and kill the cache
  this.clearCache();
  this.xParent.caches().remove(this.xKey);
  return null;
};
/**
 * clear the cCacheItem without committing the contents
 */
cCacheItem.prototype.clearCache = function () {
  this.xData = null;
  return this;
};
/**
 * clear the cCacheItem contents
 */
cCacheItem.prototype.clear = function (optR) {
  if (IsMissing(optR)) {
    var rn = this.getRowCount();
    var cn = this.getColumnCount();
    var rs = 1;
    var cs = 1;
  }
  else {
    var rn = optR.getNumRows();
    var cn = optR.getNumColumns();
    var rs = optR.getRow();
    var cs = optR.getColumn();
  }
  DebugAssert(this.xMethod=="getValues",
      'Can only clear cache values for now-you asked for', this.xMethod);
  for ( var i= rs ; i < rn+rs ; i++ )
  for ( var j= cs ; j < cn+cs ; j++ ) 
    this.setValue (Empty(), i, j);

  return this;
};
/**
 * Commit the cCacheItem contents to the sheet, and delete the cache
 */
cCacheItem.prototype.close = function () {
  //commit changes and kill the cache
  this.commit();
  this.quit();
  return null;
};
/**
 * Extend the cache if rn,cn outside current range of sheet - Internal Use:called automatically if needed
 * @param {number} rn the row number being accessed
 * @param {number} cn the column number being accessed
 * @return {cCacheItem} the cCacheItem
 */
cCacheItem.prototype.extend = function(rn,cn) {

  // maybe we need to extend the number of rows
 var cr = this.getRowCount();
 var cc = this.getColumnCount();
 if (!this.xValues) this.xValues =[];
  // need to add any rows?
  if (rn > cr ) {
    for (var i = cr ; i < rn ; i++) {
      this.xValues[i]= [] ;
      for ( var j=0; j < cc ; j++ ) this.xValues[i][j]= Empty();
    }
  }
  // maybe the number of columns ?
  if ( cn > cc){
      for (var i = 0 ; i < this.getRowCount() ;i++) {
        for (var j= cc ; j < cn ; j++){
          this.xValues[i][j]=Empty();
        }
      }
  }
  
  return this;
}; 
/**
 * set or clear whether the cache has been written to - Internal Use:called automatically if needed
 * @param {boolean=} touched whether cache is written to - default true
 * @return {cCacheItem} the cCacheItem
 */
cCacheItem.prototype.setTouched = function(touched) {
  this.xTouched = fixOptional(touched,true);
  return this;
};

/**
 * check whether the cache has been written to
 * @return {boolean} has cCacheItem been written to?
 */
cCacheItem.prototype.touched = function() {
  return this.xTouched;
}; 

/**
 * set or clear whether the cache is valid and force a refresh
 * @param {boolean=} dirty whether cache is valid - default true
 * @return {cCacheItem} the cCacheItem
 */
cCacheItem.prototype.setDirty = function(dirty) {
  if (dirty) {
    DebugAssert(!this.touched(), 'cache dirty request with outstanding write cache requests'); 
  }
  this.xDirty = fixOptional(dirty,true);
  if (this.xDirty) {
    // force a refresh now
    this.getValue(1,1);
  }
  return this;
}; 

/**
 * check whether the cache is valid- when maintained automatically should always be false
 * @return {boolean} whether cCacheItem is valid
 */
cCacheItem.prototype.dirty = function () {
  return this.xDirty ;
}; 

/**
 * get the number of rows in the cCacheItem
 * @return {number} whether cCacheItem is valid
 */
cCacheItem.prototype.getRowCount = function () {
  return this.getValues() ? this.getValues().length : 0;
};
/**
 * get the max value in cache
 * @return {*} max
 */
cCacheItem.prototype.max = function () {
  var m;
  for (var i=0; i < this.getRowCount() ; i++ )
  for (var j=0; j < this.getColumnCount() ; j++ )
    if (this.xValues[i][j] > m || isUndefined(m)) m = this.xValues[i][j] ;
  
  return m;
};
/**
 * get the min value in cache
 * @return {*} min
 */
cCacheItem.prototype.min = function () {
  var m;
  for (var i=0; i < this.getRowCount() ; i++ )
  for (var j=0; j < this.getColumnCount() ; j++ )
    if (this.xValues[i][j] < m || isUndefined(m)) m = this.xValues[i][j] ;
  
  return m;
};



/**
 * get the number of columns in the cCacheItem
 * @return {number} whether cCacheItem is valid
 */
cCacheItem.prototype.getColumnCount = function () {
  return this.getValues() ? this.getValues()[0].length : 0;
};
/**
 * enumerate a the collection in the cCache container
 * @this {cCache} 
 * @param {function(*,number,number)} a function that will be called for each item
 */
cCacheItem.prototype.forEach = function (yourFunction) {
  var nr = this.getRowCount() ;
  var nc = this.getColumnCount() ;
// get the values for this cache
  var v = this.getValues();
// this will call your function for every value
  for (var rowIndex = 0 ; rowIndex < nr ; rowIndex ++ )
  for (var colIndex = 0 ; colIndex < nc ; colIndex ++ ) {
    if ( yourFunction (v[rowIndex][colIndex],rowIndex+1,colIndex+1) ) return true;
  }
};
/**
 * return the values for the range given
 * @param {Range} r the target range 
 * @return {<Array>.*} values from the given range
 */
cCacheItem.prototype.getValuesOfRange = function (r) {
  // get from cache or if outside range return empty 
  var needRows = r.getNumRows();
  var needCols = r.getNumColumns();
  var nr = r.getRow();
  var nc = r.getColumn();
  var cacheRows = this.getRowCount();
  var cacheCols = this.getColumnCount();

  // the whole thing ?
  if (needRows == cacheRows && needCols == cacheCols && nr == 1 && nc == 1) {
    return this.getValues();
  } 
  // need to make a new shaped array
    var v= new Array(needRows);
    for (var i=0 ; i < needRows; i++ ){
      v[i]= new Array(needCols);
      for (var j=0 ; j < needCols; j++ ){
        v[i][j]= this.getValue(i+nr ,j+nc);
      }
    }
    return v;

};