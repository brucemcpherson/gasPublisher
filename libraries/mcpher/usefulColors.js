
//this is all about colors
var VBCOLORS = Object.freeze(
{vbBlue: 16711680,  
 vbWhite: 16777215,
 vbBlack: 0,
 vbGreen: 65280,
 vbYellow: 65535,
 vbRed:255
 }
);
var ECOMPARECOLOR = Object.freeze (
{
  whiteX  : 95.047,
  whiteY : 100,
  whiteZ  : 108.883,
  eccieDe2000 : 21000,
  beige: 10009301
}
);
function speedTest() {
  useTimer('x','10000 iterations of color comparison').start();
  for (var i = 1 ; i <= 10000 ;i++) {
    compareColors (i, VBCOLORS.vbWhite - i);
  }
  useTimer('x').stop();
  return useTimer().report();
}  
function testCompareSpeed() {
    Logger.log(speedTest());
}

function beigeness(rgbColor) {
  return compareColors (rgbColor, ECOMPARECOLOR.beige);
}
function RGB(r,g,b) {
  return Math.round(r) + (Math.round(g) << 8) + (Math.round(b) << 16) ;
}
function rgbRed(rgbColor) {
    return  rgbColor % 0x100;
}
function rgbGreen(rgbColor) {
    return Math.floor(rgbColor / 0x100) % 0x100;
}
function rgbBlue(rgbColor) {
    return Math.floor(rgbColor / 0x10000) % 0x100;
}
function heatmapColor(min , max, value) {
  return rampLibraryRGB("heatmap", min, max, value);
}
function rgbToHTMLHex(rgbColor) {
    // just swap the colors round for rgb to bgr as bit representation is reversed
    return "#" + maskFormat(RGB(rgbBlue(rgbColor), 
            rgbGreen(rgbColor), rgbRed(rgbColor)).toString(16), "000000");
}
function rgbToHex(rgbColor) {
  // this is just a convenience pass throuh .. i originally screwed up the camel case 
  return rgbToHTMLHex(rgbColor);
}
function rampLibraryHex (sName, min , max, value , optBrighten) {
  return rgbToHTMLHex(rampLibraryRGB (sName, min , max, value , optBrighten));
}

function maskFormat(sIn , f ) {
    var s = Trim(sIn);
    if (Len(s) < Len(f)) {
        s = Left(f, Len(f) - Len(s)) + s ;
    }
    return s;
}
function lumRGB(rgbCom, brighten) {
    var x = rgbCom * brighten;
    return x > 255 ?  255 : 
                      x < 0 ? 0 : x;
}


