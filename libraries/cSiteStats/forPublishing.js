
function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}
function getLibraryInfo () {

  return { 
    info: {
      name:'cSiteStats',
      version:'0.0.1',
      key:'MKHWwn03HE7ktl0fffddC-iz3TLx7pV4j',
      description:'connect to site for stats',
      share:'https://script.google.com/d/1Fty63hZkFuB9c0-LyRrxbysb7_LfOeGJI798ccglBPFZyl5X-P2-u1x-/edit?usp=sharing'
    },
    dependencies:[
      cDbAbstraction.getLibraryInfo(),
      cDriverMongoLab.getLibraryInfo()
    ]
  }; 
}
