CmdUtils.CreateCommand({
    name: "dev-open-calais-key",
    description: "Display / set the API key used to retrieve results from Open Calais",
    takes: {"apiKey": noun_arb_text},
    
    preview: function(pblock) {
        logins = CmdUtils.retrieveLogins("open-calais-api");
        if (logins.length == 0) {
            pblock.innerHTML="<p>No API key is currently stored. To set a key use the command 'open-calais-key <i>YourKey</i></p>";
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
  name: "dev-metatribble",
  description: "Create semantic annotations for the people, places and events described on this page.",
  
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
  
  getScriptsLoadedCount : function() {
    return CmdUtils.getDocument().metatribbleScriptsLoadedCount || 0;
  },
 
  incrementScriptsLoaded : function() {
    var doc = CmdUtils.getDocument();
    if (! doc.metatribbleScriptsLoadedCount) {
      doc.metatribbleScriptsLoadedCount = 1;     
    } else {
      doc.metatribbleScriptsLoadedCount++;
    }
  },
  
  scriptsLoadedExpected : 11,

  checkAllScriptsLoaded: function(commandContext) {
    commandContext.incrementScriptsLoaded();
    CmdUtils.log("Waiting for scripts to load: currently "+commandContext.getScriptsLoadedCount()+" but expecting "+commandContext.scriptsLoadedExpected);
    if (commandContext.getScriptsLoadedCount() >= commandContext.scriptsLoadedExpected) {
       CmdUtils.log("All scripts have now loaded!");
       commandContext.allScriptsLoaded();
    }
  },
  
  allScriptsLoaded: function() {
    text = CmdUtils.getHtmlSelection();
    text = text.replace(/"/g,"'")

    var options = this._getCalaisAjaxOptions(text, this._getCalaisParams({
      contentType:"text/html",
      enableMetadataType:"true",
      outputFormat:"xml/rdf",
      calculateRelevanceScore:false},
      { allowDistribution: true,
        allowSearch:true,
        externalID:"ubiq-open-calais",
        submitter:"kal@techquila.com"}));
    // We can't inject rdfquery into the Ubiquity sandbox, so instead call out to a function
    // using rdfquery that's been loaded into the browser's context
    options["success"] =  CmdUtils.getWindowInsecure().processCalaisResults;
    options["error"] = this._processCalaisError;
    options["dataType"]="text";
    displayMessage("Sending " + Math.ceil(text.length / 1024) + "kB to Calais for processing.");
    jQuery.ajax(options);
  },
  
  setupJavaScript: function() {
      this.addScriptToHead("http://jqueryjs.googlecode.com/files/jquery-1.3.2.js");
      // rdfquery code
      var rdfQueryBase = "http://rdfquery.googlecode.com/svn/trunk/";
      this.addScriptToHead(rdfQueryBase + "jquery.uri.js");
      this.addScriptToHead(rdfQueryBase + "jquery.xmlns.js");
      this.addScriptToHead(rdfQueryBase + "jquery.curie.js");
      this.addScriptToHead(rdfQueryBase + "jquery.datatype.js");
      this.addScriptToHead(rdfQueryBase + "jquery.rdf.js");
      this.addScriptToHead(rdfQueryBase + "jquery.rdfa.js");
      // Used by realEnhance to make fields draggable
      this.addScriptToHead("http://jqueryui.com/latest/ui/ui.core.js");
      this.addScriptToHead("http://jqueryui.com/latest/ui/ui.draggable.js");

      //var metatribbleBase = "http://localhost/~inigosurguy/mt/metatribble/js/";
	  var metatribbleBase = "http://localhost/metatribble/js/";
      //var metatribbleBase = "http://github.com/kal/metatribble/raw/master/js/";
      this.addScriptToHead(metatribbleBase+"enhance.js");
      this.addScriptToHead(metatribbleBase+"realEnhance.js");
    
      this.addStyleToHead(metatribbleBase+"metatribble.css");
  },
    
  addScriptToHead: function(src) {
    var o = this;
    CmdUtils.injectJavascript(src, function() { o.checkAllScriptsLoaded(o); } );
  },
    
  addStyleToHead: function(src) {     
    var document = CmdUtils.getDocument();
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = src;
    document.getElementsByTagName('head')[0].appendChild(link);
  },

  execute: function() {
    try {
      CmdUtils.log("Adding JavaScript");
      if (this.getScriptsLoadedCount() >= this.scriptsLoadedExpected) {
        CmdUtils.log("All scripts are already loaded!");
        this.allScriptsLoaded();
      } else {
        this.setupJavaScript();
        CmdUtils.log("Waiting for JavaScript to load");
      }
    } catch(error) {
        CmdUtils.log("Failed with "+error);
    }
  }


});