function contrastRatio(rgbColorA, rgbColorB) {
    var lumA = w3Luminance(rgbColorA);
    var lumB = w3Luminance(rgbColorB);
    return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

function makeColorProps (rgbColor) {
  return new colorProps().populate(rgbColor);
}

function colorProps() {
  return this;
}
colorProps.prototype.populate = function (rgbColor) {
  var p = this;

    //store the source color
    p.rgb = rgbColor;
    
    //split the components
    p.red = rgbRed(rgbColor);
    p.green = rgbGreen(rgbColor);
    p.blue = rgbBlue(rgbColor);
    
    //the html hex rgb equivalent
    p.htmlHex = rgbToHTMLHex(rgbColor);
    
    //the w3 algo for luminance
    p.luminance = w3Luminance(rgbColor);
    
    //determine whether black or white background
    if (p.luminance < 0.5) 
        p.textColor = VBCOLORS.vbWhite;
    else
        p.textColor = VBCOLORS.vbBlack;
   

    //contrast ratio - to comply with w3 recs 1.4 should be at least 10:1 for text
    p.contrastRatio = contrastRatio(p.textColor, p.rgb);
    
    //cmyk - just an estimate
    p.black = Math.min(Math.min(1 - p.red / 255, 1 - p.green / 255), 1 - p.blue / 255);
    if (p.black < 1) {
        p.cyan = (1 - p.red / 255 - p.black) / (1 - p.black);
        p.magenta = (1 - p.green / 255 - p.black) / (1 - p.black);
        p.yellow = (1 - p.blue / 255 - p.black) / (1 - p.black);
    }

    // calculate hsl + hsv and other wierd things
    var p2 = rgbToHsl(p.rgb);
    p.hue = p2.hue;
    p.saturation = p2.saturation;
    p.lightness = p2.lightness;
    
    p.value = rgbToHsv(p.rgb).value;
    
    p2 = rgbToXyz(p.rgb);
    p.x = p2.x;
    p.y = p2.y;
    p.z = p2.z;
    
    p2 = rgbToLab(p.rgb);
    p.LStar = p2.LStar;
    p.aStar = p2.aStar;
    p.bStar = p2.bStar;
    
    p2 = rgbToLch(p.rgb);
    p.cStar = p2.cStar;
    p.hStar = p2.hStar;

  return p;

}


function w3Luminance (rgbColor) {
// this is based on
// http://en.wikipedia.org/wiki/Luma_(video)

  return (0.2126 * Math.pow((rgbRed(rgbColor)/255),2.2)) +
         (0.7152 * Math.pow((rgbGreen(rgbColor)/255),2.2)) +
         (0.0722 * Math.pow((rgbBlue(rgbColor)/255),2.2)) ;
}


function cellProperty (r,p) {
  // makes it compatible with VBA version
  switch(p) {
    case  "background-color":
      return sheetCache(r,"getBackgroundColors").getValues(r);

    case "color":
      return sheetCache(r,"getFontColor").getValues(r);
   
    case "font-size":
      return sheetCache(r,"getFontSize").getValues(r);

    default:
      DebugAssert (false, "unknown cellproperty request " + p);
  }
}

function cellCss(r, p ) {
    return  p + ":" + cellProperty(r, p) + ";" ;
}

function rgbExpose(r , g , b ) {
    // redundadnt .. just for compatibility with vba
    return RGB(r, g, b) ;
}

function htmlHexToRgb(htmlHex){

    var s = LTrim(RTrim(htmlHex));
    s =  (Left(s, 1) == "#" ? '' : '#') + s;
    DebugAssert (Len(s) > 1 && Left(s, 1) == "#", "invalid hex color" + htmlHex);
    // -- need to find equivalent ---
    var x = parseInt(Right(s, Len(s) - 1),16);
    // these are purposefully reversed since byte order is different in unix
    return RGB(rgbBlue(x), rgbGreen(x), rgbRed(x));
}
function hslToRgb(p) {
    // from // http://www.easyrgb.com/
    var x1 , x2 , h, s , l , 
        red , green , blue ;
      
    h = p.hue / 360;
    s = p.saturation / 100;
    l = p.lightness / 100;
    
    if (s == 0) {
        return RGB (l * 255, l * 255, l * 255);
    }
    else {
        if (l < 0.5 )
            x2 = l * (1 + s);
        else
            x2 = (l + s) - (l * s);
       
        x1 = 2 * l - x2;
        
        red = 255 * hueToRgb(x1, x2, h + (1 / 3));
        green = 255 * hueToRgb(x1, x2, h);
        blue = 255 * hueToRgb(x1, x2, h - (1 / 3));
        return RGB (red, green, blue);
     }
}
function hueToRgb(a , b , h ) {
   // from // http://www.easyrgb.com/
    if (h < 0)  h = h + 1;
    if (h > 1)  h = h - 1;
    DebugAssert (h >= 0 && h <= 1,"hue outside range 0-1:" + h);

    if (6 * h < 1) 
        return a + (b - a) * 6 * h;
    else {
      if (2 * h < 1) 
          return b;
      else {
        if (3 * h < 2) 
          return a + (b - a) * ((2 / 3) - h) * 6;
        else
          return a;
      }
    }   
}


function hexColorOf(r) {
    return cellProperty(r,"color") ;
}
function colorizeCell(target, c ) {
    
    if (Len(c) > 1 && Left(c, 1) == "#") {
        p = makeColorProps(htmlHexToRgb(c));
        //target.Interior.Color = p.rgb
        //target.Font.Color = p.textColor
    }
}
function rampLibraryRGB(ramp, min , max, value , optBrighten) {
  var brighten = fixOptional (optBrighten, 1);
  
  if (IsArray(ramp)) {
    // ramp colors have been passed here
       return colorRamp(min, max, value, ramp,undefined , brighten);
  }
  else {
  
    switch(Trim(LCase(ramp))) {
        case "heatmaptowhite":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlue, VBCOLORS.vbGreen, VBCOLORS.vbYellow, 
                             VBCOLORS.vbRed, VBCOLORS.vbWhite],undefined , 
                            brighten);
        case "heatmap":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlue, VBCOLORS.vbGreen, VBCOLORS.vbYellow, 
                             VBCOLORS.vbRed], undefined, 
                            brighten);  
        case "blacktowhite":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlack, VBCOLORS.vbWhite], undefined, 
                            brighten);    
        case "whitetoblack":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbWhite, VBCOLORS.vbBlack],undefined , 
                            brighten);      
        case "hotinthemiddle":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlue, VBCOLORS.vbGreen, 
                             VBCOLORS.vbYellow,VBCOLORS.vbRed,VBCOLORS.vbGreen,
                             VBCOLORS.vbBlue], undefined, 
                             brighten);  
        case "candylime":
            return  colorRamp(min, max, value, 
                            [RGB(255, 77, 121), RGB(255, 121, 77), 
                                    RGB(255, 210, 77), RGB(210, 255, 77)], undefined, 
                            brighten);  
                            
        case "heatcolorblind":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlack,VBCOLORS.vbBlue,  VBCOLORS.vbRed, 
                             VBCOLORS.vbWhite], undefined, 
                            brighten);  
        case "gethotquick":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlue,VBCOLORS.vbGreen,  VBCOLORS.vbYellow, 
                             VBCOLORS.vbRed],[0, 0.1, 0.25, 1] , 
                            brighten);                           
        case "greensweep":
            return  colorRamp(min, max, value, 
                            [RGB(153, 204, 51), RGB(51, 204, 179)] 
                             ,undefined , 
                            brighten);   
        case "terrain":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbBlack, RGB(0, 46, 184), RGB(0, 138, 184), 
                            RGB(0, 184, 138), 
                            RGB(138, 184, 0), RGB(184, 138, 0), 
                            RGB(138, 0, 184), VBCOLORS.vbWhite] 
                             ,undefined , 
                            brighten); 
        case "terrainnosea":
            return  colorRamp(min, max, value, 
                            [VBCOLORS.vbGreen, RGB(0, 184, 138), 
                            RGB(138, 184, 0), RGB(184, 138, 0), 
                            RGB(138, 0, 184), VBCOLORS.vbWhite] 
                             , undefined, 
                            brighten); 
                            
                            
                            
        case "greendollar":
           return colorRamp(min, max, value, 
                                [RGB(225, 255, 235), 
                                RGB(2, 202, 69)], undefined, 
                                brighten);
    
        case "lightblue":
          return colorRamp(min, max, value, 
                                [RGB(230, 237, 246), 
                                RGB(163, 189, 271)], undefined, 
                                brighten);
                                
         case "lightorange":
           return colorRamp(min, max, value, 
                                [rgb(253, 233, 217), 
                                rgb(244, 132, 40)], undefined, 
                                brighten);
                            
       default:
         DebugAssert(false,"Unknown library entry " + ramp) ;
    }
   }
   
}
function colorRamp(min, max , value , mileStones , fractionStones, optBrighten) {
  // color ramp given or default
  var brighten = fixOptional ( optBrighten,1);
  var ms = IsMissing(mileStones) ? 
      [VBCOLORS.vbBlue,VBCOLORS.vbGreen,VBCOLORS.vbYellow, 
        VBCOLORS.vbRed,VBCOLORS.vbRed,VBCOLORS.vbWhite] :
        mileStones;
   DebugAssert( ms.length , "No milestone colors specified");
   // only 1 milestone - thats the color
    if (ms.length == 1) return ms[lb];
   // fractions of range at which to apply these colors
    var fs = [];
    if (!IsMissing(fractionStones)) {
        DebugAssert( fractionStones.length == ms.length, "no of fractions must equal number of steps" );
        fs = fractionStones;
    }
    else {
      // equal proportions
      fs[0]=0;
      for (var i = 1 ; i < ms.length ; i++ ) fs[i] = i/(ms.length-1) ;
    }
    // now calculate the color
    var spread = max - min;
    DebugAssert (spread >= 0 , "min is greater than max for color spread");
    var ratio = (value - min) / spread;
    DebugAssert (ratio >= 0 && ratio <= 1, "couldnt calculate ratio for color spread");
    //find which slot this value belongs in
    for (var i = 1; i  < ms.length;i++) {
      if (ratio <= fs[i]) {
        var r = (ratio - fs[i - 1]) / (fs[i] - fs[i - 1]);
        var red = rgbRed(ms[i - 1]) + (rgbRed(ms[i]) - rgbRed(ms[i - 1])) * r;
        var blue = rgbBlue(ms[i - 1]) + (rgbBlue(ms[i]) - rgbBlue(ms[i - 1])) * r;
        var green = rgbGreen(ms[i - 1]) + (rgbGreen(ms[i]) - rgbGreen(ms[i - 1])) * r;
        return RGB(lumRGB(red, brighten), 
                   lumRGB(green, brighten), 
                   lumRGB(blue, brighten));
      }
    }
        
    DebugAssert (false,"ColorRamp failed to work - dont know why");
}


