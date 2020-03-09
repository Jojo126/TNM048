if(typeof d3v4 == "undefined") d3v4 = d3;

svg = d3.select("#force");
let color = d3.scaleOrdinal(d3.schemeCategory20);

// Set width/height for viewbox of force graph
let widthFG = 1365;
let heightFG = 722;

d3.select("#forceCont")
  .select("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", "0 0 "+ widthFG + " " + heightFG);

// Create simulation for graph
let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("collide", d3.forceCollide()) // Add collion force for nodes
    .force("center", d3.forceCenter(widthFG / 2, heightFG / 2));

// Need these in order to zoom to work
let gMain = svg;
let gDraw = gMain.append("g");

let zoom = d3v4.zoom()
                // Filter => specify zoom/panning buttons (mouse wheel for zoom,
                // left-click/middle mouse button for panning
                .filter(function() {return !event.button || event.type !== 'wheel'})
                .on("zoom", function () {
                  gDraw.attr("transform", d3v4.event.transform);
               });
gMain.call(zoom);

d3.json("data/data.json", function(error, graph) {
  if (error) throw error;

  // For the brushing
  let gBrushHolder = gDraw.append("g");
  let gBrush = null;

  // Circle sizes
  let radius = function(d) { return d.size/600; };

  // Links between nodes
  let link = gDraw.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  //Nodes
  let node = gDraw.append("g")
      .attr("class", "nodes").lower()
      .selectAll("g")
      .data(graph.nodes)
      .enter().append("g")

  // Circles in nodes
  let circles = node.append("circle")
      .attr("r", radius)
      .attr("fill", function(d) { return color(d.group); })
      .attr("id", function(d) { return d.id; })
      .call(d3v4.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  // Node names
  let lables = node.append("text")
      .text(function(d) { return 'r/' + d.id; })
      .attr("fill", "black")
      .attr('text-anchor','middle')
      .attr('alignment-baseline','middle');

  node.append("title")
      .text(function(d) { return 'r/' + d.id; });

  // Connect move-ability of nodes to simulation
  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  // Add links to simulation
  simulation.force("link")
      .links(graph.links);

  // Collision between nodes so they don't overlap each other
  simulation.force("collide").radius(radius);

  // Move-abiliy for nodes
  function ticked() {
    node.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
  }

  // Brush settings
  let brushMode = false;
  let brushing = false;

  let brush = d3v4.brush()
                  .on("start", brushstarted)
                  .on("brush", brushed)
                  .on("end", brushended);


  function brushstarted() {
    brushing = true;
    updateChart();
    node.each(function(d) {
      d.previouslySelected = shiftKey && d.selected;
    });
  }

  function brushed() {
    if(!d3v4.event.sourceEvent) return;
    if(!d3v4.event.selection) return;

    updateChart();

    let extent = d3v4.event.selection;
    node.classed("selected", function(d) {
      return d.selected = d.previouslySelected ^
             (extent[0][0] <= d.x && d.x < extent[1][0]
             && extent[0][1] <= d.y && d.y < extent[1][1]);
    });
  }

  function brushended() {
    if(!d3v4.event.sourceEvent) return;
    if(!d3v4.event.selection) return;
    if(!gBrush) return;

    gBrush.call(brush.move, null);

    updateWordList();

    if(!brushMode) {
      gBrush.remove();
      gBrush = null;
    }
    brushing = false;
  }

  // Select one node
  node.on("click", d => {
    d3.event.preventDefault();

    // Set correct opacity on nodes
    d3.selectAll("circle").nodes().map(x => {
        x.style.opacity = 0.3;
        if(x.id == d.id) x.style.opacity = 1;
    });

    // Reset node selection
    node.each(function(p) {
      p.selected = false;
      p.previouslySelected = false;
    });
    node.classed("selected", false);

    // Update wordlist
    document.getElementById('wordListTitle').innerHTML = 'Most relevant words for ';
    document.getElementById("wordlist").innerHTML = '';
    
    let maxScore = 0,
      minScore = 0;
    d.words.forEach(wordObj => {

      if (maxScore < wordObj.score)
        maxScore = wordObj.score;
      if (minScore > wordObj.score)
        minScore = wordObj.score;      
    });
      
    let innerHTML = '';
    let amountWidth,
        largestScore;
    d.words.forEach(wordObj => {

      (maxScore*maxScore > minScore*minScore) ? largestScore = maxScore : largestScore = minScore;
      amountWidth = (100 / largestScore) * 100/2;
    
      let score = wordObj.score;
      scoreWidth = score/100 * amountWidth;

      //Render list
      innerHTML += '<li><h3 class="word">' + wordObj.word + '</h3><div class="stapelCont"><h3 class="occurrences" title="occurrences: '+ wordObj.amount +'">' + wordObj.amount + '</h3><div class="stapel"><span class="background"></span>';
      // If positive score -> green span to left, otherwise red span to the right
      if (score >= 0) {
        innerHTML += '<span class="ups" title="score: ' + score + '" style="width: ' + scoreWidth + '%">' + score + '</span>';
      } else {
        innerHTML += '<span class="downs" title="score: ' + score + '" style="width: ' + -1*scoreWidth + '%; left: calc(50% - ' + -2*scoreWidth + 'px)">' + score + '</span>';
      }
      // Ending of component
      innerHTML += '</div></div></li>';
    });
    document.getElementById('wordListTitle').innerHTML += 'r/' + d.id + ' ';
    document.getElementById("wordlist").innerHTML += innerHTML;

  });

  // Add event listener on shift-holding for brushing
  d3v4.select("body").on("keydown", keydown);
  d3v4.select("body").on("keyup", keyup);

  let shiftKey;

  // When shift is down activate the brush
  function keydown() {
    shiftKey = d3v4.event.shiftKey;
    if(shiftKey) {
      if(gBrush) return;
      brushMode = true;
      if(!gBrush) {
        gBrush = gBrushHolder.append("g");
        gBrush.call(brush);
      }
    }
  }

// When releasing shift deactivate the brush
  function keyup() {
    shiftKey = false;
    brushMode = false;
    if(!gBrush) return;
    if(!brushing) {
      gBrush.remove();
      gBrush = null;
    }
  }

  // Right-click to cancel selection/brushing
  svg.on("contextmenu", function() {
    d3.event.preventDefault();
    d3.selectAll("circle").nodes().map(x => {
        x.style.opacity = 1;
    });
    wordsOfReddit(graph);
    keyup();
  });

});

// Drag functions of nodes
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function updateWordList() {
	
  let selectedSubreddits = [];
  
  //Loop through every node
  let circle = d3.selectAll("circle").nodes().map(x => {

    let transform = x.parentNode.getAttribute("transform");
    let translate = transform.substring(transform.indexOf("(")+1, transform.indexOf(")")).split(",");

    // Get the selection coordinate
    extent = d3.event.selection;

    // Check if brush not used
    const selection = d3.event.selection;
    if (selection === null) {
      document.getElementById('wordListTitle').innerHTML = 'No subreddit selected';
      document.getElementById("wordlist").innerHTML = '';
    }

    // Is the circle in the selection?
    isBrushed = extent[0][0] <= translate[0] && extent[1][0] >= translate[0] && // Check X coordinate
                extent[0][1] <= translate[1] && extent[1][1] >= translate[1] ; // And Y coordinate

    // Circle is green if in the selection, red otherwise (only for debugging purpose, see if correctly selected)
    if(isBrushed) {
      x.style.opacity = 1;

      let redditName = x.parentElement.childNodes[1].innerHTML.substring(2);
      selectedSubreddits.push(redditName);
    }
    else
      x.style.opacity = 0.3;
  });
  
  makeCorsRequest('http://127.0.0.1:5000/get-wordlist', selectedSubreddits.join(" "));
}

// Create the XHR object.
function createCORSRequest(method, url) {
  let xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
	// XHR for Chrome/Firefox/Opera/Safari.
	xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
	// XDomainRequest for IE.
	xhr = new XDomainRequest();
	xhr.open(method, url);
  } else {
	// CORS not supported.
	xhr = null;
  }
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(url, selectedSubreddits) {
  let xhr = createCORSRequest('POST', url);
  if (!xhr) {
	alert('CORS not supported');
	return;
  }

  // Response handlers.
  xhr.onload = function() {
	wordList = JSON.parse(xhr.responseText);
	
	document.getElementById('wordListTitle').innerHTML = 'Most relevant words for ';
	document.getElementById("wordlist").innerHTML = '';
	let innerHTML = "";
	
	let maxScore = 0,
      minScore = 0;
    wordList.forEach(wordObj => {

      if (maxScore < wordObj.score)
        maxScore = wordObj.score;
      if (minScore > wordObj.score)
        minScore = wordObj.score;      
    });
      
    let amountWidth,
        largestScore;
    wordList.forEach(wordObj => {

      (maxScore*maxScore > minScore*minScore) ? largestScore = maxScore : largestScore = minScore;
      amountWidth = (100 / largestScore) * 100/2;
    
      let score = wordObj.score;
      scoreWidth = score/100 * amountWidth;

		//Render list
		innerHTML += '<li><h3 class="word">' + wordObj.word + '</h3><div class="stapelCont"><h3 class="occurrences" title="occurrences: '+ wordObj.amount +'">' + wordObj.amount + '</h3><div class="stapel"><span class="background"></span>';
		// If positive score -> green span to left, otherwise red span to the right
		if (score >= 0) {
			innerHTML += '<span class="ups" title="score: ' + score + '" style="width: ' + scoreWidth + '%">' + score + '</span>';
		} else {
			innerHTML += '<span class="downs" title="score: ' + score + '" style="width: ' + -1*scoreWidth + '%; left: calc(50% - ' + -2*scoreWidth + 'px)">' + score + '</span>';
		}
		// Ending of component
		innerHTML += '</div></div></li>';
	});
	let titles = selectedSubreddits.split(" ");
    
    titles.forEach(title => {
      document.getElementById('wordListTitle').innerHTML += 'r/' + title + ' ';
    });
    document.getElementById("wordlist").innerHTML += innerHTML;
  };

  xhr.onerror = function() {
	alert('Woops, there was an error making the request.');
  };

  xhr.send(selectedSubreddits);
}

function updateChart() {
  //Loop through every node
  let circle = d3.selectAll("circle").nodes().map(x => {

    let transform = x.parentNode.getAttribute("transform");
    let translate = transform.substring(transform.indexOf("(")+1, transform.indexOf(")")).split(",");

    // Get the selection coordinate
    extent = d3.event.selection;

    // Check if brush not used
    const selection = d3.event.selection;
    if (selection === null) {
      x.style.opacity = 1;
      return;
    }

    // Is the circle in the selection?
    isBrushed = extent[0][0] <= translate[0] && extent[1][0] >= translate[0] && // Check X coordinate
                extent[0][1] <= translate[1] && extent[1][1] >= translate[1] ; // And Y coordinate

    // Circle is green if in the selection, red otherwise (only for debugging purpose, see if correctly selected)
    if(isBrushed) {
      x.style.opacity = 1;
    }
    else
      x.style.opacity = 0.3;
  });
}
