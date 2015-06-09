/** @description
 * javaScript/Google Apps script functions that are equivalent to common VBA functions
 * in general these provide the same functionality and have the same calling stack
 * See http://ramblings.mcpher.com/Home/excelquirks/codeuse for more details
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a><a href="http://ramblings.mcpher.com"> ramblings.mcpher.com</a>
 */

/**
 * Removes leading and trailing whitespace
 * @param {string|number} v the item to be trimmed 
 * @return {string} The trimmed result
 */
function Trim(v) {
  return LTrim(RTrim(v));
}
/**
 * Removes leading whitespace
 * @param {string|number} s the item to be trimmed
 * @return {string} The trimmed result
 */
function LTrim(s) {
  return CStr(s).replace(/^\s\s*/, "");
}
/**
 * Removes trailing whitespace
 * @param {string|number} s the item to be trimmed
 * @return {string} The trimmed result
 */
function RTrim(s) {
  return CStr(s).replace(/\s\s*$/, "");
}
/**
 * gets the .toString length
 * @param {string|number} v the item 
 * @return {number} The length
 */
function Len(v) {
  return CStr(v).length ;
}
/**
 * gets the leftmost portion of an item
 * @param {string|number} str the item 
 * @param {number=} optLen length of result(default all)
 * @return {string} The left portion of the string
 */
function Left(str,optLen) {
  return Mid( str, 1 , optLen);
}
/**
 * gets the rightmost portion of an item
 * @param {string|number} str the item 
 * @param {number=} optLen length of result(default all)
 * @return {string} The right portion of the string
 */
function Right(str,optLen) {
  return Mid( str, 1 + Len(str) - fixOptional ( optLen, Len(str) )  );
}
/**
 * gets and extract from a string
 * @param {string|number} str the item 
 * @param {number=} optStart start position(base 1) of extract
 * @param {number=} optLen Number of characters (default all remaining)
 * @return {string} The extracted string
 */
function Mid (str,optStart,optLen) {
  var s = CStr(str);
  var start = IsMissing (optStart) ? 0 : optStart - 1;
  start = start < 0 ? 0 : start;
  var length = IsMissing (optLen) ?  Len(s) - start + 1 : optLen ;
  DebugAssert( s.slice, s + ' is not a valid string for Mid');
  return  s.slice ( start, start + length);
}
/**
 * Splits an item into an array of strings
 * @param {string|number} s the item 
 * @param {string=} optDelim delimiter(default ,)
 * @param {number=} optLimit max number of splits(default all)
 * @return {Array.<string>} The split arrray of strings
 */
function Split(s,optDelim,optLimit) {
  return CStr(s).split(fixOptional(optDelim,","),fixOptional(optLimit,-1));
}
/**
 * Returns a string of the same character repeated n times
 * @param {number} n number of times to repeat
 * @param {string=} s the character to repeat (default ' ');
 * @return {string} the string of repeats
 */
function Rept(n,s){
  return n > 0 ?  Array(n+1).join(CStr(fixOptional(s,' '))) : '';
}
/**
 * Returns a string of ' ' repeated n times
 * @param {number} n number of times to repeat
 * @return {string} the string of blanks
 */
function Space(n){
  return Rept(n);
}
/**
 * Returns a string converted to lower case
 * @param {string} s item to be converted
 * @return {string} item in lower case
 */
function LCase(s) {
  return CStr(s).toLowerCase();
}
/**
 * Returns a string converted to upper case
 * @param {string} s item to be converted
 * @return {string} item in upper case
 */
function UCase(s) {
  return CStr(s).toUpperCase();
}
/**
 * Returns a string representing a numeric char code
 * @param {number} n numeric code
 * @return {string} the equivalent character
 */
function Chr(n) {
  return String.fromCharCode(n);
}
/**
 * Returns a numeric char code given a character
 * @param {string} s the character
 * @return {number} the equivalent code
 */
function Asc(s) {
  return s.charCodeAt(0);
}
/**
 * Returns the position at which a string starts(base1)
 * @param {number=} optStart the position to start looking from(default 1)
 * @param {string} inThisString the the string to lookin
 * @param {string} lookFor the string to look for
 * @param {number=} optCompare not yet implemented
 * @return {number} the position the string starts at or 0 if not found
 */
