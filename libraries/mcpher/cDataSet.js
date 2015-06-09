/** @description
 * javaScript/Google Apps script functions for abstracting data from sheets
 * See http://ramblings.mcpher.com/Home/excelquirks/codeuse for more details
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a><a href="http://ramblings.mcpher.com"> ramblings.mcpher.com</a>
 */
/**
 * a cDataSet
 * @class 
 * @implements {cDataSet}
 * @return {cDataSet} a new cDataSet
 */
function  cDataSet () {
  //-------private properties
  var pCollect = new collection();  
  var pCollectColumns = new collection();
  var pHeadingRow = new cHeadingRow();
  //-------public properties ->methods
  
  this.rows = function() {
      return pCollect;
  };
  this.columns = function() {
      return pCollectColumns;
  };
  this.headingRow = function() {
      return pHeadingRow;
  }; 
  return this;
}; 

/**
 * return the cCell indexed
 * @param {string|number} rowId the key or dataset row number of the cell
 * @param {string|number} sid the key (column heading) or dataset column of the cell
 * @return {cCell} the requested cCell
 */
cDataSet.prototype.cell = function(rowId, sid, complain) {
  if (! (dr = this.row(rowId,complain))){
    if (fixOptional ( complain , false)) {
      	MsgBox (rowId.toString() + " is not a known row");
    }
  }
  else
    return dr.cell(sid,complain);
};
/**
 * return whether the cell contains a 'true like' value (yes/1/true  etc..)
 * @param {string|number} rowId the key or dataset row number of the cell
 * @param {string|number} sid the key (column heading) or dataset column of the cell
 * @return {boolean} whether cell is true
 */
cDataSet.prototype.isCellTrue = function(rowId, sid) {
    return  isStringTrue(this.toString(rowId, sid)) ;
};
/**
 * convert the cell value to a string
 * @param {string|number} rowId the key or dataset row number of the cell
 * @param {string|number} sid the key (column heading) or dataset column of the cell
 * @param {string=} sFormat an optional format to use
 * @return {string} cell converted to use
 */
cDataSet.prototype.toString = function(rowId, sid,sFormat) {
    return  this.cell(rowId, sid).toString() ;
};
/**
 * return the cell value
 * @param {string|number} rowId the key or dataset row number of the cell
 * @param {string|number} sid the key (column heading) or dataset column of the cell
 * @param {boolean=} complain whether to complain if cell doesnt exist
 * @return {*|undefined} cell value
 */
cDataSet.prototype.value = function(rowId, sid,complain) {
    var cc = this.cell(rowId, sid,complain);
    return cc ? cc.value() : undefined;
};
/**
 * return the cDatarow indexed
 * @param {string|number} rowId the key or dataset row number of the cell
 * @param {boolean=} complain whether to complain if row doesnt exist
 * @return {cDatarow|null} cDatarow
 */
cDataSet.prototype.row = function(rowId,complain) {
    if (!this.isLab()) {
      if (!isTypeNumber(rowId) ) {
        MsgBox ("Dataset " + this.name() + " must have labels enabled to use non-numeric labels");
        return null;
      }
    }
    return this.exists(rowId,complain);
};
/**
 * return the cDataSet 
 * @param {string} sheetName the name of the worksheet to load
 * @param {string} parameterBlock optional - the name of the paremeter block if there is one
 * @return {cDataSet} cDataSet
 */
cDataSet.prototype.load = function(sheetName,parameterBlock) {
    return this.populateData(wholeSheet(sheetName),undefined ,undefined , parameterBlock ? true: false, parameterBlock,undefined , true);
};

/**
 * return the cDataColumn indexed
 * @param {string|number} sid the key or dataset column number of the cell
 * @return {cDataColumn|null} cDataColumn
 */
cDataSet.prototype.column = function(sid) {
    return this.columns().item(sid);
};



/**
 * return the collection of headings for this cDataSet
 * @return {collection} collection of cCell
 */
cDataSet.prototype.headings = function() {
    return this.headingRow().headings();
};
/**
 * return the cDataRow indexed
 * @param {string|number} sid the key or dataset row number of the cell
 * @param {boolean=} complain whether to complain if row doesnt exist
 * @return {cDataColumn|null} cDataColumn
 */
cDataSet.prototype.exists = function(sid,complain) {
    return this.rows().item(sid,complain);
};
/**
 * refresh the indexed cells
 * @param {string|number=} rowId the key or dataset row number of the cell. Default all rows
 * @param {string|number=} sId the key or dataset column number of the cell. Default all columns
 * @return {cDataColumn|cDataRow|cCell} whatever was refreshed
 */
