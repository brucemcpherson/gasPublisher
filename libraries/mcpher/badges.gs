// this is how to create a badge environment from a spreadsheet
// there are multiple sheets required
// badges, collections, questions, questionsets, panelsets
// all data will be stored in given scripdb

function makeBadgesFromSheet(db) {
    var cdb=new cBadgeDb(db);
    var dSets = new cDataSets();
    // get the data for each interesting sheet
    var interesting = [ "badges", "collections", "questions", "questionsets", "panelsets" ]
    for (var i = 0; i<interesting.length;i++ ) {
        dSets.init (wholeSheet(interesting[i]),undefined,interesting[i],true,undefined,true,"id");  
    }
    // check all references exist in all the right places
    var nErrs = 0;
    nErrs += validateIdIsIn( dSets.dataSet("panelsets").column("collections") , dSets.dataSet("collections"));
    nErrs += validateIdIsIn( dSets.dataSet("collections").column("badges") , dSets.dataSet("badges"));
    nErrs += validateIdIsIn( dSets.dataSet("badges").column("questionsets") , dSets.dataSet("questionsets"));
    nErrs += validateIdIsIn( dSets.dataSet("questionsets").column("questions") , dSets.dataSet("questions"));
    if (!nErrs) {
      tryToast("so far so good .. all references were valid - now working on scriptdb..");
      makeTheQuestions (dSets.dataSet("questions"), cdb);
      makeTheQuestionSets (dSets.dataSet("questionsets"), cdb);
      makeTheBadges (dSets.dataSet("badges"), cdb);
      makeTheCollections (dSets.dataSet("collections"), cdb);
      makeThePanelSets (dSets.dataSet("panelsets"), cdb);
      tryToast("all is good .. your badge data has been moved to the scriptDB");
    }
    else {
      MsgBox("you need to fix " + nErrs + " reference errors before you can continue");
    }
    
}
// this checks that items mentioned in idColumn exist in inSet
function validateIdIsIn(idColumn, inSet) {
  var missing = 0;
  idColumn.rows().forEach(
    function(cc) {
        var a = Split(cc.toString());
        for (var i=0;i<a.length;i++) {
         if (!inSet.exists(a[i],false)) { 
           tryToast(a[i] + " from " + idColumn.parent().name() + " doesn't exist in " + inSet.name() );
           ++missing;
         }
      }
    }
  )
  return missing;
  
}

function makeTheQuestions(dSet,pdb) {
 // delete all existing ones
  pdb.remove(undefined, EBADGES.question);
  try {
    dSet.rows().forEach( 
      function (dr) {
        pdb.save (new cQuestion (
        { id : dr.value("id"),
          options : Split(dr.toString("options")),
          title : dr.value("title"),
          answers: Split(dr.value("answers")),
          type: EBADGES[dr.value("type")],
          randomize : dr.value("randomize") == "yes"
        } ), 
        EBADGES.question);
       }
    );
  }
  catch(err) {
    DebugAssert(false, err + " failed to write a question to scriptdb ");
  }
}
 
function makeTheQuestionSets(dSet,pdb) {
 // delete all existing ones
  pdb.remove(undefined, EBADGES.questionSet);
  try {
    dSet.rows().forEach( 
      function (dr) {
        pdb.save (new cQuestionSet (
        { id : dr.value("id"),
          pass : dr.value("pass"),
          questions: Split(dr.value("questions")),
          randomize : dr.value("randomize") == "yes"
        } ), 
        EBADGES.questionSet);
       }
    );
  }
  catch(err) {
    DebugAssert(false, err + " failed to write a questionset to scriptdb ");
  }
}

function makeTheBadges (dSet,pdb) {
 // delete all existing ones
  pdb.remove(undefined, EBADGES.badges);
  
  try {
    dSet.rows().forEach( 
      function (dr) {
        pdb.save (new cBadge (
          { name : dr.value("id"),
            image: dr.value("image"),
            description: dr.value("description"),
            criteria: dr.value("criteria"),
            issuer: {
              origin: dr.value("issuer_origin"),
              org: dr.value("issuer_org"),
              name: dr.value("issuer_name"),
              contact: dr.value("issuer_contact"),
            }
          },
          getQuestionSetObject (pdb,dr.value("questionsets")).data),
        EBADGES.badge);
       }
    );
  }
  catch(err) {
    DebugAssert(false, err + " failed to write a badge to scriptdb ");
  }
}

