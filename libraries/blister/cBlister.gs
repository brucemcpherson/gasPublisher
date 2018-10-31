/** updated this to be a data abstraction handler
 */
/**
  * create a cBlister object
  * @param {string} name name to give this new blister
  * @param {object=} optOptions options (db,sortId,sortDescending)
  * return {cBlister} a new cBlister object
  */
  
var cBlister = function (name, optOptions) {
  var self = this;
  var pName = name;
  var pOptions = optOptions || {};
  var FAKELISTCOLUMN = '__listColumn';
  var pContent = null;
  
  var pSilo = new siloItem("", pOptions.db || showMyScriptDb());
  var pSortId = pOptions.sortId;
  var pSortDescending = pOptions.sortDescending;
  var pDescription = pOptions.description ;
  
  
  if (!pName) throw ('new blister needs a name');
  
  /**
  * get the name of the blister
  * return {string} the blister name
  */
  
  self.name = function () {
    return pName;
  }
  /**
  * search template for this blister
  * return {object} the template for querying
  */
  
  self.template = function () {
    return  {  package: { name: self.name()  } };
  }
  
  
  
  /**
 * create an empty data place
 * return {object} an empty blister
 */
   
   self.empty = function () {
     pContent = self.emptyPackage();
     return pContent;
   }

  /**
 * create an empty data place
 * return {object} an empty blister
 */
   
   self.emptyPackage = function () {
     var p  = self.template();
     p.package.items = [];
     p.package.keys = [];
     return p;
   }
  
  /**
  * get the description of the blister
  * return {string} the blister description
  */
  
  self.getDescription = function () {
    var c= self.content();
    return (c && c.package.description) ?  c.package.description  : self.name() ;
  }
  
 /**
  * get the update date of the blister
  * return {string} the blister description
  */
  
  self.getUpdateDate = function () {
    var c= self.content();
    return c ? new Date(c.updateDate) : null ;
  }
  
  /**
  * get the any options for the blister
  * return {string} the blister name
  */
  
  self.options = function () {
    return pOptions;
  }

  self.items = function () {
    return self.content().package.items
  }

  
/**
  * replace or add the blister with current pContent 
  * return {cBlister} the blister for chaining
  */
  
  self.replace= function (optNewContent) {

    // write update
    if (!isUndefined(optNewContent)) pContent = optNewContent;
    if (!pContent || ! pContent.package) throw ('trying to write null content for ' + self.name());
    self.sort();
    
    // if exists, delete it, then write it
    pSilo.remove (self.template());
    pContent.updateDate = new Date().getTime();
    pContent.package.description = pDescription || self.getDescription();
    
    pSilo.save (pContent);
    return self;
  }

/**
  * sort the current payload according to the column specified in pSortId
  * return {cBlister} the blister for chaining
  */
  
  self.sort = function () {
    // sort the content
    if (!pSortId || !pContent.package.keys.length || !pContent.package.items.length) return self;
    
    var kInx = self.getKeyItemIndex (pSortId)
    if (kInx === -1) { 
      //.. just dont sortthrow ("invalid sortKey " + pSortId);
      return self;
    }

    
    // since we have to sort multiple columns, better to sort a map of the data
    var map = pContent.package.items[kInx].map(function(e, i) {
        return {index: i, value: e};
      });

    // sort the map 
    map.sort(function(a, b) {
      return a.value === b.value ? 0 : ( pSortDescending ? (a.value < b.value ? 1 : -1) : (a.value > b.value ? 1 : -1)) ;
    });

    // reconstitute from the map order
    for ( var i = 0 ; i < pContent.package.items.length; i++) {
        var ns = map.map(function(e) {
            return pContent.package.items[i][e.index];
          });          
        pContent.package.items[i] = ns;
    }

    return self;
  } 
  /**
  * lookup the values in a blister and return the position of the match(es)
  * @param {*} value  we're looking for
  * @param {options} options sortId,sortDescending,maxMatch,library
  * return {*|<array>.*} the found value(s)
  */

  self.matchWorker = function  ( value, options ) {
    options = options || {};
    var maxMatch = fixOptional ( options.maxMatch , 1);
    var data = self.getListValues (options.listId);
    if (data) {
      if (maxMatch === 1) {
        var idx = data.indexOf(value);
        if(idx != -1) {
          // all is good
          return idx+1;
        }
        else {
          throw ("no matches for " + value + " in list " + self.name());
        }
      }
      else {
        // will provide an array of results
        var results = [];
        for ( var i=0; i < data.length && (results.length < maxMatch || maxMatch === 0 )  ; i++) {
          if (data[i] === value ) results.push(i+1);
        }
        return results;
      }
    }
    else if (isUndefined(data)) {
      throw (self.name() + ":" + options.listId +  ":" + " combination not found in library " + self.options().library); 
    }
    return data;
  }
  
  /**
  * get value(s) at the specified index in the given list
  * @param {number|<array>.number} idx the item number starting at 1, or an array of start positions.
  * @param {options} options sortId,sortDescending,maxMatch,library
  * return {*|<array>.*} the found value(s)
  */
  
  self.indexWorker = function ( idx , options ) {
    options = options || {};
    var listId = options.listId || 1;
  
    // get the list required
    var data = self.getListValues(listId);
    if (data) {
      if (isArray(idx)) {
        var results = [];
        for (var i =0; i < idx.length ; i++ ){
          results.push(data[idx[i]-1]);
        }
        return results;
      }
      else {
        return data[idx-1];
      }
    }
    else if (isUndefined(data)) {
      throw (self.name()  + ":" + listId + ":" + " combination not found in library " + self.options().library);
    }
    return data;
  }

  /** 
   * add a new column to the list
   */
   
  self.findOrAddListId = function (listId) {
    var heading, c = self.content();
    
    // if it's undefined then we'll be adding one with no header
    if (isUndefined(listId)) { 
      listId = pContent.package.keys.length();
      heading = FAKELISTCOLUMN + listId;
    }
    else {
      heading = listId;
    }
    
    // cheack it doesnt exist
    var k = self.getKeyItemIndex(listId);
    if (k < 0 ) {
      // need to add it

      pContent.package.keys.push(heading);
      pContent.package.items.push([]);
      k = pContent.package.keys.length-1;
      self.replace();
    }
    
    return k;
  }
/**
  * given a listId return the column index number 
  * @param {string|number} listId can be a column name, or a column number starting at 1
  * return {number} the column index number starting at 0, -1 if doesnt exist
  */
  
  self.getKeyItemIndex = function(listId) {

    if(self.content()) {
      var kName = listId, kInx =  parseInt(listId);
      if ( !isNaN(kInx) && pContent.package.keys.length >= parseInt(listId) && parseInt(listId) >=1 ) {
        return kInx - 1;
      }
      else {
        for (var i =0 ; i < pContent.package.keys.length ; i++) {
           if (pContent.package.keys[i] === kName) return i;
        }
        return -1;
      }
    }
    else {
      return -1;
    }
  }
  
/**
  * return the values in a list column
  * @param {options} options listId,sortId,sortDescending,maxMatch,library
  * return {<array>.*} the array of values
  */
  self.listWorker = function  (options) {

    options = options || {};
    var listId = fixOptional( options.listId , 1);
    var maxMatch = fixOptional ( options.maxMatch , 0);
  
    // get the list required
    var result = self.getListValues(listId, options.filters);
    
    if (result) {
      if (maxMatch === 0 || result.length === 0) {
        return result;
      }
      else {
        if (isArray(result[0])) {
          // its a multi dimentsional thing
          var data =[];
          for ( var i=0; i < result.length ; i++ ) {
            data.push( result.slice (0,Math.min(maxMatch,result[i].length)));
          }
          return data;
        }
        else {
          return [result.slice (0,Math.min(maxMatch,result.length))];
        }
      }
    }
    else if (isUndefined(result)) {
        throw (self.name() + ":" + listId + ":" + " combination not found in library "+JSON.stringify(self.content()));
  
    }
    return result;
    
  }  
/**
  * given a listId return the headings for that column (or all columns), or null if invalid listId
  * @param {string|number=} optListId can be a column name, or a column number starting at 1
  * return {<Array>.*|null|undefined} the data associated with the given listId
  */
  
  self.getListHeaders = function(optListId) {
    
    var p = self.content();
    if (p) {
      
      var data = p.package.keys;

    // narrow down to a particular column if necessary
     if (optListId) {
       var idx = self.getKeyItemIndex (optListId);
       if (idx < 0 ) {
         return undefined;
       }
       else {
         return data[idx];
       }
     }
     else {
        return data;
      }
    }
    return p;

  }
  

/**
  * given a listId return the data for that column (or all columns), or null if invalid listId
  * @param {string|number=} optListId can be a column name, or a column number starting at 1
  * @param {<Array>.object|null} optFilters listid and value pairs that have to match for data to be included
  * return {<Array>.*|null|undefined} the data associated with the given listId
  */
  
  self.getListValues = function(optListId,optFilters) {
    
    var p = self.content();
    if (p) {
      
      var data = p.package.items;
      if (optFilters) {
       // need to do this row-wise, currently its columnwise
        var data = transposeArray(data);
        
        // apply each filter, only including rows that all the filters are true
        for ( var i=0; i < optFilters.length;i++) {
          var filter = optFilters[i];
          
          // get the filter column
          var k = self.getKeyItemIndex (filter.listId);
          if (k < 0) { 
            return undefined ;
          }
          
          // an undefined filter value will be the same as no filter
          if (!isUndefined(filter.value)) {
            data = data.filter ( function (v,ind,tab) { 
              return filter.value === v[k] ;
            } );
          }
           
        }
        // organize back to column wise
        data = transposeArray(data);
      }

    // narrow down to a particular column if necessary
     if (optListId) {
       var idx = self.getKeyItemIndex (optListId);
       if (idx < 0 ) {
         return undefined;
       }
       else {
         return data[idx];
       }
     }
     else {
        return data;
      }
    }
    return p;

  }
  
  
/**
  * return the unique values in a list column
  * @param {options} options listId,sortId,sortDescending,maxMatch,library
  * return {<array>.*} the array of unique values
  */
  self.uniqueWorker  = function  (options) {
    
    var listId = options.listId || 1;
    var maxMatch = fixOptional ( options.maxMatch , 0);
  
      // get the list required
    var data = self.getUniqueListValues(listId, options.sortId, options.filters);
    if (data) {
      if (maxMatch === 0) {
        return data;
      }
      else {
        return data.slice (0,Math.min(maxMatch,data.length));
      }
    }
    else if (isUndefined(data)) {
      throw (self.name() + ":" + listId + ":" + " combination not found in library" + self.options().library);
    }
    return data;
  }
  
  
/**
  * given a listId return the unique values in a a list
  * @param {string|number} listId can be a column name, or a column number starting at 1
  * @param {boolean} optSort whether to sort the list
  * return {<Array>.*|null} the unique data values in a list
  */
  
  self.getUniqueListValues = function (listId, optSort, optFilters) {
    var item = self.getListValues(listId,optFilters);
    if (item) {
        var uniqueList =  item.filter ( function ( v , i , t) {
          return t.indexOf (v) === i;
        });
        if(optSort) uniqueList.sort();
        return uniqueList;
    }
    return item; 
  }
  

/**
  * get the existing pContent for a list. First time it will get from scriptDB
  * @param {boolean} optRefresh if true will always refresh pContent first
  * return {object} the data as written to scriptDb
  */
  
  self.content = function (optRefresh) {
    if (optRefresh) { 
      pContent = self.dbContent();
      if(!pContent) { 
        pContent= self.emptyPackage(); 
      }
      else {
        self.sort();
      }
    }

    return pContent;
  }


/**
  * get the existing pContent for a list. First time it will get from scriptDB
  * return {object} the data as written to scriptDb
  */
  
  self.dbContent = function () {
    // get from scriptdb
    var results = pSilo.query ( self.template() );
    return results.hasNext() ? results.next() : null;
  }
  
/**
  * given a range will  replace the content for this blister and write it to scriptDB
  * @param {Range} sourceRange if true will always refresh pContent first
  * @param {boolean} optHeadings if true will use the first row headings as the the listIDs
  * @param {boolean} optIncludeEmpty if false will stop at first completely empty row
  * return {cBlister} the generated blister
  */
    
  self.makeBlisterFromRange = function(sourceRange,optHeadings,optIncludeEmpty) {
    pContent = self.getBlisterFromRange (sourceRange, optHeadings,optIncludeEmpty);
    return self.replace ();
  }

/**
  * given a range will construct a cBlister payload 
  * @param {Range} sourceRange if true will always refresh pContent first
  * @param {boolean} optHeadings if true will use the first row headings as the the listIDs
  * @param {boolean} optIncludeEmpty if false will stop at first completely empty row
  * return {cBlister} the cBlister payload
  */
  
  self.getBlisterFromRange = function (r, optHeadings,optIncludeEmpty) {
    var data = r.getValues(), 
      headings = fixOptional(optHeadings, false),
      maxRow = 0;
    
    var obData = self.emptyPackage();
    
    // srt out headings - can be named from column headings, or numeric
    if (data.length) {
      // keys
      for (var i=0; i < data[0].length; i++) {
        obData.package.keys.push( headings ? data[0][i] : FAKELISTCOLUMN + (i+1) );
       }
       // data
       for (var i=0; i < data[0].length; i++) {
         var d = [];
         for (var j = (headings ? 1 : 0) ; j < data.length; j++) {
          d.push( data[j][i] );
          if (data[j][i]) maxRow = j;
         }
         obData.package.items.push(d);
       }
    }
    // trim trailing blank rows
    if (!optIncludeEmpty && maxRow < data.length -1) {
      for (var i=0;i<obData.package.keys.length;i++) {
        obData.package.items[i] = obData.package.items[i].splice(0,maxRow);
      }
    }
    return obData;
  }
  pContent = self.content(true);
  return self;
}
/* helps to set up a new blister object
 */
function blisterHelper (listName,options , optLocalLibrary ) {

  
  // if a library is specified then we use that
  if ( options.library != "blister") {
     options.db = optLocalLibrary;
     if (!options.db) throw ("unknown library " + options.library);
  }
  
  return new cBlister (listName, options );

}