cDataSet.prototype.refresh = function(rowId,sid) {
    if (isUndefined(rowID) && isUndefined(sid)) {
      for ( var i =0; i < this.rows().count(); i ++) {
        this.row(i+1).refresh();
      }
    }
    else if (isUndefined(rowID)) {
      return this.column(sid).refresh();
    }
    else if (isUndefined(sid)){
      return this.row(sid).refresh();
    }
    else {
      return this.cell(rowId,sid).refresh();
    }
};
/**
 * commit the contents of the indexed cCells
 * @param {*=} p a value to first enter in the indexed cell
 * @param {string|number=} rowId the key or dataset row number of the cell. Default all rows
 * @param {string|number=} sId the key or dataset column number of the cell. Default all columns
 * @return {cDataColumn|cDataRow|cCell} whatever was committed
 */
cDataSet.prototype.commit = function(p,rowId,sid) {
    if (isUndefined(rowID) && isUndefined(sid)) {
      for ( var i =0; i < this.rows().count(); i ++) {
        this.row(i+1).commit(p);
      }
    }
    else if (isUndefined(rowID)) {
      return this.column(sid).commit(p);
    }
    else if (isUndefined(sid)){
      return this.row(sid).commit(p);
    }
    else {
      return this.cell(rowId,sid).commit(p);
    }
};
/**
 * create a cDataSet - normally called automatically by populateData.
 * @param {string=} sn a name for the cDataSet - default the same as the source worksheet
 * @param {boolean=} blab whether to allow rows to have keys- default false
 * @param {boolean=} keepFresh whether to keep the source sheet cache continually up to date- default false.
 * @param {boolean=} stopAtFirstEmptyRow whether input data is delimited by a blank row- default true.
 * @param {string=} sKey if blab (label keys allowed) this specifies the column name of the key - default the name of column 1.
 * @param {number=} maxDataRows the maximum number of rows to use - default all rows.
 * @return {cDataSet} the cDataSet
 */
cDataSet.prototype.create = function(sn , blab, 
                keepFresh , stopAtFirstEmptyRow ,
                sKey, maxDataRows ) {
                
 
    var rCurrent = vOffset(this.headingRow().where(),1);
    this.xWhere = rCurrent;
    this.where = function () {
      return this.xWhere;
    }
    this.xKeepFresh = fixOptional(keepFresh,false);
    this.keepFresh = function() {
      return this.xKeepFresh;
    };
    this.xName = makeKey(isUndefined(sn) ?  this.xWhere.getSheet().getName() : sn);
    this.name = function() {
        return this.xName;
    };
    
    if ( this.xIsLab = fixOptional ( blab, false)) {
      if (isUndefined(sKey) )
        this.xKeyColumn = 1;
      else if (this.headingRow().exists(sKey)) {
        this.xKeyColumn = this.headingRow().exists(sKey).column();
      }
    }
    this.isLab = function() {
        return this.xIsLab;
    };
    this.keyColumn = function() {
        return  this.xKeyColumn;
    };
    var m = maxDataRows;
    if (!m) m = wholeWs(WorkSheet(this.xWhere)).getNumRows();
    
    // create the columns
    for (var i = 0; i < this.headings().count() ; i++ ) {
      var hCell = this.headings().item(i+1);
      var dCol = new cDataColumn();
      dCol.create (this, hCell, i+1) ;
      this.columns().add( dCol, makeKey (hCell.toString()));
    }
    //get the shape of a blank delimited table
    if (m > 0) {

        this.xWhere = vResize(this.xWhere,m,this.headings().count());
        if (stopAtFirstEmptyRow) this.xWhere = toEmptyRow(this.xWhere);

        //read in the whole lot at once
        if (this.xWhere) {
          var rv = sheetCache(this.xWhere).getValues(this.xWhere);
          var xw = vResize(this.xWhere,1); // avoid repeating making it one row

          for (var i = 0 ; i < rv.length ; i++) {
            var dRow = new cDataRow();
            dRow.create (this, vOffset(xw,i), i+1 , rv[i]);
            if (this.isLab()) {
              var k = makeKey(dRow.cell(this.xKeyColumn).toString());
              if (!this.rows().add (dRow, k, false)){
                MsgBox ("Could not add duplicate key " + k +
                        " in data set " + this.name() + " column " + 
                        this.headings().item(this.xKeyColumn).toString());
              }
            }
            else {
              this.rows().add (dRow);
            }
            for (var j = 0; j < this.columns().count() ; j++ ) {
              var dCol = this.columns().item(j+1);
              dCol.rows().add (dRow.cell(dCol.column()));
          }
        }
      }
    }
    else {
       this.xWhere = Nothing;
    }

  return this;
};
/**
 * repopulate and potentially resize a cDataSet - will return a new cDataSet
 * @return {cDataSet} the cDataSet
 */