function InStr(optStart,inThisString,lookFor,optCompare) {
// TODO optCompare
  var start = fixOptional (optStart, 1);
  var s = Mid (inThisString, start);
  var p = s.indexOf(lookFor);
  return (s && lookFor) ? (p == -1 ? 0 : p+start ): 0;
}
/**
 * Returns the position at which a string starts(base1), starting at the end
 * @param {string} inThisString the the string to lookin
 * @param {string} lookFor the the string to look for
 * @param {number=} optStart the position to start looking from(default: the end)
 * @param {number=} optCompare not yet implemented
 * @return {number} the position the string starts at or 0 if not found
 */
function InStrRev(inThisString,lookFor,optStart,optCompare) {
// TODO optCompare
  var start = fixOptional (optStart, -1);
  var s = CStr(inThisString);
  start = start == -1 ? Len(s) : start ;
  return (s && lookFor) ? s.lastIndexOf(lookFor,start-1)+1 : 0;
}

// Date functions

/**
 * Returns a date object
 * @param {number} y year
 * @param {number} m month
 * @param {number} d day
 * @return {Date} a date object
 */
function DateSerial(y,m,d){
  return new Date(y,m,d);
}
/**
 * Returns the year from a date
 * @param {Date} dt a date object
 * @return {number} the year
 */
function Year(dt){
  return dt.getFullYear();
}
// Conversion functions
/**
 * Returns item converted to a string
 * @param {*} v item to be converted
 * @return {string} item converted to a string
 */
function CStr(v) {
  return v===null || IsMissing(v) ? '' :  v.toString()  ;
}
/**
 * Returns item converted to a float
 * @param {*} v item to be converted
 * @return {number} item converted to a float
 */
function CDbl(v) {
  return parseFloat(v) ;
}
/**
 * Returns item converted to a int
 * @param {*} v item to be converted
 * @return {number} item converted to a int
 */
function CLng(v) {
  return isTypeNumber(v) ? Math.round(v) : parseInt(v,10) ;
}

// Maths functions
/**
 * Returns item converted to a string
 * @param {boolean} a first item
 * @param {boolean} b second item
 * @return {boolean} exclusive OR of two items
 */

function Xor (a,b) {
  return a ? !b : b ;
}
/**
 * Returns absolute value of a number
 * @param {number} x value
 * @return {number} absolute value
 */
function Abs (x) {
  return Math.abs(x);
}

// Informational functions
/**
 * Returns whether this is an 'empty' value
 * @param {*} v item to check
 * @return {boolean} true if item is empty
 */
function IsEmpty(v) {
  return typeof(v) == "string" && v == Empty();
}
/**
 * Returns whether item is a valid date
 * @param {string} sDate item to check
 * @return {boolean} true if item can be converted to a date
 */
function IsDate(sDate) {
  var tryDate = new Date(sDate);
  return (tryDate.toString() != "NaN" && tryDate != "Invalid Date") ;
}
/**
 * Returns whether item is a valid number
 * @param {string} s item to check
 * @return {boolean} true if item can be converted to a number
 */
function IsNumeric(s) {
  return !isNaN(parseFloat(s)) && isFinite(s);
}
/**
 * Returns whether item is a missing argument
 * @param {*} x item to check
 * @return {boolean} true if item is undefined
 */
function IsMissing (x) {
  return isUndefined(x);
}
/**
 * Returns whether item is an object
 * @param {*} x item to check
 * @return {boolean} true if item is an object
 */
function IsObject (x) {
  return VarType(x) == 'object';
}
/**
 * Returns whether item is an array
 * @param {*} x item to check
 * @return {boolean} true if item is an array
 */
function IsArray (x) {
  return isArray(x) ;
}
/**
 * Returns whether item is null
 * @param {*} x item to check
 * @return {boolean} true if item is exactly null
 */
function IsNull (x) {
  return x===null ;
}
/**
 * Returns item type
 * @param {*} v item to check
 * @return {string} the java script type 
 */
function VarType (v) {
  return typeof v;
}

//Constant replacements
/**
 * Returns empty
 * @return {string} that satisfies IsEmpty() 
 */
function Empty() {
  return "";
}
/**
 * Returns LF
 * @return {string} line feed character
 */
function vbLf() {
  return "\n";
}
/**
 * rnd returns random number between 0 and 1
 * @return {number} random number
 */
function Rnd() {
  return Math.random();
}
/**
 * atan2 returns Atan2 
 * @param {number} x
 * @param {number} y
 * @return {number} atan2
 */
function Atan2(x,y) {
  // note that VBA arguments are opposite way round to javascript
  return Math.atan2(y,x);
}
// interaction functions
/**
 * Displays a dialog box
 * @param {string} a message to display
 */
