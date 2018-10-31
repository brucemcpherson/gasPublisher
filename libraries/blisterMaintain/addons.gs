
// blister.currencies
function upDateCurrencies() {
  // this one will run regularly to update the currency blister list
  // just create a trigger to run as often as you need
  var listName = 'blister.currencies', rate = 'USDrate', iso = 'ISO';
  
  // get the current currency blister
  var b = blisterAssister (listName, { sortId:1 , description:"List of currencies and exchange rates by country and ISO code" }); 
  var c = b.items();

  // check we have a USD conversion column, or add it
  var k = b.findOrAddListId (rate);
  var o = b.findOrAddListId (iso);
  // update content to rate

  for ( var i=0; i < c[o].length;i++) {
    Utilities.sleep(5);
    // google calculator is no more

    var response = UrlFetchApp.fetch('http://rate-exchange.appspot.com/currency?from=USD&to=' + c[o][i]);
    var data = JSON.parse(response);
    c[k][i] = data.rate ? data.rate : 'non-icc';


  }

  // update 
  b.replace();

}


// blister.airlines
// this one gets airlines from a fusion table and loads it to a blister
function updateAirlines() {
  generalFusionToBlister("1pvt-tlc5z6Lek8K7vAIpXNUsOjX3qTbIsdXx9Fo", "airlines" , "list of airlines and their flight codes" );
}

// blister.airports
// this one gets airports from a fusion table and loads it to a blister
// TODO - still got to deal with too big scriptDB objects
function updateAirports() {
  generalFusionToBlister("1Ug6IA-L5NKq79I0ioilPXlojEklytFMMtKDNzvA", "airports" );
}

// blister.billboardhot100
function updateBillBoard() {
  generalXMLToBlister ("http://www.billboard.com/rss/charts/hot-100", "billboardhot100", "channel","item",true, "billboard top 100");
}
// blister.champagne
function updateChampagne() {
  generalSocrataToBlister("cyps-ngcn.json", "champagne", "volume of champagne shipped" );
}


// university.guardianRatings
// TODO blows scriptDB limit for object size, so we need one for each discipline
function updateUniversityRatings() {

  var blisterName = "guardianRatings";
  var d = getDataFromSheets("0At2ExLh4POiZdFd0YUhpZVRPUGxFcW85X2xkMm1vY2c");

  
  for ( var i=0; i < d.length; i++) {
    var tab = d[i].name.split(" ");
    // we only want the tabs that have space seperaters
    if (tab.length > 1) {
      var discipline = tab[1];
      var b = new blister.cBlister(blisterName+"_"+discipline, { db: university.showMyScriptDb(), sortId:1 , 
            description:"Guardian University ratings:" + discipline  });
      b.empty();
      var c= b.items();

      // titles are in the 2nd row 
      for (var j = 0; j < d[i].values[1].length ; j++) {
        b.findOrAddListId (d[i].values[1][j]);
      }
      
      // now the data - stop at first blank cell in col 0
      for ( var x=0,j = 2; j < d[i].values.length && !(d[i].values[j][0] === '')  ; j++ ) {
        for ( k = 0; k < d[i].values[j].length ; k++ ) {
          c[k][x] = d[i].values[j][k];
        }
        x++;
      }
      b.replace();
    }
  }
}

function getDataFromSheets (key) {

  var d = [];
  var ss = SpreadsheetApp.openById(key);
  var sheets = ss.getSheets();
  for (var i=0; i < sheets.length;i++){
    d.push({name:sheets[i].getName() , values:sheets[i].getDataRange().getValues()});
  }
  return d;
  
}

function generalSocrataToBlister (key, blisterName , optDescription) {

  var url ="http://opendata.socrata.com/resource/";
  var t = UrlFetchApp.fetch(url + key).getContentText();
  var b = new blister.cBlister(blisterName, { db: blister.showMyScriptDb(), sortId:1 , description:optDescription });
  var document = JSON.parse(t);

  // delete current content
  b.empty();
  var c = b.items();
  
  for (var i = 0; i < document.length; i++) {

    for ( var col in document[i]) {
      var k = b.findOrAddListId (col); 
      c[k][i] = document[i][col];
    }
  }
  
  // update
  b.replace();
 
}


