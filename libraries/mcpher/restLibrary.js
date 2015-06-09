// conversion of rest-excel library

function generalQuery(sheetName , libEntry, queryString, breport,queryCanBeBlank,appendQuery,optUseCache)  {     
  return generalReport( 
            restQuery(sheetName, libEntry, queryString, 
              undefined , undefined,undefined , undefined, undefined, undefined,undefined , queryCanBeBlank,
              undefined, undefined,undefined,undefined,undefined,appendQuery,optUseCache), fixOptional (breport, true) ) ;
}
function generalDataSetQuery(sheetName , libEntry, colName, breport,queryCanBeBlank,appendQuery,optUseCache)  {     
  return generalReport( 
            restQuery(sheetName, libEntry, undefined, 
              colName, undefined,undefined , undefined, undefined, undefined,undefined , queryCanBeBlank,
              undefined, undefined,undefined,undefined,undefined,appendQuery,optUseCache), fixOptional (breport, true) ) ;
}

function generalReport(cr, breport ) {
    if(!cr) 
        tryToast (" failed to get any data");
    else {
        if(breport)
           tryToast (cr.jObjects().count() + " items retrieved ");
            
    }
    return cr;
}
function getRestLibrary() {
  //return new cJobject().init(null,"root").fromNative(scriptDbSilo("restLibrary").query().next()).child("restLibrary"); 
  
 return createRestLibrary();
}

