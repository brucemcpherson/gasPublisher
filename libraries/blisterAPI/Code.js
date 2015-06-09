// Handle rest calls to custom blister queries
function doGet(e) {

       return ContentService
            .createTextOutput(JSON.stringify(handleCalls(e)))
            .setMimeType(ContentService.MimeType.JSON); ;     

}


function handleCalls(e) {
  //example ?func=blisterList&listName=blister.airlines&listId=name&filters=carrier,UA
  // emulate what the custom function would pass
 
  var p = e.parameter, 
      fun = p.func, 
      sortId = p.sortId || null, 
      sortDescending = p.sortDescending || null,
      maxMatch = p.maxMatch || null,
      listId = p.listId || null,
      idx = p.idx || null, 
      value = p.value || null, 
      listName = p.listName || null,
      returnListId = p.returnListId || null,
      library=p.library|| null,
      filters = p.filters ? p.filters.split(",") : null;
  
  if (fun != 'blisterDirectory' && !listName) throw ("you must provide a listName");
  
  switch (fun) {
    case 'blisterData':
      return blisterData.apply(null, stackArguments(filters,listName, sortId, sortDescending, maxMatch));
     
    case 'blisterList': 
      return blisterList.apply(null, stackArguments(filters,listName, listId, sortId, sortDescending, maxMatch));       
      
    case 'blisterIndex':
      return blisterIndex.apply(null, stackArguments(filters, listName, idx, listId, sortId, sortDescending)); 
   
    case 'blisterMatch':
      return blisterMatch.apply(null, stackArguments( filters,listName, value, listId, sortId, sortDescending, maxMatch));

    case 'blisterLookup':
      return blisterLookup.apply(null, stackArguments(filters, listName, value, listId, returnListId, sortId, sortDescending, maxMatch));
      
    case 'blisterUnique':
      return blisterUnique.apply(null, stackArguments( filters,listName,  listId, sortId, sortDescending, maxMatch));

    case 'blisterHeaders':
      return blisterHeaders.apply(null, stackArguments(filters, listName,  listId));
      
    case 'blisterDescription':
      return blisterDescription.apply(null,stackArguments(filters, listName));

    case 'blisterUpdateDate':
      return blisterUpdateDate.apply(null,stackArguments(filters, listName));
      
    case 'blisterDirectory':
      return blisterDirectory.apply(null,stackArguments(filters,library));

    default:
      throw (fun + ' is not a valid blister function (remember it is case sensitive)');
  }

}
// kind of funky since we need to create a paramarray of optional arguments for filters
function stackArguments () {
  // the first arg is the array to tag on at end - the rest are the arguments
  var a = Array.slice(arguments);
  // these are the regular arguments
  var b = a.slice(1);
  // these are the optional filter ones
  if (a[0]) {
    for (var i=0;i<a[0].length;i++) b.push(a[0][i]);
  }
  return b;
}


