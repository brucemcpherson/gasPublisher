

var ETYPEOFCOLUMN = Object.freeze(
{'eTCdate':2000, 
'eTCnumeric':2001,
'eTCtext':2002,
'eTCmixed':2003,
'eTCboolean':2004,
'eTCunknown':2005}
);

var EJSONCONV = Object.freeze(
{'EJSONCONVPropertyNames':3000} 
);

var STREATS = Object.freeze(
{'stcAnnual':5000,
'stcDuration':5001,
'stcOneOffStart':5002,
'stcOneOffFinish':5003,
'stcDefault':5000 }
);

var ECONSTANTS = Object.freeze(
{'cJobName': 'cDataSet' ,
'cVersion': 3.00,
'nameStub': '_rm_',
'frameID': '_frame_',
'maxTicks':24, 
'mths': ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
'cNull': '_null',
'cRoot':'_deserialization'}
);  


var SCTYPES = Object.freeze(
{'sctdata':4000,
'sctframe':4001,
'sctscale':4002} 
);

var SCHARTTYPES = Object.freeze(
{ 'ctShale' : 6000,
'ctColumnStacked': 6001,
'ctLine': 6002,
'ctNone': 6003,              
'ctDefault' : 6003,
'ctBar' : 6004, 
'ctColumn': 6005}
);

var SHAPETYPES = Object.freeze(       
{'stPentagon': 7000,
'stRectangle': 7001,
'stDefault': 7001,
'stRoundedRectangle': 7003,
'stChevron': 7004,
'stNotchedRightArrow': 7005,
'stRightArrow': 7006,
'stRightArrowCallout': 7007,
'stNone':  7008,
'stRectangularCallout': 7009,
'stRoundedRectangularCallout':7010,
'stLineCallout2AccentBar': 7011,
'stPanel': 7012 }
);
var ERRESTTYPE = Object.freeze(       
{'erQueryPerRow': 8000,
'erSingleQuery': 8001 }
);
var EBADGES = Object.freeze(
{'badge':"badge",
'badgeCollection':"badgeCollection",
'panelSet':"panelSet",
'single':"s",
'multiple':"m",
'text':"t",
'numeric':"n",
'question':"question",
'questionSet': "questionset",
'award':'award' }
);


function Like (a,b) {
  // TODO need to do some work using regEx .. for moment...
  return Trim(Lcase(a)) == Trim(Lcase(b));
}

