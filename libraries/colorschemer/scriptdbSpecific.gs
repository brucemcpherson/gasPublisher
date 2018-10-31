//scriptdb specific
function getFromScriptDb(e) {
  return { results : 
            mcpher
              .scriptDbSilo("colorSchemes",publicStuffDb())
              .queryArray(makeQuery(e),e.parameter.limit) };
}
