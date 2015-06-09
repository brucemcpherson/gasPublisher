var cShapeContainer = function() {
  var pChildren = new collection();
  this.children = function() {
    return pChildren;
  };
  this.xSerial = 0;
  this.serial = function() {
    return this.xSerial;
  };
  this.xParent = null;
  this.parent = function(){
    return this.xParent;
  }
};
cShapeContainer.prototype.debug = function (s){
  this.children().forEach(
    function (sc) {
      DebugPrint(fixOptional(s,''),'child',sc.id(),'target',sc.target(),'myspace',sc.mySpace(),sc.text());
      sc.debug('parent:'+sc.id());
    }
  );
}

// create--
cShapeContainer.prototype.create = function(rt,pr,rplot,dss){
    this.xScType = isUndefined(this.xDataRow=pr) ? SCTYPES.sctframe : SCTYPES.sctdata;

    this.scType = function() {
      return this.xScType;
    };
    this.dataRow = function() {
      return this.xDataRow;
    };
    DebugAssert ( (this.xDataRow && this.xScType == SCTYPES.sctdata) ||
                  (!this.xDataRow && this.xScType == SCTYPES.sctframe),'mismatchdata/type');             

    this.xRoot = rt;
    this.root = function() {
      return this.xRoot;
    };
    this.xWhere = rplot;
    this.where = function() {
      return this.xWhere;
    };

    this.xDsets = dss;
    this.xSerial = (this.root().xSerial ++);
    return this;
};
cShapeContainer.prototype.valid = function() {
  return this.parent();
};
cShapeContainer.prototype.dSets = function() {
  return this.root().xDsets;
};

cShapeContainer.prototype.plot = function() {
  return this.where();
};

// target..if parent is confirmed use the parents ID, otherwise go to the data. If blank, use the frame as the target
cShapeContainer.prototype.target = function() {
  var s;
  return this.valid() ? 
    this.parent().id() : 
    (s=this.fetchKey("Target")) ? 
      s :
      this.root().id();
};
cShapeContainer.prototype.isFrame =function () {
  return this.scType()==SCTYPES.sctframe;
};
cShapeContainer.prototype.isData =function() {
  return this.scType()==SCTYPES.sctdata;
};
cShapeContainer.prototype.assertData = function(sExtra) {

  if (this.dataRow()) {
    DebugAssert( this.isData() ,'expected a data item ' +fixOptional(sExtra,''));
  }
  else {
    DebugAssert ( this.isFrame(),'expected a frame ' +fixOptional(sExtra,'')); 
  }
  return this.dataRow();
};
cShapeContainer.prototype.isRounded = function(s) {
  return s == SHAPETYPES.stRoundedRectangularCallout || s == SHAPETYPES.stRoundedRectangle;
}
cShapeContainer.prototype.whichShape = function(s) {
  switch(LCase(s)) {
    case "pentagon" :
      return SHAPETYPES.stPentagon;
    case "rectangle":
      return SHAPETYPES.stRectangle;
    case "rounded rectangle":
      return SHAPETYPES.stRoundedRectangle;
    case "chevron":
      return SHAPETYPES.stChevron;
    case "notched right arrow":
      return SHAPETYPES.stNotchedRightArrow;
    case "right arrow":
      return SHAPETYPES.stRightArrow;
    case "right arrow callout":
      return SHAPETYPES.stRightArrowCallout;
    case "rectangular callout":
      return SHAPETYPES.stRectangularCallout;
    case "rounded rectangular callout":
      return SHAPETYPES.stRoundedRectangularCallout;
    case "none":
      return SHAPETYPES.stNone;
    case "line callout accent bar":
      return SHAPETYPES.stLineCallout2AccentBar;
    default:
      MsgBox ("Used default - cant find shape " + s);
      return SHAPETYPES.stDefault;
  }
};
cShapeContainer.prototype.startScale = function() {
  return this.xStartScale;
};
cShapeContainer.prototype.finishScale = function() {
  return this.xFinishScale;
};
cShapeContainer.prototype.paramStartDate = function() {
    var s = makeKey(this.paramCell("containers", "start date", "value").toString());
    var dsmallest=0;
    if (s == "automatic" ) {
      this.dSets().dataSet("data").rows().forEach(
        function(dr,drIndex){
          var  d = dr.value("activate");
          if((d && d < dsmallest) || !dsmallest) {
            dsmallest=d;
          }
        }
      );
      return dsmallest;
    }
    else {
      return this.param("containers", "start date", "value");
    }
};
cShapeContainer.prototype.paramFinishDate = function() {
    var s = makeKey(this.paramCell("containers", "finish date", "value").toString());
    var dbiggest=0;
    if (s == "automatic" ) {
      this.dSets().dataSet("data").rows().forEach(
        function(dr,drIndex){
          var  d = dr.value("deactivate");
          if((d && d > dbiggest) || !dbiggest) {
            dbiggest=d;
          }
        }
      );
      return dbiggest;
    }
    else {
      return this.param("containers", "finish date", "value");
    }
};


