(function() {
	var body = document.body;
	var head = document.getElementsByTagName("head")[0];
	var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

	/* Retrieving the word list from github */
	var decode = function (str) {
		var output = "", buffer = "", bits = 8;
		for (var i = 0; i < str.length; ++i) {
			var chr = str.charAt(i);
			if (chr == "=") break;
			if (chr == "\n") continue;
			var chrBinary = charSet.indexOf(chr).toString(2);
			buffer += ("000000"+chrBinary).slice(-6);
			while (buffer.length >= bits) {
				var octet = buffer.slice(0, bits);
				buffer = buffer.slice(bits);
				output += String.fromCharCode(parseInt(octet, 2));
			}
		}
		return output;
	};
	/* It's a shame we have to use JSONP, but CORS is only on for some domains on github */
	window._processJargoneWords = function(response) {
		var data = decode(response.data.content).split("\n");
		var jargon = {};
		for (var i = 0; i < data.length; ++i) {
			var line = data[i].split("\t");
			jargon[line[0]] = line[1];
		}
		highlightJargon(jargon);
	};

	var scriptTag = document.createElement('script');
	scriptTag.src = "https://api.github.com/repos/kybernetikos/jargone/contents/jargonlist.txt?callback=_processJargoneWords";
	head.appendChild(scriptTag);

	/* Define the css classes */
	var css = document.createElement("style");
	css.type = "text/css";
	css.textContent = ".jargonehighlight { background-color: #FFFF88 !important; color: black; } .jargonehasnotes { cursor: help; border-bottom:1px dashed !important; } #jargonepopup { position: fixed; z-index: 1000 !important; visibility: hidden; background-color: #FFFFCC; color: black; border: solid silver 1px; margin: 5px; padding: 6px;} ";
	head.appendChild(css);

	/* create the popup */
	var popup = document.createElement("div");
	popup.id = "jargonepopup";
	body.appendChild(popup);

	function clearPopup() {
		popup.style.visibility = 'hidden';
		popup.innerHTML = '';
	}
	function showPopup(notes, event) {
		event = event || window.event;
		if (event.stopPropagation) { event.stopPropagation(); } else { event.cancelBubble = true; }
		if (notes != null) {
			popup.innerHTML = notes;
			popup.style.left = this.getBoundingClientRect().left + 'px';
			popup.style.top = this.getBoundingClientRect().top + 20 + 'px';
			popup.style.visibility = 'visible';
		} else {
			clearPopup();
		}
	}

	if (body.addEventListener) {
		body.addEventListener('mousedown', clearPopup, false);
		body.addEventListener('scroll', clearPopup, false);
	} else {
		body.attachEvent('onmousedown', clearPopup);
		body.attachEvent('onscroll', clearPopup);
	}

	/* highlight the jargon */
	function evaluateXPath(aNode, aExpr, process) {
		var result = document.evaluate(aExpr, aNode, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0; i < result.snapshotLength; ++i) {
			process(result.snapshotItem(i));
		}
	}

	var xpathQuery = "//text()[" +
		['html','head','style','title','link','meta','script','object','iframe'].map(function(tag){return "not(parent::"+tag+")";}).join(" and ") +
		"]";

	function highlightJargon(jargon) {
		evaluateXPath(body, xpathQuery, function(textNode) {
			var re = new RegExp("\\b("+Object.keys(jargon).join("|")+")\\b", "gi");
			var parent = textNode.parentNode;
			textNode.textContent.split(re).map(function(text, index) {
				if (index % 2 == 1) {
					var span = document.createElement('span');
					span.className = 'jargonehighlight';
					var note = jargon[text.toLowerCase()];
					if (typeof note == 'string') {
						span.className += " jargonehasnotes";
						span.onmousedown = showPopup.bind(span, note);
					}
					span.appendChild(document.createTextNode(text));
					return span;
				} else {
					return document.createTextNode(text);
				}
			}).forEach(function(child) {parent.insertBefore(child, textNode);});
			parent.removeChild(textNode);
		});
	}
})();