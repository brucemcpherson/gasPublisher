/* USE WITH CAUTION
 * will completely rewrite your site
 */
var FORREAL = false;
var STARTAT = "https://sites.google.com/a/mcpher.com/share/testplay";

function carefulWithThatAxeEugene() {

  // get the parameters for this site
  var options = cSiteStats.getOptions('ramblings');

  // this is the site i'm working with
  var site = SitesApp.getSite(options.domain, options.site);
  
  // get the template page
  var template = SitesApp.getPageByUrl(options.gadgetTemplate);
  var templateDocument = XmlService.parse(template.getHtmlContent());
  
  // if it exists, then find the div holding the template
  var elems = getElementByName (templateDocument.getRootElement(), options.gadgetTemplateDiv);
  if (!elems.length || elems.length > 1 ) throw 'could not find element ' + options.gadgetTemplateDiv ;
  var templateElement = elems[0];
     
  // get all the pages under the start point
  var pages = getPages(SitesApp.getPageByUrl(STARTAT));
  
  // convert to tood
  var tood = treeTo2d(pages);
  Logger.log(tood);
  
  tood.forEach (function(d) {
    var page = SitesApp.getPageByUrl(d.page.url);
    var doc = XmlService.parse(page.getHtmlContent());
    var head = doc.getRootElement();
    var xmls = getElementByName (head, options.gadgetTemplateDiv);
    var xml = xmls.length ? xmls[0] : null;
    var target = xml ? xml.getParentElement () : head;
    if (xml) {
      Logger.log( 'replacing existing div in ' + d.page.url);
    }
    else {
      Logger.log( 'adding div in ' + d.page.url);
    }
    cloneTree (templateElement, target);
  });
  
  function cloneTree (elementFrom, elementTo) {
    elementFrom.getChildren().forEach (function (e) {
      var t = elementTo.addContent (e.cloneContent());
      e.getChildren().forEach (function(d) {
        cloneTree (d,t);
      });
    });
    
  }
}

function getElementByName(element, name ) {  
  return element.getDescendants().filter(function (e) {
    var el = e.asElement();
    var en = el ? el.getAttribute("name") : null;
    return el && en && en.getValue() === name ? el : null;
  });  
}
 