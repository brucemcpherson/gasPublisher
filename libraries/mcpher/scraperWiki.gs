/** 
 * @description
 * get data from scraperwiki into google apps script
 * See http://ramblings.mcpher.com/Home/excelquirks/codeuse for more details
 * @author <a href="mailto:bruce@mcpher.com">Bruce McPherson</a><a href="http://ramblings.mcpher.com"> ramblings.mcpher.com</a>
 */

/**
 * swSeewhatworks see which scraperwikis have tables and update a list (as returned by rest entry scraperwiki) with default sql
 * @param {string} ws the worksheet name with the scraperwiki list of shortnames
 * @return {void} null
 */
function swSeewhatworks(ws) {
    var ds = new cDataSet().populateData (wholeSheet(ws), 
                  undefined,undefined ,undefined ,undefined , undefined, true);
    var cache = sheetCache(ds.headingRow().where());
    
    ds.rows().forEach(
      function (dr) {
        cache.setValue(swGetDefaultTableSql(dr.cell("short_name").toString(), false), 
              dr.where().getRow(), dr.columns().count()+1 );
      }
    );
    cache.close();
}
/**
 * swGetTables return the cRest result of query for table names
 * @param {string} shortName the scraperWiki key
 * @return {cRest} the result of the query for table names
 */
function swGetTables(shortName){
      var tableDirectory = "SELECT name FROM sqlite_master " +
        "WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' " +
        "Union all " +
        "SELECT name FROM sqlite_temp_master " +
        "WHERE type IN ('table','view') " +
        "ORDER BY 1";

       return restQuery(undefined, "scraperwikidata", 
           shortName + "&query=" + tableDirectory,undefined ,undefined ,undefined ,undefined , false);
        
} 
/**
 * swGetDefaultTableSql look up to see what tables are defined in a given scraperwiki and return sql to get the first one
 * @param {string} shortName the scraperWiki key
 * @param {boolean} optComplain whether to complain if there is a problem
 * @return {string} the sql query to get data from first table
 */
function swGetDefaultTableSql(shortName, optComplain){
     
    var complain = fixOptional (optComplain,true);
    var cr = swGetTables(shortName);
    if (!cr) {
      MsgBox ("could get no info on " + shortName);
    }
    else {
      var job = cr.jObjects().count() ? cr.jObjects().item(1) : null;
      if (job && job.hasChildren()) {
        // this is hokey - for the moment just take from the first table found
        return "select * from '" +
                job.children(1).child("name").toString() + "'";
      }
      else {
        DebugPrint(shortName," did not return any tables: got this:", cr.responseData());
        if (complain) MsgBox ("could not find any valid tables for " +
            shortName + "(" + (job ? job.serialize() : "no data")  + ")")
      }
    } 
    return "";
}
/**
 * swCleanSheet create a clean results sheet with column headings
 * @param {cJobject} job contains the list of columns headings as keys
 * @param {string} ws the worksheet name to populate
 * @return {cDataSet} the dataset with the headings populated
 */
function swCleanSheet(job, ws) {
    // put headers to a clean sheet
    
    var ds = null;
    var cache = sheetCache(ws);
    cache.clear();
    
    if (job.hasChildren()) {
      job.children().forEach(
        function (cj,n) {
          cache.setValue(cj.key(),1,n);
        }
      ); 
      ds= new cDataSet().populateData( vResize (wholeSheet(ws), 1, job.children().count()));
  }
  cache.commit();
  return ds;
}
/**
 * swGetHeaders organize what headers are needed given the scraperWIki response
 * @param {cJobject} job contains the query response
 * @return {cJobject} a jobject with a list of keys for column headings
 */
function swGetHeaders(job) {
    // take scraper wiki data and generate an organized dataset using the headers found
    var cjKeys = new cJobject().init(null);
    job.children().forEach(
      function(cj) {
        cj.children().forEach( 
          function (jo) {
            cjKeys.add(jo.key());
          }
        );
      }
    );
    return cjKeys;
}
/**
 * scraperWikiStuff do the query and populate the data
 * @param {string} shortName the scraperwiki key
 * @param {string} optWs the worksheet name to populate - required if optPop is true
 * @param {string} optSql the optional sql string to get the data
 * @param {number} optLimit the optional limit to number of rows to get
 * @param {string} optAddSql adds selective sql fields to the default table name
 * @param {boolean} optPop whether to populate
 * @return {cDataSet|cRest} the finished data or the query response if not populated
 */
function scraperWikiStuff(shortName, optWs , optSql, optLimit, optAddSql, optPop) {
    // sort out the optional args
    
    var pop = fixOptional (optPop,true);
    var ws = fixOptional (optWs,"");
    var sql = fixOptional (optSql, swGetDefaultTableSql(shortName));
    var addSql = IsMissing(optAddSql) ? "" :  CStr(optAddSql);
    var limit = IsMissing(optLimit) ? "" : " LIMIT " + CStr(optLimit);
    var ds = null;
    // get the data
    var cr = restQuery(undefined, "scraperwikidata", 
       shortName + "&query=" + sql + addSql + limit,undefined ,undefined ,undefined ,undefined , false);
    if(pop) {
      //now organize it
      if(cr) {
         // get the unique headers and put them to a clean data set
         var crj = cr.jObject();
         var headJob = swGetHeaders(crj);
         if (!headJob) {
              MsgBox ("didnt work at all " + crj.serialize())
         }
         else {
              ds = swCleanSheet(headJob, ws);
              if (!ds) {
                  MsgBox ("failed to get the expected data " & crj.serialize())
              }
              else {
                  var cache = sheetCache(ds.headingRow().where());
                  var r = ds.headingRow().where().getRow();
                  // we know how big the cache needs to be so do it once off
                  cache.extend(crj.children().count()+1, ds.columns().count());
                   // this is the data returned - each array member is a row
                   crj.children().forEach(
                     function (cj,rIndex) {
                       cj.children().forEach (
                         function (job,cIndex) {
                           cache.setValue(job.value(), r + rIndex, cIndex);
                         }
                       );
                     }
                   );
                   cache.close();
              }
          }
       }
       
       return ds;
    }
    else
      return cr;
}
