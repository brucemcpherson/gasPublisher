/**
 * @static
 */
var dbSilo;

function createDbSilos(optionalDb){
  return dbSilo ? 
      dbSilo : 
      (dbSilo = new cScriptDbSilo(optionalDb));
}
function librarySiloDb() {
  return ScriptDb.getMyDb();
}
/**
 * a cScriptDbSilo
 * @class 
 * @param {ScriptDbInstance} Db the default scriptDB
 * @implements {cScriptDbSilo}
 * @return {cScriptDbSilo} a new cScriptDbSilo
 */
function cScriptDbSilo(optionalDb) {
// create a Silo for known script silos
  this.xSilos = new collection();
  this.silos = function () {
    return this.xSilos;
  };

  this.xDb = IsMissing(optionalDb) ?  librarySiloDb() : optionalDb;
 
  return this;
}
/**
 * return the db silo item associated with the given key
 * @param {string} k the key
 * @param {ScriptDbInstance=} optionalDb the default scriptDB (default the db for the silo collection)
 * @param {boolean=} createIfUnknown whether to create the item if it doesnt exist (default true)
 * @param {boolean=} optionalHash whether to encrypt the userstamp
 * @param {boolean=} optionalMeOnly whether to filter by only records that I created
 * @return {cScriptDbSiloItem} the cScriptDbSiloItem
 */
function scriptDbSilo(k,optionalDb,createIfUnknown,optionalHash,optionalMeOnly) {
// find the Silo associated with this key

    // get the item or create it
    var dbSilo = createDbSilos(optionalDb);
    if (IsMissing(k)) 
      return dbSilo;
    else {
      var silo = dbSilo.silos().item(k,false);
    // return the SiloItem, or create one if it's allowed
      return silo ? silo : (fixOptional (createIfUnknown,true) ?  dbSilo.init(k,optionalDb,optionalHash,optionalMeOnly) : null) ;
    }
}
/**
 * add db silo item associated with the given key
 * @param {string} k the key
 * @param {ScriptDbInstance=} optionalDb the default scriptDB (default the db for the silo collection)
 * @param {boolean=} optionalHash whether to encrypt the userstamp
 * @param {boolean=} optionalMeOnly whether to filter by only records that I created
 * @return {cScriptDbSiloItem} the cScriptDbSiloItem
 */
cScriptDbSilo.prototype.init = function (k,optionalDb,optionalHash,optionalMeOnly) {
  return this.silos().add (new cScriptDbSiloItem(k,this,optionalDb,optionalHash,optionalMeOnly),k);
};
/**
 * remove all db silo items for this db
 * @param {object} ob the query by example object
 * @param {ScriptDbInstance=} optionalDb the default scriptDB (default the db for the silo collection)
 * @return {cScriptDbSilo} the cScriptDbSilo
 */
cScriptDbSilo.prototype.remove = function (ob,optionalDb) {
  return this.removeData(ob,optionalDb);
}

/**
 * remove db silo item data associated with the given query object
 * @param {object} ob the query by example object
 * @param {ScriptDbInstance=} optionalDb the default scriptDB (default the db for the silo collection)
 * @return {cScriptDbSilo} the cScriptDbSilo
 */
cScriptDbSilo.prototype.removeData = function (ob,optionalDb) {
    var qob = fixOptional(ob,{});
    //-- disabled for now---only allowed to delete your own data
    //qob.userStamp = Session.getUser().getEmail();
    //if (this.xHash) qob.userStamp = shortKeyHash(qob.userStamp);
    var db = fixOptional(optionalDb, this.xDb);
    
    // we'll use removeBatch
    while(true) {
      var result = db.query(qob); // get everything, up to limit
      if (result.getSize() == 0) {
        break;
      }
      var o = [];
      while (result.hasNext()) {
        if (o.length > this.xBatchMax) {
          DebugAssert(db.allOk(db.removeBatch(o, false)), "failed to delete " + o.length + " objects"); 
          o = [];
        }
        o.push(result.next());
      }
      
      if (o.length > 0 ) {
        var result = db.removeBatch(o, false);
        DebugAssert(db.allOk(result), "failed to delete " + o.length + " objects"); 
      }
    }
  
  return this;
}

