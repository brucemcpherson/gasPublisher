// a rest server for SunCalc.SunCalc
//
/* -- uses GAS version of SunCalc 
 * created from....
 (c) 2011-2014, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/mooon position and light phases.
 https://github.com/mourner/suncalc
 see license -  https://github.com/mourner/suncalc/blob/master/LICENSE
 * by ... plus.google.com/+BruceMcPherson
 * public library - M-s0BU6lPDoReqOEZFLzdv6i_d-phDA33
*/

// return data about various sun related timings.
// example
// ?lat=52.1&lon=1&date=2014-03-31T12:05:45.513Z&callback=xyz
// date default is today (UTC)
// lat lon default is greenwich observatory, london
// callback will give jsonp, otherwise json

/* you get this back
{
    "solarNoon": "2014-03-31T12:05:45.513Z",
    "nadir": "2014-03-31T00:05:45.513Z",
    "sunrise": "2014-03-31T05:39:29.813Z",
    "sunset": "2014-03-31T18:32:01.213Z",
    "sunriseEnd": "2014-03-31T05:42:55.852Z",
    "sunsetStart": "2014-03-31T18:28:35.174Z",
    "dawn": "2014-03-31T05:05:37.818Z",
    "dusk": "2014-03-31T19:05:53.209Z",
    "nauticalDawn": "2014-03-31T04:24:56.169Z",
    "nauticalDusk": "2014-03-31T19:46:34.857Z",
    "nightEnd": "2014-03-31T03:41:29.839Z",
    "night": "2014-03-31T20:30:01.188Z",
    "goldenHourEnd": "2014-03-31T06:23:30.156Z",
    "goldenHour": "2014-03-31T17:48:00.870Z"
}
*/

function doGet(e) {

    var result = doSun(e);
    var s = JSON.stringify(result);
   
    // publish result
    return ContentService
            .createTextOutput(result.params.callback ? result.params.callback + "(" + s + ")" : s )
            .setMimeType(result.params.callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);  

}

function doSun(e) {
  // set up default parameters
  
    e = e || {parameter:{}}, result= {error:null};
   
    result.params = {
      callback: e.parameter.callback || null,
      lat: e.parameter.lat || 51.477812,
      lon: e.parameter.lon || -0.000725
    }

  // dates can be tricky
    var mom = e.parameter.date ? moment.moment(e.parameter.date) : moment(Date.now());
    
    if (!mom.isValid()) {
      result.error = e.parameter.date + ' was invalid';
    }
    else {
      result.params.date = mom.utc().format();
    }
    
    if (!result.error ) {
      try {
        result.result = new SunCalc.SunCalc().getTimes(mom.toDate(),result.params.lat,result.params.lon);
      }
      catch (err) {
        result.error = err;
      }
    }
    return result;
}

function testSunCalc() {

  // get today's sunlight times for empire state building
  var sun = new SunCalc.SunCalc();
  var times = sun.getTimes(new Date(), 40.7484, 73.9857);
  Logger.log(JSON.stringify(times));
  Logger.log(times.sunrise.toLocaleString());
  Logger.log(times.sunset.toLocaleString());
  
  
}
