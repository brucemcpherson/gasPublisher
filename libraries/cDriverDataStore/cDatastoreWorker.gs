/** 
 * interface for data store - takes care of accessing datastore
 * @param {DataHandler} parentHandler the abstract handker
 * @param {string} accessToken - the oauth2 access token
 * @param {string} dataStoreName  - the name of this data store (project id incloud console)
 * @param {string} kind - somewhat like the table name
 * @return {DatastoreWorker} self
 * @class DatastoreWorker
 */
 
function DatastoreWorker(parentHandler, accessToken, dataStoreName, kind) {
  
    var name_ = dataStoreName;
    var self_ = this;
    var kind_ = kind;
    var accessToken_ = accessToken;
    var parentHandler_ = parentHandler;
    var enums = parentHandler.getEnums();  
    var SAVECHUNK = 500;
    
    self_.getParentHandler = function () {
      return parentHandler_;
    }
    /**
     * set a new access token
     * @param {string} accessToken - the oauth2 access token
     * @return {DatastoreWorker} self
     */
    self_.setAccessToken = function (token) {
      accessToken_ = token;
      return self_;
    };
    /**
     * flatten an array of objects/a single object
     * @param {Array.Object|Object} obs an array of/single unflattened objects
     * @param {boolean} optConstraints whether there might be constraints to preserve
     * @return {Array.Object|Object} an array of/single flattened objects
     */
    self_.flatten = function (obs,optConstraints) {
     
      return self_.getParentHandler().flatten(obs,optConstraints);

    };
    
    /**
     * unflatten an array of objects
     * @param {Array.Object} obs an array of flattened objects
     * @return {Array.Object} and array of unflattened objects
     */
    self_.unflatten = function (obs) {
      // unflatten the query
      if (!obs) return null;
      return obs.map(function(d) {
        return new cFlatten.Flattener().unFlatten(d);
      });

    };
    
    /**
     * generate a proper object from a datastore entity query response
     * @param {Array.object} entities - the datastore query response
     * @return {Array.object} an array of proper objects
     */
    self_.reconstructProperties = function (entities) {
      var root;
      if(entities.batch) {
        root = entities.batch.entityResults;
      }
      else if (entities.found) {
        root = entities.found;
      }
      else if (entities.entityResults) {
        root = entities.entityResults;
      }
      else {
        throw 'cant make anything of ' + JSON.stringify(entities);
      }

       return root.map( function(d) { 
         return new DataStoreEntity (d.entity.key.path[0].kind).injectProperties(d.entity.properties).reconstructProperties();
       });     
    };
    
    /**
     * insert an array of objects
     * @param {Array.object} obs - an array of objects to insert
     * @return {object} the datastore result object and success codes
     */
    self_.insert = function (obs) {
      var result = {handleCode:enums.CODE.OK,handleError:''};
      
      if (!Array.isArray (obs)) obs = [obs];
      var entities = obs.map(function(d){
        return new DataStoreEntity (kind_).setProperties (self_.flatten(d));
      });

      var options = getOptions_(), done =0;
      while (done < entities.length && result.handleCode === enums.CODE.OK) {
        var chunk = entities.slice(done, Math.min(entities.length,done+SAVECHUNK));
        options.payload=  JSON.stringify({
          mutation: {insertAutoId: chunk.map ( function (d) { return d.objectify()})},
          mode: "NON_TRANSACTIONAL"
        });
        result = execute_ (self_.getEndpoint("commit"), options);
        done += chunk.length;
      }
      return result;
    };
    
    /**
     * delete an array of objects
     * @param {Array.string} obs - an array of ids to delete
     * @return {object} the datastore result object and success codes
     */
    self_.remove = function (ids) {
      var result = {handleCode:enums.CODE.OK,handleError:''};
      var options = getOptions_(),done =0;
      
      while (done < ids.length && result.handleCode === enums.CODE.OK) {
        var t = new DataStoreEntity (kind_);
        var chunk = ids.slice(done, Math.min(ids.length,done+SAVECHUNK));
        options.payload =  JSON.stringify({
          mutation: {"delete": t.removeify(chunk)},
          mode: "NON_TRANSACTIONAL"
        });
        result= execute_ (self_.getEndpoint("commit"), options);
        done += chunk.length;
      }
      return result;

    };
    
    /**
     * update an array of objects
     * @param {Array.string} obs - an array of ids to update
     * @param {Array.object} obs - an array of objects to update it to
     * @return {object} the datastore result object and success codes
     */
    self_.update = function (ids,obs) {
      
      if (!Array.isArray (obs)) obs = [obs];
      if (!Array.isArray (ids)) ids = [ids];
      if(ids.length !== obs.length) {
       return {
         handleCode: enums.CODE.KEYS_AND_OBJECTS,
         handleError: 'objects- ' + obs.length + ' keys- ' + ids.length,
         result:null };
      }
      else {
        var entities = obs.map(function(d){
          return new DataStoreEntity (kind_).setProperties (self_.flatten(d));
        });

        var options = getOptions_();
  
        options.payload=  JSON.stringify({
          mutation: {update: entities.map ( function (d,i) { return d.updateify(ids[i])})},
          mode: "NON_TRANSACTIONAL"
        });
        
        var result= execute_ (self_.getEndpoint("commit"), options);
        if (result.handleCode >=0) {
          result.data = self_.unflatten (result.mutationResult);
        }
        return result;
      }
    };

    self_.getConstraintName = function (constraint) {
        return constraint ? 
          Object.keys(enums.CONSTRAINTS).reduce (function(p,c) { 
            return enums.CONSTRAINTS[c] === constraint ? enums.DATASTORE_CONSTRAINTS[c] : p;
          },'') 
          : null;
    }

    /**
     * run a query
     * @param {object} optOb - a nosql query
     * @param {optParams} optParams - sorted out parameters
     * @return {object} the datastore result object and success codes
     */
    self_.runQuery = function (optOb,optParams) {
      var options = getOptions_();
      var de = new DataStoreEntity (kind_,self_);

      // create query
      var qo = self_.flatten(optOb,true);
      var queryOb = de.querify(qo,optParams);
      options.payload = JSON.stringify(queryOb);
      
      var result= execute_ (self_.getEndpoint("runQuery"), options);

      if (result.handleCode >=0) {
        result.data = self_.unflatten (self_.reconstructProperties(result.result));
      }
      return result;
    };
    
    /**
     * lookup an object by id
     * @param {string} id - an id to lookup
     * @return {object} the datastore result object and success codes
     */
    self_.lookup = function (id) {
      var options = getOptions_();
      options.payload = JSON.stringify(new DataStoreEntity (kind_).lookupify(id) );
      
      var result= execute_ (self_.getEndpoint("lookup"), options);
      if (result.handleCode >=0) {
        result.data = self_.unflatten (self_.reconstructProperties(result.result));
      }
      return result;
    };
    
    /**
     * get the api url
     * @param {string} method - the method
     * @return {string} the url
     */
    self_.getEndpoint = function (method) {
      return 'https://www.googleapis.com/datastore/v1beta2/datasets/' + name_ + "/" + method; 
    };

    /**
     * get an array of ids
     * @param {object} result the datastore result object and success codes
     * @return {Array.string} the array of IDS
     */
    self_.getIds = function (result) {

        if (result.result.mutationResult ) { 
          return result.result.mutationResult.insertAutoIdKeys.map(function(d) { return d.path[0].id; }).filter(function(d) { return d });
        }
        else if (result.result.batch) {
          return result.result.batch.entityResults.map(function(d) { return d.entity.key.path[0].id; }).filter(function(d) { return d });
        }
        else if (result.result.found) {
          return result.result.found.map(function(d) { return d.entity.key.path[0].id; }).filter(function(d) { return d });
        }

    };
    
    /**
     * get basic http options
     * @return {object} the options
     */
    function getOptions_ () {
       return {
        method: "POST",
        contentType : "application/json" ,
        muteHttpExceptions : true,
        headers: {
          authorization: "Bearer " + accessToken_
        }
      };
    }
    
    /**
     * exponetial backoff get
     */
    function fetch_ (url,options) {
      return parentHandler_.rateLimitExpBackoff ( function () { 
              return UrlFetchApp.fetch(url,options); }) ;
    } 
    
    /** 
     * execute a fetch
     */
    function execute_ (url,options) {
      var result=null, error = '', code = enums.CODE.OK;
      
      return parentHandler.rateLimitExpBackoff ( function () {
        try {
          var response = fetch_(url, options);
          result = JSON.parse(response.getContentText());
          if (response.getResponseCode() !== 200) {
            code = enums.CODE.HTTP;
            error = 'status'+ response.getResponseCode();
          }
        }
        catch (err) {
          code= enums.CODE.DRIVER;
          error = err;
        }
          
        return {handleError:error, handleCode:code, result:result};
      });
      
     }
     
     return self_;
}
