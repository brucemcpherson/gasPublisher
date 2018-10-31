function encryptMessage (s,salt) {
  return Utilities.base64Encode(JSON.stringify(sjcl.encrypt(salt,s)));
}

function decryptMessage (s,salt) {
  return sjcl.decrypt(salt,JSON.parse(Utilities.newBlob(Utilities.base64Decode(s)).getDataAsString()));
}

function test () {
  var salt = "the rain in spain";
  var text = "stays mainly on the plain";
  
  Logger.log( decryptMessage(encryptMessage(text,salt),salt));

}