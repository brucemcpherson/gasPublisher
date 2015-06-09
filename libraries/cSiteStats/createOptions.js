function setKnownOptions() {

  var options = {
    domain:"mcpher.com",
    site:"share",
    propertyId: '34421202',
    base: 'Home/',
    root: 'excelquirks',
    dbid:'siteinstrumentation',
    siteCode:'ramblings',
    siteRoot: "https://sites.google.com/a/",
    alternateRoots:[
        "http://ramblings.mcpher.com"
      ]
  };
  options.siloid = options.siteCode + options.propertyId;
  options.siteUrl = options.siteRoot + options.domain + "/" + options.site;
  setOptions (options);

}  