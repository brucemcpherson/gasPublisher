
function actRoadMapper(wp,wd){
//where the parameters are

    var rParam = wholeSheet (fixOptional (wp, "Parameters"));
// automatically find where the data is

    var rData = getLikelyColumnRange(Sheets(wd));

// get the data and the parameters

    var dSets = new cDataSets();
    dSets.create();

    dSets.init(rData,undefined , "data");

    dSets.init(rParam,undefined ,undefined , true, "roadmap colors");
    dSets.init(rParam,undefined ,undefined , true, "containers");
    dSets.init(rParam,undefined ,undefined , true, "options");
    dSets.init(rParam,undefined ,undefined , true, "custom bars");
    var ds = dSets.dataSet("data");
    if (!ds.where()) 
      MsgBox ("No data to process");
    else {
      //check we have fields we need
      if(ds.headingRow().validate(true, "Activate", "Deactivate", "ID", "Target", "Description")){ 
        var rplot = rangeExists(dSets.dataSet("options").cell("frameplot", "value").toString());
        if (rplot) doTheMap(dSets, rplot);
      }
    }

    
}

function doTheMap(dSets, rplot) {
  var scRoot = new cShapeContainer();
  scRoot.create (scRoot,undefined,rplot,dSets);
  // create s node for each data row
  dSets.dataSet("data").rows().forEach(
    function (dr,drItem) {
      var sc = scRoot.find(dr.toString("ID"));
      if (!sc) {
        sc = new cShapeContainer();
        sc.create (scRoot, dr);
        scRoot.children().add (sc, sc.id());
      }
      else {
        MsgBox (sc.id() + " is a duplicate - skipping");
      }
    }
  );
  // clean up the structure and associate ids to targets

  scRoot.springClean();
  scRoot.createScale();
  scRoot.sortChildren();

  // make the shapes 

  scRoot.makeShape();

  // do the chart if there is one
  scRoot.doShapeCallouts();
  scRoot.makeChart();
  // add traceability data to each shape
  scRoot.traceability();
  // group everything

  scRoot.groupContainers();

} 