function rgbToHsl (RGBcolor) {
    //from // http://www.easyrgb.com/
    var r , g , b , d , dr , dg , db , mn , mx , p ={};

    r = rgbRed(RGBcolor) / 255 ;
    g = rgbGreen(RGBcolor) / 255;
    b = rgbBlue(RGBcolor) / 255;
    mn = Math.min(Math.min(r, g), b);
    mx = Math.max(Math.max(r, g), b);
    d = mx - mn;
    
    //HSL sets here
    p.hue = 0;
    p.saturation = 0;
    //lightness
    p.lightness = (mx + mn) / 2;
    
    if (d != 0) {
        // saturation
        if (p.lightness < 0.5)
            p.saturation = d / (mx + mn) ;
        else
            p.saturation = d / (2 - mx - mn) ;       
        // hue
        dr = (((mx - r) / 6) + (d / 2)) / d ;
        dg = (((mx - g) / 6) + (d / 2)) / d ;
        db = (((mx - b) / 6) + (d / 2)) / d ;
        
        if (r == mx) 
            p.hue = db - dg ;
        else 
          if(g == mx) 
            p.hue = (1 / 3) + dr - db ;
          else
            p.hue = (2 / 3) + dg - dr ;
        
        
        //force between 0 and 1
        if (p.hue < 0) p.hue = p.hue + 1 ;
        if (p.hue > 1) p.hue = p.hue - 1 ;
        if (!(p.hue >= 0 && p.hue <= 1)) p.hue = 0;   // " invalid hue " + p.hue + ":" + JSON.stringify(p));
       
    }
    p.hue = p.hue * 360 ;
    p.saturation = p.saturation * 100 ;
    p.lightness = p.lightness * 100 ;
    return p;
    
}

