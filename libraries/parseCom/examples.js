/**
 * Sub testGetItemByUniqueId
 * return {void}
 */
function testGetItemByUniqueId () {

    // get a handle for this class
    var parseCom = cParseCom.getParsed("gasParseData",findRegistryPackage());
    
    // use a valid unique ID to get the data
    if (parseCom.getObjectById("ZflFVMnczp").isOk()) {
      Logger.log (JSON.stringify(parseCom.jObject()));
    }
    else {
      throw ("failed to get object:" + parseCom.browser().url() + ":" + parseCom.browser().status() + ":" + parseCom.browser().text());
    }

}

/**
 * Sub testparseCount
 * return {void}
 */
function testparseCount () {
    // how many records in the class
    Logger.log (getParsed("gasParseData").count());
    // how many records in the class with given query
    Logger.log (getParsed("gasParseCustomers").count({country:"Libya"}));
}
/**
 * Sub testparsequery
 * return {void}
 */
function testparsequery () {

    // get a number of items that match a query by example
    var w = getParsed("gasParseData").getObjectsByQuery( {customerid:1},{order:'-value'});
    //test if it worked, and do something with the results
    if (w.isOk() ){
      Logger.log( "all is ok"+ JSON.stringify(w.jObject()));
    }
    else {
      throw( "failed to do query:" + w.browser().url() + ":" + w.browser().status() + ":" + w.browser().text());
    }

}

/**
 * Sub testparseUpdate
 * return {void}
 */
function testparseUpdate () {

    // get some items by query and change the scheme name to something else
    var w = getParsed("gasParseData").batch(true).updateObjects({customerid:39}, {customerid:1}).batch(false);
    if (w.isOk() ){
      Logger.log( "all is ok"+ JSON.stringify(w.jObject()));
    }
    else {
      throw( "failed to do query:" + w.browser().url() + ":" + w.browser().status() + ":" + w.browser().text());
    }
}
/**
 * Sub populates
 * return {void}
 */
function testPopulates () {

  populateFromSheetValues ([['a','b','c','d'],[new Date(),false,"data",4],[new Date(),true,7,8]],"test1");
  populateFromSheetValues ([['e','f','g'],['e1','f1','g1'],['e2','f2','g2']],"test2");
  
  var package = JSON.parse(UserProperties.getProperty("parseKeys"));

  Logger.log (cParseCom.getParsed('test1', package).count());
  Logger.log (cParseCom.getParsed('test2', package).count());
}
/**
 * Sub populateFromSheetValues
 * @param {Object[][]} values from a sheet as 2 dimensional array
 * @param {string} className
 * return {void}
 */
function populateFromSheetValues (values,className) {

  //this will clear out an existing parse class, and create a new one from a worksheet
  //we'll use batch mode throughout
  
  // need at least a row and a row of headings
  if (!values || values.length < 2 ) return null;
  
  //var parseCom = getParsed(className).batch(true);

  var package = JSON.parse(UserProperties.getProperty("parseKeys"));
  var parseCom = cParseCom.getParsed(className, package).batch(true);
  
  //clear out existing any existing data
  parseCom.deleteObjects();
  
  // find out best types for each column
  dataTypes = [];
  for ( var j =0,job={} ; j < values[0].length;j++) {
      dataTypes.push(null);
      for ( var i=1; i < values.length;i++) {
        if (toType(values[i][j]) != dataTypes[j]) { 
          dataTypes[j] = dataTypes[j]  ? "string" : toType(values[i][j]);
        }
      }
  }

  // populate parse  
  for ( var i=1; i < values.length;i++) {
    for ( var j =0,job={} ; j < values[i].length;j++) {
      var v = values[i][j], k = values[0][j];
      // deal with where we have to take a guess at the type
      if (dataTypes[j] === "date") {
        job[k] = {"__type":"Date","iso":v};
      }
      else {
        job[k] = dataTypes[j] === 'string' ? v.toString() : v;
      }
    }
    if (!parseCom.createObject(job).isOk()) throw("failed to create object:" + w.browser().url() + ":" + w.browser().status() + ":" + w.browser().text());
  }
  
  parseCom.flush();
  Logger.log(parseCom.count() + " in class" + className);

}
function toType(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}
/**
 * Sub parseMatch
 * return {void}
 */
function testParseMatch () {

    var pCustomer = getParsed("gasParseCustomers");
    var pData = getParsed("gasParseData");
    
    // set up a query by example
    var queryJob = {country: "United States"};
        
    //go through all matching customers
    if (pCustomer.getObjectsByQuery(queryJob,{order:'name'}).isOk()) {
      for (var i=0; i < pCustomer.jObject().results.length; i++ ) {
        var joc = pCustomer.jObject().results[i];
        if (pData.getObjectsByQuery({customerid:joc.customerid}).isOk()){
          for (var j=0; j< pData.jObject().results.length; j++) {
            var job = pData.jObject().results[j];
            Logger.log(joc.country + "," + joc.name +" ," + joc.customerid + "," +  job.invoiceid  + "," +  job.value )
          }
        }
      }
    
    }

}
