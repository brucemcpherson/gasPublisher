// this is clone of the excel cJobject
// kind of odd since cJobject is a way to do jSon things in Excel but this will maintain compatability.

var cJobject = function  () {
  this.xChildren = new collection();  
  this.children = function(x) {
    return IsMissing(x) ? this.xChildren : this.xChildren.item(x) ;
  };
  return this;
}; 
cJobject.prototype.init = function(p,optK,optV) {  
  k = fixOptional ( optK, '');
  v = fixOptional ( optV, Empty());
  var self = this;
  
  this.xParent = p;
  this.parent = function() {
    return this.xParent;
  };
  this.xIsArrayRoot = false;
  this.isArrayRoot = function() {
    return this.xIsArrayRoot;
  };
  this.xIsValid = true;
  this.isValid = function() {
    return this.xIsValid;
  };
  this.xChildIndex =  this.parent() ? this.parent().children().count()+1 : 1;
  this.childIndex= function() {
    return this.xChildIndex;
  };
  this.xKey = k ?  k :  CStr(this.xChildIndex)  ;
  this.key = function() {
    return this.xKey;  
  };

  this.xValue = v;
  this.value = function() {
    return this.xValue;
  };
                  
  if (this.parent()){
    this.parent().children().add (this,  this.key());
  }

  return self;
};
cJobject.prototype.isArrayMember = function(){
  return this.parent() ?  this.parent().isArrayRoot() : false;
};
cJobject.prototype.clearParent = function(){
  this.xParent = null;
};
cJobject.prototype.root = function(){
  var jo=this;
  if (jo) while ( jo.parent())  jo=jo.parent();
  return jo;
};
cJobject.prototype.toString = function(optChild){
  return CStr(this.cValue(optChild));
 
};
cJobject.prototype.hasChildren = function(){
  return this.xChildren ? this.xChildren.count() > 0 : false;
};
cJobject.prototype.child = function(s){
  var jc = null;
  if (s) {
    var aString = Split(s, ".");
    var jo = this;
    // we take something like x.y.z and find the child
    for ( var n= 0; n < aString.length && jo ; n++){
      jc = jo.childExists(CStr(aString[n]));
      jo = jc;
    }
  }
  return jc;
};
cJobject.prototype.childExists = function(s){
  return this.hasChildren() ? 
            this.children().item(s,false):
            null;
};
cJobject.prototype.insert = function(optS, optV){
  s = fixOptional ( optS, '');
  v = fixOptional ( optV, Empty());
  var joNew = this.childExists(s);
  var p = this;
  if (!joNew) {
  // this is an add.
    DebugAssert ( p.isArrayRoot() || s, 
      'Non array add must have a key', p.fullKey());
    var joNew = new cJobject().init( p , s , v);
  }
  else {
    joNew.xValue = v;
  }
  return joNew;
};
cJobject.prototype.add = function(optK, optV){
  k = fixOptional ( optK, '');
  v = fixOptional ( optV, Empty());
  var aString = Split(k,".");
  var jo = this;
  for(var n =0 ; n < aString.length ; n++ ) { 
    var jc = jo.insert(CStr(aString[n]), v);
    jo = jc
  }
  return jo ;
};
cJobject.prototype.addArray = function(){
  this.xIsArrayRoot = true;
  return this;
};



cJobject.prototype.find = function(s){
  var f = null;
  var fk = this.fullKey();
  var possible = (Len(s) == Len(fk));
  if (!possible && Len(fk) > Len(s)) possible = (Mid(fk, Len(fk) - Len(s), 1) == ".");
  if(possible && makeKey(Right(fk,Len(s))) == makeKey(s) ) {
    f= this;
  }
  else {
    if (this.hasChildren()) {
      this.children().forEach( 
        function(jo){
          if (!f) 
            f = jo.find(s) ;

        }
      )
    }
  }

  return f;
};

cJobject.prototype.fullKey = function(optIncludeRoot){
  var jo = this;
  var s = '';
  var includeRoot = fixOptional (optIncludeRoot,true);
  while (jo) { 
    if (!jo.isRoot() || includeRoot) s = jo.key() + '.' + s;
    jo = jo.parent();
  }
  if (s) s = Left(s,Len(s)-1);
  return s;
};

cJobject.prototype.serialize = function(optBeautify){
  // beautify not implemented as im using the built in JSONifier
  // the VBA version uses my own.
  return JSON.stringify(this.toNative());
};