cShapeContainer.prototype.activate = function() {
  if (this.isFrame()) {
    return this.startScale() ?  this.startScale() : this.paramStartDate(); 
  }
  else {
    var mind = this.root().activate();
    return this.dateGiven('activate') ? 
          (this.fieldData("activate") < mind ?
              mind : 
              this.fieldData("activate") ) :
          mind;   
  }
};
cShapeContainer.prototype.deActivate = function() {
  if (this.isFrame()) {
    return this.finishScale() ?  this.finishScale() : this.paramFinishDate(); 
  }
  else {
    var maxd = this.root().deActivate();
    return this.dateGiven('deActivate') ? 
          (this.fieldData("deActivate") > maxd ?
            maxd : this.fieldData("deActivate") ) :
          maxd;   
  }
};

cShapeContainer.prototype.text = function() {
  return this.assertData('text') ? this.dataRow().toString("Description") : this.paramTitle();
};
cShapeContainer.prototype.calloutText = function() {
  return this.assertData('callOutText') ? this.dataRow().toString("Callout") : '';
};
cShapeContainer.prototype.sequence = function() {
  return this.fieldData("sequence");
};
cShapeContainer.prototype.cost = function() {
  var x = this.fieldData("cost");
  return x ? x : 0 ;
};
cShapeContainer.prototype.custom = function() {
  return this.fieldData("custom");
};
cShapeContainer.prototype.fieldData = function(s) {
  return this.assertData() ? this.dataRow().value(s) : null ;
};
cShapeContainer.prototype.dateGiven = function(s) {
  return IsDate( this.fieldData(s));
};
cShapeContainer.prototype.fetchKey = function(s) {
    return this.isData() ? 
        makeKey(this.dataRow().value(s)) : 
        ECONSTANTS.frameID ;
};
cShapeContainer.prototype.paramShapeCalloutTemplate = function(s) {
    return this.assertData('paramShapeCalloutTemplate') ? this.fixupCustomCell("callout format").where() : null ;
};

cShapeContainer.prototype.fixupCustomCell = function(sid) {

    var cc= this.paramCustomCell(sid);
    return cc ?  cc : this.timeBasedRow().cell(sid)  ;
};
cShapeContainer.prototype.id = function() {
  return this.fetchKey("id");
};


cShapeContainer.prototype.myWidth = function() {
  return this.isData() ? 
    this.root().shape().width() * this.duration() / this.root().duration() :
    this.paramFrameWidth();
};


