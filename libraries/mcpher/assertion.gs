

function processAwards(p) {
  
  var result= {};
  switch(LCase(p.action)){
    case 'get':
      var result  = getThisAward (p);
      break;
      
    case 'remove':
      var result  = removeThisAward (p);
      break;
      
    case 'award':
      result = makeThisAward(p);
      break;
      
    case 'assertion':
      result = getThisAssertion(p);
      break;
    
    default:
      result = {error: "unknown action" + p.action, data: null };
  }
  var j = JSON.stringify(result.error ? result : result.data);
  
  if (p.callback) {
      j = p.callback + "(" + j + ")"
  }
  return j;
}

function makeThisAward(p) {
  var award = new cAward(p);
  p.awardDb.save(award,EBADGES.award);
  return award;
}

function cAward (p) {
  var self = this;
  self.data = {
    recipient: "sha256$" + p.key,
    salt: p.badge,
    evidence: p.evidence,
    expires: p.expires,
    issued_on: p.issued_on
  }
  self.id = p.key;
  self.name = function() {
    return self.id;
  }
  self.items = function() {
    return self.data;
  }
  return self;
}

function removeThisAward(p) {
  var award = getThisAward(p);
  if (award.error) 
    return award ;
  else {
    var r = p.awardDb.remove({id:p.key}, EBADGES.award);
    return {status: 'ok', data: 'removed ' + p.key};
  }

}


function getThisBadge(p){
  return getThisBadgeThing(p.badgeDb,p.badge, EBADGES.badge); 
}

function getThisAward(p) {
  return getThisBadgeThing(p.awardDb,p.key, EBADGES.award); 
}

function getThisAssertion(p) {
  var assertion = {};
  var a = getThisAward(p);
  var b = a.error ? {error:'could not identify badge',data:null} : 
        getThisBadgeThing(p.badgeDb,a.data.salt,EBADGES.badge);  
  if (!b.error && !a.error) {
    assertion.data = a.data;
    assertion.data.badge=b.data.badge;
  }
  else
    assertion = {error:'could not get assertion',badge:b,award:a,data:null};
  
  return assertion;
}

function getThisBadgeThing(cdb,k,type){
  var results = cdb.get( {id:k} ,type );
  return results.hasNext() ? results.next() : {error:'no such ' + type + ' ' + k,data:null};
}