function makeTheCollections (dSet,pdb) {
 // delete all existing ones
  pdb.remove(undefined,EBADGES.badgeCollection);
  
  try {
    dSet.rows().forEach( 
      function (dr) {
        var c = new collection (undefined, undefined, dr.value("id")); 
        var a = Split(dr.value("badges"));
        for (var i=0;i<a.length;i++) {
          addBadgesToCollection (pdb, c , a[i]);
        }
        pdb.save (c);
       }
    );
  }
  catch(err) {
    DebugAssert(false, err + " failed to write a collection to scriptdb ");
  }
}

function makeThePanelSets (dSet,pdb) {
 // delete all existing ones
  pdb.remove(undefined,EBADGES.panelSet);
  
  try {
    dSet.rows().forEach( 
      function (dr) {
        var c = new collection (undefined, undefined, dr.value("id")); 
        var a = Split(dr.value("collections"));
        for (var i=0;i<a.length;i++) {
          addCollectionsToPanel (pdb, c , a[i]);
        }
        pdb.save (c,EBADGES.panelSet);
       }
    );
  }
  catch(err) {
    DebugAssert(false, err + " failed to write a panelset to scriptdb ");
  }
}



function getQuestionSetObject(bdb,id) {
  var q = bdb.get({id:id},EBADGES.questionSet);
  DebugAssert(q.hasNext(), "missing questionset " + id);
  return q.next();
}
function addBadgesToCollection ( bdb,c, id) {
  return addItems (bdb,c,id,EBADGES.badge);
}
function addCollectionsToPanel ( bdb,c, id) {
   return addItems (bdb,c,id,EBADGES.badgeCollection);
}
function addItems ( bdb,c, id ,type) {
   var o = bdb.get({id: id}, type);
   
   while (o.hasNext()) {
    var r = o.next();
    c.add (type== EBADGES.badge? r.data : r.id,r.id,false);
   }
   return c;
}
function getQuestionObject(bdb,id) {
  var q = bdb.get({id:id},EBADGES.question);
  DebugAssert(q.hasNext(), "missing questions " + id);
  return q.next();
}

function cQuestion(p) {
  var params = p || {};

  this.q = {
    id: params.id || "defaultquestion",
    title: params.title || "Where is the record of which badges I have earned ?",
    randomize: params.hasOwnProperty("randomize") ? params.randomize : true,
    options: params.options || ["There is no record","In my Mozilla backpack","In a cookie","On this site"],
    answers: params.answers || [0],
    type: params.type || EBADGES.single
  }
  
  this.name = function() {
    return this.q.id;
  }
  
  this.items = function() {
    return this.q;
  }  
  
  return this;
}
function cQuestionSet(p) {

  var params = p || {};

  this.q = {
    id: params.id || "defaultquestionset",
    randomize: params.hasOwnProperty("randomize") ? params.randomize : true,
    questions: params.questions || ["defaultquestion"],
    pass: params.pass || 1
  }
  
  this.name = function() {
    return this.q.id;
  }
  this.items = function() {
    return this.q;
  }
  return this;
}
function cBadge(p,optQuestionSet) {
  var params = p || {};
  var questionSet = fixOptional(optQuestionSet,null);
  var name = fixOptional( params.name  , "xliberationbadge");
  return { badge: {
    "version": "0.5.0",
    "name": name ,
    "image": params.image  || "img/" + name + ".png",
    "description": params.description || name,
    "criteria": params.criteria || "criteria/" + name + ".html",
      "issuer": {
        "origin": (params.issuer && params.issuer.origin) || "http://xliberation.com",
        "name": (params.issuer && params.issuer.name) || "xliberation",
        "org":  (params.issuer && params.issuer.org) || "Excel Liberation",
        "contact": (params.issuer && params.issuer.contact) || "bruce@mcpher.com"
       },
     },
     "questionSet": questionSet
  };
  
}
