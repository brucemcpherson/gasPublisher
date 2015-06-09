"use strict";

function getLibraryInfo () {

  return { 
    info: {
      name:'blisterMaintain',
      version:'2.2.0',
      key:'MjzWoikp6oNhybkdKWR7ab6i_d-phDA33',
      description:'blister maintainer',
      share:'https://script.google.com/d/1gDyDuW88-Y8xc0SFRO3fzVYm5RCaYghEnzlsIAnVUA9mmof9-0Q6bY_z/edit?usp=sharing',
      docs:'http://ramblings.mcpher.com/Home/excelquirks/listsandvalidation'
    },
    dependencies:[
      cUseful.getLibraryInfo()
    ]
  }; 
}
/**
  * return the values in a blister and return the value(s) in the same position(s)
  * @param {*} value  we're looking for
  * @param {string} listName the name of the list to find it in
  * @param {string|number=} optListId can be a column name, or a column number starting at/default 1
  * @param {string|number=} optReturnListId can be a column name, or a column number starting/default at 1
  * @param {string|number=} optSortId the list id on which to sort before looking, default is not to sort
  * @param {boolean=} optSortDescending if a sort is required, then whether to sort it descending - default is ascending
  * @param {number=} optMaxMatch maximum matches to return, 1 (default) will return a single value, everything else returns an array, 0 is all matches
  * return {*|<array>.*} the found value(s)
  */
function blisterLookup ( listName, value, optListId, optReturnListId ,  optSortId , optSortDescending,  optMaxMatch ) {

    // get a new blister
    var b = blisterAssister (listName,  
      {sortId:optSortId || undefined ,sortDescending:optSortDescending || undefined} );
    
    // match it
    var idx = b.matchWorker ( value , {
        listId : optListId || undefined,  
        maxMatch: optMaxMatch || undefined 
      });
      
    // get the values - its already sorted so no need to do it again
    return blister.transposeArray(b.indexWorker (idx , {
        listId :  optReturnListId || optListId || undefined,  
      }));

}
/**
  * get value(s) at the specified index in the given list
  * @param {string} listName the name of the list to find it in
  * @param {number|<array>.number} idx the item number starting at 1, or an array of start positions.
  * @param {string|number=} optListId can be a column name, or a column number starting at/default 1
  * @param {string|number=} optSortId the list id on which to sort before looking, default is not to sort
  * @param {boolean=} optSortDescending if a sort is required, then whether to sort it descending - default is ascending
  * @param {number=} optMaxMatch maximum matches to return, 1 (default) will return a single value, everything else returns an array, 0 is all matches
  * return {*|<array>.*} the found value(s)
  */
function blisterIndex ( listName, idx , optListId, optSortId, optSortDescending ) {  
    
    // get a new blister
    var b = blisterAssister (listName,  
      {sortId:optSortId || undefined ,sortDescending:optSortDescending || undefined } );
    
    return blister.transposeArray(b.indexWorker (idx, { 
        listId : optListId || undefined
      }));
}
/**
  * lookup the values in a blister and return the position of the match(es)
  * @param {*} value  we're looking for
  * @param {string} listName the name of the list to find it in
  * @param {string|number=} optListId can be a column name, or a column number starting at/default 1
  * @param {string|number=} optSortId the list id on which to sort before looking, default is not to sort
  * @param {boolean=} optSortDescending if a sort is required, then whether to sort it descending - default is ascending
  * @param {number=} optMaxMatch maximum matches to return, 1 (default) will return a single value, everything else returns an array, 0 is all matches
  * return {*|<array>.*} the found value(s)
  */
function blisterMatch (listName,value, optListId, optSortId, optSortDescending,  optMaxMatch ) {

    // get a new blister
    var b = blisterAssister (listName,  
      {sortId:optSortId || undefined ,sortDescending:optSortDescending || undefined} );
    
    return blister.transposeArray(b.matchWorker ( value, { 
        listId : optListId || undefined,  
        maxMatch: optMaxMatch || undefined
      }));
}
/**
  * return the unique values in a list column
  * @param {string} listName the name of the list to find it in
  * @param {string|number=} optListId can be a column name, or a column number starting at/default 1
  * @param {string|number=} optSortId the list id on which to sort before looking, default is not to sort
  * @param {boolean=} optSortDescending if a sort is required, then whether to sort it descending - default is ascending
  * @param {number=} optMaxMatch maximum matches to return,  0 is all matches and the default
  * @param {string=} optFilterId can be a column name, or a column number starting at/default 1
  * @param {string=} optFilterValue value the filter has to be.. there can be lots of these
  * return {<array>.*} the array of unique values
  */
function blisterUnique ( listName, optListId,   optSortId, optSortDescending,  optMaxMatch ,optFilterId, optFilterValue ) {
  
    
    // get a new blister
    var b = blisterAssister (listName,  
      {sortId:optSortId || undefined ,sortDescending:optSortDescending || undefined} );
    
    return blister.transposeArray(b.uniqueWorker ( { 
        listId : optListId || undefined,  
        maxMatch: optMaxMatch || undefined,
        filters: makeFilterArgs (5, Array.slice(arguments))
      } ));
                                            
}
/**
  * return the values in a list column
  * @param {string} listName the name of the list to find it in
  * @param {string|number=} optListId can be a column name, or a column number starting at/default 1
  * @param {string|number=} optSortId the list id on which to sort before looking, default is not to sort
  * @param {boolean=} optSortDescending if a sort is required, then whether to sort it descending - default is ascending
  * @param {number=} optMaxMatch maximum matches to return,  0 is all matches and the default
  * @param {string=} optFilterId can be a column name, or a column number starting at/default 1
  * @param {string=} optFilterValue value the filter has to be.. there can be lots of these
  * return {<array>.*} the array of values
  */