function generalXMLToBlister (url, blisterName , containerName, itemName, optAddSequence, optDescription) { 

  var t = UrlFetchApp.fetch(url).getContentText();
  var document = XmlService.parse(t);
  var root = document.getRootElement();

  var entries = document.getRootElement().getChildren(containerName)[0].getChildren(itemName);
  // create a blister if it doesn't exist
  var b = new blister.cBlister(blisterName, { db: blister.showMyScriptDb(), sortId:1, description:optDescription });
    
  // delete current content
  b.empty();
  var c = b.items();
  
  for (var i = 0; i < entries.length; i++) {
    var items = entries[i].getChildren();
    if (optAddSequence) {
      var k = b.findOrAddListId ("sequence");
      c[k][i] = (i+1);
    }
    for (var j=0; j < items.length;j++) {
      // add item to blister
      var k = b.findOrAddListId (items[j].getName());
      c[k][i]= items[j].getValue();

    }
  }
  b.replace();
}
function copyKeys() {
  PropertiesService.getUserProperties().setProperty("fusionDeveloperKey", UserProperties.getProperty("fusionDeveloperKey"));
}
 
function generalFusionToBlister (tableKey, blisterName,optDescription) {
  
  var developerKey = JSON.parse(PropertiesService.getUserProperties().getProperty("fusionDeveloperKey")).consumerKey;
  
  // this is the fusion table 
  var sql = "select * from " + tableKey;
  var url = "https://www.googleapis.com/fusiontables/v1/query?key=" + developerKey + "&sql=" + sql;
  var t = UrlFetchApp.fetch(url).getContentText();
  var data = JSON.parse(t);
  
  if (data.columns) {
    // create a blister if it doesnt exist
     var b = new blister.cBlister(blisterName, { db: blister.showMyScriptDb(), sortId:1 , description:optDescription });
  
    // delete current content
     var c = b.content();
     if (!c) c = b.template();
     c.package.items = [];
    
    // create new keys 
     c.package.keys = data.columns;

     // now add data rows
     for (var i = 0 ; i < data.columns.length ; i++ ) {
       c.package.items.push ( [] ) ;
       for (var j = 0 ; j < data.rows.length ; j++ ) {
         c.package.items[i].push(data.rows[j][i]) ;
       }
     }
     // write back
     b.replace (c);
   }
   else {
     throw ("error getting data from fusion table " + t);
   }

}
function maskFormat(sIn , f ) {
  var s = sIn.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  if (s.length < f.length) {
    s = f.slice(0,f.length - s.length) + s ;
  }
  return s;
}
  
function btcUpdate() {
  var urlStem = "btc-e.com/api/2/";
  //var types = ["ticker","trades","depth"];
  var types = ["ticker","depth"];
  var currencies = ["usd","eur","rur"];
  //var venues = ["btc_usd","btc_eur","btc_rur","ltc_btc","ltc_usd","ltc_rur","nmc_btc","usd_rur","eur_usd","nvc_btc","trc_btc","ppc_btc","ftc_btc"];
  var venues = ["btc_usd"];
  var registerDate = new Date();
  var blisterBox = registerDate.getFullYear().toString()+maskFormat(registerDate.getMonth().toString(),"00") + maskFormat(registerDate.getDay().toString(),"00");
  var registerTime = registerDate.getTime();
  
  // query for each one
  for (var j=0; j < types.length;j++) {
    for (var i=0; i < venues.length ; i++ ) {
        var listName = "blister."+types[j]+"_"+venues[i];
        // get the current blister
        var b = blisterAssister (listName, { sortId:1 , description:"Data for bitcoin " + types[j] + " venue " + venues[i] + " " + blisterBox }); 
                
        // now all the column headers in from the api
        var response = UrlFetchApp.fetch(urlStem  + venues[i] + "/" + types[j] ).getContentText();
        var data = JSON.parse(response);
        
        if (types[j] === 'depth' ) {
          var d = data.asks;
          var price =b.findOrAddListId ("Price");
          var volume =b.findOrAddListId ("Volume");
          for (var p = 0 ; p < d.length ; p++) {
              b.content().package.items[price].push(d[p][0]); 
              b.content().package.items[volume].push(d[p][1]); 
          }
        }
        else if (types[j] === 'ticker') {
          var d = data.ticker;
          // ensure we have all the needed columns
          for (var col in d) {
            b.findOrAddListId (col);
          }
          // add the data
          for (var col in d) {
            var k = b.getKeyItemIndex(col) ;
            b.content().package.items[k].push(d[col]); 
          }
        }
        else if (types[j] === 'trades') {
          var d = data;

          for (var p =0; p < d.length; p++) {
            c[b.findOrAddListId ("updateDate")-1][r] = registerTime;
            for (var col in d[p]) {
              var k = b.findOrAddListId (col);
              Logger.log(k+col);
              c[k].push(d[p][col]);
            }
          }
        }
        else {
          throw ("wtf" + types[j]);
        }

        b.replace();
      }
    }
  }

  
