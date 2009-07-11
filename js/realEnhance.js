
function createList(topic) {
	safeLog("createList " + topic);
  var rdf = $('body').rdf();
  rdf.prefix('s', 'http://s.opencalais.com/1/type/em/e/');
  rdf.prefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#'); 
  var uniqueNames = new Object();
  var names = rdf.where("?country a s:"+topic)
	.where("?country rdfs:label ?label")
	.filter(function() { return (!this.label.datatype) }) // Removing XMLLiterals - ?
	.map(function() { return this.label.value; })
	.filter(function() { var exists = uniqueNames[this] == "true"; uniqueNames[this] = "true"; return !exists; });

  var h = "<div class='metatribble-title'>"+topic+"</div><ul>";
  names.each(function() { h = h + "<li>"+this+"</li>"; });
  h = h + "</ul>";

	if (!$('#mti_' + topic).length) {
  	var infoBox = document.createElement("div");
  	infoBox.setAttribute("class", "metatribble-infobox");
  	infoBox.setAttribute("id", "mti_" + topic);
	  $("#metatribble-infoboxes").append(infoBox);
  }
	$('#mti_'+topic).html(h);
}


function createInfoboxes() {
	if (!$("#metatribble-infoboxes").length) {
		var infoBoxes = document.createElement("div");
		infoBoxes.setAttribute("id", "metatribble-infoboxes");
		$("body").append(infoBoxes);
		$("#metatribble-infoboxes").draggable({
			handle: '.metatribble-title'
		});
	}
	/* Trying to find a better way to determine what info boxes to show
	 * One thought is to find all types in the RDF and then check their 
	 * URI against an internal map that tells you which info box they go into 
	 */
	/*
	var rdf = $('body').rdf();
	var uniqueTypes = new Object();
	var types = rdf.where('?inst a ?type').filter(function(){console.log(this); var exists = uniqueTypes[this.type]=="true"; uniqueTypes[this.type]="true"; return !exists;});
	types.each(function(){console.log("Found a type: " + this)});
	*/
  var list = ["Country","City","Person"];
  jQuery.each(list, function() { createList(this); });

  var bindingMap = new Object();
  jQuery.each(actions, function() { bindingMap[""+this.id] = this.fn; });
  jQuery.each(list, function() { createMenu(this, bindingMap); });
}

function createMenu(name, bindingMap) {
  name = ""+name;
  var menuName = name+"Menu"; 

  var menu = document.createElement("div");
  menu.setAttribute("class", "contextMenu");
  menu.setAttribute("id", menuName);

  var listItems = actions.filter(function(t) { return t.types.indexOf(name) != -1; }).map( function(t) { return "<li id='"+t.id+"'>"+t.name+"</li>"; })
  menu.innerHTML = "<ul>"+listItems.join("")+"</ul>";
  
  $("body").append(menu);
  $("#mti_"+name+" li").contextMenu(menuName,  { bindings: bindingMap });
}

function logAllTriples() {
  var rdf = $('body').rdf();
  rdf.where("?s ?p ?o").each(function() { console.log("Woo "+this.s+" and "+this.p+" and "+this.o); })
}

var actions = [ 
	{ 
		name : "Wikipedia", 
		id : "wikipedia", 
		types : ["Country","City","Person"],
		fn : function(t) { var url = "http://en.wikipedia.org/wiki/"+t.innerHTML; window.location.href = url; }
	},
	{
		name: "Google maps",
		id: "googleMap",
		types: ["Country","City"],
        	fn: function(t) { var url = "http://en.wikipedia.org/wiki/"+t.innerHTML; window.location.href = url; }
	}
];



