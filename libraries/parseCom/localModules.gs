// to use parse.com from google apps script you need
// this module
// the cParseCom library
// since credentials are stored in your UserProperties stuff in this module cannot be part of the shared of the library, which canot access your userproperties
//module parseCom skeleton created by excelLiberation@ramblings.mcpher.com at 11/27/2013 5:28:43 PM

// in order to bring into line with the dbabstraction method, and to take account of the new properties service - i recommend the use of the version of this in 
// the cParseCom library. 

function getParsed (parseClass,optStore) {
  return new cParseCom.cParseCom().init(parseClass,findRegistryPackage());
}

function getRegistryPackage () {
  var s =  UserProperties.getProperty("xliberation");
  return s ? JSON.parse(decrypt(s)) : {credentialStore:[]};
}

function findRegistryPackage(authFlavor,scopeEntry,package) {
  authFlavor = authFlavor || "parse";
  scopeEntry = scopeEntry || "default";
  var p = (package || getRegistryPackage()).credentialStore;
  for (var i=0 ;i<p.length ;i++) {
      if (p[i].authFlavor == authFlavor && p[i].scopeEntry == scopeEntry) {
        return p[i];
      }
  }
  return null;
}

function setRegistryPackage (authFlavor,scopeEntry, ob) {
  authFlavor = authFlavor || "parse";
  scopeEntry = scopeEntry || "default";
  var package = getRegistryPackage();
  var p = findRegistryPackage(authFlavor,scopeEntry,package) ;
  if (!p) { 
    p = {scopeEntry:scopeEntry,authFlavor:authFlavor};
    package.credentialStore.push(p);
  }
  for (var k in ob)p[k] = ob[k];
  
  UserProperties.setProperty("xliberation",encrypt(JSON.stringify(package)));
  
}

function encrypt (s) {
  return encryptMessage (s);
}

function decrypt(s) {
  return decryptMessage (s);
}
function getSalt() {
  return "the stars that play with laughing sam's dics";
}
function encryptMessage (s) {
  return sjclEncryption.encryptMessage(s, getSalt());
}
function decryptMessage ( s) {
  return sjclEncryption.decryptMessage(s, getSalt());
}

