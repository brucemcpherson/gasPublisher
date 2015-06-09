//create a chart to append to roadmap

var cChartContainer = function (rt) {
  var pScRoot = rt;
  this.xChart = null;
  this.root = function () {
    return pScRoot;
  };
  this.chart = function () {
    return this.xChart;
  };
  return this;
};


cChartContainer.prototype.makeChart = function () {

  var rt = this.root();
  var shp = rt.shape();

  
  if (rt.chartStyle() != SCHARTTYPES.ctNone) {
    // the size of the chart will be a proportion of the roadmap size in parameter sheet
    var chtHeight = shp.height() * rt.chartProportion();
    // add a panel under the roadamap to contain the chart
    this.xChart = rt.addShape(SHAPETYPES.stPanel, shp.left(), shp.top() + shp.height(), 
        shp.width(), chtHeight );
    // create the google table
    this.xBuilder = 
      DebugAssert( Charts.newDataTable() , 'failed to create a data table builder');

    // add the roadmap data
    this.chartArray = [];
    this.makeAxes()
        .makeSeries();
        
    // transpose if necesay
    var chartArray = arrayTranspose(this.chartArray);
    // build a table
    this.xBuilder.addColumn(Charts.ColumnType.STRING,chartArray[0][0]) ;
    for (var i=0 ; i < chartArray[0].length ;i++) 
      this.xBuilder.addColumn(Charts.ColumnType.NUMBER, chartArray[0][i+1]) ;
    
    // do the rows
    for (var i=1 ; i < chartArray.length ;i++)  { 
      this.xBuilder.addRow( chartArray[i]) ;
    }

    // now build it
    this.xDataTable = DebugAssert( this.xBuilder.build() , 'failed to build a data table');
    // create the appropriate type of chart

    this.xChartBuilder = rt.chartStyle() == SCHARTTYPES.ctShale ? 
                               DebugAssert( Charts.newAreaChart(), 'failed to build area chart') :
                               rt.chartStyle() == SCHARTTYPES.ctColumnStacked || rt.chartStyle() == SCHARTTYPES.ctColumn ? 
                                 DebugAssert( Charts.newColumnChart(), 'failed to build column chart') :
                                 rt.chartStyle() == SCHARTTYPES.ctLine ? 
                                   DebugAssert( Charts.newLineChart(), 'failed to build Line chart') :
                                     rt.chartStyle() == SCHARTTYPES.ctBar? 
                                        DebugAssert( Charts.newBarChart(), 'failed to build Bar chart') :
                                        DebugAssert (false,'unknown chart type ' + rt.chartStyle());
    
    var stacked = rt.chartStyle() == SCHARTTYPES.ctColumnStacked ;
    
    // tweak it
    if (stacked) {
      this.xChartObject = this.xChartBuilder
                            .setDataTable(this.xDataTable)
                            .setTitle(rt.text())
                            .setStacked()
                            .setDimensions(shp.width(), chtHeight)
                            .setLegendPosition(Charts.Position.BOTTOM)
                            .build();
    }
    else {
      this.xChartObject = this.xChartBuilder
      .setDataTable(this.xDataTable)
      .setTitle(rt.text())
      .setDimensions(shp.width(), chtHeight)
      .setLegendPosition(Charts.Position.BOTTOM)
      .build();
    
    }
    // add it to the panel and commit to the api
    this.xChart.box().add(this.xChartObject);
    this.xChart.commit();
  }
  return this;
};
cChartContainer.prototype.makeAxes = function () {
  var oArray = this.root().scaleDates();
  //var builder = this.xBuilder;
  var v = new Array(oArray.length+1);
  v[0] = "Periods";
  for (var i=0; i < oArray.length ; i++){
    v[i+1] = oArray[i].finishText;
  }
  this.chartArray.push(v);
  return this;
};
cChartContainer.prototype.makeSeries = function ( scParent ) {
  // its recursive, do the children first
  var sc = fixOptional (scParent, this.root());
  var self = this;
  sc.children().forEach(function(child){
      self.makeSeries( child);
    }
  );
  if (!IsEmpty(sc.cost())) {
    if ( sc.isData() && sc.cost() ){
      // add data for this series
      self.makeValues(sc);
    }
  }
};
cChartContainer.prototype.makeValues = function ( sc){
  //this calcultes the values based on the rules for treatment of the cost
    var dsd = this.dLater(sc.activate(), sc.activate(), sc.root().activate());
    var dfd = this.dEarlier(sc.deActivate(), sc.deActivate(), sc.root().deActivate());
    var dur = dfd - dsd;
    var bDone = false;
    var oArray = this.root().scaleDates();
    var v = new Array(oArray.length+1);
    
    for (i=0; i < oArray.length ; i++){
      var sd = oArray[i].start;
      var fd = oArray[i].finish;
      var efd = this.dEarlier(fd, sc.deActivate(), fd);
      var esd = this.dLater(sd, sc.activate(), sd);
      var p=0;
      //proportion of annual cost occurring in this period
      if ( esd > fd || efd < sd || bDone ) {
        p =0;
      } 
      else {
        switch (sc.chartCostTreatment()) {
          case STREATS.stcAnnual:
            p = (efd - esd) / (DateSerial(Year(fd), 12, 31) - DateSerial(Year(fd), 1, 1) );
            break;
          case STREATS.stcDuration:
            p = (efd - esd + 1) / dur;
            break;
          case STREATS.stcOneOffStart:
            p = 1;
            bDone = True;
            break;
          case STREATS.stcOneOffFinish:
            if (efd < fd ) {
              p=1;
              bDone = true;
            }
            else {
              p=0;
            }
            break;            
          default:
            DebugAssert ( false,'unknown chart cost treatment' );
            break;
        }
        DebugAssert ( p>=0,'some deactivate/activate dates must be reversed' );
      }
      v[i+1] =p* sc.cost();
    }
    v[0] = sc.text();
    this.chartArray.push(v);
    return this;
};
cChartContainer.prototype.dEarlier = function (a,b,missing){
  var ea = a ? a : missing;
  var eb = b ? b : missing;
  return ea > eb ? eb : ea;
};
cChartContainer.prototype.dLater = function (a,b,missing){
  var ea = a ? a : missing;
  var eb = b ? b : missing;
  return ea < eb ? eb : ea;
};