function createRestLibrary() {

  var cj = new cJobject().init(null,"restLibrary");
  var w;


   w = cj.add("villas");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url","http://www.villasofdistinction.com/tools/export-json/?destination=");
    w.add ("results", '');
    w.add ("treeSearch", true);
    w.add ("ignore");


   w = cj.add("fql");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://graph.facebook.com/fql?q=");
    w.add ("results", "data");
    w.add ("treeSearch", true);
    w.add ("ignore");
    w.add ("alwaysEncode", true);
    
   w = cj.add("my society");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://mapit.mysociety.org/postcode/");
    w.add ("results", "areas");
    w.add ("treeSearch", true);
    w.add ("ignore");
    w.add ("alwaysEncode", true);

  w = cj.add("tagsitejson");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "https://googledrive.com/host/");
    w.add ("results", "data");
    w.add ("treeSearch", true);
    w.add ("ignore");
    
   
   w = cj.add("nestoria");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://api.nestoria.co.uk/api?country=uk&pretty=1&action=metadata&encoding=json&");
    w.add ("results", "response.metadata");
    w.add ("treeSearch", true);
    w.add ("ignore");

   w = cj.add("publicstuff");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "https://script.google.com/a/macros/mcpher.com/s/AKfycbzLXr1aQKQVK2imlIJp9C6m_HEBAmLBiYM28mfnLn_3oIe3c2kN/exec?entry=");
    w.add ("results", "results");
    w.add ("treeSearch", false);
    w.add ("ignore");
    
   w = cj.add("urbaramamashup");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "?address=");
    w.add ("results", "projects");
    w.add ("treeSearch", false);
    w.add ("ignore");
    w.add ("indirect","publicstuff");
    
  w = cj.add("restserver");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "?entry=");
    w.add ("results", "restlibrary");
    w.add ("treeSearch", false);
    w.add ("ignore");
    w.add ("indirect","publicstuff");

        
  w = cj.add("duckduckgo");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://api.duckduckgo.com/?format=json&q=");
    w.add ("results", "relatedtopics");
    w.add ("treeSearch", true);
    w.add ("ignore");
    
  w = cj.add("neildegrassetysonquotes");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://www.neildegrassetysonquotes.com/quote_api/random");
    w.add ("results", "");
    w.add ("treeSearch", false);
    w.add ("ignore");

  w = cj.add("google patents");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "https://ajax.googleapis.com/ajax/services/search/patent?v=1.0&rsz=8&q=");
    w.add ("results", "responseData.results");
    w.add ("treeSearch", false);
    w.add ("ignore");
  
  w = cj.add("twitter");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://search.twitter.com/search.json?q=");
    w.add ("results", "results");
    w.add ("treeSearch", true);
    w.add ("ignore"); 
  
  w = cj.add("google books by isbn");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "https://www.googleapis.com/books/v1/volumes?q=isbn:");
    w.add ("results", "Items");
    w.add ("treeSearch", true);
    w.add ("ignore"); 
  
  w = cj.add("yahoo geocode");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://gws2.maps.yahoo.com/findlocation?flags=J&location=");
    w.add ("results", "ResultSet.Result");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("imdb by title");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://www.imdbapi.com/?tomatoes=true&t=");
    w.add ("results", "");
    w.add ("treeSearch", false);
    w.add ("ignore");
  
  w = cj.add("itunes movie");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://itunes.apple.com/search?entity=movie&media=movie&term=");
    w.add ("results", "results");
    w.add ("treeSearch", false);
    w.add ("ignore");
  
  w = cj.add("google finance");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://www.google.com/finance/info?infotype=infoquoteall&q=");
    w.add ("results", "crest");
    w.add ("treeSearch", true);
    w.add ("ignore", "//");
  
  w = cj.add("whatthetrend");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://api.whatthetrend.com/api/v2/trends.json");
    w.add ("results", "trends");
    w.add ("treeSearch", false);
    w.add ("ignore");
  
  w = cj.add("tweetsentiments");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://data.tweetsentiments.com:8080/api/analyze.json?q=");
    w.add ("results", "results");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("topsy histogram");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://otter.topsy.com/searchhistogram.json?period=30&q=");
    w.add ("results", "response");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("topsy count");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://otter.topsy.com/searchcount.json?q=");
    w.add ("results", "response");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("tweetsentiment topics");
    w.add ("restType", ERRESTTYPE.erQueryPerRow);
    w.add ("url", "http://data.tweetsentiments.com:8080/api/search.json?topic=");
    w.add ("results", "");
    w.add ("treeSearch", true);
    w.add ("ignore");
    
  w = cj.add("opencorporates reconcile");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://opencorporates.com/reconcile?query=");
    w.add ("results", "result"); 
    w.add ("treeSearch", true); 
    w.add ("ignore");
  
  w = cj.add("tweetsentiment details");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://data.tweetsentiments.com:8080/api/search.json?topic=");
    w.add ("results", "results");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("f1");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://ergast.com/api/f1.json?limit=");
    w.add ("results", "MRData.RaceTable.Races");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("f1 drivers");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://ergast.com/api/f1/drivers.json?limit=");
    w.add ("results", "MRData.DriverTable.Drivers");
    w.add ("treeSearch", true);
    w.add ("ignore");
  
  w = cj.add("e-sim");
    w.add ("restType", ERRESTTYPE.erSingleQuery);
    w.add ("url", "http://e-sim.org/apiMilitaryUnitMembers.html?id=");
    w.add ("results", "");
    w.add ("treeSearch", true);
    w.add ("ignore");

  w = cj.add("eSimResource");
     w.add ("restType", ERRESTTYPE.erSingleQuery);
     w.add ("url", "http://api.craea.name/esim/market/json/");
     w.add ("results", "offer");
     w.add ("treeSearch", true);
     w.add ("ignore");
  
  w = cj.add("jorum");
     w.add ("restType", ERRESTTYPE.erSingleQuery);
     w.add ("url", "http://dashboard.jorum.ac.uk/stats/");
     w.add ("results", "");
     w.add ("treeSearch", true);
     w.add ("ignore");

  w = cj.add("mercadolibre");
     w.add ("restType", ERRESTTYPE.erSingleQuery);
     w.add ("url", "https://api.mercadolibre.com/sites/MLA/search?q=");
     w.add ("results", "results");
     w.add ("treeSearch", true);
     w.add ("ignore");
     
  w = cj.add("EC2");
     w.add ("restType", ERRESTTYPE.erSingleQuery);
     w.add ("url", "http://aws.amazon.com/ec2/pricing/pricing-reserved-instances.json");
     w.add ("results", "config.regions");
     w.add ("treeSearch", true);
     w.add ("ignore");
 
   w = cj.add("battlenet");
     w.add ("restType", ERRESTTYPE.erQueryPerRow);
     w.add ("url", "http://us.battle.net/api/wow/item/");
     w.add ("results", "");
     w.add ("treeSearch", true);
     w.add ("ignore");
  
       
  w = cj.add("trello");
     w.add ("restType", ERRESTTYPE.erSingleQuery);
     w.add ("url", "https://api.trello.com/1/board/4ff1644acb179efe1718ec61?key=b5acff6f87bda62eba4ac7f6419fad20");
     w.add ("results", "");
     w.add ("treeSearch", true);
     w.add ("ignore");
  
  
  w = cj.add("huffingtonpost elections");
     w.add ("restType", ERRESTTYPE.erSingleQuery);
     w.add ("url", "http://elections.huffingtonpost.com/pollster/api/charts.json");
     w.add ("results", "");
     w.add ("treeSearch", true);
     w.add ("ignore");
 
   w = cj.add("page rank");
     w.add ("restType", ERRESTTYPE.erQueryPerRow);
     w.add ("url", "http://prapi.net/pr.php?f=json&url=");
     w.add ("results", "");
     w.add ("treeSearch", false);
     w.add ("ignore");
 
    w = cj.add("faa airport status");
      w.add ("restType",ERRESTTYPE.erQueryPerRow);
      w.add ("url", "http://services.faa.gov/airport/status/");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore", "");
      w.add ("append", "?format=json");

    w = cj.add("url shorten");
      w.add ("restType",ERRESTTYPE.erQueryPerRow);
      w.add ("url", "http://ttb.li/api/shorten?format=json&appname=ramblings&url=");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore", "");
      w.add ("append", "");
     
    w = cj.add("freegeoip");
      w.add ("restType",ERRESTTYPE.erQueryPerRow);
      w.add ("url", "http://freegeoip.net/json/");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore", ""); 
        
     w = cj.add("uk postcodes");
      w.add ("restType",ERRESTTYPE.erQueryPerRow);
      w.add ("url", "http://www.uk-postcodes.com/postcode/");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore", "");
      w.add ("append", ".json");
      
     w = cj.add("googlecurrencyconverter");
      w.add ("restType",ERRESTTYPE.erQueryPerRow);
      w.add ("url", "http://www.google.com/ig/calculator?hl=en&q=1USD=?");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore", "");
      w.add ("append", ""); 
      w.add ("wire", ""); 
      
    w = cj.add("crunchbase relationships");
      w.add ("restType",ERRESTTYPE.erSingleQuery);
      w.add ("url", "http://api.crunchbase.com/v/1/person/");
      w.add ("results", "relationships");
      w.add ("treeSearch", true);
      w.add ("ignore", "");
      w.add ("append", ".js");
      
    w = cj.add("crunchbase companies");
      w.add ("restType",ERRESTTYPE.erSingleQuery);
      w.add ("url", "http://api.crunchbase.com/v/1/company/");
      w.add ("results", "relationships");
      w.add ("treeSearch", true);
      w.add ("ignore", "");
      w.add ("append", ".js");
      
   w = cj.add("rxNorm drugs");
      w.add ("restType",ERRESTTYPE.erSingleQuery);
      w.add ("url", "http://rxnav.nlm.nih.gov/REST/drugs?name=");
      w.add ("results", "drugGroup.conceptgroup.2.conceptProperties");
      w.add ("treeSearch", true);
      w.add ("ignore", "");
      w.add ("append", "");
      w.add ("accept", "application/json");
      

   w = cj.add("scraperwikidata");
      w.add ("restType", ERRESTTYPE.erSingleQuery);
      w.add ("url", "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore");      
      
   w = cj.add("scraperwiki");
      w.add ("restType", ERRESTTYPE.erSingleQuery);
      w.add ("url", "https://api.scraperwiki.com/api/1.0/scraper/search?format=jsondict&maxrows=");
      w.add ("results", "");
      w.add ("treeSearch", false);
      w.add ("ignore");   

   w = cj.add("urbarama");
      w.add ("restType", ERRESTTYPE.erSingleQuery);
      w.add ("url", "http://www.urbarama.com/api/project?sort=popular&offset=0&count=100&size=small&format=json");
      w.add ("results", "projects");
      w.add ("treeSearch", true);
      w.add ("ignore");  
      
  w = cj.add("builtwith");
      w.add ("restType", ERRESTTYPE.erSingleQuery);
      w.add ("url", "http://api.builtwith.com/api.json?lookup=");
      w.add ("results", "Technologies");
      w.add ("treeSearch", false);
      w.add ("ignore");  
      w.add ("append","&key=");
 

  return cj; 


} 

