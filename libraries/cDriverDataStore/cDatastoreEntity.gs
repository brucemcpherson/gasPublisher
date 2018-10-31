
/** 
 * entity for data store - takes care of organizing properties and keys
 * @param {string} kind - somewhat like the table name
 * @param {DataStoreWorker} worker to get handler from
 * @return {DataStoreEntity} self
 * @class DataStoreEntity
 */
 
function DataStoreEntity (kind,worker) {
  var self_ = this;
  var kind_ = kind;
  var worker_ = worker;
  var properties_ = {};

  
  /*
   * clear out current properties and optionall set some more
   * @param {object} optOb the object to set if required
   * @return {DataStoreEntity} self
   */
  self_.resetProperties = function  (optOb) {
    properties_ = {};
    if (optOb) {
      self_.setProperties(optOb);
    }
    return self_;
  };
  
  /*
   * add the object ob to the datastore properties
   * @param {object} optOb the object to set
   * @return {DataStoreEntity} self
   */
  self_.setProperties = function  (optOb) {
    ob = optOb || {};
    Object.keys(ob).forEach (function(k) {
      properties_[k] = {};
      properties_[k][getType_(ob[k])] = ob[k];
    });
    return self_;
  };
  

  /*
   * get a single property value by property name
   * @param {string} propertyName the property name
   * @return {*} the value of the property
   */
  self_.getProperty = function (propertyName) {
    var p = properties_[propertyName] ;
    // just takes the first data type
    return p ? convertType(p,Object.keys(p)[0]) : null; 
    
    // strangely, it returns integer type as a string
    function convertType (ob,type) {
      if (type === "integerValue") {
        return parseInt( p[type],10);
      }
      else {
        return  p[type];
      }
    }
    
    
  };
  
  /*
   * get a single property type by property name
   * @param {string} propertyName the property name
   * @return {string} the datastore type of the property
   */
  self_.getPropertyType = function (k) {
    var p = properties_[k] ;
    return p ? Object.keys(p)[0] : '';  
  };
  
  /*
   * get the datastore properties 
   * @return {Array.object} the properties
   */
  self_.getProperties = function () {
    return properties_;
  };
  
  /*
   * introduce new datastore properties
   * @return {DatastoreEntity} self
   */
  self_.injectProperties = function(p) {
    properties_ = p || {};
    return self_;
  };
  
  /*
   * recsontruct the datastore properties into a single object
   * @return {object} the properties
   */
  self_.reconstructProperties = function () {
    return Object.keys(properties_).reduce ( function (p,c) {
      p[c] = self_.getProperty(c);
      return p;
    },{});
  };

  /*
   * construct the key part of the object for looking up a single id
   * @param {string} id the id
   * @return {object} the keys
   */
  self_.lookupify = function (id) {
    return {keys: [ {path: [ { kind: kind_, id: id }] } ]};
  };
  
  /*
   * make a stringifiable representation of an object ready for writing to the datastore
   * @return {object} a constructed entity
   */
  self_.objectify = function () {
    return {key: {path: [ { kind: kind_ }] },properties:properties_};
  };

  /*
   * make a stringifiable representation of an object ready for updating
   * @param {string} id the id
   * @return {object} a constructed entity
   */
  self_.updateify = function (id) {
    return {key: {path: [ { kind: kind_, id:id }] },properties:properties_};
  };
  
  /*
   * make a stringifiable representation of an object ready for deleting
   * @param {Array.string} ids array of ids to remove
   * @return {object} a constructed entity
   */
  self_.removeify = function (ids) {
    if (!Array.isArray(ids)) ids = [ids];
    return ids.map(function(d) { return {path: [{ "kind": kind_, "id": d }]}; });
  };
  
  /*
   * make a stringifiable representation of an object ready for querying
   * @param {Object} optQuery any sorting/skipping type params
   * @param {Object} optParams any sroting/skipping type params
   * @return {string} a datastore type name
   */     
  self_.querify = function (optQuery, optParams) {

    var enums = worker_.getParentHandler().getEnums();
    // the basic rule is
    // all queries that are = can be combined
    // you can only have multiple constraints (eg > & <) if the property is the same one
    var q = {query:{ kinds: [{name: kind_}]}};
    
    if (optParams) {
      Object.keys(optParams).forEach (function(k){
        q.query[k] = optParams[k];
      });
    }
    
    if (optQuery) {

      var ks = '';
      
      // do the non-constraints first
      var fs = Object.keys(optQuery).reduce (function(p,c) {
        if (!optQuery[c].hasOwnProperty (enums.SETTINGS.CONSTRAINT)) {
          p.push(patchOb_ (c,optQuery[c] , enums.DATASTORE_CONSTRAINTS.EQ));
          ks = c;
        }
        return p;
      },[]);

      var fs = Object.keys(optQuery).reduce (function(p,c) {
        if (isObject_ (optQuery[c]) ){
          if (optQuery[c].hasOwnProperty (enums.SETTINGS.CONSTRAINT)) {
            if (!ks || ks === c) {
              optQuery[c][enums.SETTINGS.CONSTRAINT].forEach(function(d) {
                var operator = worker_.getConstraintName(d.constraint);
                if (operator) {
                  p.push(patchOb_ (c ,d.value, operator));          
                }
              });
              ks = c;
            }
          }
          else {
            throw 'unexpected unflattened property ' + JSON.stringify(optQuery[c]);
          }
        }

        return p;
      },fs);
      
     if (fs && fs.length > 0) {
       q.query.filter =  {
         compositeFilter:{
           operator: "AND",
           filters: fs,
         }
       };
     }
     
   }
   
   function patchOb_(name, v,oper) {
     var o =  { propertyFilter: 
       { property: { name: name },
         operator: oper,
         value:{}
       }
     };
     o.propertyFilter.value[getType_ (v)] = v;
     return o;
   }

    return q;
  };
  
  function isObject_ (obj) {
    return obj === Object(obj);
  }
  /*
   * return a datastore type deduced from the value
   * @param {*} a value
   * @return {string} a datastore type name
   */ 
  function getType_ (value) {
    
    var t = typeof value;
    if (t === "string") {
      return "stringValue"
    }
    
    else if (t==="number") {
    
      if (!isNaN(value) && parseInt(Number(value),10) === value) {
        return "integerValue";
      }
      else {
        return "doubleValue";
      }
    }
    
    else if (t==="boolean") {
    
      return "booleanValue"
    }
    
    else if (t==="undefined") {
      return "stringValue"  
    }
    
    else if (value instanceof Date) {
      return "dateTimeValue"  
    }

    else {
      throw 'unable to determine type of ' + value;
    }

    
  }

  
  return self_;
}

