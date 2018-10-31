// included in mcpher library - GAS key MEQ3tE5y5_cTOAgUbUKSIAiz3TLx7pV4j
// ramblings.mcpher.com
/**
 * performs a melt reshape 
 * @param {object|string} options describes the melt actions required as either js object or jSon string
 * @return {cDataSet} The populated sheet as a cDataSet
 */
function reshapeMelt (options) {
    
    // this is a very basic start at gas implementation of Hadley Wickhams  melt(R)
    // http://www.statmethods.net/management/reshape.html
        
    // sort out the options
    var jArgs = optionsExtend(options, rOptionDefaults());

    // check for argument programming syntax error
    DebugAssert (jArgs , "invalid options to optionsExtend");
    var w= jArgs;
        if (w.toString("inputsheet") == w.toString("outputsheet")) {
            MsgBox ("Reading and writing to the same sheet - not allowed");
            return null;
        }
   
    // read input sheet
    var ds = new cDataSet();
    if (!ds.populateData 
        (wholeSheet(jArgs.toString("inputsheet")),undefined , undefined,undefined ,undefined ,undefined , true)) return null;
    
    // check we have everything we need
    var w = jArgs;
    var bad = false;
        w.child("id").children().forEach(
          function (cj) {
            if (!ds.headingRow().validate(w.cValue("complain"), cj.toString())) bad = true;
          }
         );
         if (bad) return (null);

    //check if output sheet exists?
        var ws = sheetExists(w.toString("outputSheet"),w.cValue("complain"));
        DebugAssert(ws,'first create output sheet ' + w.toString("outputSheet"));

    // set up cache to use for output sheet
        var cache = sheetCache(ws);
        if (w.cValue("clearContents")) cache.clear();

     // make headings
        var r = 1;
        w.child("id").children().forEach(
          function (cj) {
            cache.setValue(cj.value(),1,r++) 
            } 
         );
        cache.setValue(w.toString("variableColumn"),1,r);   
        cache.setValue(w.toString("valueColumn"),1,r+1); 
        
       
    // lets get that in a dataset for abstracted column access
        var dsOut = new cDataSet();
        dsOut.populateData ( vResize(wholeWs(ws),1, r + 1));
       
        ds.headings().forEach(
          function (x,i) {
              DebugPrint(i,r,x.value(),sad(dsOut.headingRow().where()));
            }
        );
    // now data
        var r =2;
        ds.rows().forEach(
          function (dr) {
            // dr is a row
            dr.columns().forEach(
              function(dc) {
               // dc is a cell - write a row for every 'non-id' cell
                var colHead = ds.headings().item((dc.column())).toString();
                if (colHead && !w.child("id").valueIndex (colHead) ){
                // the id fields
                  w.child("id").children().forEach( 
                    function(cj) {
                     // cj is a an ID object
                      cache.setValue(dr.value(cj.toString()),r,dsOut.headingRow().exists(cj.toString()).column());
                    }
                  );
                // this variable value
                  cache.setValue(dc.value(),r,dsOut.headingRow().exists(w.toString("valueColumn")).column());
                  
                // and its name
                  cache.setValue(colHead,r,dsOut.headingRow().exists(w.toString("variableColumn")).column());
                  r++;
                }
              }
            );
          }
        )
    // write it all out
     cache.commit();
    // send back what we have for chaining - its all still in cache so no real reading here
     return new cDataSet().populateData(vResize(dsOut.headingRow().where(),r-1)) ;
 } 
/**
 * Returns the default options for any R related stuff
 * @return {string} options as a jSon string
 */
function rOptionDefaults() {
    // the activesheet is the default
   
     var options = { complain : true, 
              inputSheet:  WorkSheetName(ActiveSheet()) ,
              variableColumn : "variable", 
              valueColumn : "value", 
              id:["id"] ,
              outputSheet: "rOutputData" , 
              clearContents:true } ;
              
    return options;
          
}

