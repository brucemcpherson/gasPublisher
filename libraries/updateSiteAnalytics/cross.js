function countries() {

  // get the parameters for this site
  var options = cSiteStats.getOptions('ramblings');
  
  // this is the site i'm working with
  var site = SitesApp.getSite(options.domain, options.site);
  
  // get all the pages on the site
  var root = getPages(site);
  
  var pageViews = getAnalytics(options.propertyId,undefined, undefined, 'ga:country' );
  var world = worldBankCountries()[1].map(function(d) { return d.name });
  
  // now lets see what's in what
  var countries = pageViews.map(function (d) { return d.country; });
  
  var missingFromAnalytics = world.filter(function(d) {
    return countries.indexOf(d) === -1;
  });
  
  var missingFromWorld = countries.filter(function(d) {
    return world.indexOf(d) === -1;
  });
  
  Logger.log('Missing from Analytics');
  Logger.log(JSON.stringify(missingFromAnalytics));
  
  Logger.log('Missing from World');
  Logger.log(JSON.stringify(missingFromWorld));
  
}

function worldBankCountries() {

  var result =  UrlFetchApp.fetch("http://api.worldbank.org/country?per_page=250&region=WLD&format=json");
  return JSON.parse(result.getContentText());
}