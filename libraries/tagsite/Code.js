function timed() {
 // this is a trigger im running every day
  var e = getDefaultE();
  e.source= "site";
  e.parameters.tagfile="play.json";
  doGet(e);
}
function timedAll() {
 // this is a trigger im running every day
  var e = getDefaultE();
  e.source= "all";
  e.parameters.tagfile="allplay.json";
  doGet(e);
}
function timedBlog() {
 // this is a trigger im running every day
  var e = getDefaultE();
  e.source= "blog";
  e.parameters.tagfile="blogplay.json";
  doGet(e);
}

function getDefaultE() {
   return {parameters:{ tagdomain: 'mcpher.com',
                        tagsite: 'share', 
                        tagoutput :'drive',
                        tagfile: 'play.json',
                           d3: "d3,d3js,d3.js",
                           vbaExcel: "vba,vb,excel,xl",
                           gas: "gas,apps\\sscript,scriptdb",
                           javascript: "js,javascript",
                           parse: "parse,parse.com",
                           jquery: "jquery",
                           maps: "maps",
                           fusion: "fusion",
                           earth: "earth",
                           vizualization: "viz,vi[sz]uali[sz]ations?",
                           snippets: "snippets?,oneliners?,one\\sliners?",
                           colors: "colors?,heatmaps?",
                           charts: "charts?",
                           json: "json",
                           classes: "class,classes",
                           cdataset: "cdataset,data\\sabstraction,data\\smanipulation\\sclasses",
                           cjobject: "cjobject"
                       }};
}

function initBlogger(e,source) {
  // this will get my secret stuff for accessing the blogger
  var bloggerDetails = getApiKey("bloggerapi");
  // now I can get all the posts
  return "https://www.googleapis.com/blogger/v3/blogs/" + 
    bloggerDetails[source] + "/posts?key=" + 
    bloggerDetails.consumerKey;

}

function getApiKey(api) {
  // my private store
  var myKey = mcpher.getMyStuff(api, myStuff.myStuffDb());
  if (myKey.status.code == "good") {
    return myKey.result.myStuff;
  }
  else {
    mcpher.MsgBox("unable to find your key for " + api);
    return null;
  }
}

function blogChildren(tags,parent,pages,a) {

  var resultsArray = a || [];
  for (var i =0;i<pages.length;i++) {
     // process this page
     var page = pages[i];
     resultsArray.push( { 
         parent: parent,
         name: page.title, 
         key: page.id, 
         url: page.url, 
         title: page.title,
         tags: addCounts(cloneObject(tags),getTextFromHtml(page.content))
     } );
     // and its children
  }
  return resultsArray;
}

function process(source,eArgs,append) {
 // create the query object
  var tags = { tagmap: [] };
  for (var k in eArgs.parameters ) {
    if (k != "tagdomain" & k!= "tagsite" & k!= "callback" & k!="tagoutput" & k!="tagfile") {
      tags.tagmap.push ( {name: k , values : eArgs.parameters[k].toString().split(",") , counts : []} ); 
    }
  }
  
 // process the site counting how many tag matches on each page
  var results;
  if (source == "site") {
    try { 
      var site = SitesApp.getSite(eArgs.parameters.tagdomain,eArgs.parameters.tagsite);
      results =  { data:  logChildren (tags,site,site.getChildren(),append) };
    }
    catch (err) {
      results = { error : err , data : [] };
    }
  }
  else {
  // this only returns a small number of posts, so we need to keep going
    var cb = new mcpher.cBrowser();
    var p, items=[];
    
    while (!p || p.nextPageToken) {
      p = JSON.parse(cb.get(initBlogger(eArgs,source) + ( p ? '&pageToken='+p.nextPageToken : '')));
      if (p && p.items) items = items.concat (p.items);
      if (!p) break;
    }
    results =  { data:  blogChildren (tags,source,items,append) };
  }
  
  return results;

}
function doGet(e) {
  // will take args like
  // ?tagdomain=mcpher.com&tagsite=share&tagoutput=drive&tagfile=site.json
  // &d3=d3,d3js&excel=excel,xl&jquery=jquery&google apps script=apps\\sscript,gas

 // some default arguments for testing
  var eArgs = e || {parameters:{ tagdomain: 'mcpher.com',tagsite: 'share', 
                           d3: "d3,d3js,d3.js", callback: "somecallback", source: "site" }};
                           
 // default is to write it to drive (others option is rest)
  eArgs.parameters.tagoutput =  eArgs.parameters.tagoutput || "drive";
  


  var results;
  if (eArgs.source == "site" || eArgs.source == "all") results= process("site",e);
  if (eArgs.source == "blog" || eArgs.source == "all") results= process("excelRamblings",e,results? results.data : null);
  
  if ( eArgs.parameters.tagoutput == "drive" && ! results.error ) { 
    results = writeToGdrive ( eArgs.parameters.tagfile || "tag" + eArgs.source +".json" , JSON.stringify(results));
    
  }
  // this is either file data or json results
  return ContentService.createTextOutput ( eArgs.parameters.callback ? 
                        eArgs.parameters.callback + "(" + JSON.stringify(results) + ");" : JSON.stringify(results)) 
                  .setMimeType(ContentService.MimeType.JSON) ; 


}
function getTextFromHtml(html) {
  return getTextFromNode(Xml.parse(html, true).getElement());
}

function getTextFromNode(x) {
  switch(x.toString()) {
    case 'XmlText': return x.toXmlString();
    case 'XmlElement': return x.getNodes().map(getTextFromNode).join('');
    default: return '';
  }
}
// write it to google drive
function writeToGdrive( name , json ) {
    //TODO some error handling.oauth.foldercreation.
    var file, result;
    // does it exist?
    var files = DriveApp.getFilesByName(name)
    if (files.hasNext()) {
       file = files.next();
       // dont know how to setMimeType.....
       file.setContent(json);
       
    }
    else {
      try {
        file = DriveApp.createFile(name,json,MimeType.JSON);
      }
      catch(err) {
        result = { error : err , data: [] , file : {  name: name } };
      }
    }

    // if we have a file then
    if (file) { 
      // set permissions up
      file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      // give back details - this would be got by result.file.hosted
      result = { 
          data: [] , 
          file : { 
            url: file.getUrl() , 
            name: file.getName() , 
            id: file.getId(), 
            download: file.getDownloadUrl(),
            hosted: "https://googledrive.com/host/" + file.getId()
          } 
      }
    }
    return result || { error : 'complete gdrive screw up', file: { name:name}};
}
// recurse to process all pages
function logChildren(tags,parent,pages,a) {

  var resultsArray = a || [];
  for (var i =0;i<pages.length;i++) {
     // process this page
     var page = pages[i];
     resultsArray.push( { 
         parent: parent.getName (),
         name: page.getName (), 
         key: page.getName () + "_" + resultsArray.length, 
         url: page.getUrl(), 
         title: page.getTitle(),
         tags: addCounts(cloneObject(tags),page.getTextContent())
     } );
     // and its children
    logChildren (tags,pages[i], pages[i].getChildren(), resultsArray);
  }
  return resultsArray;
}
// just convert it to json and back to clone an object works for simple cases
function cloneObject(o) {
  return JSON.parse(JSON.stringify(o));
}

function addCounts(tags,body) {

  for (var i=0; i < tags.tagmap.length ; i ++ ) {
    for (var j=0;j<tags.tagmap[i].values.length;j++) {
        var matches = body.match (new RegExp("\\b"+tags.tagmap[i].values[j]+"\\b", "ig"));
        tags.tagmap[i].counts[j] = matches ? matches.length : 0;
    }
  }
  return tags;
}