// emulate excel shapes by using the UI 

// public variable holding the panel to contain the shapes
var shapePanel;
function usePanel() {
  return shapePanel ? shapePanel : shapePanel = new cUiPanel();
}

function showPanel() {
  usePanel().app().setHeight(usePanel().xMaxHeight).setWidth(usePanel().xMaxWidth);
  SpreadsheetApp.getActiveSpreadsheet().show(usePanel().app());
  return shapePanel;
}

var cUiPanel = function(){
  this.xApp = UiApp.createApplication(); 
  this.app = function(){
    return this.xApp;
  };
  this.xAbsolutePanel = this.app().createAbsolutePanel();
  this.absolutePanel = function(){
    return this.xAbsolutePanel;
  };
  this.app().add(this.absolutePanel());
    // keep track of the biggest assigned and tweak the panel later
  this.xMaxHeight = 0;
  this.xMaxWidth = 0;
};
// a shape will be placed on the absolute panel defined by usePanel().xAbsolutePanel
var cShape = function  (isaPanel) {
  this.xIsaPanel = fixOptional(isaPanel,false);
  this.xShapePanel = usePanel();
  this.xBox = this.xIsaPanel ?  this.app().createHorizontalPanel() : this.app().createLabel();
  this.panel().add(this.box(),0,0);
  this.xLeft = this.xTop = this.xHeight = this.xWidth =0;
  this.xVisible = true;
  return this;
};


cShape.prototype.app = function() {
  return this.shapePanel().app();
};
cShape.prototype.panel = function() {
  return this.shapePanel().absolutePanel();
};
cShape.prototype.shapePanel = function() {
  return this.xShapePanel;
};
cShape.prototype.box = function() {
  return this.xBox;
};
cShape.prototype.borderCss = function() {
  return '1px solid gray';
};
cShape.prototype.borderRadiusCss = function() {
  return this.xRounded ? '5px' : '0px';
};
cShape.prototype.commit = function() {
  // position and size the box
  this.box()
    .setHeight (this.height())
    .setWidth(this.width())
    .setStyleAttribute('backgroundColor',this.xBackgroundColor)
    .setStyleAttribute('color',this.xColor)
    .setStyleAttribute('textAlign',this.xTextAlign)
    .setStyleAttribute('verticalAlign',this.xVerticalAlign)
    .setStyleAttribute('fontSize',this.xFontSize)
    .setStyleAttribute('border',this.borderCss())
    .setStyleAttribute('borderRadius',this.borderRadiusCss());
    
  if(!this.xIsaPanel)this.box().setText(this.text());    
  this.panel().setWidgetPosition(this.box(), this.left() , this.top() );
  this.box().setVisible(this.visible());
  
  // adjust the absolute panel so its always big enough with a small % border
  var smallPercent = 1.05;
  var x= (this.height() + this.top() ) * smallPercent ;
  if ( x > this.shapePanel().xMaxHeight)  { 
    this.panel().setHeight(this.shapePanel().xMaxHeight =  x);
  }
  
  x= (this.width() + this.left())* smallPercent;
  if ( x > this.shapePanel().xMaxWidth)  { 
    this.panel().setWidth(this.shapePanel().xMaxWidth =  x);
  }

  return this;
};

cShape.prototype.left = function() {
  return this.xLeft;
};
cShape.prototype.visible = function() {
  return this.xVisible;
};
cShape.prototype.top = function() {
  return this.xTop;
};
cShape.prototype.height = function() {
  return this.xHeight;
};
cShape.prototype.width = function() {
  return this.xWidth;
};
cShape.prototype.text = function() {
  return this.xText;
};
cShape.prototype.box = function() {
  return this.xBox;
};

cShape.prototype.setHeight = function(height) {
  this.xHeight = height;
  return this;
};
cShape.prototype.setWidth = function(width) {
  this.xWidth = width;
  return this;
};
cShape.prototype.setLeft = function(left) {
  this.xLeft = left;
  return this;
};
cShape.prototype.setTop = function(top) {
  this.xTop = top;
  return this;
};
cShape.prototype.setText = function(text) {
  this.xText = text;
  return this;
};
cShape.prototype.setRounded = function(b) {
  this.xRounded = fixOptional(b,true);
  return this;
};
cShape.prototype.setVisible = function(b) {
  this.xVisible = fixOptional(b,true);
  return this;
};
cShape.prototype.setBackgroundColor = function(c) {
  this.xBackgroundColor = c;
  return this;
};
cShape.prototype.setColor = function(c) {
  this.xColor = c;
  return this;
};
cShape.prototype.setVerticalAlign = function(c) {
  this.xVerticalAlign = c;
  return this;
};
cShape.prototype.setTextAlign = function(c) {
  this.xTextAlign = c;
  return this;
};
cShape.prototype.setFontSize = function(c) {
  this.xFontSize = c;
  return this;
};