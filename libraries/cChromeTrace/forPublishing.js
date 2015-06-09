/**
 * becoming a little defunct
 * but here for backwards compat
 */
function getLibraryInfo () {

  return { 
    info: {
      name:'cChromeTrace',
      version:'0.0.2',
      key:'M6SHE8Ysn-5KyFf8NGzQpTSz3TLx7pV4j',
      description:'enable chrome tracing from apps script',
      share:'https://script.google.com/d/18DUgAypAyUNTeHmCVDHtiqrTFc9ovMKFQ70bFOMgJrB-ho49Z0UC-utu/edit?usp=sharing'
    },
    dependencies:[
      cUseful.getLibraryInfo(),
      cDriveJsonApi.getLibraryInfo()
    ]
  }; 
}


function showMyScriptAppResource(s) {
  try {
    return ScriptApp.getResource(s);
  }
  catch (err) {
    throw err + " getting script " + s;
  }
}