cDataSet.prototype.rePopulate = function(){
    //this repopulates and creates a new cdataset
    var s = this.xKeyColumn > 0 ? this.headingRow().headings(this.xKeyColumn) : '' ;
    var newSet = new cDataSet();
    //delete it from parent collection
    if(this.parent()) this.parent().dataSets.remove(this.name());  
    // recreate it with the same parameters as before
    return newSet.populateData(firstcell(this.headingRow().where()), undefined , 
            this.name(), this.isLab(), undefined , this.parent(), true, s);
};

 // TODO
cDataSet.prototype.populateDataOptions = function(options) {
  var jOptions = optionsExtend(options, 
    {
      rStart : undefined, 
      keepFresh : false, 
      sn : undefined, 
      blab : false,
      blockstarts : undefined, 
      ps : undefined, 
      bLikely : true,   // different default 
      sKey : undefined, 
      maxDataRows : undefined, 
      stopAtFirstEmptyRow : true
    }
  );
  
  return this.populateData(
      jOptions.cValue("rStart"),
      jOptions.cValue("keepFresh"),
      jOptions.cValue("sn"),
      jOptions.cValue("blab"),
      jOptions.cValue("blockstarts"),
      jOptions.cValue("ps"),
      jOptions.cValue("bLikely"),
      jOptions.cValue("sKey"),
      jOptions.cValue("maxDataRows"),
      jOptions.cValue("stopAtFirstEmptyRow")
    );
}
/**
 * remove backlinks to help garbage collector
 * @return {void} 
 */ 
cDataSet.prototype.tearDown = function() { 
  if (this.rows())
      this.rows().forEach(
      function(dr) {
        dr.tearDown();
      }
    );
  if(this.columns())
    this.columns().forEach(
      function(dc) {
        dc.tearDown();
      }
    );
  this.xParent = null;
} 
/**
 * create and populate a cDataSet.
 * @param {Range} rStart a range specifying either the start of or all of the input data set
 * @param {boolean=} keepFresh whether to keep the source sheet cache continually up to date- default false.
 * @param {string=} sn a name for the cDataSet - default the same as the source worksheet
 * @param {boolean=} blab whether to allow rows to have keys- default false
 * @param {string=} blockstarts the column 1 text at which a cDataSet starts - default - no text search
 * @param {cDataSets=} ps the cDataSets collection of which this is a part - default - no collection
 * @param {boolean=} bLikely whether to try to figure out the likely start of a cDataSet if beginning of range is blank - default - false
 * @param {string=} sKey if blab (label keys allowed) this specifies the column name of the key - default the name of column 1.
 * @param {boolean=} stopAtFirstEmptyRow whether input data is delimited by a blank row- default true.
 * @param {number=} maxDataRows the maximum number of rows to use - default all rows.
 * @return {cDataSet} the cDataSet
 */

cDataSet.prototype.populateData = function(rStart, keepFresh, sn, 
        blab,blockstarts, 
        ps, 
        bLikely, 
        sKey, 
        maxDataRows, 
        stopAtFirstEmptyRow) {
   this.xParent = fixOptional(ps,null);
   this.parent = function() {
     return this.xParent;
   }
  // the table dimensions to look at
  var rInput = rStart;

  if(isUndefined(rInput)) {
    rInput = getLikelyColumnRange();
  }
  else if (fixOptional (bLikely, false)) {
    rInput = getLikelyColumnRange(rStart.getSheet());
  }

  // set up name and get actual table range start row
  var blockName = makeKey(fixOptional (sn, ''));
  var rp = vResize(rInput,1);
  if (!isUndefined(blockstarts)) {
    if (!blockName) blockName = makeKey(blockstarts);
    rp = cleanFind(blockstarts, vResize(rInput,undefined,1), true, true);
    if (rp) rp = toEmptyCol (rp);
    else return rp;
  }

  this.headingRow().create (this, rp);

  
  this.create (blockName, fixOptional(blab,false), fixOptional(keepFresh,false), 
        fixOptional(stopAtFirstEmptyRow,true), sKey, fixOptional(maxDataRows,0));
  //debugging.....
  if (this.where())DebugPrint(sad(this.where()));
  return this;
};
/**
 * Commit or Clone a cDataSet to cache and commit the cache.
 * @param {Range} optrOut a range specifying either the start of or all of the output data. Default is original source
 * @param {boolean=} optClearWs whether to clear the entire worksheet first- default false.
 * @param {<Array>.*=} optHeadOrderArray An array of the column headings to be written. Default is all of them
 * @param {string=} optFilterHead the name of a column to use to selectively output data - default ''
 * @param {*=} optFilterValue if specified, only rows with values matching this value in optFilterHead column will be output 
 * @param {boolean=} optFilterApproximate if filtering, then whether approximate or exact matching is required- default true
 * @param {boolean=} optOutputHeadings whether to output a heading row - default true
 * @return {number} the number of rows written
 */ 