function MsgBox(a) {
    // cant do this as a library 
    try {
      Browser.msgBox( a);
    }
    catch (err) {
      DebugPrint('MsgBoxSubstitute',a);
    }
}
/**
 * Displays a dialog box and gets input
 * @param {string} a message to display
 * @return {string} user input
 */
function InputBox(a) {
    return Browser.inputBox(a);
}
// Sheet access functions
/**
 * Gets a sheet
 * @param {string} wn sheet Name
 * @return {Sheet} a sheet
 */
function Sheets(wn) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(wn);
}

/**
 * Gets a sheet
 * @param {string} wn sheet Name
 * @return {Sheet} a sheet
 */
function WorkSheets(wn) {
  return Sheets(wn);
}
/**
 * Gets the active workbook
 * @return {Spreadsheet} a workbook
 */
function ActiveWorkbook() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
/**
 * Gets the workbook name
 * @param optWb a workbook (spreadsheet) - default the active one
 * @return {String} a name
 */
 function WorkbookName(optWb) {
  return IsMissing(optWb) ? ActiveWorkbook().getName() : optWb.getName();
}
/**
 * Gets the active sheet
 * @return {Sheet} a sheet
 */
function ActiveSheet() {
  try {
   return SpreadsheetApp.getActiveSheet(); 
  }
  catch(err) {
   return null;
  }
}
/**
 * Gets the active range
 * @return {Range} a range
 */
function ActiveRange() {
  return SpreadsheetApp.getActiveRange();
}
/**
 * Gets the address of a range in string format
 * @param {Range} r a range
 * @return {string} its address
 */
function Address(r) {
  return r.getA1Notation();
}
/**
 * Gets a sheet a range is on
 * @param {Range} r a range
 * @return {Sheet} a sheet
 */
function WorkSheet (r) {
  return r.getSheet();
}
/**
 * Gets a the name of sheet
 * @param {Sheet} ws a sheet
 * @return {string} its name
 */
function WorkSheetName(ws) {
  return  ws ? ws.getName() : '' ;
}
/**
 * Resizes a range
 * @param {Range} r a source range
 * @param {number=} nr new number of rows (default as source)
 * @param {number=} nc new number of columns (default as source)
 * @return {Range} the resized range
 */
function vResize (r,nr,nc) {
  if (( nr <= 0 && !isUndefined(nr)) || (nc <= 0 && !isUndefined(nc))) 
    return null;
  else {
    var rr = isUndefined(nr) ? r.getNumRows() : nr;
    var rc = isUndefined(nc) ? r.getNumColumns() : nc;
    return r.offset ( 0,0, rr,rc);
  }
}
/**
 * the offset of a range
 * @param {Range} r a source range
 * @param {number=} ro number of rows down from source range (default 0)
 * @param {number=} co number of rows right from source range (default 0)
 * @return {Range} the repositioned range
 */
function vOffset (r,ro,co) {
    return r.offset ( fixOptional (ro,0), fixOptional (co,0) );
}
//Debug functions
/**
 * An exception to throw on assert failure
 * @constructor
 * @param {string} what a message to display on failed assertion
 */
function VbaAssert(what) { 
  this.what = fixOptional(what,"no assertion text given"); 
  this.toString = function () {
     return 'VbaAssert: ' + this.what;
  };
}

/**
 * throw an exception if not true
 * @param {*} arg given value
 * @param {*} defaultValue value to use if given value IsMissing
 * @return {*} the new value 
 */
function fixOptional (arg, defaultValue) {
  if (isUndefined(arg) ){
    DebugAssert(!isUndefined(defaultValue) ,
      'programming error: no default value for missing argument');
    
    return defaultValue;
  }
  else 
    return arg;
}
/**
 * Check if a value is defined
 * @param {*} arg given value
 * @return {boolean} true if undefined
 */