cShapeContainer.prototype.myLeft = function() {

  
  return this.root().shape() ? 
    this.root().shape().left() + 
      (this.activate()- this.root().activate() ) / 
       this.root().duration() * this.root().shape().width() :
    this.paramFrameLeft();
};
cShapeContainer.prototype.duration = function() {
    return this.deActivate() - this.activate();
};
cShapeContainer.prototype.paramGap = function() {
    return this.fixupCustomCell("gap").value();
};
cShapeContainer.prototype.paramCalloutHeightAbove = function() {
    return this.fixupCustomCell("callout % height").value();
};
cShapeContainer.prototype.paramCalloutMaxWidth = function() {
    return this.fixupCustomCell("callout % width").value();
};
cShapeContainer.prototype.paramCalloutPosition = function() {
    return this.fixupCustomCell("callout position").value();
};
cShapeContainer.prototype.paramExpansion = function() {
    return isStringTrue(this.fixupCustomCell("allow expansion").value());
};
cShapeContainer.prototype.timeBasedRow = function() {
// try to figure out characteristics for a shape based on dates
  var self = this;
  var rdr = null;
  this.dSets().dataSet("roadmap colors").rows().forEach(
    function (dr) {
      var sd = dr.value("decommission from");
      var fd = dr.value("decommission to");
      var datafd = self.deActivate();
      if ( (!self.dateGiven("deactivate") && (!sd || !fd)) ||
            (datafd >= sd && datafd <= fd) ){
        return(rdr = dr);
      }
    }
  );
  if(!rdr)
    MsgBox ("Could not find time based parameter for deactivate date " + 
      CStr(self.deActivate()) + " ID " + self.id());
  return rdr;
};

cShapeContainer.prototype.paramHeight = function() {
    return this.fixupCustomCell("height").value();
};
cShapeContainer.prototype.paramFrameWidth = function() {
    return this.param("containers", "width", "value");
};
cShapeContainer.prototype.paramFrameLeft = function() {
    return this.param("containers", "left", "value");
};
cShapeContainer.prototype.paramFrameTop = function() {
    return this.param("containers", "top", "value");
};
cShapeContainer.prototype.paramTitle = function() {
    return this.param("options", "title", "value");
};
cShapeContainer.prototype.paramExpansion = function() {
    return isStringTrue(this.fixupCustomCell("allow expansion").value());
};
cShapeContainer.prototype.paramShapeTemplate = function(s) {
    return this.assertData('paramShapeTemplate') ? 
      this.fixupCustomCell("format").where() : 
      this.paramRange("containers", "frame", "format");
};


cShapeContainer.prototype.paramShapeType = function() {
    return this.isFrame() ? 
      this.whichShape(this.param("containers", "frame", "value")):
      this.whichShape(this.fixupCustomCell("shape").toString());
};
cShapeContainer.prototype.paramShapeCalloutType = function() {
    var cc;
    return this.isData() ? 
      (cc = this.fixupCustomCell("callout") ? whichShape(cc.toString()) : SHAPETYPES.stNone) :
        SHAPETYPES.stNone
};
cShapeContainer.prototype.chartProportion = function() {
    return this.param("options", "chart proportion", "value");
};
cShapeContainer.prototype.paramYesNo = function(dsn,rid,sid) {
    return isStringTrue(this.param(dsn, rid, sid));
};
cShapeContainer.prototype.param = function(dsn,rid,sid) {
    return this.paramCell(dsn, rid, sid).value();
};
cShapeContainer.prototype.paramCell = function(dsn,rid,sid) {
    return this.dSets().dataSet(makeKey(dsn)).cell(rid,sid);
};
cShapeContainer.prototype.paramRange = function(dsn,rid,sid) {
    return this.paramCell(dsn,rid,sid).where();
};
cShapeContainer.prototype.chartProportion = function() {
    return (this.param("options", "chart proportion", "value"));
};
// how many branches in my tree
cShapeContainer.prototype.treeLength = function() {
    var ht = 1;
    this.children().forEach(
      function (sc) {
        ht += sc.treeLength();
      }
    );
    return ht;
}