cDataSet.prototype.bigCommit = function (optrOut, 
                  optClearWs, 
                  optHeadOrderArray, 
                  optFilterHead, 
                  optFilterValue, 
                  optFilterApproximate, 
                  optOutputHeadings) {
                    
    // this one does a quick bulk commit
    var rTarget = fixOptional( optrOut,  this.headingRow().where());
    var targetCache = sheetCache(rTarget);
    //possible that we clear the target worksheet frst
    if(fixOptional(optClearWs,false)){
      targetCache.clear();
    }
    if (IsMissing(optHeadOrderArray)) {
    // its possible to specify only a subset of columns, or reorder them
      var headOrder = this.headings();
    }
    else {
      var headOrder = new collection();
      var s = '';
      for (var nHeads = 0; nHeads < optHeadOrderArray.length; nHeads++ ){
        var hcell = this.headingRow().exists(optHeadOrderArray[nHeads]);
        if (hcell) {
          headOrder.add (hcell, hcell.toString());
        }
        else {
          s += (s ? ',' : '') + optHeadOrderArray[nHeads].toString()  ;
        }
      }
      if(s) MsgBox ("These fields do not exist " + s);

    }

    //is there a filter ?
    var filterCol = 0;
    if(fixOptional(optFilterHead,'')) {
      var hcell = this.headingRow().exists(optFilterHead);
      if (hcell) {
        filterCol = hcell.column();
      }
      else {
        MsgBox (optFilterHead + " does not exist to filter on..ignoring");
      }
    }
    // now output to cache
    var n=0;
    if(headOrder.count()) {
        var outputHeadings = fixOptional (optOutputHeadings, true) ;
        if (outputHeadings) n =1;
        // we're using cache so no problem stepping through this one by one. 
        var self = this;
        var i = 0;
        if (outputHeadings) {
          headOrder.forEach(
            function (hcell) {
              i++;
              targetCache.setValue(hcell.value(),1,i);
            }
          );
        }
        this.rows().forEach(
          function (dr) {
            if(self.filterOk(dr, filterCol, optFilterValue, optFilterApproximate)) {
              n++;
              i=0;
              headOrder.forEach(
                function (hcell) {
                  i++;
                  targetCache.setValue(dr.cell(hcell.column()).value(),n,i);
                }
              );
            }
          }
        );
    }
    targetCache.commit();
    return n;
};
/**
 * check to see if a row matches filter specified in bigcommit - used internally
 * @param {cDataRow} dr the row to consider
 * @param {number} filterCol the column number of column to check
 * @param {*} filterValue the value to check against
 * @param {boolean} optFilterApproximate if filtering, then whether approximate or exact matching is required
 * @return {boolean} whether this row passes the filter test
 */ 
cDataSet.prototype.filterOk = function(dr, filterCol,filterValue, filterApproximate){       
  return filterCol ? 
      (filterApproximate ? 
        Like (dr.cell(filterCol),filterValue) :
        dr.cell(filterCol) == filterValue ) 
        :
      true;
};