function blisterList (  listName, optListId,   optSortId, optSortDescending,  optMaxMatch , optFilterId, optFilterValue  ) {
  
  // get a new blister
  var b = blisterAssister (listName,  
      {sortId:optSortId || undefined ,sortDescending:optSortDescending || undefined } );
    
  return blister.transposeArray(b.listWorker ( { 
          listId : optListId || undefined,  
          maxMatch: optMaxMatch || undefined,
          filters: makeFilterArgs (5, Array.slice(arguments))
        } ));
  
}

/**
  * return the headers in a list column
  * @param {string} listName the name of the list to find it in
  * @param {string|number=} optListId can be a column name, or a column number starting at/default 1
  * return {<array>.*} the array of values
  */
function blisterHeaders (  listName, optListId  ) {
  
  // get a new blister
  var b = blisterAssister (listName, {} );
    
  return b.getListHeaders ( optListId || undefined );
  
}
/**
  * return the description of a blister
  * @param {string} listName the name of the list to find it in
  * return {string} the description
  */
function blisterDescription (  listName ) {
  
  // get a new blister
  var b = blisterAssister (listName, {} );
  return b.getDescription ();
}
/**
  * return the last update date of a blister
  * @param {string} listName the name of the list to find it in
  * return {string} the description
  */
function blisterUpdateDate (  listName ) {
  
  // get a new blister
  var b = blisterAssister (listName, {} );
  return b.getUpdateDate ();
}
/**
  * return the last update date of a blister
  * @param {string} optLibrary the name of the library to directory - default, this one
  * return {<array>.String} the descriptions
  */
function blisterDirectory (optLibrary) {
  
  // get a directory of blisters in this library
  var packages = blister.getBlisterPackages ( { db: blisterPickScriptDb( {library: optLibrary || undefined} )});
  var dir =[];
  for (var i=0;i<packages.length;i++){
    dir.push ([]);
    dir[dir.length-1].push(packages[i].package.name);
    dir[dir.length-1].push(packages[i].package.description);
  }
  return dir;
}
/**
  * return all the values in a list
  * @param {string} listName the name of the list to find it in
  * @param {string|number=} optSortId the list id on which to sort before looking, default is not to sort
  * @param {boolean=} optSortDescending if a sort is required, then whether to sort it descending - default is ascending
  * @param {number=} optMaxMatch maximum matches to return,  0 is all matches and the default
  * @param {string=} optFilterId can be a column name, or a column number starting at/default 1
  * @param {string=} optFilterValue value the filter has to be.. there can be lots of these
  * return {<array>.*} the array(s) of values
  */
function blisterData ( listName,   optSortId, optSortDescending,  optMaxMatch , optFilterId, optFilterValue) {  
  
  // get a new blister
  var b = blisterAssister (listName,  
      {sortId:optSortId || undefined ,sortDescending:optSortDescending || undefined } );
    
  return blister.transposeArray(b.listWorker ( { 
        maxMatch: optMaxMatch || undefined,
        listId: null,
        filters: makeFilterArgs (4, Array.slice(arguments))
      } ));

}
/**
  * return an exsiting or a new blister
  * @param {string} listName the name of the list to find it in
  * @param {options} options any options passed to the function
  * return {cBlister} the blister to use
  */
function blisterAssister ( listName,  options) {
  
  // the default place to look is in the scriptDB associated with this sheet. 
  // change it by either specifying a library name that blister knows about 
  // eg. options.library = "blister" (this is an optional param on all the custom functions)
  // or by passing some library scriptdb below
  // if you do not want to pass any scriptdbs, just delete the blisterPickScriptDb argument below, and it will only be able
  // to operate on the global blister list.
  options = options || {};
  // the library can prefix the listName
  var lib = listName.split (".");
  if (lib.length > 1) {
    listName = lib[1];
    options.library = lib[0];
  }
  
  return blister.blisterHelper (listName,  options ,  blisterPickScriptDb(options) );  
}
/**
 * return the scriptDB to pass to blister
 * @param {options} options any options passed to the function - here we are interested in options.library
 * return {null|scriptDBInstance} the scriptdb to use
 */
function blisterPickScriptDb(options) {
  
  // to use the library associated with this spreadsheet - options.library is blank
  // to use another library, options.library should be the name of a library (which needs to be known by this script)
  // to use the global blister library, options.library = "blister"
  
  if (options.library === 'blister' ) {
    // use global blister library - no action required - blister will take care of it
    return null;

  }
  else  {
    // here you need to find a way to pass the scriptdb of the given library.
    // by convention, I create a function in any library that needs to share its scriptdb as showMyScriptDb()
    try {
      return eval ( (options.library ? options.library + '.' : '' ) + 'showMyScriptDb')();
    }
    catch (e) {
      throw ("error " + e + " opening library " + options.library);
    }
  }

}
function makeFilterArgs (filterArgStartsAt, args) {
    var filterArgs;
    if (args.length > filterArgStartsAt) {
      filterArgs = [];
      for (  var i = filterArgStartsAt; i < args.length ; i += 2) {
       filterArgs.push( {listId:args[i], value:args[i+1] } );
      }
    }
    return filterArgs;
}