cShapeContainer.prototype.myGapAfterMe = function() {
    return this.paramGap();
};
cShapeContainer.prototype.myGapBeforeChildren = function() {
    return this.children().count() ? this.paramGap() : 0;
};
cShapeContainer.prototype.myExpansion = function() {
    return this.paramExpansion() ?  true : this.biggestBranch() > 1 ;
};

cShapeContainer.prototype.mySpace = function() {
    var ht = 0;
    
    if (!this.children().count()){
      ht= this.paramHeight() + this.myGapAfterMe();
    }
    else {
      if (this.myExpansion()){
        ht += this.myGapBeforeChildren();
        this.children().forEach(
          function (sc,scIndex) {
            ht += sc.mySpace();
          }
        );
        ht +=  this.myGapAfterMe();
      }
      else
        ht = this.paramHeight() + this.myGapAfterMe();
    }
    return ht;
};
cShapeContainer.prototype.myShapeHeight = function() {
    return this.mySpace() - this.myGapAfterMe();
};
cShapeContainer.prototype.biggestBranch = function() {
    var ht = this.children().count();
    this.children().forEach(
      function (sc,scIndex) {
        if (( t = sc.biggestBranch()) > ht) ht = t;
      }
    );
    return ht;
};
cShapeContainer.prototype.find = function(vId) {
  var scFound = this.childExists(vId);
  if (!scFound) {
    this.children().forEach(
      function (sc,scIndex) {
        if (!scFound) scFound = sc.find(vId);
      }
    );
  }
  return scFound;
};
cShapeContainer.prototype.childExists = function(vId,complain) {
  return this.children().item(vId,fixOptional(complain,false));
}


cShapeContainer.prototype.paramCustomCell = function(sValue,complain) {
    var sCustom = this.fieldData("Custom");
    if (sCustom) {
      var p = this.paramCell("Custom Bars", sCustom, sValue);
      if (!p && fixOptional (complain,true)) {
        MsgBox ("could not find custom format definition |" + 
            sCustom + "|" + sValue + "| in parameter sheet");
      }
      return p;
    }
};
cShapeContainer.prototype.shape = function() {
   return this.xShape;
};
cShapeContainer.prototype.shapeType = function() {
   return this.xShapeType;
};