cDataSet.prototype.logIt = function(){
  DebugPrint(' datasset',this.name(),sad(this.where()));
  this.rows().forEach ( 
    function(drItem,drIndex) {         // for each row
      DebugPrint('  row',drItem.row(),sad(drItem.where()));
      drItem.columns().forEach ( 
        function(dcItem,dcIndex) {     // for each cell
          DebugPrint ('   item r,c',dcItem.row(),dcItem.column(),dcItem.value(),sad(dcItem.where()));
        }
      )
    }
  )
  DebugPrint('  ncols', this.columns().count());
  var self = this;
  this.columns().forEach ( 
    function(doItem,doIndex) {         // for each column
      DebugPrint('  column',doItem.column(),sad(doItem.where()));
    }
  )  
  this.headings().forEach ( 
    function(dhItem,dhIndex) {         // for each heading
      DebugPrint('  heading',dhItem.value(),sad(dhItem.where()));
    }
  )
  
};
 /**
 * a cCell
 * @class 
 * @implements {cCell}
 * @return {cCell} a new cCell
 */

function  cCell () {
};
/**
 * construct a cCell
 * @param {cDataRow} par the row this belongs in
 * @param {number} colNum the column number 
 * @param {Range} rCell it's address
 * @param {*=} v the value (if not given, will look up the rCell
 * @return {cCell} for chaining
 */  
cCell.prototype.create = function(par, colNum , rCell,  v ) {
      this.xColumn = colNum;
      this.column= function() {
        return this.xColumn;
      };
	  this.xParent = par;
      this.parent= function() {
        return this.xParent;
      };
      this.xWhere = rCell;
      this.where= function() {
        return this.xWhere;
      };
      this.row = function () {
        return this.parent().row();
      };
      
      if (isUndefined(v))   
        this.refresh();
      else 
        this.xValue =  v ;

	  return this;                  
  };
/**
 * remove backlinks to help garbage collector
 * @return {void} 
 */ 
cCell.prototype.tearDown = function() { 
  this.xParent = null;
}
/**
 * refresh a cCell from it's cache
 * @return {*} the value 
 */  
cCell.prototype.refresh = function(){
    return (this.xValue = 
      sheetCache(this.where()).getFirstValueOfRange(this.where()));
  }
/**
 * whether or not we are supposed to be keeping the range for this ccell constatly refreshed
 * @return {boolean} whether it needs to be kept fresh
 */    
cCell.prototype.keepFresh = function() {
       return this.parent().parent().keepFresh();
  };
/**
 * convert to string
 * @param {string=} sFormat the format to use (optional - not yet implemented)
 * @return {string} the cCell value converted to a string
 */  
cCell.prototype.toString = function(sFormat) {
    if (isUndefined(sFormat)) {
      return this.xValue.toString();
    }
    else {
    //TODO
    }
  };
/**
 * the cCell value
 * @return {*} the cCell value 
 */  
  cCell.prototype.value = function() {
    return this.keepFresh() ? this.refresh() : this.xValue;
  };
/**
 * set the cCell value
 * @param {*} p the value to set 
 * @return {*} the cCell value 
 */ 
  cCell.prototype.letValue = function(p) {
    return this.keepFresh()  ? this.commit(p) : (this.xValue = p);
  };
/**
 * say whether this needs swapped in a sort 
 * @param {cCell} cc the cell to compare with
 * @param {ESORT=} es the sort order from the ESORT enum
 * @return {boolean} swap is needed
 */
  cCell.prototype.needSwap = function( cc,es){
    switch (es) {
      case ESORT.ESORTAscending:
        return LCase(this.toString()) > LCase(cc.toString());
      case ESORT.ESORTDescending:
        return LCase(this.toString()) < LCase(cc.toString());  
      default:
        return false;
    }
  };
 /**
 * commit the cCell value to the sheet cache
 * @param {*=} p the value to set and then commit (default, the current ccell value)
 * @return {*} the cCell value 
 */ 
  cCell.prototype.commit = function (p) {
	  if (!isUndefined(p)) {
		  this.xValue = p;
	  }
	  this.where().setValue(this.xValue);
      sheetCache(this.where()).makeDirty();
	  return this.refresh();
  };
//---------------------------------------
// conversion of cDataColumn VBA class to Google Apps Script
// a collection of data Cells representing one column of data
 /**
 * a cDataColumn
 * @class 
 * @implements {cDataColumn}
 * @return {cDataColumn} a new cDataColumn
 */
function  cDataColumn () {
  //-------private properties
  var pCollect =  new collection(); 
  this.rows = function () {
    return pCollect;
  }
  this.xTypeofColumn = ETYPEOFCOLUMN.eTCunknown;
};
 /**
 * return the type of values to be found in this column
 * @return {ETYPEOFCOLUMN} the type of column from ETYPEOFCOLUMN enum
 */ 
