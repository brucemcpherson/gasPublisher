/**
 * store the options for a particular site
 * @param {string} siteCode the site options name
 * @return {object} site the site options
 */
function getOptions (siteCode) {
  var handler = getOptionsHandle();
  var result = handler.query({siteCode:siteCode});
  if (result.handleCode < 0 || result.data.length !== 1 ) throw JSON.stringify(result);
  return result.data[0];
}

/**
 * store the options for a particular site
 * @param {object} site the site options
 * @return {object} site the site options
 */
function setOptions (options) {
  var handler = getOptionsHandle();
  var result = handler.remove({siteCode:options.siteCode});
  if (result < 0) throw result.handleError;
  
  var result = handler.save(options);
  if (result.handleCode < 0) throw result.handleError;
  
  return options;
}
/** 
 * place to store all the options for any sites being monitored
 * @return {DbAbstraction.handle} a handle to some database abstraction
 */
function getOptionsHandle () {

// im setting this up for mongo lab .. change this for a different driver
  var handler = new cDbAbstraction.DbAbstraction ( cDriverMongoLab , { 
    dbid:'siteinstrumentation',
    siloid:'options',
    driverob:JSON.parse(PropertiesService.getScriptProperties().getProperty("mongoLabKeys")),
    private:false
  });
  if (!handler.isHappy()) throw 'unable to get handler for mongolab';
  return handler;
}
/** 
 * place to store all the data for any sites being monitored
 * @param {string} siteCode the site options name
 * @param {boolean} optPass pass on faile
 * @return {DbAbstraction.handle} a handle to some database abstraction
 */
function getDataHandle (siteCode,optPass) {
  
  // this where i store the options. 
  var options = getOptions(siteCode);
  if (!options) throw 'could not get options for ' + siteCode;
  
  // im setting this up for mngo lab .. change this for a different driver
  options.driverob = JSON.parse(PropertiesService.getScriptProperties().getProperty("mongoLabKeys"));
  options.private = false;
  
  var handler = new cDbAbstraction.DbAbstraction ( cDriverMongoLab , options);
  if (!handler.isHappy() && ! optPass) throw 'unable to get handler for mongolab';
  return handler;
}
/**
 * @param {string} optUrl url to find .. if blank will try for the current site page 
 * @param {string} siteCode will be used to find the parameters (ua property, database etc) for this site data
 * @return {object} the data
 */
function siteStats (optUrl,siteCode) {
  // given a url construct the site stats
  var options  = getOptions(siteCode),data;
  var url = optUrl|| '';
  if (options) {
    var dataHandle = getDataHandle (options.siteCode, true);
    if (dataHandle) {
    
      if (url) {
        if (url.slice(0,options.siteUrl.length)!==options.siteUrl) {
            //replace the domain with the site url
            url = url.replace(/^[\w-:]*\/\/[\w-\.]*\//,options.siteUrl + "/" );
        }
      }
      else {
        var result = {data:null};
        Logger.log('no page url provided');
      }
      var result = dataHandle.query ({"page.url":url});
      data = result.handleCode < 0 ? null: result.data[0];
    }
  }
  return data;
  
}