/**
 * whether this is the root of the cJobject
 * @return {boolean} whether this is the root of the cJobject
 */
cJobject.prototype.isRoot = function () {
    return this.root() === this;
}

/**
 * removes an entire cJobject branch from it's parent
 * @return {cJobject} The parent
 */
cJobject.prototype.remove = function () {
    // removes a branch from a cjobject
    var self = this;
    DebugAssert (self.parent(), "trying to remove  with no parent");
    DebugAssert (self.parent().hasChildren(), "messed up cJobject parent linkage somehow");
    
    // remove myself from the collection
    self.parent().children().remove (self.childIndex());
    // fix the childindices of my siblings
    var i = 0;
    self.parent().children().forEach(
      function (cj) {
        cj.xChildIndex = ++i;
      }
    );
    return self.parent();
}

/**
 * makes a copy of a cJObject to a brand new one 
 * @return {cJobject} The cloned cJobject
 */
cJobject.prototype.clone =function () {
  // make a copy of this cJobject
    var cj = new cJobject().init(null).append(this).children(1);
  // reset the root
    cj.clearParent();
    return cj;
}
/**
 * merges one cJobject into another, replacing values, appending branches or replacing arrays as required
 * @param {cJobject} mergeThisIntoMe the cJobject to be merged in
 * @return {cJobject} The merged cJobject
 */

cJobject.prototype.merge = function (mergeThisIntoMe) {
    // merge this cjobject with another
    // items in merged with are replaced with items in Me
    // note this is a copy (so once merged there is no linkage to the old object)
    var self = this;
    var p = self.find(mergeThisIntoMe.fullKey(false));
    
    if(!p) {
    // i dont have it yet
       p = self.append(mergeThisIntoMe);
    } 
    else {
    // i do have it already
      if (p.isArrayRoot()) {
      // but its an array - i need to get rid of the current one and replace it
        var p = p.remove();
        p=p.append(mergeThisIntoMe);
      }
      else {
      // regular replace the value 
        p.xValue = mergeThisIntoMe.value();
      }
    }

    // now merge in my children and recurse
    mergeThisIntoMe.children().forEach(
      function(cj) {
        p.merge(cj);
      }
    );
    return self;
}
/**
 * a shortcut for .child(childname).value
 * @param {string=} childname optionally the key of the child whose value is required
 * @return {*} The value
 */
cJobject.prototype.cValue= function (childName) {
  // just a shortcut for .child(childname).value
    return IsMissing (childName) ? this.value() : this.child(childName).value();
}
/**
 * returns the 1st position in the children collection that matches the given value
 * @param {*} v the value to look for
 * @return {number} The position (1 is base), or 0 if not found
 */
cJobject.prototype.valueIndex = function (v) {
    // check to see if v is in the cj array
    var r = 0;
    this.children().forEach(
      function(cj,i) {
        if (cj.value() == v)  { 
          r = cj.childIndex();
          // break out of forEach
          return true;
        }
      }
    );
    return r;
}

cJobject.prototype.toNative = function(optParent) {
  var parent = fixOptional(optParent,{});
  this.toNativeRecurse(parent);
  return parent;
};
cJobject.prototype.toNativeRecurse = function(parent){
  // converts a cJobject to a javaScript object
  var self = this;
  if (self.hasChildren()) {
    parent= parent[self.key()]= self.isArrayRoot () ? [] : {};
    self.children().forEach(
      function (item) {
         if (item.key()) {
           branch = item.toNativeRecurse(parent);
           if (item.isArrayMember()) {
             DebugAssert ( isArray (parent),self.key() + ' should have been an array');
             var p = {};
             p[item.key()]=branch;
             parent.push (p);
           }
           else {
             parent[item.key()]= branch;
           }
         }
         else {
           DebugAssert ( isArray (parent),self.key() + ' should have been an array');
           DebugAssert ( item.isArrayMember (parent),self.key() + ' has non-array members');
           parent.push(item.toNativeRecurse());
         } 
       }
    );
    return parent;
  }
  else {
     return self.value();
  }

};