cDataColumn.prototype.typeOfColumn = function (){
  return this.xTypeofColumn;
}
 /**
 * return the type of values to be found in this column - GoogleWire names
 * @return {string} the type of column 
 */ 
cDataColumn.prototype.googleType = function() {
  	switch (this.xTypeofColumn) {
        case ETYPEOFCOLUMN.eTCnumeric:
          return "number";
        case ETYPEOFCOLUMN.eTCdate:
          return  "date";
        default:
          return  "string";
  	}    
};

 /**
 * return the column number for this column
 * @return {number} the column number
 */ 
cDataColumn.prototype.column= function() {
      return this.xColumn;
};
 /**
 * return the cDataSet to which this cDataColumn belongs
 * @return {cDataSet} the column number
 */
cDataColumn.prototype.parent= function() {
      return this.xParent;
};
 /**
 * return the cCell where the heading value for this column can be found
 * @return {cCell} the column number
 */
cDataColumn.prototype.headingCell= function() {
      return this.xHeadingCell;
};
 /**
 * return the Range that describes this column's range
 * @return {Range} the range for this column and its data
 */
cDataColumn.prototype.where = function () {
    return this.headingCell().where().offset(1,0,this.parent().where().getNumRows(),1);
};
 /**
 * return the cCell at a particular row  for this column
 * @param (number|string} rowId the string or row number identifying the required row
 * @return {Range} the ccell at the given row 
 */
cDataColumn.prototype.cell = function(rowId){
    return this.parent().cell(rowId, this.headingCell().column());
};
 /**
 * refresh the cCell or entire column
 * @param (number|string=} rowId the string or row number identifying the required row(default- all rows)
 * @return {*} the value of the ccell at the given row, or null if the whole column 
 */ 
cDataColumn.prototype.refresh = function(rowId){
	  if (isUndefined(rowId)) {
		  for ( var i=0; i < this.rows().count() ; i ++){
			  this.rows().item(i+1).refresh();
		  }
		  return null;
	  }
	  else {
		  return (this.cell(rowId)).refresh();
	  }

  };
/**
 * return a collection of cCells containing unique values for this column
 * @param {ESORT=} es the sort order from the ESORT enum
 * @return {collection} collection of cCells
 */
cDataColumn.prototype.uniqueValues = function(es){

  var self = this;
  var vUnique = new collection();
  self.rows().forEach(
    function (cc) {
      // just try to add and dont complain if it doesnt work
      vUnique.add (cc,cc.toString(),false);
    }
  );
  return es == ESORT.ESORTNone ? 
                    vUnique : 
                    ( vUnique.sort ( 
                        es == ESORT.ESORTAscending ? undefined : 
                        function (a,b) { return (a<b) }) 
                    );
    
  };
  // -- max
cDataColumn.prototype.max = function(){
	  	//toDo
  };
  // -- min
cDataColumn.prototype.min = function(){
	  	//toDo
  };
 /**
 * commit the cDataColumn or cCell value to the sheet cache
 * @param {*=} p the value to set and then commit (default, the current ccell value)
 * @param {*=} rowId the row to apply this to (default, the whole column)
 * @return {*} the value of the ccell at the given row, or null if the whole column 
 */ 
cDataColumn.prototype.commit = function(p,rowId){
	  if (isUndefined(rowId)) {
		  for ( var i=0; i < this.rows().count() ; i ++){
			  this.rows().item(i+1).commit(p);
		  }
		  return null;
	  }
	  else {
		  return (this.cell(rowId)).commit(p);
	  }

  };
 /**
 * convert cCell to to string
 * @param {number|string} rowNum the rowId to get the ccell from
 * @param {string} sFormat the format to use TODO
 * @return {*} the formated string
 */ 
cDataColumn.prototype.toString = function(rowNum, sFormat) {
	  return (this.cell(rowNum).toString(sFormat));
  };
 /**
 * construct a cDataColumn 
 * @param {cDataSet} dSet the cDataSet to which this column belongs
 * @param {cCell} hCell the cCell holding the header value for this column
 * @param {hCell} colNum the column number of this cell
 * @return {cDataColumn} the cDataColumn
 */ 
  
cDataColumn.prototype.create = function(dSet,  hCell, colNum ) {
	  this.xColumn = colNum;
	  this.xParent = dSet;
	  this.xHeadingCell  = hCell;
	  return this; 
};
/**
 * remove backlinks to help garbage collector
 * @return {void} 
 */ 
