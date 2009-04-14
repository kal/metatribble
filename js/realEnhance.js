
function createList(topic) {
  var rdf = $('body').rdf();
  rdf.prefix('s', 'http://s.opencalais.com/1/type/em/e/');
  rdf.prefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#'); 
  var names = rdf.where("?country a s:"+topic)
	.where("?country rdfs:label ?label")
	.filter(function() { return (!this.label.datatype) }) // Removing XMLLiterals - ?
	.map(function() { return this.label.value; });

  var h = "<div class='metatribble-title'>"+topic+"</div><ul>";
  names.each(function() { h = h + "<li>"+this+"</li>"; });
  h = h + "</ul>";

  var infoBox = document.createElement("div");
  infoBox.setAttribute("class","metatribble-infobox");
  infoBox.innerHTML = h;
  $("#metatribble-infoboxes").append(infoBox);
}


function createInfoboxes() {
  var infoBoxes = document.createElement("div");
  infoBoxes.setAttribute("id","metatribble-infoboxes");
  $("body").append(infoBoxes);
  $("#metatribble-infoboxes").draggable({ handle: '.metatribble-title' });

  createList("Country");
  createList("City");
  createList("Person");
}



function logAllTriples() {
  var rdf = $('body').rdf();
  rdf.where("?s ?p ?o").each(function() { console.log("Woo "+this.s+" and "+this.p+" and "+this.o); })
}