cShapeContainer.prototype.shapeTemplate = function(shp,ptWhere) {
  var where =  !isUndefined(ptWhere) ? ptWhere : this.paramShapeTemplate();
  var sh = fixOptional(shp,this.shape());
  // minimize api calls again
  var wn = WorkSheetName(WorkSheet(where));
  var rn = where.getRow();
  var cn = where.getColumn();
  sh.setBackgroundColor(sheetCache(wn,'getBackgroundColors').getValue(rn,cn));
  sh.setColor(sheetCache(wn,'getFontColors').getValue(rn,cn));
  sh.setTextAlign(sheetCache(wn,'getHorizontalAlignments').getValue(rn,cn));
  sh.setVerticalAlign(sheetCache(wn,'getVerticalAlignments').getValue(rn,cn));
  sh.setFontSize(sheetCache(wn,'getFontSizes').getValue(rn,cn)) ;
  return this;
}
cShapeContainer.prototype.makeShape = function (xTop) {
  var self = this;
  // this would be a frame
  if (isUndefined(xTop)) xTop = self.paramFrameTop() +  this.paramHeight() / 2;;
  // none shapes are made invisible but take space
  if ((this.xShapeType = self.paramShapeType()) == SHAPETYPES.stNone) 
    this.xShapeType = SHAPETYPES.stDefault;
  //this is the most complex part - creating the shapes of the correct size and placing them in the right spot
  self.xShape = self.addShape(this.xShapeType,self.paramFrameLeft(),xTop, self.paramFrameWidth(), this.myShapeHeight());
  self.shapeTemplate();
  
  self.shape()
    .setText(self.text())
    .setVisible (self.paramShapeType() != SHAPETYPES.stNone);
    
  if (self.isData()){
    self.shape()
      .setLeft(self.myLeft())
      .setWidth(self.myWidth());
  }
  self.shape().commit();
  
  //this is where it gets tricky
  var xNextTop = self.shape().top();
  if(this.myExpansion()) {
    //if we are allowing expansion of targets then need to make a gap to accommodate my children
    xNextTop += self.myGapBeforeChildren();
  }
  self.children().forEach(
    function (sc) {
      sc.makeShape(xNextTop);
      xNextTop += sc.mySpace();
    }
  );  

};
cShapeContainer.prototype.springClean=function(){
    DebugAssert (this.scType() == SCTYPES.sctframe, 'spring clean should start at root');
    this.associate();
    // probably dont need this in gapps
    //deleteAllShapes Plot, nameStub
};
cShapeContainer.prototype.associate=function(){
//one off reassociation of items from the root to be children of their target
//no need for recursion since to start with all are associated with the top level frame
  var self = this;
  self.children().forEach(
    function (scParent) {
      self.children().forEach(
        function (scChild,i) {
          if(scChild.target() == scParent.id()){
            scParent.children().add (scChild, scChild.id());
            //confirm the parent as found
            scChild.xParent = scParent;
          }  
        }
      )
    }
  );

  //now all we need to do is clean up the children of the frame
  for (var n = this.children().count(); n > 0 ; n--) {
    var scChild = this.children().item(n);
    if (!scChild.valid()) {
      //we get here because we didnt find a target yet
      if(scChild.target() != this.id()) {
        //and it wasnt the frame.. so
        MsgBox("Did not find target " + scChild.target() + " for ID " + scChild.id());
      }
      // confirm the frame as the parent
      scChild.xParent = this;
    }
    else {
    //remove from the frames children as already now child of someone else
          this.children().remove (n);
    }
    //belt and braces
    DebugAssert (scChild.valid(),'logic failure in associate');
  }
  return this;
};  
cShapeContainer.prototype.createScale = function(){
  var tickType =   makeKey(this.param("containers", "ticks", "value"));
  if (tickType == "automatic") tickType = this.autoScale(tickType);
  return ( this.xScaleDates = this.createTicks(tickType));
  
};
cShapeContainer.prototype.scaleDates = function(){
  return this.xScaleDates;
}
cShapeContainer.prototype.createTicks = function(s){
          
  var oTicks = this.limitofScale(s, this.activate(), this.deActivate());

  //patch in new scale
  this.xStartScale = oTicks.start;
  this.xFinishScale = oTicks.finish;

  var p = this.paramFrameLeft();

  var dheight = this.paramHeight();

  var ft = this.paramRange("containers", "ticks", "format");

  var ftop = this.paramFrameTop() ;
  if (ftop < 0) {
        MsgBox ("not enough room for scale - try changing the top parameter");
        ftop = 0;
  }

  var tScaleDates = [];
  var xcds = oTicks.start;
  var ticks=0;
  var p =this.paramFrameLeft();
  while (xcds < oTicks.finish) {
    ticks++;

    DebugAssert( ticks <= ECONSTANTS.maxTicks,
                "no room to show scale " + s + " :choose another scale");
    // get end date of the tick for this start date
	var oSub = this.limitofScale(s, xcds, xcds);
	DebugAssert (oSub.finish > xcds, ' got confused calculating scale');

    var w = this.myWidth() * (oSub.finish-oSub.start) / (oTicks.finish-oTicks.start+.0001);
    var shp = this.addShape(SHAPETYPES.stRectangle, p, ftop, w, dheight)
                  .setText(oSub.finishText);
                  
    this.shapeTemplate(shp,ft);
    shp.commit();
    p += shp.width();
    tScaleDates.push( oSub);
    xcds = addDays(oSub.finish, 1);

  }
  if (ticks){
    return tScaleDates;
  }
  
}
cShapeContainer.prototype.autoScale = function(){
  DebugAssert( this.scType() == SCTYPES.sctframe,'unexpected type wants dates');
  var idealTicks = ECONSTANTS.maxTicks * 0.5;
  var tickDiff = ECONSTANTS.maxTicks + 1;
  var s;
  var sBest ='unknown';

  for ( s in {"weeks":0, "months":0, "quarters":0, "halfyears":0,"years":0} ) {
    var ob = this.limitofScale(s, this.activate(), this.deActivate());
    if( Abs(idealTicks - ob.ticks) < tickDiff ){
      sBest = s;
      tickDiff = Abs(idealTicks - ob.ticks);
    }
  }
  DebugAssert( tickDiff <= ECONSTANTS.maxTicks,"Couldnt find a feasible automatic scale to use for roadmap"); 
  return sBest;
};