cJobject.prototype.fromNative = function(native) {
	// take a native jscript object and convert it to a cjobject
	var self = this;
	// if its an array then create an array root, and recurse with each array element
	if (isArray(native)) {
		self.addArray();
		for (var j = 0; j < native.length;j++) {
            self.add().fromNative(native[j]);
		}
	}
	// if its an object, then add each key as the next lower cjobject
	else if (IsObject(native)) {
		for (k in native) {
			self.add (k).fromNative(native[k]);
		}	
	}
	// finally we get to the value;
	else {
		self.xValue = native;
	}
    return self;
};
cJobject.prototype.deSerialize = function(s) {
	// the VBA version uses its own jSON parser. This one will use the JSON.parse built in
	// simply we just parse it to native jscript object, then convert it to a cJobject
    try {
      var x = JSON.parse(s);
    }
    catch(err) {
      // json can have control chars, or quotes not properly escaped.. silently clearn and try again
      var sCleaner = s;
      Logger.log("some invalid json in " + s);
      try {
        sCleaner = invalidlyEscapedQuote(s.replace(/[\x00-\x1F\x7F]/g, ""));
        var x = JSON.parse(sCleaner);
      }
      catch (err) {
        Logger.log("unable to parse even after cleaning " + sCleaner);
        var x = { error: "json was invalid - could not deserialize", jSon : s }
      }
    }
    return this.fromNative(x);
};
cJobject.prototype.depth = function(optL) {
  var l = fixOptional (optL, 0);
  l++;
  var self = this;
  self.children().forEach(
    function (jo) {
      l=jo.depth(l);
    }
  );
  return l;
}; 
cJobject.prototype.clongestFullKey = function(job,optSoFar) {
  var soFar = fixOptional (optSoFar, 0);
  l = Len(job.fullKey());
  if (l < soFar) l = soFar;
  var self = this;
  job.children().forEach(
    function (jo) {
      l = self.clongestFullKey(jo, l)
    }
  );
  return l;
};
cJobject.prototype.formatData = function() {
    return this.cformatData(this.root()); 
};
cJobject.prototype.cformatData = function(job, optSoFar) {
    var s = fixOptional( optSoFar,'') + this.itemFormat(job) ;
    var self = this;
    job.children().forEach(
      function (jo) {
        s = self.cformatData(jo, s);
      }
    );
    return s;
};
cJobject.prototype.itemFormat = function (jo ) {

    return jo.fullKey() + Space(this.clongestFullKey(jo) + 4 - Len(jo.fullKey())) +
            jo.toString() + "\n" ;

};
cJobject.prototype.toTreeView = function (app,selectHandler) {

  var scrollPanel = app.createScrollPanel().setAlwaysShowScrollBars(true);
   
  var tree = app.createTree().setId('restExplorer');
  this.treeViewPopulate (tree,app,tree,selectHandler);
  scrollPanel.add(tree);
  app.add(scrollPanel);
  return app;

};
cJobject.prototype.treeViewPopulate = function (root,app,tree,selectHandler) {
    var self = this;
    var s = self.key() + ( self.hasChildren() ? "" : " : " + self.toString() );
    var treeItem = app.createTreeItem().setText(s).setId(self.fullKey());
    tree.addItem(treeItem);
    if (selectHandler) {
      var handle = app.createServerSelectionHandler(selectHandler);
      root.addSelectionHandler(handle);
      handle.addCallbackElement(treeItem);
    }
    self.children().forEach(
      function (cj) {
        cj.treeViewPopulate ( root,app, treeItem,selectHandler);
      }
    ); 
    return treeItem;
};
/**
 * appends (makes a copy of) a new branch to a cJobject parent
 * @param {cJobject} appendThisToMe the cJobject to be added 
 * @return {cJobject} The  cJobject
 */
cJobject.prototype.append = function (appendThisToMe) {
    //append another object to me
    var self = this;

    // if its an array, then the key will be automatically generated
    var w = appendThisToMe.parent();
    var p = w ?  (w.isArrayRoot() ?
              self.add(undefined, appendThisToMe.value()):
              self.add(appendThisToMe.key(), appendThisToMe.value())) : 
              self.add(appendThisToMe.key(), appendThisToMe.value()) ;
    // notice if its an array
    if (appendThisToMe.isArrayRoot()) p.addArray();
    
    // now all his children and recurse
    appendThisToMe.children().forEach(
      function(cj) {
        p.append(cj);
      }
    );
    return self;
}

/*
tree.setName('mytree').addSelectionHandler(app.createServerSelectionHandler("restClick").
    addCallbackElement(tree));


	





*/
