
var document = CmdUtils.getDocument();

/* Load the RDFQuery library as a jQuery plugin */
CmdUtils.loadJQuery(function(jQuery) {
	var rdfQueryBase = "http://rdfquery.googlecode.com/svn/tags/v0.3/";
	CmdUtils.injectJavascript(rdfQueryBase + "jquery.uri.js");
	CmdUtils.injectJavascript(rdfQueryBase + "jquery.xmlns.js");
	CmdUtils.injectJavascript(rdfQueryBase + "jquery.curie.js");
	CmdUtils.injectJavascript(rdfQueryBase + "jquery.datatype.js");
	CmdUtils.injectJavascript(rdfQueryBase + "jquery.rdf.js");
	CmdUtils.injectJavascript(rdfQueryBase + "jquery.rdfa.js");
});

function buildRdfDatabank (data) 
{
  	var databank = jQuery.rdf.databank();
	CmdUtils.log("Created empty RDF databank");
	var rdfNS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
	// First create prefixes for the namespaces declared on the RDF element
	var rootAttrs = data.documentElement.attributes;
	var namespaces = {}
	for(i = 0; i < rootAttrs.length;i++) {
		if (rootAttrs[i].name.slice(0,6)=="xmlns:") {
			CmdUtils.log("Mapping namespace ", rootAttrs[i].localName,  " to URI ", rootAttrs[i].value);
			namespaces[rootAttrs[i].localName] = rootAttrs[i].value;
		}
	}
	var descriptions = data.documentElement.getElementsByTagNameNS(rdfNS, "Description");
	for (i = 0; i < descriptions.length; i++) {
		var d = descriptions[i];
		CmdUtils.log("Description:", d);
		var subjAttr = d.getAttributeNS(rdfNS, "about");
		CmdUtils.log(subjAttr);
		var subject = jQuery.rdf.resource('<' + subjAttr + '>');
		CmdUtils.log("Subject: ", subject);
		for (j = 0; j < d.childNodes.length; j++) {
			var childNode = d.childNodes[j];
			if (childNode.nodeType == 1) {
				var predicate = jQuery.rdf.resource(childNode.nodeName, { namespaces: namespaces});
				CmdUtils.log("  Predicate: ", predicate);
				if (childNode.hasAttributeNS(rdfNS, "resource")) {
					var o = jQuery.rdf.resource('<' + childNode.getAttributeNS(rdfNS, "resource") + '>');
					CmdUtils.log("    Object: ", o);
					databank.add(jQuery.rdf.triple(subject, predicate, o ));
				} else {
					var txt = jQuery(childNode).text().replace(/[\r\n]/g, '');
					var lit = jQuery.rdf.literal(txt, {datatype:"http://www.w3.org/2001/XMLSchema#string"});
					CmdUtils.log("    Object: ", lit);
					databank.add(jQuery.rdf.triple(subject, predicate, lit));
				}
			}
		}
	}
	CmdUtils.log("Created databank");
	return databank;
  };
  
function createItemsOverlay(rdf) {
	var document = CmdUtils.getDocument();
	jQuery('#rdfNav', document).remove();
	jQuery("body", document)
		.append('<div id="rdfNav"><ul id="rdfNavList"></ul></div>');
	
	createInstanceList(rdf, "People", 'http://s.opencalais.com/1/type/em/e/Person', 'rdfNavListPeople');
	createInstanceList(rdf, "Organizations", 'http://s.opencalais.com/1/type/em/e/Organization','rdfNavListOrganization');
	createInstanceList(rdf, "Countries", 'http://s.opencalais.com/1/type/er/Geo/Country', 'rdfNavListCountries');
	CmdUtils.injectCss("#rdfNav { position:absolute; top:0; left:0; width:150; height:100%; overflow:scroll-y; background-image:(url:file:///D:/projects/rdfq/ubiquity/ocbackground.png); background-repeat:repeat;font-family:Trebuchet MS, Verdana, Helvetica, sans-serif;font-size:11pt} #rdfNavList { margin:30px 10px;overflow:auto;z-index:2} .instanceList { margin: 10px 10px } .rdfInstance { font-size:.75em} .rdfDetected {font-weight:bold;color:red}");
	jQuery("#rdfNav", document).show();
  };

function createInstanceList(rdf, typeName, type, listName) {
	jQuery("#rdfNavList", document)
		.append("<li class='rdfType'>" + typeName + "<ul id='"+ listName + "' class='instanceList'></ul></li>");
	jQuery.rdf({databank:rdf})
		.prefix('pred', 'http://s.opencalais.com/1/pred/')
		.where('?person a <' + type + '>')
		.where('?person pred:name ?name')
		.each(function(){
			jQuery('#'+listName, document)
				.append("<li class='rdfInstance'><span about='" + this.person.uri + "' typeof='" + type + "' property='http://s.opencalais.com/1/pred/name'>" +  this.name.value + "</span></li>");
		});
	jQuery("#" + listName, document)
		.children()
		.mouseenter(function(){jQuery("span", this).css("font-weight", "bold")})
		.mouseleave(function(){jQuery("span", this).css("font-weight", "normal")});
};