cShapeContainer.prototype.limitofScale = function(s, sd, fd) {

	var obj = {};
	obj['start'] = null;
	obj['finish'] = null;
	obj['ticks'] = 0;
	obj['finishText'] = '';
	obj['startText'] = '';

	switch (s) {
      case "weeks":
		obj.start = addDays(sd, -(sd.getDay() % 7), -1);
		obj.finish = addDays(fd, 6 - (fd.getDay() % 7), 1);
		obj.ticks = Math
		.floor((1 + daysDiff(obj.start, obj.finish)) / 7);
		obj.startText = niceDate(obj.start);
		obj.finishText = niceDate(obj.finish);
		return obj;
        
      case "months":
		obj.start = new Date(sd.getFullYear(), sd.getMonth(), 1);
		obj.finish = addDays(new Date(fd.getFullYear(),
				fd.getMonth() + 1, 1), -1, 1);
		obj.ticks = Math
		.floor((1 + daysDiff(obj.start, obj.finish)) / 30);
		obj.startText = ECONSTANTS.mths[obj.start.getMonth()] + '-'
		+ padYear(obj.start);
		obj.finishText = ECONSTANTS.mths[obj.finish.getMonth()] + '-'
		+ padYear(obj.finish);
		return obj;
        
      case "quarters":
		obj.start = new Date(sd.getFullYear(), sd.getMonth()
				- (sd.getMonth() % 3), 1);
		obj.finish = addDays(new Date(fd.getFullYear(), fd.getMonth()
				+ 3 - (fd.getMonth() % 3), 1), -1, 1);
		obj.ticks = Math
		.floor((1 + daysDiff(obj.start, obj.finish)) / 90);
		obj.startText = 'Q'
			+ (1 + Math.floor(obj.start.getMonth() / 3)).toString()
			+ padYear(obj.start);
		obj.finishText = obj.startText;
		return obj;
        
      case "halfyears":
		obj.start = new Date(sd.getFullYear(), sd.getMonth()
				- (sd.getMonth() % 6), 1);
		obj.finish = addDays(new Date(fd.getFullYear(), fd.getMonth()
				+ 6 - (fd.getMonth() % 6), 1), -1, 1);
		obj.ticks = Math
		.floor((1 + daysDiff(obj.start, obj.finish)) / 183);
		obj.startText = 'H'
			+ (1 + Math.floor(obj.start.getMonth() / 6)).toString()
			+ padYear(obj.start);
		obj.finishText = obj.startText;
		return obj;
        
      case "years":
		obj.start = new Date(sd.getFullYear(), 0, 1);
		obj.finish = addDays(
				new Date(fd.getFullYear() + 1, 0, 1), -1, 1);
		obj.ticks = Math
		.floor((1 + daysDiff(obj.start, obj.finish)) / 365);
		obj.startText = obj.start.getFullYear().toString();
		obj.finishText = obj.startText;
		return obj;
        
      default:
		DebugAssert(false, 'unknown scale ' + s);
        return null;
	}
};

