// this section deals with badges storage - its anbstracted away so that the callers
// are not aware of how the badges are stored
// this is a scriptDB version
/** stored objects looks like this
 * {id: whatever, data: theobject }
 */
/**
 * a cBadgeDb
 * @class 
 * @implements {cBadgeDb}
 * @return {cBadgeDb} a new cBadgeDb
 */
function cBadgeDb(db) {
  this.db= db;  
  return this;
}
/**
 * detect the type of object
 * @param {object} item the badge or collection of badges
 * @return {string} the EBADGE enum
 */
cBadgeDb.prototype.detect = function (item,optType) {
  var type = fixOptional (optType, EBADGES.badge);
  return item && item.hasOwnProperty("items") && IsMissing(optType) ? 
    EBADGES.badgeCollection : type;
}
/**
 * save a given badge or collection
 * @param {object} item the badge or collection of badges
 * @return {cBadgeDb} this cBadgeDb
 */
cBadgeDb.prototype.save = function (item, optType) {
  
  var self = this, o , type = self.detect (item,optType) ;
  var silo = scriptDbSilo (type , self.db,undefined, true);

  o = type == EBADGES.badge ? 
    { id: item.badge.name, data: item  }   :
    { id: item.name(), data: item.items()} ;
  
  // block to ensure delete.insert
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);
  try {
    silo.remove({id:o.id});
    silo.save(o);
  } 
  finally { 
    lock.releaseLock();
  }
  return self;
}
/**
 * save a given badge or collection
 * @param {object} optItem the badge or collection of badges
 * @return {object} query results  matching the criteria
 */
cBadgeDb.prototype.get = function(optItem,optType) {

  var self=this,  type = self.detect (optItem,optType);
  var silo = scriptDbSilo (type , self.db,undefined, true);
  return silo.query (optItem);
  
}
 
  
/**
 * delete a given badge or collection of badges
 * @param {object} optItem the badge or collection of badges
 * @param {number=} optType EBADGES the type of item being saved
 * @return {cBadgeDb} this cBadgeDb
 */
cBadgeDb.prototype.remove = function( optItem, optType ) {
  var self = this, silo = scriptDbSilo (self.detect (optItem,optType) , self.db, undefined, true);
  silo.remove (optItem);
  return self;
}