/**
 * fill the silos from the data in the script DB
 * @param {object} ob the query by example object
 * @param {ScriptDbInstance=} optionalDb the default scriptDB (default the db for the silo collection)
 * @return {cScriptDbSilo} the cScriptDbSilo
 */
cScriptDbSilo.prototype.fill = function (optionalDb) {
// fill Silo with every known silo  in the given db
    var db = fixOptional ( optionalDb, this.xDb);
    var result = db.query({}); //note-- only works up to the limit

      while (result.hasNext()) {
        var k = result.next().siloId;
        if ( ! this.Silos.item(k,false) ) 
          this.Silos().add (new cScriptDbSiloItem(k,this,db),k ); 
      }

  return this;
};
/**
 * a cScriptDbSiloItem
 * @class 
 * @param {string} k the key
 * @param {cScriptDbSilo=} parent the collection of silo items
 * @param {boolean=} optionalHash whether to encrypt the userstamp
 * @param {boolean=} optionalMeOnly whether to filter by only records that I created
 * @implements {cScriptDbSiloItem}
 * @return {cScriptDbSiloItem} a new cScriptDbSiloItem
 */

function cScriptDbSiloItem(k,parent,optionalDb,optionalHash,optionalMeOnly) {
  // a silo item
  this.xBatch = [];
  this.xKey = makeKey(k);
  this.xParent = parent;
  this.xHash = fixOptional( optionalHash, false);
  this.xMeOnly = fixOptional( optionalMeOnly, false);
  this.xDb = fixOptional( optionalDb , this.xParent.xDb);
  this.db = function() {
    return this.xDb;
  }
  // this is wont change in a silo session so may as well do it once
  this.xWho = this.who();
  // there is a bug in savebatch that failes for more than about 4000
  // here's a workaround
  this.xBatchMax = 4000;
  return this;
}
/**
 * construct the query object that identifies this query by example
 * @param {object=} ob the query by example (default all data)
 * @return {object}  a query by example to silo the data
 */
cScriptDbSiloItem.prototype.querySet = function(ob) {
  // apply a query for this silo
  var newOb = fixOptional(ob,{});
  newOb.siloId = this.xKey;
  if (!newOb.userStamp && this.xMeOnly) newOb.userStamp = this.xWho;
  return newOb ;
};
cScriptDbSiloItem.prototype.queryStamp = function(ob) {
  // apply a user and time stamp
  ob.timeStamp = new Date().getTime();
  ob.userStamp = this.xWho;
  return ob;
};
/**
 * do a query within the silo for this cScriptDbSiloItem
 * @param {object} [ob={}]  the query by example (default all data)
 * @param {object} [ob={}]  the query by example (default all data)
 * @return {ScriptDBquery} a query by example to silo the data
 */
cScriptDbSiloItem.prototype.query = function(ob) {
  return this.db().query(this.querySet(ob));
};
/**
 * do a query within the silo and put to an array, taking account of limits
 * @param {object} [ob={}]  the query by example (default all data)
 * @param {object} [ob={}]  the query by example (default all data)
 * @param {number} [optLimit=0]  default bypass any limits
 * @return {Array} an array of results
 */
cScriptDbSiloItem.prototype.queryArray = function(ob, optLimit) {
  
  // this is the max I'll take in one go to be compatible with parse.com
  var maxLimit = 1000;
  var limit = fixOptional ( optLimit, 0);
  var results =[], q = this.querySet(ob);
  while(true) {
    var qr =  this.db()
                .query(q)
                .limit(limit > 0 ? limit-results.length : maxLimit).startAt(results.length);
    // we're done
    if (!qr.hasNext()) return results;
    // still have pushing to do
    while(qr.hasNext() && (limit==0 || results.length < limit)) results.push(qr.next());
  }
  
};
/**
 * do a count query within the silo for this cScriptDbSiloItem
 * @param {object} [ob={}] the query by example (default all data)
 * @return {ScriptDBquery} a query by example to silo the data
 */
cScriptDbSiloItem.prototype.count = function(ob) {
  return this.db().count(this.querySet(ob));
};
/**
 * do a save within the silo for this cScriptDbSiloItem
 * @param {object} ob the data so save
 * @param {boolean} optBatch whether or not to save up for a batch update
 * @return {ScriptDbResult} a query result 
 */
