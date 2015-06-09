var cRest = function(){
	return this;
};
cRest.prototype.jObjects = function () {
	return this.xJobjects;
};
cRest.prototype.jObject = function () {
    var t = this.response();
	return new cJobject().init(null,ECONSTANTS.cRoot).deSerialize(t);
};
cRest.prototype.erType = function () {
	return this.xerType;
};
cRest.prototype.response = function () {
	return this.xResponse;
};
cRest.prototype.treeSearch = function () {
	return this.xTreeSearch;
};
cRest.prototype.responseData = function () {
	return this.xResponseData;
};
cRest.prototype.encodedUri = function () {

    var s = this.restUrlStem();
    var sq = this.queryString() + this.xAppendQuery;
    // sometimes encoding should not be done... this hack tries to predict
    if (!this.xAlwaysEncode) {
      var p = InStrRev(sq, "=");
      if (p > 0) {
          s += Left(sq, p);
          if (p < Len(sq))  s += URLEncode(Mid(sq, p + 1));
      }
      else {
        s += sq;
      }
    }
    else {
      s += URLEncode(sq);
    }

  return s;
};

cRest.prototype.queryhCell = function () {
	return this.xQueryhCell ;
};
cRest.prototype.queryString = function () {
	return this.xQueryString ;
};
cRest.prototype.response = function () {
	return this.xResponse ;
};
cRest.prototype.restUrlStem = function () {
	return this.xRestUrlStem ;
};
cRest.prototype.dSet = function () {
	return this.xdSet ;
};

cRest.prototype.respRootJob = function (job) {
  var x;
  if (job) x =  this.responseData () ? this.childOrFindJob(job, this.responseData()) : job;
  if (!x)  { 
    tryToast('Could not find results node for '
      +(this.responseData() ? this.responseData() : "no reponse")  + " " + (job ? job.key() : 'no data') );
  }
  return x;
};
cRest.prototype.childOrFindJob = function (job,s) {
  var t = stripDots(s);
  return this.treeSearch () ? job.find(t) : job.child(t) ;
};


cRest.prototype.init = function (optrData , 
								 optEt,
								 optHc,
								 optRq,
								 optDs,
								 optPop,
								 optPurl,
								 optClearMissing,
								 optTreesearch,
								 optComplain,
                                 optsIgnore,
                                 optUser,
                                 optPass, 
                                 optAppend, 
                                 optStampQuery, 
                                 optAppendQuery, optAccept,optBwire,optUseCache,
                                 optAlwaysEncode) {
                     
               
    this.xResponseData = fixOptional (optrData, "responsedata.results");
	this.xerType = fixOptional (optEt, ERRESTTYPE.erQueryPerRow);
	this.xQueryhCell = fixOptional (optHc, null);
	this.xQueryString = fixOptional (optRq, '');
	this.xdSet = fixOptional (optDs, null);
	this.xPopulate = fixOptional (optPop, true);
	this.xRestUrlStem = fixOptional (optPurl, '');
	var clearMissingCells = fixOptional (optClearMissing, true);
	this.xTreeSearch = fixOptional (optTreesearch, true);
	var complain = fixOptional (optComplain, true);
	this.xIgnore = fixOptional (optsIgnore, '');
    this.xAppend = fixOptional(optAppend, false);
    this.xUser = fixOptional(optUser, false);
    this.xPass = fixOptional(optPass, false);
    this.xStamp = fixOptional(optStampQuery, null);
	this.xJobjects = new collection();
    this.xAppendQuery = fixOptional(optAppendQuery,'');
    this.xAccept = fixOptional (optAccept,'');
    this.xWire = fixOptional (optBwire, false);
    this.xUseCache = fixOptional (optUseCache, true);
    this.xAlwaysEncode = fixOptional (optAlwaysEncode, false);
    
	if (this.xerType == ERRESTTYPE.erQueryPerRow && !this.xQueryhCell) {
        if(complain) {
            MsgBox ("You need to specify a column for rowwise queries");
        }
        return null;
    }

    if (!this.xdSet && this.xQueryhCell) this.xdSet = this.xQueryhCell.parent().parent();
    if (this.xPopulate && !this.xdSet) {
        if(complain) {
            MsgBox ("You need to specify a dataset");
        }
        return null;
    }
	return this;
};