cDataColumn.prototype.tearDown = function() { 
  this.xParent = null;
}  
//---------------------------------------
// conversion of cDataRow VBA class to Google Apps Script

 /**
 * cDataRow a collection of cCells representing one row of data
 * @class 
 * @implements {cDataRow}
 * @return {cDataRow} a new cDataRow
 */
var cDataRow = function  () {
  //-------private properties
  var pCollect = new collection();                   
  //-------public properties ->methods
  this.columns = function() {
      return pCollect;
  };
};  
/**
 * remove backlinks to help garbage collector
 * @return {void} 
 */ 
cDataRow.prototype.tearDown = function() { 
  if (this.column())
    this.columns().forEach(
      function(cc) {
        cc.tearDown();
      }
    );
  this.xParent = null;
}
 /**
 * construct a cDataRow 
 * @param {cDataSet} dSet the cDataSet to which this row belongs
 * @param {Range} rDataRow the spreadsheet range for this row
 * @param {number} nRow the row number of this cell in the cDataSet
 * @param {<Array>.*=} vArray an array of width nRow with the values for this row if known(if not given will be taken from the range)
 * @return {cDataRow} the cDataRow
 */ 
cDataRow.prototype.create = function (dSet, rDataRow, nRow, vArray) {
  this.xWhere = rDataRow;
  this.where = function () {
    return this.xWhere;
  };
  this.xParent = dSet;
  this.parent = function () {
    return this.xParent;
  };
  this.xRow = nRow;
  this.row = function () {
    return this.xRow;
  };
   
  var n = 0;
  
  if( !this.xRow) { 
    var r = firstcell(this.xWhere);
    var nx = this.xWhere.getNumColumns();
  
    for (var i = 0; i < nx ; i++) {
      var dCell = new cCell();
      dCell.create (this,i+1,r);
      this.columns().add (dCell, makeKey(dCell.toString()));
      r=vOffset(r,undefined,1);
    }

  }
  else {
    var hr = this.parent().headingRow();
    for ( var i=0; i < hr.headings().count() ; i++ ){
      var hCell = hr.headings().item(i+1);
      var dCell = new cCell();
      var rCell = this.where().offset(0,hCell.column()-1,1,1);
      var v = vArray[i];
      dCell.create ( this,hCell.column(),rCell,v);
      this.columns().add ( dCell) ;
      // set the type of data
      var dc = this.parent().columns().item(hCell.column(),true);
      if (!IsEmpty(v)){
        if (dc.xTypeofColumn != ETYPEOFCOLUMN.eTCmixed) {
          if (IsDate(v)) {
            if (dc.xTypeofColumn != ETYPEOFCOLUMN.eTCdate) {
                dc.xTypeofColumn = 
                  ( dc.xTypeofColumn == ETYPEOFCOLUMN.eTCunknown ? 
                      ETYPEOFCOLUMN.eTCdate : ETYPEOFCOLUMN.eTCmixed);
            }
          }
          else if (IsNumeric(v)) {
            if (dc.xTypeofColumn != ETYPEOFCOLUMN.eTCnumeric) {
                dc.xTypeofColumn = 
                  ( dc.xTypeofColumn == ETYPEOFCOLUMN.eTCunknown ? 
                      ETYPEOFCOLUMN.eTCnumeric : ETYPEOFCOLUMN.eTCmixed);
            }
          }
          else {
            if (dc.xTypeofColumn != ETYPEOFCOLUMN.eTCtext) {
                dc.xTypeofColumn = 
                  ( dc.xTypeofColumn == ETYPEOFCOLUMN.eTCunknown ? 
                      ETYPEOFCOLUMN.eTCtext : ETYPEOFCOLUMN.eTCmixed);
            }
          }
        }
      }
    }
  }
  return this;
};

 /**
 * get the cCell at given column ID
 * @param {string|number} sid the column name or number to get the cCell from
 * @param {boolean} complain whether to complain if this is an invalid address
 * @return {cCell} the cCell
 */ 
cDataRow.prototype.cell = function(sid,complain) {
  var cc = null;
  if (! (cc = this.exists(sid))){
    if (fixOptional ( complain , true)) {
      	MsgBox (sid.toString() + " is not a known column heading");
    }
  }
  return cc;
};

 /**
 * get the value at given column ID
 * @param {string|number} sid the column name or number to get the value from
 * @return {*} the value
 */ 