function isUndefined ( arg) {
  return typeof arg == 'undefined';
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
/**
 * Check if a value is a number type
 * @param {*} arg given item
 * @return {boolean} true if numeric type
 */
function isTypeNumber ( arg) {
  return typeof arg == 'number';
}
/**
 * Check if a value is a string type
 * @param {*} arg given item
 * @return {boolean} true if string type
 */
function isTypeString ( arg) {
  return typeof arg == 'string';
}
/**
 * Check if a value is an array
 * @param {*} arg given item
 * @return {boolean} true if array
 */
function isArray (arg) {
  return toType(arg) == 'array';
}
/**
 * used throughout to normalize strings for comparison
 * @param {*} v given item
 * @return {string} cleaned up string
 */
function makeKey(v) {
    return LCase(Trim(CStr(v)));
}
/**
 * returns a dat object with current time
 * @return {date} a date object
 */
function Now() {
  return new Date();
}

// mimic a collection
// item is stored with a string key
// can be retireved either by its position or by string key
// automatically adjusted to match the base (1 for VBA)
/**
 * VBA like collection
 * @class
 * @implements {collection}
 * @param {number=} base base for constructor (default 1)
 * @param {number=} cleanKey opt_argument whether to use makeKey on key values
 * @param {string=} optName opt_argument an optional name to give to this collection
 * @return {collection} collection
 */

function collection(base,cleanKey,optName) {
  var pBase = fixOptional ( base , 1);
  var pCleanKey = fixOptional ( cleanKey , true);
  var pItems =[];
  var pKeys ={};
  var pLastUsed =-1;
  var self = this;
  var pName = fixOptional (optName, "mcpherCollection");
  /**
   * Returns the base
   * @this {collection} 
   * @return {number} the base for this collection
   */
  this.base = function() {
    return pBase;
  };  
  /**
   * Returns the name
   * @this {collection} 
   * @return {string} the name for this collection
   */
  this.name = function() {
    return pName;
  }; 
  /**
   * Returns the items array
   * @this {collection} 
   * @return {<Array>.*} the items in this collection
   */
  this.items = function() {
    return pItems;
  };
 /**
   * Returns the number of items in the collection
   * @this {collection} 
   * @return {number} the count of items in collection
   */
  this.count = function() {
    return pItems.length;
  };
 /**
   * Returns the keys object for this collection
   * @this {collection} 
   * @return {object} the keys object
   */
  this.keys = function () {
    return pKeys;
  };
 /**
   * create a key for this item
   * @this {collection} 
   * @return {string} a key
   */
  this.generateKey = function () {
     return makeKey(EGAHACKS.EGAHACKSCo + (++pLastUsed).toString());
  }; 
  /**
   * return an item given its key
   * @this {collection} 
   * @param {string|number} they key of the item to find
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {*} the found item
   */
    // -- item returns null or the item
  this.item = function (k,complain) {
    var x;
    var y = isUndefined(x = self.index(k,complain)) ? null : pItems[x];
    return  y;
  };
  // -- swap - position swap for a and b - useful for sorting
  /**
   * swap the position of 2 items
   * @this {collection} 
   * @param {string|number} they key of the first item
   * @param {string|number} they key of the second item   
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {collection} the collection
   */
  this.swap = function (a,b,complain) {
    var xa = self.index (a, complain);
    var xb = self.index (b, complain);
    if (isUndefined (xa) || isUndefined(xb) ) {
    // didnt find the swapees
      return null;
    }
    // we dont know the keys for a & b so find them
    var ka = self.findKey(xa+this.base());
    var kb = self.findKey(xb+this.base());
    DebugAssert (! (isUndefined(ka) || isUndefined(kb)), 'logic error in swap');
    // swap the items
    var t = pItems[xa];
    pItems[xa] = pItems[xb];
    pItems[xb] = t;
    // repoint the keys
    pKeys[ka]=xb;
    pKeys[kb]=xa;
    // all was good
    return self;
  };
  // does a sort based on your comparison function
 /**
   * sort a collection
   * @this {collection} 
   * @param {function(*,*)=} opt_argument a function that will do a comparison between 2 items
   * @return {collection} the collection
   */
  this.sort = function (yourNeedSwap) {
    // provide a default comparison function
    var swap = fixOptional(yourNeedSwap,function (a,b) { return (a>b) }) ;
    // do the sort
    for (var ita = 0; ita < self.count() -1 ; ita ++ ) {
      for (var itb = ita ; itb < self.count()  ; itb ++ ) {
        if (swap(pItems[ita],pItems[itb])) {
          self.swap(ita+self.base(),itb+self.base());
        }
      }
    }
    return self;
   }
  // -- add - returns null or newly added item
  /**
   * add an item
   * @this {collection} 
   * @param {*} the item to add
   * @param {string|number} they key to add  
   * @param {boolean=} opt_argument whether to complain if not found
   * @param {*=} opt_argument not implemented yet
   * @param {*=} opt_argument not implemented yet
   * @return {*} the added item
   */
  this.add = function (o,k,complain,before,after) {
    // everything must have a key, so make one if not given
    var ks = isUndefined(k) ? 
      self.generateKey() : 
      (pCleanKey ? makeKey(k.toString()) : k.toString()); 
  // see it it exists already
    if (this.item(ks,false)) {
      if (fixOptional(complain,true)) {
        MsgBox ("item " + ks + " already in collection ");
      }
      return null;
    }
    else {
      // add it to the end, and store the position in array against the key
      var x = (pKeys[ks] = pItems.push(o) -1) ;
      return pItems[x];
    }
  };

  // -- index figures out the index number or undefined
  /**
   * get the index (position) of an item
   * @this {collection} 
   * @param {string|number} the key of the required item
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {number} the index of the item
   */
  this.index = function (k,complain) {
    // get the index of the item,either by checking the key or directly
    // note that if the input is a number, it follows the base for the collection
    // the returned value is the 0 based index into the pitems array
    var x = isTypeNumber(k) ? k - pBase : pKeys[pCleanKey ? makeKey(k) : k];
    if (isUndefined(x) ) {
        if (fixOptional(complain,true)) {
          MsgBox ("Requested item " + k  + " not in collection");
        }
    }
    return x;
  };
  /**
   * get the key of an item from its index
   * @this {collection} 
   * @param {string|number} the key of the required item
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {number} the index of the item
   */
  this.findKey = function (k, complain) {
    if ( !isUndefined(x = self.index(k,complain)) ) {
      for (c in pKeys) {
        if (pKeys[c] == x) return c; 
      }
      DebugAssert(false,'findkey couldnt find ' + k);
    }
    
  }; 

  // -- remove returns the index or undefined if it didnt work
  /**
   * remove an item
   * @this {collection} 
   * @param {string|number} the key of the required item
   * @param {boolean=} opt_argument whether to complain if not found
   * @return {number} the index of the item
   */
  this.remove = function (k,complain) {

    if ( !isUndefined(x = self.index(k,complain)) ) {
      // remove from key object & decrement anything higher
      for (c in pKeys) {
        if (pKeys[c] == x){
          delete pKeys[c];
        } 
        else if (pKeys[c] > x) {
          pKeys[c]--;
        }
      }
      pItems.splice(x,1);
    }
    return x;
  };
  /**
   * enumerate a collection
   * @this {collection} 
   * @param {function(*,number)} a function that will be called for each item
   */
  this.forEach = function(yourFunction) {
    for (var i = 0 ; i < self.count() ; i++ ) {
     if (yourFunction( self.item(i+pBase), i+pBase)) break ; 
    }
  };

};

/**
 * Enum for sorting.
 * @enum {number}
 */
var ESORT = Object.freeze(
{'ESORTNone':1000,  
'ESORTAscending':1001, 
'ESORTDescending':1002}
);
/**
 * Enum for constant identifiers.
 * @enum {string}
 */    
var EGAHACKS = Object.freeze(
{'EGAHACKSCo':'~g~',
 'EGAHACKSTimer':'~t~'}
);

/**
 * Format an item for debugging purposes
 * @param {*} a an item to be converted
 * @return {string} a formatted version of the item
 */
function DebugItem(a) {
  var t='';
  if (isArray(a)) {
    for (var i=0;i<a.length;i++ ) 
        t+=  (t ? ',' : '')+ (DebugItem(a[i]) );
    return '[' + t + ']';
  }
  else if (IsObject(a)) {
    t+=JSON.stringify(a);
  }
  else if (IsMissing(a)) 
    t+= 'null';
    
  else if (!a.toString) {
    t += a? 'errordebugging' : '(null)' ; 
  }
  else {
    t+= a.toString();
  }
  return t;
}
/**
 * Format an item for debugging purposes
 * @param {...} var_args an array of items to log
 * @return {string} a formatted version of the items
 */
function DebugPrint(){
  Logger.log(DebugString(arguments));
}
/**
 * Format an item for debugging purposes
 * @param {...} var_args an array of items to format
 * @return {string} a formatted version of the items
 */
function DebugString(){
  var s ='';
  for( var i = 0; i < arguments.length; i++ ) {
    if (s) s += "|";
    s+= DebugItem (arguments[i]) ;
  }
  return s;
}
/**
 * throw an exception if not true
 * @param {*} mustBeTrue value to assert
 * @param {string} sayWhat additional message to to throw
 * @return {*} the value to assert is returned
 */
function DebugAssert(mustBeTrue, sayWhat) {
  if (!mustBeTrue) 
      throw new VbaAssert(fixOptional(sayWhat,"no assertion supplied"));
      
  return mustBeTrue;
}
    