cRest.prototype.executeSingle = function(optRurl,
                        optQry,
                        optComplain,
                        optsFix 
                        ) {
  // this stuff can be modifed at execute time
  if (!IsMissing(optRurl)) this.xRestUrlStem = optRurl;
  if (!IsMissing(optQry)) this.xQueryString = optQry;
  var sFix = fixOptional (optsFix,'');
  var complain = fixOptional(optComplain, true);
  var cb = new cBrowser();

  if (!sFix) {
    this.xResponse = trimLeading(cb.httpGET(this.encodedUri(),undefined,undefined,this.xAccept, this.xUseCache));
    if (this.xIgnore) {
      if(Left(this.response(), Len(this.xIgnore)) == this.xIgnore){
           this.xResponse = "{" + quote("crest") + ":" 
                    + Mid(this.response(), Len(this.xIgnore) + 1) + "}" ;
      } 
    }
   // now another tweak no quotes round the keys
   if( this.xWire)  { 
     var rx = new RegExp("(\\w+)(:)", "g");
     this.xResponse = this.xResponse.replace(rx,'"$1":');
   }
  }
  else{
    this.xResponse = sFix;
  }
  var job = this.jObject();

  this.jObjects().add(job);
  if (!job.isValid()) {
    if(complain) {
      MsgBox ("Badly formed jSon returned for query" + 
               this.queryString() + "-" + this.response());
    }
  }
  else {
    if(!this.respRootJob(job)){
      if(complain) {
        MsgBox ("No results for query " + 
               this.queryString() );
      }
      return null;
    }
    else {
      return job;
    }
  } 
};
cRest.prototype.execute = function(optQry,optsFix,optComplain){
  var complain = fixOptional (optComplain, true);
  var self = this;
 
  switch (this.erType()) {
    case ERRESTTYPE.erSingleQuery:

      //clear current data
      if (this.dSet()) {
        if (this.dSet().where() && ! this.xAppend) {
          sheetCache(this.dSet().where()).clear(this.dSet().where()).commit();
        }
      }
      // do a single query that populates multiple rows
      var job = this.executeSingle(undefined, optQry,complain , optsFix);
      
      if (job) {
        if (this.populateRows(job,complain)) {
        //update the dataset with the new values
          this.xdSet = this.dSet().rePopulate();
          return this;
        }
      }
      
      break;
      
    case ERRESTTYPE.erQueryPerRow:
    // do a query for each row
      var n=0;
      this.dSet().rows().forEach(
        function (dr) {
          var job = self.executeSingle(undefined, 
                      dr.cell(self.queryhCell().toString()).toString(),
                      complain, optsFix);
          if (job) {
            if (self.populateOneRow(job, dr) ) n++;
          }
          
        }
      );
      //write it all back to the sheet
      if (n) this.dSet().bigCommit();
      break;
    
    default:
      DebugAssert(false,'Unknown type of query ' + self.erType());
  }
  return this;
};
                        

cRest.prototype.populateOneRow= function(job, dr) { 
//populate cells with response - this populate cells in this row
  if (!this.xPopulate) return null;
  var self = this;
  var jo = self.respRootJob(job);

  if (jo) this.dSet().headings().forEach(
    function (dc) {
        //leave the query column intact
        if (dc.column() != self.queryhCell().column()) {
            // update with new value
            var jof = self.childOrFindJob(jo, dc.toString());
            dr.cell(dc.column()).xValue = jof ? 
              self.getValueFromJo(jof,dc.toString()) :
              Empty();
        }
    }
  );
  return dr;
};

cRest.prototype.populateRows= function(job, optComplain ) {

  this.xDatajObject = this.respRootJob(job);
  var complain = fixOptional (optComplain,true);
  if (!this.xPopulate) return null;
  var self = this;
  var cache = sheetCache(self.dSet().headingRow().where());
  var ro = self.dSet().headingRow().where().getRow();
  var rc = self.dSet().headingRow().where().getColumn();
  var iAppend = self.xAppend ?  self.dSet().rows().count() : 0;
  if (this.xDatajObject && this.xDatajObject.hasChildren() ) {
    // lets extend the cache since we know the size it at least needs to be
    cache.extend(this.xDatajObject.children().count()+1,self.dSet().columns().count());
    this.xDatajObject.children().forEach(
      function (jo) {
 
        // now match whatever column headings there are
          self.dSet().headings().forEach(
            function (dc) {
             // this is to deal with when a query which is supposed to create and array doesnt
              var dotless = stripDots(dc.toString());

              var joToUse = jo.child(dotless) ? jo : jo.parent();

              if (joToUse.child(dotless)) {
                cache.setValue(self.getValueFromJo(joToUse.child(dotless),dc.toString()),
                                joToUse.childIndex()+ro+iAppend,dc.column()+rc-1);
              }

            }
          );
          // we allow the stamping of the query for each row as well
          if(self.xStamp) {
            var xt = vOffset(self.xStamp.where(),jo.childIndex() + iAppend);
            cache.setValue(self.queryString () ,xt.getRow(),xt.getColumn());
          }
       }
    );
    cache.commit();
  }
  else {
    if(complain) MsgBox ("Could find no data for query " 
                        + self.queryString() 
                        + "-" + job.serialize());
    
  }

  return self;
};
cRest.prototype.getValueFromJo = function(jo ,originalKey){
  var needDots = isDots(originalKey);
  var searchKey = needDots ? dotsTail(originalKey) : originalKey;

    if(jo.isArrayRoot()) {
        var s = '';
        if(jo.hasChildren()) {
          jo.children().forEach(
            function (jom){
                            Logger.log("needdots"+originalKey+'-'+searchKey);
              var t = '';
              if (needDots) {
                var jot = jom.find(searchKey);
                if (jot) t = jot.toString();
              }
              else {
                t = jom.toString();
              }

              if(t)
                s += (s ? ","  : '' ) + t;            
            }
           );
        }
        return s;
    }
    else return jo.value ();
};

function stripDots(s) {
  return s.replace(/\.{2}.*/, "");
}

function dotsTail(s) {
    return s.match(/(.*?)\.{2}(.*)/)[2];
}
function isDots(s) {
    return stripDots(s) != s;
}