function rgbToHsv(rgbColor){
    // adapted from // http://www.easyrgb.com/
    
    var r = rgbRed(rgbColor) / 255;
    var g = rgbGreen(rgbColor) / 255;
    var b = rgbBlue(rgbColor) / 255;
    var mn = Math.min(r, g, b);
    var mx = Math.max(r, g, b);
    
    // this is the same as hsl and hsv are the same.
    var p = rgbToHsl(rgbColor);
    
    // HSV sets here
    p.value = mx;
    
    return p;
}

function xyzCorrection(v) {
    if (v > 0.04045) 
        return Math.pow( ((v + 0.055) / 1.055) , 2.4);
    else
        return v / 12.92 ;
   
}

function xyzCieCorrection(v) {
  return v > 0.008856 ? Math.pow(v , 1 / 3) : (7.787 * v) + (16 / 116);
}
function rgbToXyz(rgbColor) {
    // adapted from // http://www.easyrgb.com/

    var r = xyzCorrection(rgbRed(rgbColor) / 255) * 100;
    var g = xyzCorrection(rgbGreen(rgbColor) / 255) * 100;
    var b = xyzCorrection(rgbBlue(rgbColor) / 255) * 100;
    var p = new colorProps();
    p.x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    p.y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    p.z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    return p;
}


function rgbToLab(rgbColor) {
    // adapted from // http://www.easyrgb.com/

    var p = rgbToXyz(rgbColor);
    
    var x = xyzCieCorrection(p.x / ECOMPARECOLOR.whiteX);
    var y = xyzCieCorrection(p.y / ECOMPARECOLOR.whiteY);
    var z = xyzCieCorrection(p.z / ECOMPARECOLOR.whiteZ);

    p.LStar = (116 * y) - 16;
    p.aStar = 500 * (x - y);
    p.bStar = 200 * (y - z);

    return p;
}
function compareColorProps (p1, p2 , optCompareType)  {
    
    switch (fixOptional(optCompareType, ECOMPARECOLOR.eccieDe2000)) {
        case ECOMPARECOLOR.eccieDe2000:
            var t= cieDe2000(p1, p2);
            p1 = p2 = null;
            return t;
            
        default:
            DebugAssert (false, "unknown color comparision " + optCompareType);
   }
    
}


function compareColors(rgb1, rgb2 , optCompareType)  {

    return compareColorProps(makeColorProps(rgb1),makeColorProps(rgb2));
    
}