cDataRow.prototype.value = function(sid) {
  var cc = this.cell(sid);
  if (cc) {
    return cc.value();
  }
};
 /**
 * refresh the cCell at given column ID
 * @param {string|number=} sid the column name or number to refresh(default the whole row)
 * @return {cCell|null} the cCell if a single cCell specified
 */ 
cDataRow.prototype.refresh = function(sid) {
  if (isUndefined(sid)) {
    this.columns().forEach(
      function (cItem,cIndex) {
        cItem.refresh();
      }
    )
  }
  else{
      return this.cell(sid).refresh();
  }
};
 /**
 * commit the cCell at given column ID
 * @param {*=} p the value to commit (default the current cCell value)
 * @param {string|number=} sid the column name or number to refresh(default the whole row)
 * @return {cCell|null} the cCell if a single cCell specified
 */ 
cDataRow.prototype.commit = function(p, sid) {
   if (isUndefined(sid)) {
    this.columns().forEach(
      function (cItem,cIndex) {
        cItem.commit(p);
      }
    )
  }
  else{
    return this.cell(sid).commit(p);
  }
};
 /**
 * convert the cCell at given column ID to a string
 * @param {string|number} sid the column name or number to format
 * @param {string=} sFormat the format to use (TODO)
 * @return {string} the converted string
 */ 
cDataRow.prototype.toString = function(sid, sFormat) {
  return (this.cell(sid).toString(sFormat));
};
 /**
 * return the cCell at the given column if it exists
 * @param {string|number} sid the column name or number to format
 * @param {boolean=} complain whether or not to complain if ccel doesnt exist
 * @return {cCell} the cCell
 */ 
cDataRow.prototype.exists = function(sid,complain){
  var c = fixOptional (complain, false);
  return isTypeNumber (sid) ?  
    this.columns().item(sid,c) : 
    this.columns().item(this.parent().headings().item(sid,c).column(), c ) ; 
};
//----------------------------------------------------------
// conversion of cHeadingRow VBA class to Google Apps Script
// a  data rows representing headings in a table
var cHeadingRow = function  () {
  this.xDataRow = new cDataRow();
}; 
cHeadingRow.prototype.create = function(dSet, rHeading, keepFresh){
  this.xDataRow.create ( dSet, rHeading,0, keepFresh);
  return this;
};
cHeadingRow.prototype.dataRow = function(){
  return this.xDataRow;
};
cHeadingRow.prototype.parent = function(){
  return this.xDataRow.parent();
};
cHeadingRow.prototype.headings = function(){
  return this.xDataRow.columns();
};
cHeadingRow.prototype.where = function(){
  return this.xDataRow.where();
};
cHeadingRow.prototype.exists = function(s,complain){
  return this.headings().item(makeKey(s),complain);
};
cHeadingRow.prototype.validate = function(complain,args){
  var s ='';
  for( var i = 1; i < arguments.length; i++ ) {
		if (!this.exists(arguments[i],false)) {
          if (s) s += ",";
          s += arguments[i].toString()  ;
        }
  }
  if (s) {
    if (complain) {
      MsgBox("The following required columns are missing from dataset " + 
          this.parent().name() + ":" + s);
    }
    return false;
  }
  else
    return true;

};

//---------------------------------------------
// conversion of cDataSets VBA class to Google Apps Script
// a collection of cDataSets
var cDataSets = function  () {
  //-------private properties
  var pCollect = new collection(); 
  var pName ='DataSets';
  //-------public properties ->methods
  this.dataSets = function() {
      return pCollect;
  };
  this.dataSet = function(n,complain) {
      return pCollect.item(n,fixOptional(complain,false));
  };
  this.name = function(){
      return pName;
  }
  this.create = function(sName) {
      if (!isUndefined(sName)) pName = sName;
      return this;
  };
  this.init = function(rInput, keepFresh, 
                sn , 
                blab , blockstarts , 
                bLikely , 
                sKey) {
    ds = new cDataSet();
    ds.populateData (rInput, keepFresh, sn, blab, blockstarts, this, bLikely, sKey);
    return pCollect.add(ds,ds.name());
  };

};
/**
 * remove backlinks to help garbage collector
 * @return {void} 
 */ 
cDataSets.prototype.tearDown = function() { 
  // no back links
}

cDataSets.prototype.logIt=function(){
  
  DebugPrint('datassets',this.name(),this.dataSets().count() + ' datasets');
  this.dataSets().forEach(                // for each dataset
    function(dsItem,dsIndex) {
      dsItem.logIt();
    }
  )
};
//------------------------------------------