function createInstanceSpans(rdf) {
	CmdUtils.log("createInstanceSpans");
	var incr = -39;
	var replace = CmdUtils.getHtmlSelection();
	jQuery.rdf({databank:rdf})
		.prefix('pred', 'http://s.opencalais.com/1/pred/')
		.where('?instance a <http://s.opencalais.com/1/type/sys/InstanceInfo>')
		.where('?instance pred:subject ?subject')
		.where('?instance pred:offset ?offset')
		.where('?instance pred:length ?length')
		.where('?instance pred:exact  ?exact')
		.each(function(){
			CmdUtils.log("Got an instance: " + this.instance.uri);
			CmdUtils.log("  incr: " + incr);
			CmdUtils.log("  offset: " + this.offset.value);
			CmdUtils.log("  length: "+ this.length.value);
			var offset= parseInt(this.offset.value);
			var length = parseInt(this.length.value);
			CmdUtils.log("Slicing from 0 to " + (offset + incr));
			var start = replace.slice(0, offset + incr);
			
			var spanStart = '<span class="rdfDetected" about="' + this.subject.uri + "'>";
			var content = replace.slice(offset + incr, length);
			var spanEnd = '</span>'
			var end = replace.slice(offset + incr + length);
			replace = start + spanStart + content + spanEnd + end;
			incr = incr + spanStart.length + spanEnd.length;
		});
	CmdUtils.log(replace);
	CmdUtils.setSelection(replace);
};

CmdUtils.CreateCommand({
	name: "open-calais-key",
	description: "Display / set the API key used to retrieve results from Open Calais",
	takes: {"apiKey": noun_arb_text},
	
	preview: function(pblock) {
		logins = CmdUtils.retrieveLogins("open-calais-api");
		if (logins.length == 0) {
			pblock.innerHTML="<p>No API key is currently stored. To set a key use the command 'open-calais-key <i>YourKey</i>";
		} else {
			pblock.innerHTML="<p>The key that will be used for Open Calais requests is: " + logins[0].password + "</p>";
		}
	},
	
	execute: function(apiKey) {
		if (apiKey) {
			CmdUtils.savePassword({
				name:"open-calais-api", 
				username:"open-calais-user", 
				password:apiKey.text});
			displayMessage("Open Calais key updated!");
		}
	}
});
	
CmdUtils.CreateCommand({
  name: "open-calais",
  
  _getCalaisParams : function(processingDirectives, userDirectives) {
    var paramsXml = '<c:params xmlns:c="http://s.opencalais.com/1/pred/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><c:processingDirectives  ';
    for(pd in processingDirectives) {
        CmdUtils.log(pd, processingDirectives[pd]);
        paramsXml = paramsXml + 'c:' + pd + '="' + processingDirectives[pd] + '" ';
    }
    paramsXml = paramsXml + "></c:processingDirectives><c:userDirectives ";
    for (ud in userDirectives) {
        CmdUtils.log(ud, userDirectives[ud]);
        paramsXml = paramsXml + 'c:' + ud + '="' + userDirectives[ud]+'" ';
    }
    paramsXml = paramsXml + "></c:userDirectives><c:externalMetadata></c:externalMetadata></c:params>";
    CmdUtils.log("ParamsXml: ", paramsXml);
    return paramsXml;
  },
  
  _getCalaisAjaxOptions: function(text, paramsXml) {
	var logins = CmdUtils.retrieveLogins("open-calais-api");
	if (logins.length > 0) {
		return {
			type :"POST",
			url : "http://api.opencalais.com/enlighten/rest/",
			data : { 
				licenseID: logins[0].password,
				content: text,
				paramsXML : paramsXml 
			}
		};
	}
	// TODO: else raise the alarm
  },

  
  
  _processCalaisResults: function( data, textStatus ) {
	try {
		CmdUtils.log("processCalaisResults");
		CmdUtils.log(this);
		var rdf = buildRdfDatabank(data);
		//createInstanceSpans(rdf);
		createItemsOverlay(rdf);
		// TODO: Find some way to display the entities that are extracted (sidebar ?)
		// TODO: Provide some way to add assertions about entities (simple text)
		// TODO: Post assertions to a server
		// TODO: Provide some way to connect side bar to page content
	} catch (e){
		CmdUtils.log("Exception in processCalaisResults: ",e.name, " ", e.message);
	}
  },
  
  _processCalaisError: function(request, textStatus, errorThrown) {
	displayMessage("Error retrieving entity information from OpenCalais: " + textStatus);
  },
  
  preview: function( pblock ) {
	var text = CmdUtils.getHtmlSelection();
	if (!text || text.length == 0) {
		pblock.innerHTML="<p>Create semantic annotations for the people, places and events described on this page.</p>"
	} else {
		pblock.innerHTML = "<p>Create semantic annotations for the people, places and events described in the selected text.</p>";
	}
	var logins = CmdUtils.retrieveLogins("open-calais-api");
	if (logins.length == 0) {
		pblock.innerHTML += "<div class='warning' style='background-color:#ddd;border: 2px red solid;color:red;padding:5px'>No Open Calais API key set. Use the command 'open-calais-key <i>your api key</i>' to provide your API key.</div>";
	}
  },
  
  execute: function() {
	text = CmdUtils.getHtmlSelection();
	/*
	if (!text || text.length == 0) {
		CmdUtils.log("Nothing selected. Using full page content instead");
		text = jQuery("body", CmdUtils.getDocument()).html();
	}
	*/
    CmdUtils.log("Body HTML is: ", text);
    var options = this._getCalaisAjaxOptions(text, this._getCalaisParams({
      contentType:"text/html",
      enableMetadataType:"true",
      outputFormat:"xml/rdf",
      caclulateRelevanceScore:false}, 
      { allowDistribution: true,
        allowSearch:true,
        externalID:"ubiq-open-calais",
        submitter:"kal@techquila.com"}));
    options["success"]=this._processCalaisResults;
	options["error"]=this._processCalaisError;
    options["dataType"]="xml";
	displayMessage("Sending " + Math.ceil(text.length / 1024) + "kB to Calais for processing.");
	jQuery.ajax(options);
  },


});
