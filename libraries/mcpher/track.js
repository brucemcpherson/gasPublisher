/* this uses the scriptDB to track events starting and finishing.
 * you need to initialize once
 */

/**
 * trackInitialize
 * @param {ScriptDbInstance} db the database to use
 * @return {cScriptDbSilo} the tracking silo
 */
var trackSilo;
function trackInitialize (db) {
  return ( trackSilo = scriptDbSilo ("track", DebugAssert(fixOptional(db,null),"you need to specify a scriptDB")));
}
/**
 * trackArrival
 * @param {string} what event to track
 * @return {ScriptDbResult} the stored object
 */
function trackArrival(what) {
  return trackSilo.save({entered:Now().getTime(), what: what});
}
/**
 * trackDeparture
 * @param {ScriptDbResult} record the event returned by trackArrival
 * @return {ScriptDbResult} the stored object
 */
function trackDeparture(record) {
  // we should be able to find the matching record in the using he timestamp and user name
  var db = trackSilo.db();
  var updatedRecord = db.load(record.getId());
  // this is the updated version
  updatedRecord.exited = Now().getTime();
  // save changes
  return db.save(updatedRecord);
}

/*
 * trackDeleteAll delete all tracking records
 */
 function trackDeleteAll () {
   trackSilo.remove();
 }
/**
 * trackReportAll report contents of db tracker to given worksheet
 * @param {String|Sheet|Range} ws the worksheet to use to report contents
 * @return {number} how many rows
 */
function trackReportAll(ws) {
  var cache = sheetCache(ws);
  cache.clear();
// titles
  var c= 1;
  var r = 1;
  cache.setValue ( "what", r ,c++);
  cache.setValue ( "user",r ,c++);
  cache.setValue ( "date",r,c++);
  cache.setValue ( "time on",r,c++);
// data

  var results = trackSilo.query({}).sortBy("entered");

  while (results.hasNext()) {
    var result = results.next();
    c =1;
    cache.setValue (result.what, ++r, c++);
    cache.setValue (result.userStamp, r, c++);
    cache.setValue (new Date(result.entered), r, c++);
    cache.setValue (result.exited - result.entered, r, c++);
   
  }
  cache.close();
}