cScriptDbSiloItem.prototype.save = function(ob,optBatch) {
  var sob = this.queryStamp(this.querySet(ob));
  if (fixOptional (optBatch, false)) {
    if (this.batchLength() > this.xBatchMax) {
      this.saveBatch();
    }
    this.xBatch.push(sob);
  }
  else
    return this.db().save(sob);
};
/**
 * provide current batch length 
 * @return {number} the batch length
 */
cScriptDbSiloItem.prototype.batchLength = function() {
  return this.xBatch ? this.xBatch.length : 0;
};
/**
 * clear out any batch items
 * @return {ScriptDbResult} a query result 
 */
cScriptDbSiloItem.prototype.saveBatch = function() {
   if (this.xBatch.length) {
     var results = this.db().saveBatch(this.xBatch, false);
     this.xBatch = [];
     return results;
   }
   else 
     return null;   
};
/**
 * do a save within the silo for this cScriptDbSiloItem, and delete the data
 * @param {object=} ob the data so remove (default all data for this silo)
 * @return {cScriptDbSiloItem} the cScriptDbSiloItem
 */
cScriptDbSiloItem.prototype.remove = function(ob) {
  return this.xParent.removeData(this.querySet(ob),this.db());
};
/**
 * get who user is, and hash email address if required
 * @param {boolean=} optHash whether to encrypt, otherwise use the silo default
 * @return {string} the user email or hashed emaik
 */
cScriptDbSiloItem.prototype.who = function(optHash) {
  return fixOptional(optHash, this.xHash) ? shortKeyHash(Session.getUser().getEmail()) : Session.getUser().getEmail();
};
/**
 * return the stuff from the db associated with the e.parameter.entry value
 * @param {String} siloNamethe the locker name
 * @param {scriptDB} db the private db to use
 * @return {ContentService} the rest response
 */
function getMyStuff (siloName, db) {

    var response = {status: {code:"bad", reason:"entry parameter not found"}, result:null};
    var silo = scriptDbSilo(siloName,db);
    var thisMail = silo.who();
    
    if (!db) {
      response.reason = "private db must be specified" ;
    }
    else if (siloName) 
    { var q=  silo.query();
      if (q.hasNext()) {
        // only retrievable by teh same user as created it
        var result = q.next();
        try {
           if (result.userStamp != thisMail) {
             response.status.code = "bad";
             response.status.reason = siloName + "does not belong to you";
           }
           else {
             response.status.code = "good";
             response.status.reason = siloName + " found in your stuff";
             response.result = result;
           }
             
          }
          catch (err) {
            response.status.code = "bad";
            response.status.reason = err;
          }
      } 
      else {
        response.status.code = "bad";
        response.status.reason = siloName + " not found in your stuff";
      }
    }

    return response;
}
/**
 * create an entry for the given siloname value
 * @param {String} siloNamethe the locker name
 * @param {scriptDB} db the private db to use
 * @param {object} content the content to store
 * @return {scriptDBObject} the saved object
 */
function createStuff (siloName, db, content) {
  // exist?
  DebugAssert(db, "you must provide a db");
  var silo =  scriptDbSilo(siloName,db);
  var myAuth = silo.query();
  if (myAuth.hasNext()) silo.remove();
  var put = {};
  put.myStuff = content;
  put.help = "for details see ramblings.mcpher.com";
  return silo.save(put);
}
/** react to a doGet(e) using lockbox for oAuth
 * @param {object} e as passed to doGet() (show or oauth)
 * @param {scriptDBInstance} db the private db to use
 * @return {String} the json string content
 */