function cieDe2000(p1, p2 ) {
    // calculates the distance between 2 colors using CIEDE200
    // see http://www.ece.rochester.edu/~gsharma/cieDe2000/cieDe2000noteCRNA.pdf
    
    var kp = Math.pow(25 , 7), kl = 1,kc = 1, kh = 1;
    
    // calculate c & g values
    var c1 = Math.sqrt(Math.pow(p1.aStar , 2) + Math.pow(p1.bStar , 2));
    var c2 = Math.sqrt(Math.pow(p2.aStar , 2) + Math.pow(p2.bStar , 2));
    var c = (c1 + c2) / 2;
    var g = 0.5 * (1 - Math.sqrt(Math.pow(c , 7) / (Math.pow(c , 7) + kp)));

    //adjusted ab*
    var a1 = (1 + g) * p1.aStar;
    var a2 = (1 + g) * p2.aStar;

    // adjusted cs
    var c1Tick = Math.sqrt(a1 *a1 + p1.bStar *p1.bStar);
    var c2Tick = Math.sqrt(a2 *a2 + p2.bStar * p2.bStar);

    //adjusted h
    var h1 = computeH(a1, p1.bStar);
    var h2 = computeH(a2, p2.bStar);

    
    // deltas
    var dh;
    if (h2 - h1 > 180)  
        dh = h2 - h1 - 360;
    else if (h2 - h1 < -180) 
        dh = h2 - h1 + 360 ;
    else 
        dh = h2 - h1;
    

    var dl = p2.LStar - p1.LStar;
    var dc = c2Tick - c1Tick;
    var dBigH = (2 * Math.sqrt(c1Tick * c2Tick) * Math.sin(toRadians(dh / 2)));

    // averages
    var lTickAvg = (p1.LStar + p2.LStar) / 2;
    var cTickAvg = (c1Tick + c2Tick) / 2;

    var hTickAvg;
    if (c1Tick * c2Tick == 0)
        hTickAvg = h1 + h2;
    
    else if (Math.abs(h2 - h1) <= 180) 
        hTickAvg = (h1 + h2) / 2;
    
    else if (h2 + h1 < 360) 
        hTickAvg = (h1 + h2) / 2 + 180;
    
    else 
        hTickAvg = (h1 + h2) / 2 - 180;
   
    
    var l50 = Math.pow(lTickAvg - 50,2);
    var sl = 1 + (0.015 * l50 / Math.sqrt(20 + l50));
    
    var sc = 1 + 0.045 * cTickAvg;
    var t = 1 - 0.17 * Math.cos(toRadians(hTickAvg - 30)) + 0.24 * 
            Math.cos(toRadians(2 * hTickAvg)) + 0.32 * 
            Math.cos(toRadians(3 * hTickAvg + 6)) - 0.2 * 
            Math.cos(toRadians(4 * hTickAvg - 63));

    var sh = 1 + 0.015 * cTickAvg * t;

    var dTheta = 30 * Math.exp(-1 * Math.pow((hTickAvg - 275) / 25 , 2));
    var rc = 2 * Math.sqrt(Math.pow(cTickAvg , 7) / (Math.pow(cTickAvg , 7) + kp));
    var rt = -Math.sin(toRadians(2 * dTheta)) * rc;
    var dlk = dl / sl / kl;
    var dck = dc / sc / kc;
    var dhk = dBigH / sh / kh;
    return Math.sqrt(dlk *dlk + dck *dck + dhk *dhk + rt * dck * dhk);
    
}
function computeH(a , b ) {
    if (a == 0 && b == 0)
        return 0;
    else if (b < 0) 
          return fromRadians(Atan2(a,b)) + 360 ;

    else
        return fromRadians(Atan2(a,b))  ;   
}

function lchToLab (p) { 
    var h = toRadians(p.hStar);
    p.aStar = Math.cos(h) * p.cStar;
    p.bStar = Math.sin(h) * p.cStar;
    return p;
}

function labxyzCorrection(x ) {
    if (Math.pow(x , 3) > 0.008856)
        return Math.pow(x , 3);
    else
       return (x - 16 / 116) / 7.787; 
}
function lchToRgb(p) {
    return xyzToRgb(labToXyz(lchToLab(p)));
}
function labToXyz(p) {
    
    p.y = (p.LStar + 16) / 116;
    p.x = p.aStar / 500 + p.y;
    p.z = p.y - p.bStar / 200;
    
    p.x = labxyzCorrection(p.x) * ECOMPARECOLOR.whiteX;
    p.y = labxyzCorrection(p.y) * ECOMPARECOLOR.whiteY;
    p.z = labxyzCorrection(p.z) * ECOMPARECOLOR.whiteZ;
    return p;
}


