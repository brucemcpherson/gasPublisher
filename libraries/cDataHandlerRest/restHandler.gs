/**
  * getPostParams - sorts out parameters for DataHandlerRest in cluding thos passed as postdata
  * @param {object} e from doPost()/doGet()
  * return {object} the massaged parameters
  */
  

function getPostParams (e) {
  
  var postData,params = {};
  // data and parameters can co,e via both post or command line
  // postData should look like {parameters:{},data:{}}
  // postdata sent via GET should be &data=some json
  

  if (e && e.postData) {
    postData = JSON.parse(e.postData.contents);
  }
  
  if (postData) {
    params = postData.parameters || {};
    if (postData.data) {
      params.data = JSON.stringify(postData.data);
    }
    var ks = postData.keys || postData.handleKeys;
    if (ks) {
      params.keys = JSON.stringify(ks);
    }
  }  

  // now supercede with command line parameters
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function(k) {
      params[k]=e.parameter[k];
    });
  }
  params.e = e;
  return params;
}


/**
  * DataHandlerRest - handlesweb app for DataHandler
  * @param {object} data everything needed to process the request
  * @param {Array.string} optAllowed array of aoperations im allowed to perform 
  * return {DataHandlerRest} a new DataHandlerRest object
  */

var DataHandlerRest = function (data,optAllowed,accessToken) {
  var self = this;
  var enums =  cDataHandler.dhConstants;
  var params = data;
  var result = {handleCode:enums.CODE.PUBLISH,handleError:enums.ERROR.PUBLISH};
  
  self.isHappy = function () {
    return (result && result.handleError === enums.CODE.OK);
  };
  
  self.publish = function () {

    var s = JSON.stringify(result);
    var mime = ContentService.MimeType.JSON;
    
    if (params.callback) {
      s = params.callback + "(" + s + ")";
      mime = ContentService.MimeType.JAVASCRIPT;
    }

    return ContentService.createTextOutput(s).setMimeType(mime);
  };
  
  self.getResult = function() {
    return result ? result : {handleCode:enums.CODE.NO_ACTION, handleError:enums.ERROR.NO_ACTION};
  };
  
  
  // find the type
  var driverType = params.driver ? enums.DB[params.driver.toUpperCase()] : '';
  if (!driverType) {
    result = {handleCode:enums.CODE.UNKNOWN_DRIVER, handleError:enums.ERROR.UNKNOWN_DRIVER, data:[params]};
    return self;
  };
  
  
  // open a handler
  var handler = new cDataHandler.DataHandler (
    params.siloid,
    driverType,
    params.expiry,
    params.dbid,
    params.driverob,
    undefined,
    undefined,
    params.peanut,
    params.accessToken);
    
  if (!handler) {
    result = {handleCode:enums.CODE.PARAMS_MISSING, handleError:enums.ERROR.PARAMS_MISSING, data:[params]};
    return self;
  }
  else if (!handler.isHappy()) {
    result = {handleCode:enums.CODE.HANDLE_GET, handleError:enums.ERROR.HANDLE_GET, data:[params]};
    return self;
  }
  
  // now good to try rest processing
  var rest = new DataRest(handler,params.allowed);
  if (!rest) {
    result = {handleCode:enums.CODE.REST_GET, handleError:enums.ERROR.REST_GET, data:[params]};
    return self;
  }


  
  // lets go - organize the args into the right order for the called function

  if (params.action === 'save') {
    result = rest.generalRoute (params.action,params.dataOb);
  }
  else if (params.action === 'update') {

    result = rest.generalRoute (params.action,params.keyOb,params.dataOb);
  }
  else if (params.action === 'get') {
    result = rest.generalRoute (params.action,params.keyOb,params.nocache,params.keepid);
  }
  else {

    result = rest.generalRoute (params.action,params.query,params.params,params.nocache,params.keepid);

  }

  return self;
}

/**
  * DataRest - handles rest requests to DATAHANDLER
  * @param {DataHandler} dataHandler the datahandler to work on
  * @param {[String]} allowedOperations list of operations that can be done. default ['remove','save','query','count']
  * return {DataRest} a new DataHandlerRest object
  */
  
var DataRest = function  (dataHandler,allowedOperations) {

  var self = this;
  var parentHandler = dataHandler;
  var enums = parentHandler.getEnums();
  var pAllowed = allowedOperations ||  enums.ACTIONS;
  

  self.isAllowed = function(access) {
      return  pAllowed.indexOf(access) !== -1 ;
  }

  self.generalRoute = function(action) {
    // hive off all the args but the first
    var a = Array.prototype.slice.call(arguments);
    a.shift();
    
    // can we do this?
    if (!self.isAllowed(action)) {
      return parentHandler.makeResults (enums.CODE.OPERATION_NOT_ALLOWED,action);
    }
    else {
      var r;
      try { 
        r = parentHandler[action].apply (null,a);
      }
      catch(err) {
        r = parentHandler.makeResults (enums.CODE.ACTION_FAILED,action+" "+err);
      }
      return r;
    }

  }
  return self;
}
 
