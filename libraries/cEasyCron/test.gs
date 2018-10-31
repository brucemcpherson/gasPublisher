function myFunction() {
  // some gas webapp
  var sc = "https://script.google.com/macros/s/AKfycbyNxrJg2SbjoKWJQgGxqjECkcA-A57xaoRQWzsJkTPbVyTWbCDi/exec";
  
  // get my apiKey, which Im storing in my userproperties
  var easyCron = new EasyCron(JSON.parse(PropertiesService.getUserProperties().getProperty('easyCronKeys')).restAPIKey);
  
  // schedule it at 12:30 every day (see https://www.easycron.com/faq/What-cron-expression-does-easycron-support)
  var result = easyCron.add("myGASWebapp",sc,"30 12 * * *");
  if(!result.ok) {
    throw (JSON.stringify(result));
  }
  
}

function test () {

// some other things
  var easyCron = new EasyCron(JSON.parse(PropertiesService.getUserProperties().getProperty('easyCronKeys')).restAPIKey);

  // add something
  var id = easyCron.add("testcron","https://www.easycron.com/rest/list?token=4cf0ff7a668a141d5a81e2b6242952dc&sortby=name&page=1","0 0 * * 3").id;

  Logger.log(easyCron.enable(id));
  
    
  // list all current cron jobs
  var jobs = easyCron.listAll();

  jobs.forEach (function(d) {
    Logger.log(easyCron.disable(d[0].cron_job_id));
  });
  Logger.log(easyCron.disable(id));
  

 // remove it
  Logger.log(easyCron.remove(id));
  
}