function xyzrgbCorrection(x) {
   if (x > 0.0031308) 
        return 1.055 * (Math.pow(x , (1 / 2.4))) - 0.055;
   else
       return 12.92 * x;
       
}
function xyzToRgb(p) {

    var x = p.x / 100, y = p.y / 100 ,z = p.z / 100;
    
    var x1 = x * 0.8951 + y * 0.2664 + z * -0.1614;
    var y1 = x * -0.7502 + y * 1.7135 + z * 0.0367;
    var z1 = x * 0.0389 + y * -0.0685 + z * 1.0296;
    
    var x2 = x1 * 0.98699 + y1 * -0.14705 + z1 * 0.15997;
    var y2 = x1 * 0.43231 + y1 * 0.51836 + z1 * 0.04929;
    var z2 = x1 * -0.00853 + y1 * 0.04004 + z1 * 0.96849;

    r = xyzrgbCorrection(x2 * 3.240479 + y2 * -1.53715 + z2 * -0.498535);
    g = xyzrgbCorrection(x2 * -0.969256 + y2 * 1.875992 + z2 * 0.041556);
    b = xyzrgbCorrection(x2 * 0.055648 + y2 * -0.204043 + z2 * 1.057311);
    
    var c = RGB(Math.min(255, Math.max(0, CLng(r * 255))), 
                   Math.min(255, Math.max(0, CLng(g * 255))), 
                   Math.min(255, Math.max(0, CLng(b * 255))));

   return c;
}

function rgbToLch(rgbColor) {
    //convert from cieL*a*b* to cieL*CH
    //adapted from http://www.brucelindbloom.com/index.html?Equations.html

    var p = rgbToLab(rgbColor);
    if (rgbColor == 0 )
        p.hStar = 0 ;
    else {
        p.hStar =Atan2(p.aStar, p.bStar);
        if (p.hStar > 0) 
            p.hStar = fromRadians(p.hStar);
        else
            p.hStar = 360 - fromRadians(Math.abs(p.hStar));
      
    }
    p.cStar = Math.sqrt(p.aStar * p.aStar + p.bStar * p.bStar);
    return p;
}
function colorPropBigger(a, b, byProp) {

  DebugAssert (a.hasOwnProperty(byProp) && b.hasOwnProperty(byProp),"unknown color prop in sort " + byProp);
  return a[byProp] > b[byProp];
}
function rgbWashout(rgbColor) {

    var p = makeColorProps(rgbColor);
    p.saturation = p.saturation * 0.2;
    p.lightness = p.lightness * 0.9;
    return hslToRgb(p)
}


function sortColorProp(pArray, byProp,optDescending ) {
  descending = fixOptional (optDescending ,false) ? -1 : 1;
  return pArray.sort (function (a,b) {
      var result = a[byProp] > b[byProp] ? 1 : a[byProp] < b[byProp] ? -1 : 0 ;
      return  descending * result ; } );
}

function makeAPalette(rgbColor, optModel, optiType, optHowMany, optDescending) {
  
  var model = fixOptional(optModel, "lch");
  var iType = fixOptional(optiType, "hue");
  var howMany = fixOptional(optHowMany, 5);
  var ph,ps,pl,pf,h,pv,a=[],g;
  
  
  if (model == "lch") {
    ph = "hStar", ps = "cStar", pl = "LStar", pf = lchToRgb;
  }
  else {
    ph = "hue", ps = "saturation", pl = "lightness", pf = hslToRgb;
  }
  
  var top = (iType == "hue" ? 360 : 100);
  g = top / howMany;
  pv = (iType == "hue" ? ph : (iType == "saturation" ? ps : pl));
  var p = makeColorProps(rgbColor); 
  h = p[pv];
  
  // do a number of equally spaced props and store in array
  for (var i =0;i < howMany ;i++ ) {
    if (h > top) h -= top;
    // store new value
    p[pv] =h;
    // convert back to rgb and redo
    p =makeColorProps(pf(p));
    a.push(p);
    // make a new copy
    p = makeColorProps(p.rgb);
    h += g;
  }
  
  return sortColorProp (a, pv, optDescending);
  
}

function arrayLength(a) {
  return a.length;
}