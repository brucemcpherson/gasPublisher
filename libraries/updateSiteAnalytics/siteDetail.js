function myFunction() {
  
  // get the parameters for this site
  var options = cSiteStats.getOptions('ramblings');

  // this is the site i'm working with
  var site = SitesApp.getSite(options.domain, options.site);
  
  // get all the pages under the start point
  var pages = getPages(site);
  
  // convert tree to array
  var tood = treeTo2d(pages); 
  
  Logger.log(tood);
}