function restQuery(optSheetName , 
                   optEntry, 
                   optQuery, 
                   optQueryColumn, 
                   optRestUrl, 
                   optResponseResults , 
                   optTreeSearch, 
                   optPopulate, 
                   optClearMissing , 
                   optComplain , 
                   optQueryCanBeBlank , 
                   optFix, 
                   optUser, 
                   optPass,
                   optAppend,
                   optStampQuery,
                   optAppendQuery,
                   optUseCache){

//  in the case where 1 query returns multiple rows, sQuery is the query contents
//  where 1 column contains the query for each row, sQueryColumn contains the name of the column

    var sheetName = fixOptional (optSheetName,'');  
    var sEntry = fixOptional (optEntry,''); 
    var sQuery = fixOptional (optQuery,''); 
    var sQueryColumn = fixOptional (optQueryColumn,'');                   
    var sRestUrl = fixOptional (optRestUrl,'');    
    var sResponseResults = fixOptional (optResponseResults,'');  
    var sTreeSearch = fixOptional (optTreeSearch,true);  
    var bPopulate = fixOptional (optPopulate,true);     
    var bClearMissing = fixOptional (optClearMissing,true);     
    var complain = fixOptional (optComplain,true);    
    var queryCanBeBlank = fixOptional (optQueryCanBeBlank,false); 
    var append = fixOptional(optAppend,false);
    var sFix= fixOptional (optFix,''); 
    var user= fixOptional (optUser,'');   
    var pass= fixOptional (optPass,'');     
    var bWire = false;
    var bAlwaysEncode = false;
     
    var appendQuery = fixOptional(optAppendQuery,'');
    var stampQuery  = fixOptional (optStampQuery,'');
    var cEntry = getRestLibrary();
    DebugAssert (cEntry, "failed to get restlibrary");
    var libAppend = '';
    var libAccept = '';
    if(! Xor(!sQuery, !sQueryColumn)) {
        if(!queryCanBeBlank){
            MsgBox ("you must provide one of either query contents or a query column name");
            return null;
        }
    }

    if (!Xor(!sEntry , !sRestUrl )) {
        MsgBox ("you must provide one of either a known library entry or a rest URL");
        return null;
    }
    
    // based on whether a column name or a query argument was supplied
    var qType;
    if (!sQuery  && !queryCanBeBlank) 
        qType = ERRESTTYPE.erQueryPerRow;
    else
        qType = ERRESTTYPE.erSingleQuery;
    
    //get the characteristics from the crest library

    if(!sEntry ) {
        var sUrl = sRestUrl;
        var sResults = sResponseResults;
    }
    else {
   
      var cj = cEntry.childExists(sEntry);
      if (!cj) {
        MsgBox (sEntry + " is not a known library entry");
        return null;
      } 
      var sEntryType = cj.child("restType").toString();
      if (complain) 
        if (abandonType(sEntry, qType, sEntryType)) return null;
      
      var sUrl = cj.child("url").toString();
      var sResults = cj.child("results").toString();
      var bTreeSearch = (cj.child("treeSearch").toString() == "true");
      var sIgnore = cj.child("ignore").toString();
      if (cj.childExists("alwaysEncode")) bAlwaysEncode = cj.child("alwaysEncode").value();
      if (cj.childExists("append"))  libAppend = cj.child("append").toString();
      if (cj.childExists("accept"))  libAccept = cj.child("accept").toString();
      if (cj.childExists("wire"))  bWire = cj.child("wire").value;

      // this is using an indirect lockbox for the published uri
      if (cj.childExists("indirect")) {
        if (cj.child("indirect").toString()) {
              // could be recursive
              var crIndirect = restQuery("", cj.child("indirect").toString(), sEntry,undefined ,undefined ,undefined , false) ;
              if (!crIndirect) return null;
              sUrl = crIndirect.jObject().children("results").child("1.mystuff.publish").toString() + sUrl;
        }
      }
    }
   
    //lets get the data
    var cr;
    if (sheetName) {
        var dSet = new cDataSet().populateData(wholeSheet(sheetName),undefined , sheetName,undefined ,undefined ,undefined , true);
        // ensure that the query column exists if it was asked for
        if(qType == ERRESTTYPE.erQueryPerRow &&
                !dSet.headingRow().validate(true, sQueryColumn)) return null;
        // are we stamping the query on the output results?
            var sc = null;
            if (stampQuery) {
              if (!dSet.headingRow().validate(true, stampQuery)) return null;
              sc = DebugAssert(  dSet.headingRow().exists(stampQuery), " dSet heading row messed up") ;
            }

        //alsmost there

        var cr = new cRest().init(sResults, 
                                  qType, 
                                  dSet.headingRow().exists(sQueryColumn,false), 
                                  undefined,
                                  dSet, 
                                  bPopulate,
                                  sUrl,
                                  bClearMissing, 
                                  bTreeSearch,
                                  complain, 
                                  sIgnore,
                                  user,
                                  pass,
                                  append, 
                                  sc, libAppend + appendQuery,libAccept,bWire,optUseCache, 
                                  bAlwaysEncode);
                                  
                                  

    }
    else {
      
        var cr = new cRest().init(sResults, qType, undefined, undefined
                    ,undefined , false, sUrl,undefined , 
                    bTreeSearch, complain, sIgnore, user, 
                    pass,append,sc,libAppend + appendQuery,libAccept,bWire,optUseCache, bAlwaysEncode);
    }
    

    if (!cr) {
        if (complain) MsgBox ("failed to initialize a rest class");
    }
    else {
        cr = cr.execute(sQuery, sFix, complain);
        if (!cr) {
            if (complain)  MsgBox ("failed to execute " + sQuery);
        }
    }
  return cr;
}

function abandonType(sEntry, qType, targetType) {
    if( qType != targetType) 
         MsgBox(sEntry + " is normally " + 
                whichType(targetType) + 
                " but you have specified " + 
                whichType(qType) );
                
    return qType != targetType;
}

function whichType(t) {
    return t == ERRESTTYPE.erSingleQuery ? " single query that can return multiple rows" :
              ( DebugAssert(t==ERRESTTYPE.erQueryPerRow,"unknown query type") ? 
                  " a single column provides the query data for each row": null );
}

function showAllrest() {
  var db = scriptDbSilo("restLibrary").db();
  var results = db.query({});
  while (results.hasNext()) {
    var result = results.next();
    Logger.log(Utilities.jsonStringify(result));
  }
}