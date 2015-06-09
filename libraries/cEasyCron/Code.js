/**
 * work with easycronAPI
 * @class EasyCron
 * @param {string} apiKey your easyCron api key
 * @param {number} optEmailFlag easyCrn email flag - 0 is only value that works with a free account
 * @param {number} optLogLength easyCrn log length flag - 0 is only value that works with a free account
 * @return {EasyCron} self
 */
 
function EasyCron(apiKey, optEmailFlag,optLogLength) {
  
  // set up api key
  apiKey_ = apiKey;
  emailFlag_ = typeof optEmailFlag === 'undefined' ? 0 : optEmailFlag;
  logLength_ = typeof optLogLength === 'undefined' ? 0 : 10240;
  var self = this;
  
    
  /**
   * list all cron jobs
   * @return {object} the self.parse result
   */
  self.listAll = function () {
    var results = [], page=1;
    while (true) { 
      var result = self.parse(UrlFetchApp.fetch (getUrl_("list")+'&sortby=name&page='+ page));
      if (!result.ok) return result;
      if (!result.data.length) return results;
      Array.prototype.push.call (results, result.data);
      page++;
    }
      
  };

  /** 
   * add a cron job
   * @param {string} name the name
   * @param {string} url the url to run
   * @param {string} expression - a cron expression - see https://www.easycron.com/faq/What-cron-expression-does-easycron-support
   * @return {object} the self.parse result
   */
  self.add = function (name,url,expression) {
     return self.parse(UrlFetchApp.fetch (
       getUrl_("add")+
       '&cron_job_name='+name+
       '&cron_expression='+expression+
       '&log_output_length='+logLength_ + 
       '&testfirst=0'+
       '&email_me='+emailFlag_+
       '&url=' + encodeURIComponent(url)
     ));
  };
  
  /** 
   * enable a cron job
   * @param {string} id the id
   * @return {object} the self.parse result
   */
  self.enable = function (id) {
     return  idMethod_ ("enable",id);
  };
  
  /** 
   * disable a cron job
   * @param {string} id the id
   * @return {object} the self.parse result
   */
  self.disable = function (id) {
     return  idMethod_ ("disable",id);
  };
  
  /** 
   * remove a cron job
   * @param {string} id the id
   * @return {object} the self.parse result
   */
  self.remove = function (id) {
     return  idMethod_ ("delete",id);
  };
  
  function idMethod_ (method,id) {
     return self.parse(UrlFetchApp.fetch (
       getUrl_(method)+'&id='+id
     ));
  };

  
  /**
   * parse and check urlfetch response
   * @param {HTTPResponse} reponse from urlfetch
   * @return {object} the result
   */
  self.parse = function (response) {
    var result = JSON.parse(response.getContentText());
    return {ok:result.status === "success", status: result.status, error:result.error, data: result.cron_jobs, id:result.cron_job_id};
  };

  /**
   * construct general URL for all uses
   * @param {string} method
   * @return {string} the url
   */
  function getUrl_ (method) {
    return 'https://www.easycron.com/rest/' + method + '?token=' + apiKey_;
  }
  
}

