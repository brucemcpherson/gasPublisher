//---class to to the authentication
function cDigestAuth(url, credentials) {
  
  // implementation of http://tools.ietf.org/html/rfc2617
  this.credentials = credentials;  
  this.url = url;
  
  // workflow is try and get expected 401, construct digest and try again - should be 200
  this.login = function () {
    
    this.cnonce = new Date().getTime().toString(16);
    return this.initWorkflow()
                .finishWorkflow();
  };
  
  // if all has gone well we'll have got a 200 on 2nd part of workflow
  this.isLoggedIn = function () {
    return (this.danceStep2 && this.danceStep2.getResponseCode() == 200) ;
  };
  
  // kick off workflow , expecting a 401
  this.initWorkflow = function () {
      this.danceStep1 = UrlFetchApp.fetch(this.url, 
                      { "method" : "GET", "muteHttpExceptions": true} );
      return this;
  };
  
  // finish the workflow, expecting a 200
  this.finishWorkflow = function () {
      var options = 
       { "method" : "GET", "muteHttpExceptions": true , 
         "headers" : {
           "Authorization" : this.digest() 
         }
       }
      this.danceStep2 = UrlFetchApp.fetch(this.url, options);
      return this;
  }
  
  // this the hard work - figuring out the digest
  this.digest = function () {
    // now we can handshake
      var nc= "00000001";
      var o = this.authSplit();
      
    // we only know how to do md5 - TODO decide how to handle
      if (o.algorithm && o.algorithm != "MD5") {
        throw ("unable to deal with requested algorithm " + o.algorithm);
      }
      
      o.algorithm = "MD5";
      var HA1 = bytesToHex(md5(this.credentials.username+':'+o.realm+':'+this.credentials.password));
      var HA2 = bytesToHex(md5('GET'+':'+o.domain ));
      var response = bytesToHex(md5(HA1+':'+o.nonce+":" + nc+":"+this.cnonce+":"+o.qop+":"+HA2));
  
      var digest = 'Digest username="' + this.credentials.username + '"' +
             ',realm="' + o.realm + '"' +
             ',nonce="' + o.nonce + '"' +
             ',uri="' + o.domain + '"' +
             ',qop=' + o.qop + 
             ',nc=' + nc  +
             ',algorithm=' + o.algorithm +
             ',cnonce="' + this.cnonce + '"' + 
             ',response="' + response + '"';

    // sometimes opaque not given
      if (o.opaque) digest += ',opaque="' + o.opaque + '"';

      return digest;

  };
  
  // parse that very messy authenticate header
  this.authSplit = function () {
    return authSplit(this.danceStep1.getHeaders()["WWW-Authenticate"]);
  }

  // contains session ID etc.
  this.header200 = function () {
    return this.danceStep2.getHeaders();
  }

  // some utilities
  function md5 (s) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s);
  }
  
  
  function bytesToHex(b) {
    var s = '';

    for (var i =0 ; i < b.length;i++) {
      var by = b[i]<0 ? b[i]+256:b[i];
      var t= maskString(by.toString(16),"00");
      s += t;
    }
    return s;
  }
  
  function maskString(sIn , f ) {
    var s = sIn.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    if (s.length < f.length) {
        s = f.slice ( 0, f.length- s.length)  + s ;
    }
    return s;
  }
  function authSplit  (aHeader, optSplitChar) {
  
    var a = aHeader.replace(/^"|"$/g,"").replace(/^Digest /,"").split(optSplitChar || ",");
    var o = {};
    for (var i =0; i < a.length ; i++ ) {
      // trims then splits on = ignoring - in double quotes, and knocking off quotes if present
      var b = a[i].replace(/^\s\s*/, "").replace(/\s\s*$/, "").match(/(".*?"|[^"=\s]+)(?=\s*=|\s*$)/g) ;   
      if (b.length == 2 ) {
        o[b[0]] = b[1].replace(/^"|"$/g,"");
      }
      else
        throw("error in WWW-Authenticate response " + a.join());
      
    }
    return o;
  }
}