function getStuffContent (e,db) {
   //parameters 
   // e.parameter.entry - the lockBox entry name
   // e.parameter.proxyUrl - optional - if specifed then proxyUrl to execute , using lockbox entry for oAuth 
   // e.parameter.action - manadatory - (not implemented yet edit,)show,oauth

  var content ="";
  if(IsMissing(db)) 
    content = JSON.stringify ({error: "programming error - you must provide a scriptDB to use"}) ;
 else {
    var entry =  decodeURIComponent(e.parameter.entry)
    var proxyurl = decodeURIComponent(e.parameter.proxyurl) ;
    var action = decodeURIComponent(e.parameter.action);
    

    try {
  
      switch (action) {
        case 'edit':
          content= JSON.stringify ({error: "action not yet implemented" + action}) ;
          break;
          //TODO return uiStuff (db, entry);
          
        case 'show':
          content = JSON.stringify(getMyStuff(entry,db));
          break;
          
        case 'oauth':
          content = oAuthProxy (db,entry, proxyurl).getContentText();
          break;
          
        default:
          content = JSON.stringify ({error: "unknown action - should be show or oauth" + action}) ;
          break;
      } 
    }
    catch (err) {
        content = JSON.stringify ( { error: err } );
    }
   
   
   }
   return content;
  
}
/**
 * oAuthPacket will create a packet of options and oauth parameters
 * @param {object} stuff contents of an oauth lockbox
 * @return {urlfetch.advancedoptions} the packet to use as options to urlfetch
 */ 
function oAuthPacket(stuff) {

  // relevant properties from silo
    var locker = stuff.result.myStuff;
    var siloId = stuff.result.siloId;
    
  // use GAS oauth library
    var oa = UrlFetchApp.addOAuthService(siloId);
    oa.setAccessTokenUrl (locker.accessUrl);
    oa.setRequestTokenUrl (locker.requestUrl);
    oa.setAuthorizationUrl(locker.authorizeUrl);
    oa.setConsumerKey(locker.consumerKey);
    oa.setConsumerSecret(locker.consumerSecret);
  
  // advanced oauth options
    return {
      "oAuthServiceName": siloId,
      "oAuthUseToken" : "always"
     };
}
/**
 * oAuthProxy will execute an oauth then call some url by proxy
 * @param {String} siloId siloid of the scriptdb locker holding the oauth information
 * @param {scriptDBInstance} db the private db to use
 * @param {String} url to execute
 * @return {String} response from the urlfetch
 */                
function oAuthProxy (db,siloId, url) {

  // get myStuff - this will have previously been stored in the myStuff locker
  var stuff = getMyStuff(siloId,db);
  DebugAssert(stuff.status.code == "good", "error getting secrets " + JSON.stringify(stuff) );

  // construct the oauth packet
  var packet = oAuthPacket(stuff);
  
  // issue request
   return UrlFetchApp.fetch(url, packet);
  
}
/**
 * return the stuff from the db associated with the e.parameter.entry value
 * @param {String} siloNamethe the locker name
 * @param {scriptdbinstance} db public db
 * @param {queryOb} optQuery optional query by example
 * @return {ContentService} the rest response
 */
function getPubStuff (siloName, db, optQuery) {
  var q;

  var response = {status: {code:"bad", reason:"unknown error"}, results:null};
  var ob = optQuery || {}; 
  
  q=  siloName ? scriptDbSilo(siloName,db).query(ob) : db.query(ob);
  if (q.hasNext()) {
    response.status.code = "good";
    response.status.reason = siloName + " found in your stuff";
    response.results =  [] ;
    while (q.hasNext()) {
      response.results.push(q.next());
    }
  }
  else {
    response.status.reason = siloName + " has no data";
    response.status.query = JSON.stringify(ob);
  }   
  return response;
}

/** react to a doGet(e) to return public data
 * @param {object} e as passed to doGet() 
 * @param {scriptdbinstance} db public db
 * @return {String} the json string content
 */
function getPubStuffContent (e,db) {
   //parameters 
   // e.parameter.entry - optional the lockBox entry name
  var content ;
  var entry =  e.parameter && e.parameter.entry ? decodeURIComponent(e.parameter.entry)  : null;
  try {
          content = JSON.stringify(getPubStuff(entry,db));
  } 
  catch (err) {
        content = JSON.stringify ( { error: err } );
  }

   return content;
  
}

/** show everything in a given db
 * @param {scriptdbinstance} db public db
 * @return {String} the json string content
 */
function showAll(db) {
  var results = db.query({});

  while (results.hasNext()) {
    var result = results.next();
    Logger.log(Utilities.jsonStringify(result));
  }
}