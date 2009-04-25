
// Useful while debugging interactively to dump the value to a visible variable
var myrdf = "asd";
var myresults = "someresults";

function doAlertStuff() { alert("Woo"); }

function processCalaisResults(results) {
  try {
  console.log("Received response from Calais");
  var rdf = parseRdf(results);
  console.log("Extracting instances from parsed RDF");
  var instances = extractInstances(rdf);
  console.log("Creating RDFa in page");
  createInstanceSpans(instances, rdf);

  console.log("Creating infoboxes");
  createInfoboxes();
  } catch(e) {
     console.log("Failed to load databank with "+e);
  }
}

// Callback function for sendToCalais
function parseRdf(results) {
//   var xmlString = new XMLSerializer().serializeToString(results);
  var xmlString = results;
  myresults = results;
  console.log("Parsing RDF");
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlString, 'text/xml');
  console.log("Loading databank");
  var databank = $.rdf.databank();
  databank.load(doc);
  var triples = databank.triples();

  console.log("Setting up RDF object");
  var rdf = $.rdf({triples: databank.triples(), namespaces: databank.namespaces}); 
  rdf.prefix("sys","http://s.opencalais.com/1/type/sys/");
  rdf.prefix("c","http://s.opencalais.com/1/pred/");
  rdf.prefix("rdf","http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  // Useful for debugging
  myrdf = rdf;
  console.log("Done setting up RDF");
  return rdf;
}

// Get a list of JavaScript objects for each instance out of the databank created by parseRdf
function extractInstances(rdf) {
  var instanceIds = rdf.where("?instanceId a sys:InstanceInfo").map(function() { return this.instanceId; } );
  var instances = instanceIds.map( function(n, val) { return toJsObj(rdf.where(val+" ?pred ?obj").select()); });
  return instances;
}

/** 
 Turn a list of ?pred / ?obj entries from a where query into a single object,
 with keys taken from the predicates and values from the objects. e.g. for Calais
 instances, create an object for which instance.suffix and instance.type work.
 ... is no longer actually doing anything of real use...
*/
function toJsObj(listFromSelect) {
  var newObj = new Object();
  jQuery.each(listFromSelect,function() { 
	var key = ident(this.pred.value.toString());
	var value = this.obj;
	newObj[key] = value; 
  });
  return newObj;
}

function ident(s) { return s.substring( Math.max(s.lastIndexOf("#"), s.lastIndexOf("/"))+1 ); }

function createInstanceSpans(instances, rdf) {
  var ins = jQuery.makeArray(instances);
  addNamespaces();
  // ins.sort(function(a,b) { return b.offset.value-a.offset.value; });
  jQuery.each(ins, function() {	
	var itemType = rdf.where(this.subject+" rdf:type ?type").map(function() { return this.type; })[0]
	wrapWithSpan(this.exact.value, itemType);
  });
}

function addNamespaces() {
  $('html').xmlns('',"http://www.w3.org/1999/xhtml")
	.xmlns('rdfs', "http://www.w3.org/2000/01/rdf-schema#")
	.xmlns("s","http://s.opencalais.com/1/type/em/e/");
}

function trigger() {
   sendToCalais(document.getSelection(), processCalaisResults );
}

// For use outside Ubiquity - when testing directly from browser
function sendToCalais(text, successFn) {
   netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");

   // @todo the RDF/XML parser in rdfquery can't cope with " inside literals...
   text = text.replace(/"/g,"'")

   var paramsXml = '<c:params xmlns:c="http://s.opencalais.com/1/pred/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><c:processingDirectives c:contentType="text/html" c:enableMetadataType="true" c:outputFormat="xml/rdf" c:calculateRelevanceScore="false" ></c:processingDirectives><c:userDirectives c:allowDistribution="true" c:allowSearch="true" c:externalID="ubiq-open-calais" c:submitter="kal@techquila.com" ></c:userDirectives><c:externalMetadata></c:externalMetadata></c:params>';

   // Inigo's API key
   var apiKey = "jvpw9x8322eyczgkznhacyua";
   var options = {
			type :"POST",
			url : "http://api.opencalais.com/enlighten/rest/",
			data : { 
				licenseID: apiKey,
				content: text,
				paramsXML : paramsXml 
			},
			dataType : "xml",
			success : successFn
		};

	jQuery.ajax(options);
}

function wrapWithSpan(text, type) {
   var located = locateTextInNode($("body"), text);
   if (located==null) {
	return;
   }
   var range = document.createRange();
   range.setStart(located.node[0], located.offset);
   range.setEnd(located.node[0], located.offset + text.length);
   var span = document.createElement('span');
   span.setAttribute("class","metatribble-rdfa");
   var typeQname = "s:"+ident(type.value.toString());
   span.setAttribute("typeof",typeQname);
   span.setAttribute("property","rdfs:label");
   range.surroundContents(span);
}

/** Taken from Jeni's demo code - find a bit of text. Should pay more attention to word breaks. */
function  locateTextInNode(node, text) {
      var i = 0, 
        location = null, 
        children = node.contents(),
        offset = -1;
      if (children.length > 0) {
        while (location === null && i < children.length) {
          location = locateTextInNode($(children[i]), text);
          i += 1;
        }
        return location;
      } else {
        if (node[0].nodeValue !== null) {
          offset = node[0].nodeValue.indexOf(text);
        }
        return offset === -1 ? null : { node: node, offset: offset };
      }
    }