/*
'Posted by Support A2 on 04 May 2013 08:27 PM
'Public API ? BTC/USD
'
'
'
' Ticker -  https://btc-e.com/api/2/btc_usd/ticker
'
' Trades -  https://btc-e.com/api/2/btc_usd/trades
'
' Depth -  https://btc-e.com/api/2/btc_usd/depth
'
'
'
'Public API ? BTC/EUR
'
'
'
' Ticker -  https://btc-e.com/api/2/btc_eur/ticker
'
' Trades -  https://btc-e.com/api/2/btc_eur/trades
'
' Depth -  https://btc-e.com/api/2/btc_eur/depth
'
'
'
'Public API ? BTC/RUR
'
'
'
' Ticker -  https://btc-e.com/api/2/btc_rur/ticker
'
' Trades -  https://btc-e.com/api/2/btc_rur/trades
'
' Depth -  https://btc-e.com/api/2/btc_rur/depth
'
'
'
'Public API ? LTC/BTC
'
'
'
' Ticker -  https://btc-e.com/api/2/ltc_btc/ticker
'
' Trades -  https://btc-e.com/api/2/ltc_btc/trades
'
' Depth -  https://btc-e.com/api/2/ltc_btc/depth
'
'
'
'Public API ? LTC/USD
'
'
'
' Ticker -  https://btc-e.com/api/2/ltc_usd/ticker
'
' Trades -  https://btc-e.com/api/2/ltc_usd/trades
'
' Depth -  https://btc-e.com/api/2/ltc_usd/depth
'
'
'
'Public API ? LTC/RUR
'
'
'
' Ticker -  https://btc-e.com/api/2/ltc_rur/ticker
'
' Trades -  https://btc-e.com/api/2/ltc_rur/trades
'
' Depth -  https://btc-e.com/api/2/ltc_rur/depth
'
'
'
'Public API ? NMC/BTC
'
'
'
' Ticker -  https://btc-e.com/api/2/nmc_btc/ticker
'
' Trades -  https://btc-e.com/api/2/nmc_btc/trades
'
' Depth -  https://btc-e.com/api/2/nmc_btc/depth
'
'
'
'Public API ? USD/RUR
'
'
'
' Ticker -  https://btc-e.com/api/2/usd_rur/ticker
'
' Trades -  https://btc-e.com/api/2/usd_rur/trades
'
' Depth -  https://btc-e.com/api/2/usd_rur/depth
'
'
'
'Public API ? EUR/USD
'
'
'
' Ticker -  https://btc-e.com/api/2/eur_usd/ticker
'
' Trades -  https://btc-e.com/api/2/eur_usd/trades
'
' Depth -  https://btc-e.com/api/2/eur_usd/depth
'
'
'
'Public API ? NVC/BTC
'
'
'
' Ticker -  https://btc-e.com/api/2/nvc_btc/ticker
'
' Trades -  https://btc-e.com/api/2/nvc_btc/trades
'
' Depth -  https://btc-e.com/api/2/nvc_btc/depth
'
'
'
'Public API ? TRC/BTC
'
'
'
' Ticker -  https://btc-e.com/api/2/trc_btc/ticker
'
' Trades -  https://btc-e.com/api/2/trc_btc/trades
'
' Depth -  https://btc-e.com/api/2/trc_btc/depth
'
'
'
'Public API ? PPC/BTC
'
'
'
' Ticker -  https://btc-e.com/api/2/ppc_btc/ticker
'
' Trades -  https://btc-e.com/api/2/ppc_btc/trades
'
' Depth -  https://btc-e.com/api/2/ppc_btc/depth
'
'
'
'Public API ? FTC/BTC
'
'
'
' Ticker -  https://btc-e.com/api/2/ftc_btc/ticker
'
' Trades -  https://btc-e.com/api/2/ftc_btc/trades
'
' Depth -  https://btc-e.com/api/2/ftc_btc/depth

}
*/