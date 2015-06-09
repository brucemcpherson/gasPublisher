// use blisters to manage validation
// a blisterrule looks like this
// { blister: [ {listId:'xx', dependent: true , sortId:'optxx', sortDescending: false},{},{} ..] }

function cValidation(b, optBlisterRule) {
  var self = this;

/**
 * check that these rules go with this blister 
 * @return {boolean} good or not.
 */
  self.validate = function () {
    for (var i= 0 ; i < pRules.blister.length ; i++ ) {
      if( pBlister.getKeyItemIndex(pRules.blister[i].listId) < 0 ) return false;
    }
    return true;
  }
  
/**
 * check that this range goes with this validation
 * @return {boolean} good or not.
 */
  self.worksWith = function (range) {
      return (pRules.blister.length === range.getNumColumns() || !pRules.blister.length) && self.validate();
  } 
  
/**
 * make an empty blisterRule
 * @return {boolean} good or not.
 */
  self.emptyBlisterRule = function () {
      return { blister: [] };
  } 
  
/**
 * create a default rule to match this range
 * @param {Range} range the range to apply it to
 * @return {object} a default blisterrule
 */  
 
 self.defaultBlisterRule = function (range) {
   var p = self.emptyBlisterRule(), nc = range.getNumColumns() ;
   for ( var i = 0 ; i < nc ; i++ ) {
     var d = { listId: i +1 , sortId: i +1 , filters: null ,  sortDescending: false};
     // filter on previous columns
     if (i > 0 ) {
       for ( var filters=[],j = 0; j < i ; j++) {
          filters.push ( {listId: j+1, value: null } );
       }
       d.filters = filters;
     }
     p.blister.push (d);
   }
   return p;
 }
  
  
/**
 * apply this validation
 * @param {Range} range the range to apply it to
 * @return {cValidation} the self for chaining
 */  
  
  self.apply = function (range) {
  
    if (!self.worksWith(range)) throw ("attempt to apply mismatched blister to range");
    pRange = range;
    pValidations = [];
   
     // use given rules or set up defaults
    var r = pRules.blister.length ? pRules.blister : self.defaultBlisterRule(range).blister;
    var data = null,nr = pRange.getNumRows(), nc= pRange.getNumColumns() ;

    for ( var i = 0 ; i < r.length ; i ++ ) {
      if (!r[i].filters) {
        // we can do the whole column at once
        var f =  pBlister.getUniqueListValues (r[i].listId, r[i].sortId);
    
        if (f) {
          // bugette patch
          f.push('');
          var p = SpreadsheetApp.newDataValidation()
                .setAllowInvalid(false)
                .requireValueInList(f )
                .build();
          pRange.offset(0,i,nr,1).setDataValidation (p);
        }
      }
      else {
        // we have to do it row by row
        if (!data) data = pRange.getValues();
        for ( var j = 0 ; j < nr ; j++) {
          // filter on the data values
          for (var k=0; k < r[i].filters.length; k++) {
            r[i].filters[k].value = data[j][k];
          }  
          
          // apply dymanic filter to individual cell 
          var f = pBlister.getUniqueListValues  (r[i].listId, r[i].sortId, r[i].filters);
         
          if (f) {
            // bugette patch
            f.push('');
            var p = SpreadsheetApp.newDataValidation()
                  .setAllowInvalid(false)
                  .requireValueInList(f)
                  .build();
            pRange.offset(j,i,1,1).setDataValidation (p);
           
          }
        }
      }

  }
  
  return self;
}
  
/**
 * return validations created by this 
 * @return {<array>.DataValidation} the array of validations
 */
 
  self.getValidations = function () {
    return pValidations;
  }
   
  
/**
 * return latest used range for this validation 
 * @return {Range} the range
 */
 
  self.getRange = function () {
    return pRange;
  }
  
/**
 * return latest used range for this validation 
 * @return {cValidation} itself for chaining
 */
 
  self.setRange = function (range) {
    pRange = range;
    return self;
  }


  var pBlister = b;
  if (optBlisterRule && optBlisterRule.blister) {
    pRules = optBlisterRule;
  }
  else {
    pRules = self.emptyBlisterRule();
  }

  var pRange = null;
  var pValidations = [];
  
  return self;
  
}


function intersect (e, target) {
  // does the range returned by onedit intersect with the one given by onEdit
  return target.getSheet().getName() == e.getSheet().getName() && 
         target.getRow() <= e.range.rowEnd &&
         target.getLastRow() >= e.range.rowStart &&
         target.getColumn() <= e.range.columnEnd  &&
         target.getLastColumn() >= e.range.columnStart ; 
}

function clearKnownValidations(v) {
  
  for (var i=0; i < v.blisters.length; i++) {
    for ( var j =0; j < v.blisters[i].applies.length; j++) {
       getRangeFromItem(v.blisters[i].applies[j]).clearDataValidations();
    }
  }
}

function applyValidations (blisterValidations,assister) {
  
  if (blisterValidations) {
      clearKnownValidations (blisterValidations);
      for (var i=0; i < blisterValidations.blisters.length ; i++ ) {
        var b = assister ( blisterValidations.blisters[i].listName ) ;
        var v = new cValidation (b, blisterValidations.blisters[i] );
        for ( var j = 0 ; j < blisterValidations.blisters[i].applies.length ; j++ ) {
          var r = getRangeFromItem(blisterValidations.blisters[i].applies[j]);
          r.clearDataValidations();
          v.apply(r);
        }
    }
  }
  return blisterValidations;
}

function reApply(e, blisterValidations,assister) {

  
  if (blisterValidations && e.range.getDataValidations()) {
       
    // lets see if this intersects with any known validation
          for (var i=0; i < blisterValidations.blisters.length ; i++ ) {
            var b = null,v;
            
            for ( var j = 0 ; j < blisterValidations.blisters[i].applies.length ; j++ ) {
              var r = getRangeFromItem(blisterValidations.blisters[i].applies[j]);
              
              if ( intersect ( e, r) ) {
                 
                if (!b) {
                    
                    b = assister ( blisterValidations.blisters[i].listName ) ;
                    v = new cValidation (b, blisterValidations.blisters[i] );
                }
               
                var eRow = e.range.offset(0,r.offset(0,0,1,1).getColumn()-e.range.getColumn(),1,r.getNumColumns());
                eRow.clearDataValidations();
                v.apply(eRow);
              }
           }
        }
    }
}