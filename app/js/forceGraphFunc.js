// Todo: onclick node -> update wordlist to that subreddits ten most frequent/relevant words

svg = d3.select("#force");//.style("background-color", "blue");
let color = d3.scaleOrdinal(d3.schemeCategory20);

let widthFG = 1200;
let heightFG = 600;

d3.select("#forceCont")
  .select("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", "0 0 "+ widthFG + " " + heightFG);

let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("collide", d3.forceCollide()) // Add collion force for nodes
    .force("center", d3.forceCenter(widthFG / 2, heightFG / 2));

let brush = d3.select("#force")
      .call( d3.brush()                     // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [1228,593] ] )
            .on("start brush", updateChart)// initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateWordList)
      );

// Remove default fill from brush selection
brush.select(".selection")
    .attr("fill", "none")
    .attr("stroke-width", "3")
    .attr("stroke", "#dadada");


d3.json("data/data.json", function(error, graph) {
  if (error) throw error;

  let radius = function(d) { return d.size/600; };

  let link = d3.select("#force").append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  //Nodes
  let node = d3.select("#force").append("g")
      .attr("class", "nodes").lower()
      .selectAll("g")
      .data(graph.nodes)
      .enter().append("g")

  // Circles in nodes
  let circles = node.append("circle")
      .attr("r", radius)
      .attr("fill", function(d) { return color(d.group); })
      //.attr("fill-opacity", 0.4)
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
  /*
    // Ingen aning vad den här biten gör, men inte kompatibel med dynamiska radien
    let side = 2 * radius * Math.cos(Math.PI / 4),
        dx = radius - side / 2;

    let g = circles.append('g')
    .attr('transform', 'translate(' + [dx, dx] + ')');

    g.append("foreignObject")
        .attr("width", side)
        .attr("height", side)
        .append("xhtml:body")
        .html("Lorem ipsum dolor sit amet, ...");
    */

  let lables = node.append("text")
      .text(function(d) { return d.id; })
      .attr("fill", "black")
      .attr('text-anchor','middle')
      .attr('alignment-baseline','middle');

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  // Collision between nodes so they don't overlap each other
  simulation.force("collide").radius(radius);


  function ticked() {
    /*
    // Do not render lines between nodes
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    */

    node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
  }
});

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
      d3.json("data/data.json", function(error, graph) {
  if (error) throw error;

  document.getElementById('wordListTitle').innerHTML = 'Most relevant words for r/' + graph.nodes[0].id;

  let innerHTML = '';
  let firstIteration = true;
  let maxWidth,
      amountWidth,
      upWidth,
      downWidth;
  graph.nodes[0].words.forEach(wordObj => {

    if(firstIteration)
      {
        maxWidth = wordObj.score;
        firstIteration = false;
      }

    let upVotes = wordObj.score; //wordObj.upVotes;
    let downVotes = wordObj.score; //wordObj.downVotes;
    amountWidth = (wordObj.amount / maxWidth) * 100 /30; // /30 only temp
    upWidth = upVotes/100 * amountWidth;
    downWidth = downVotes/100 * amountWidth;

    innerHTML += '<li><h3 class="word">' + wordObj.word + '</h3><div class="stapelCont"><h3 class="occurrences" title="occurrences: '+ wordObj.amount +'">' + wordObj.amount + '</h3><div class="stapel"><span class="background"></span><span class="ups" title="upvotes: ' + upVotes + '%" style="width: ' + upWidth + '%">' + upVotes + '%</span><span class="downs" title="downvotes: ' + downVotes + '%" style="width: ' + downWidth + '%">' + downVotes + '%</span></div></div></li>';
  });

  document.getElementById("wordlist").innerHTML = innerHTML;
});
      return;
    }

    // Is the circle in the selection?
    isBrushed = extent[0][0] <= translate[0] && extent[1][0] >= translate[0] && // Check X coordinate
                extent[0][1] <= translate[1] && extent[1][1] >= translate[1] ; // And Y coordinate

    // Circle is green if in the selection, red otherwise (only for debugging purpose, see if correctly selected)
    if(isBrushed) {
      x.style.opacity = 1;
      //updateWordList(x);
      //console.log(e);
  let redditName = x.parentElement.childNodes[1].innerHTML;
  let innerHTML = '';
  let subreddits = '';
  document.getElementById('wordListTitle').innerHTML = 'Most relevant words for r/';
  document.getElementById("wordlist").innerHTML = '';
  d3.json("data/data.json", function(error, graph) {
    if (error) throw error;

    let selected = graph.nodes.find(subreddit => {

      if (subreddit.id == redditName) {
        subreddits += redditName;
        //console.log("found: " + redditName);
        //lägg in ord i lista

        let firstIteration = true;
        let maxWidth,
            amountWidth,
            upWidth,
            downWidth;
        subreddit.words.forEach(word => {
          //console.log(word);

          if(firstIteration) {
            maxWidth = word.score;
            firstIteration = false;
          }

          let upVotes = word.score; //wordObj.upVotes;
          let downVotes = word.score; //wordObj.downVotes;
          amountWidth = (word.amount / maxWidth) * 100 /30; // /30 only temp
          upWidth = upVotes/100 * amountWidth;
          downWidth = downVotes/100 * amountWidth;

          innerHTML += '<li><h3 class="word">' + word.word + '</h3><div class="stapelCont"><h3 class="occurrences" title="occurrences: '+ word.amount +'">' + word.amount + '</h3><div class="stapel"><span class="background"></span><span class="ups" title="upvotes: ' + upVotes + '%" style="width: ' + upWidth + '%">' + upVotes + '%</span><span class="downs" title="downvotes: ' + downVotes + '%" style="width: ' + downWidth + '%">' + downVotes + '%</span></div></div></li>';
        });
      };
    });
    document.getElementById('wordListTitle').innerHTML += subreddits + ' ';
    document.getElementById("wordlist").innerHTML += innerHTML;
  });
    }
    else
      x.style.opacity = 0.3;
  });
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