cShapeContainer.prototype.needSwapBar = function(y) {
  var sorder =  LCase(this.param("options", "sort bar order", "value"));
  var self = this;
  var bAscending = ( sorder == "ascending");
  if (sorder != "none") {
     var mOrder = LCase(self.param("options", "sort bars by", "value"));
     switch(mOrder){
       case "original":
         return (self.serial() > y.serial() && bAscending) || 
                 (self.serial() < y.serial() && !bAscending);
       case "sequence":
         return (self.sequence() > y.sequence() && bAscending) || 
                 (self.sequence() < y.sequence() && !bAscending);
       case "activate":
         return (self.activate() > y.activate() && bAscending) || 
                 (self.activate() < y.activate() && !bAscending);
       case "deActivate":
         return (self.deActivate() > y.deActivate() && bAscending) || 
                 (self.deActivate() < y.deActivate() && !bAscending);
       case "duration":
         return (self.duration() > y.duration() && bAscending) || 
                 (self.duration() < y.duration() && !bAscending);
       case "id":
         return (self.id() > y.id() && bAscending) || 
                 (self.id() < y.id() && !bAscending);
                 
       case "description":
         return (self.description() > y.id() && bAscending) || 
                 (self.description() < y.id() && !bAscending);
       default:
         DebugAssert(false,'unknown sort order ' +mOrder);
     }
  }
  return false;
};
function needSwap (x,y) {
  var xLen = x.treeLength();
  var yLen = y.treeLength();
  var sorder =  x.param("options", "sort target popularity", "value");
  var bSwapBar = x.needSwapBar(y);
  switch(LCase(sorder)) {
    case "ascending popularity":
      return (xLen < yLen) || (xLen == yLen && bSwapBar);
    case "ascending popularity":
      return (xLen > yLen) || (xLen == yLen && bSwapBar);
    case "no popularity sort":
      return bSwapBar; 
    default:
      DebugAssert(false,'unknown popularity sort ' + sorder);
  }
  return false;  
};
cShapeContainer.prototype.sortChildren = function(){
  if (this.children().count()) {
    this.children().forEach(
      function (sc) {
        sc.sortChildren (needSwap);
      }
    );
    this.children().sort(needSwap);
  }
};
cShapeContainer.prototype.addShape = 
      function (shapeType,shapeLeft,shapeTop,shapeWidth,shapeHeight){
      return (new cShape(shapeType == SHAPETYPES.stPanel))
              .setWidth(shapeWidth)
              .setHeight(shapeHeight)
              .setTop(shapeTop)
              .setLeft(shapeLeft)
              .setRounded(this.isRounded(shapeType));
};

cShapeContainer.prototype.makeChart = function () {
  this.xChartContainer = new cChartContainer(this.root());
  this.xChartContainer.makeChart();
  return this;
};
cShapeContainer.prototype.chartStyle = function () {

    switch(LCase(this.param("options", "chart style", "value"))) {
        case "shale":
            return SCHARTTYPES.ctShale;
        case "column stacked":
            return SCHARTTYPES.ctColumnStacked;
        case "line":
            return SCHARTTYPES.ctLine;
        case "bar":
            return SCHARTTYPES.ctBar;
        case "column":
            return SCHARTTYPES.ctColumn;
        default:
            return SCHARTTYPES.ctDefault
    }
};
cShapeContainer.prototype.chartCostTreatment = function () {

    switch(LCase(this.fixupCustomCell("chart cost treatment").toString())) {
        case "annual":
            return STREATS.stcAnnual
        case "duration":
            return STREATS.stcDuration
        case "one off at start":
            return STREATS.stcOneOffStart
        case "one off at finish":
            return STREATS.stcOneOffFinish
        default:
            return STREATS.stcDefault
    }
};

cShapeContainer.prototype.groupContainers =  function () {
  showPanel();
//todo
};
cShapeContainer.prototype.traceability = function () {
//todo
};
cShapeContainer.prototype.doShapeCallouts = function () {
//TODO
};


