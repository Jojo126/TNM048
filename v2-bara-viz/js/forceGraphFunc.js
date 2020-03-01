// Todo: onclick node -> update wordlist to that subreddits ten most frequent/relevant words

svg = d3.select("#force").style("background-color", "blue");
let color = d3.scaleOrdinal(d3.schemeCategory20);

let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(1200 / 2, 600 /2));

d3.select("#force")
      .call( d3.brush()                     // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [1228,593] ] )       // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      );

d3.json("data/miserables.json", function(error, graph) {
  if (error) throw error;
  
  let radius = function(d) { return d.size; };
    
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