function addSlashes(str) {
  if (isTypeString(str)){
    str=str.replace(/\\/g,'\\\\');
    str=str.replace(/\'/g,'\\\'');
    str=str.replace(/\"/g,'\\"');
    str=str.replace(/\0/g,'\\0');
    return str;
  }
  else
    return str;
}
function stripSlashes(str) {
  str=str.replace(/\\'/g,'\'');
  str=str.replace(/\\"/g,'"');
  str=str.replace(/\\0/g,'\0');
  str=str.replace(/\\\\/g,'\\');
  return str;
}
function quote(s) {
    return q() + s + q();
}
function q() {
  return '"';
}
function addDays(d, n, e) {
	var xd = new Date(d);
	xd.setDate(xd.getDate() + n);
	if (e < 0) {
		return new Date(xd.getFullYear(), xd.getMonth(), xd.getDate());

	} else if (e > 0) {
		var nd = new Date(xd.getFullYear(), xd.getMonth(), xd.getDate() + 1);
		return (new Date(nd - 1));

	} else
		return xd;
}

function daysDiff (a, b) {
	var oneDay = 1000 * 60 * 60 * 24;
	return Math.floor(b.getTime() / oneDay) - Math.floor(a.getTime() / oneDay);
}
function shortYear (d) {
	return d.getYear() % 100;

}
function timeStamp() {
  return Now().getTime();
}
function unixTime(d) {
  return (fixOptional ( d, timeStamp() )/1000).toFixed();
  
}
function padYear (d) {
	return padTemplate(shortYear(d), '00');
}
function padTemplate (n, template) {
	return (template + n.toString()).slice(-template.length);
}
function niceDate (d) {
	return d ? (d instanceof Date ? d.getDate().toString() + '-'
			+ ECONSTANTS.mths[d.getMonth()] + '-' + padYear(d)
			: (typeof d == 'number' ? d.toFixed(1) : tryString(d))) : '';

}
function tryString (a) {
	return a ? a.toString() : '';
}

function isStringTrue(s) {
  var x = LCase(s.toString());
  return ( x== "yes" || x == "y" || x == "1" || x == "true");
}


function qs() {
  return "'";
}
/**
 * transpose an array (swap rows and columns)
 * @param {<array>.*} a the array to transpose
 * @return {<array>.*} the transposed array
 */

function arrayTranspose(a) {
  //swap rows and columns- assumes this is a square array
  //first prepare the new shape - no of rows = input no of columns
  var v = new Array(a[0].length);
  // no of columns  input number of rows
  for(var i =0 ; i < v.length ; i++) v[i] = new Array(a.length);
  //now move the values in
  for (var i=0; i < a.length ;i++){
    for (var j=0; j < v.length ;j++)v[j][i] = a[i][j];
  }
  return v;
}

//------------------------------------------
//-- UsefulStuff- these are generally useful functions in both GA & vba
/**
 * find a value in a range (approximate match)
 * @param {number|string} x the value to look for
 * @param {Range} r the range to look in
 * @param {boolean=} complain whether or not to complain if not found (false default)
 * @param {boolean=} singlecell whether or not to return the a single cell (false default, return the row)
 * @return {range} the range as a string
 */
function cleanFind(x , r , complain , singlecell ){
  DebugAssert(!isUndefined(r),'call to find ' + x + ' with undefined range');
  var t = makeKey(x);
  var rFound = null;
  if (!isUndefined(r)) {
    var cache = sheetCache(r);
    cache.forEach(
      function(v,row,col){
        if (makeKey(v) == t ) {
          rFound = fixOptional (singlecell,false) ? 
            firstcell (vOffset(r,row-1,col-1)) : firstRow(vOffset(r,row-1,col-1));
          return true;
        }  
     }
    );
    if (!rFound) {
          if(fixOptional (complain, false)) 
              msglost(x,r);
    }      
  }
  return rFound;
}
function msglost(x, r , extra){
   
    MsgBox ("Couldnt find " + CStr(x) + " in " + sad(r) 
      + " " + fixOptional(extra,''));
}
/**
 * string representation of a range
 * @param {Range} r the range
 * @return {string} the range as a string
 */
function sad(r){
// this needs extending

  return r ? "'"+WorkSheetName(WorkSheet(r))+"'!"+r.getA1Notation() : 
    "sad was called with null range";
}
/**
 * the first cell in a given range
 * @param {Range} r the range
 * @return {Range} a range representing the first cell in the given range
 */
function firstcell(r) {
  return vResize(r,1,1);
}
/**
 * the first row in a given range
 * @param {Range} r the range
 * @return {Range} a range representing the first row in the given range
 */
function firstrow(r){
  return vResize(r,1);
}
/**
 * the first column in a given range
 * @param {Range} r the range
 * @return {Range} a range representing the first column in the given range
 */
function firstcolumn(r){
  return vResize(r,undefined,1);
}
/**
 * the last cell in a given range
 * @param {Range} r the range
 * @return {Range} a range representing the last cell in the range
 */
function lastcell(r){
  return r.offset(r.getNumRows()-1,r.getNumColumns()-1,1,1);
};
/**
 * a range for all cells in a worksheet, given a range in that sheet
 * @param {Range=} r the range (default the activesheet)
 * @return {Range} a range representing all the cells in the sheet
 */
function wholeRange(r) {
  return wholeWs(WorkSheet(r));
}
/**
 * a range for all cells in a worksheet
 * @param {string=} wn the worksheet name (default the activesheet)
 * @return {Range} a range representing all the cells in the sheet
 */
function wholeSheet(wn) {
  return wholeWs(IsObject(wn) ? wn : Sheets(wn));
}
/**
 * a range for all cells in a worksheet
 * @param {Sheet=} ws the worksheet (default the activesheet)
 * @return {Range} a range representing all the cells in the sheet
 */
function wholeWs(ws) {
  return isUndefined(ws) ? 
    ActiveSheet().getDataRange() :
    ws.getDataRange();
}

function getLikelyColumnRange(wn) {
    return toEmptyBox(wholeSheet(wn));          
}

function firstEmptyColumnOffset(cache,rn){
  // index of the first empty cell
  var tc = 0;
  while( !IsEmpty(cache.getValue(rn,tc))) tc++;
  return tc  ;
}
function toEmptyCol(r){
    var p = r ? firstEmptyColumnOffset(sheetCache(r),r.getRow()) -1  : 0 ;
    return p > 0 ? vResize (r,undefined, p  ) : null ;
}

function tryToast(m) {
  try {
   ActiveWorkbook().toast(m);
  }
  catch(e) {
    MsgBox(m);
  }
  
}
function toEmptyRow(r){
  if (r) {
    var cache = sheetCache(r);
    var startRow = r.getRow();
    var rowCount = cache.getRowCount();
    var colCount = Math.min(cache.getColumnCount(),r.getNumRows());
    
    var tr = startRow;
    // stop when we get a completely empty row
    for (;tr <= rowCount;tr++) {
      var tc = 1;
      for (; tc <= colCount ; tc ++ ) {
        if (!IsEmpty(cache.getValue(tr,tc))) break;
      }
      // did we find an empty row?
      if ( tc > colCount ) break;
    }
    // this is the range that has data
    return vResize( r, tr - startRow);
 }
 else {
   return null;
 }
}

function toEmptyBox(r){

  return toEmptyCol(toEmptyRow(r));
}


function rangeExists(sw, complain) {
    var x = wholeSheet(sw);
    if (!x && fixOptional(complain,true))
        MsgBox ("Sheet " + sw + " doesnt exist");
    return x ;
}
function degreesToRadians(degrees ) {
    return degrees / 57.29577951308;
}
/**
 * encode a string for inclusion in a URI
 * @param {string} s string to encode
 * @return {string} encoded string
 */
function URLEncode(s) {
  return encodeURIComponent(s);
}
/**
 * Gets a sheet and  complains if required
 * @param {string} wn sheet Name
 * @param {boolean} complain whether to complain
 * @return {Sheet} a sheet
 */
function sheetExists(wName,complain) {
  var wn = null;
  try {
    wn= SpreadsheetApp.getActiveSpreadsheet().getSheetByName(wName);
  }
  catch (e) {
    wn=null;
    DebugPrint(e);
  }
  if (complain && !wn) MsgBox("sheet " + wn + " doesn't exist");
  return wn;
 
}
/**
 * takes a javaScript like options paramte and converts it to cJobject - options can be jSon string or js object
 * @param {object|string} options as either js object or jSon string
 * @return {cJobject} The cJobject
 */
function jSonArgs(options) {

   // it can be accessed as job.child('argName').value or job.find('argName') etc.
    var cj = new cJobject().init(null);
    
    return options ? 
      (IsObject(options) ? 
        cj.fromNative(options) : 
        cj.deSerialize(options)
      ) : 
      null ;
}
/**
 * this works like $.extend in jQuery - merges two options into 1
 * @param {object|string=} optional givenOptions as either js object or jSon string
 * @param {object|string=} optional optDefaultOptions as either js object or jSon string
 * @return {cJobject} The merged cJobject with the given options overriding any maching default ones
 */
function optionsExtend(givenOptions, optDefaultOptions) {
    // this works like $.extend in jQuery.
    // given and default options arrive as a json string or js object
    // example -
    // optionsExtend ("{'width':90,'color':'blue'}", "{'width':20,'height':30,'color':'red'}")
    // would return a cJobject which serializes to
    // "{width:90,height:30,color:blue}"
    // if you need it as a js object (rather than cJobject) then call as optionsExtend(...).toNative();
    
    var jGiven = jSonArgs(givenOptions);
    var jDefault = jSonArgs(fixOptional(optDefaultOptions,null));
    // now we combine them
    var jExtended = jDefault ? jDefault : new cJobject().init (null);

    // now we merge that with whatever was given
    if(jGiven) jExtended.merge (jGiven);
    // all over
    return jExtended;
}


function trimLeading(t) {
  var i=1;
  while( i <= Len(t) && isWhiteSpace (Mid(t,i,1) )) i++;
  return i > 1 ?  Mid(t,i) : t;
}
/**
 * whether or not the given character is whitespace
 * @param {string} charToCheck the character to check
 * @return {boolean} true if whitespace
 */
function isWhiteSpace(charToCheck) {
	var whitespaceChars = " \t\n\r\f";
	return (whitespaceChars.indexOf(charToCheck) != -1);
}
/**
 * convert degrees to Radians
 * @param {number} deg degrees to convert
 * @return {number} eqivalent radians
 */
function toRadians(deg) {
      return Math.PI / 180 * deg;
}
/**
 * convert  Radians to degrees
 * @param {number} rad radians to convert
 * @return {number} eqivalent degrees
 */
function fromRadians(rad) {
      return 180/Math.PI * rad;
}
/**
 * return earths radius in km
 * @return {number} earth radius in km
 */
 function earthRadius() {
   return 6371.0;
 }
// attribution for lat/lon formulas
// Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2012 
// http://www.movable-type.co.uk/scripts/latlong.html

/**
 * given 2 lat/lons , return distance in kms
 * @param {number} mLatOrigin origin latitude
 * @param {number} mLonOrigin origin longitude
 * @param {number} mLatTarget target latitude
 * @param {number} mLonTarget target logitude
 * @return {number} distance in km 
 */
 
function getDistanceBetween(mLatOrigin, mLonOrigin , mLatTarget, mLonTarget ) {
    var dLat = toRadians(mLatTarget-mLatOrigin);
    var dLon = toRadians(mLonTarget-mLonOrigin);
    
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * 
            Math.cos(toRadians(mLatOrigin)) * Math.cos(toRadians(mLatTarget)); 
            
    return earthRadius() * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

}


/**
 * given lat, distance in km, and heading calculate new lat
 * @param {number} mLat origin latitude
 * @param {number} d distance in km
 * @param {number} heading heading (degrees) 
 * @return {number} destination lat
 */
function getLatFromDistance(mLat, d , heading ) {
    var lat = toRadians(mLat);
    var newLat =   Math.asin(Math.sin(lat) * 
            Math.cos(d / earthRadius()) + 
            Math.cos(lat) * 
            Math.sin(d / earthRadius()) * 
            Math.cos(heading));
    return fromRadians(newLat);
}
/**
 * given lat,lon, distance in km, and heading calculate new lon
 * @param {number} mLat origin latitude
 * @param {number} mLon origin longitude
 * @param {number} d distance in km
 * @param {number} heading heading (degrees) 
 * @return {number} destination lat
 */ 
function getLonFromDistance(mLat, mLon, d, heading) {
    var lat = toRadians(mLat);
    var lon = toRadians(mLon);
    var newLat = toRadians(getLatFromDistance(mLat, d, heading));
    var newLon = lon + 
      Math.atan2( 
        Math.sin(heading) * Math.sin(d / earthRadius()) * Math.cos(lat),
        Math.cos(d / earthRadius()) - (Math.sin(lat) * Math.sin(newLat))
      );
   return fromRadians (newLon);
}
/**
 * this will replace all occurrences of a string. replace only does the first
 * @param {string} origString the text 
 * @param {string} fromThis string to change from
 * @param {string} toThis string to change to
 * @return {String} escapred text
 */
function replaceAll(origString , fromThis, toThis ) {
  return origString.replace(new RegExp(fromThis, 'g'),toThis);
}

/**
 * if json.parse fails, then it may be because of invalidly escaped single quote \'
 * @param {string} s text for escaping
 * @return {String} escapred text
 */
function invalidlyEscapedQuote(s) {
	 var t = s.replace(/\\'/g,"'");
     return t;
}
/**
 * return a randome integer between 1 min and max
 * @param {number} min minimum random value
 * @param {number} max maximum value
 * @return {number} random integer between max and min
 */ 
function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * return a random string of given length 
 * @param {number} length length of string to generate
 * @return {String} random random string of length
 */ 
function arbritraryString (length) {
    var s = '';
    for (var i = 0; i < length; i++) {
        s += Chr(randBetween ( 33,125));
    }
    return s;
}
/**
 * return a shortened key
 * @param {String} input string to shorten
 * @return {String} shortened key
 */ 
function shortKeyHash (input) {
    return Utilities.base64Encode( Utilities.computeDigest( Utilities.DigestAlgorithm.SHA_1, input));
}
/** return content within body tags
  * @param {String} input string to extratct from
  * @return {String} the body content
  */ 
function getBodyContent(input) {
  return(/<body[^>]*>((.|[\n\r])*)<\/body>/i.exec(input)[1]);
} 
/** 
 * return spreadsheet data from google cache, or get it and write it there
 * @param {String} wb The id of the workbook containing the data
 * @param {String} wn The name of the sheet required
 * @param {Number=} optSeconds how long to aim to keep it around for
 * @return {Array} the data
 */
function getPersistData ( wb, wn ,  optSeconds, optPublic) {

  var googCache = fixOptional(optPublic, false) ? 
      CacheService.getPrivateCache() :
      CacheService.getPublicCache() ;
    
  var sheetData = googCache.get( shortKeyHash ( wb + "!" + wn ))  ;
  
  if (sheetData) 
    // we know it
    return JSON.parse (sheetData); 
  else {
    // we know nothing, open the workbook & cache
    sw = SpreadsheetApp.openById(wb).getSheetByName(wn).getDataRange().getValues();
    googCache.put(shortKeyHash ( wb + "!" + wn ) , JSON.stringify(sw), fixOptional ( optSeconds, 60));
    return sw;
  }
}
function sleep (optMs) {
  var ms = fixOptional (optMs, 1000);
  Utilities.sleep (ms);
  return ms;
}
/**
 * draw border around a range
 * @param {Range} r the range
 * @return {Range} the range
 */
function borderAround(r){
  r.setBorder(true, true, true, true, false, false);
  return r;
}
/**
 * do a binary search on a sorted array
 * @param {Array} things the array
 * @param {*} thing the thing we're looking for
 * @param {*} mini the lower limit to start looking initially call with 0
 * @param {*} maxi the upper limit to start looking initially call with things.length-1
 * @param {*} compare the compare function that takes (a,b) and returns -1,0,1 this would be same as the one used for sorting the array
 * @return {*} the found thing or null
 */
function binarySearch(things, thing, mini, maxi, compare) {
  if ( mini > maxi ) return null;
  var midi = parseInt((mini + maxi) / 2,10);
  var cmp = compare (thing,things[midi]);
  if (cmp) {
    return binarySearch (things,thing, cmp > 0 ? midi+1 : mini , cmp < 0 ? midi - 1 : maxi, compare);
  }
  else 
    return (things[midi]) ;   
}
// call back in parameters causes a jsonpwrap

function  pitJsonp (s,e) {
// jsonp?
    return e.parameters.callback ? e.parameters.callback + "(" + s + ");" : s;
}