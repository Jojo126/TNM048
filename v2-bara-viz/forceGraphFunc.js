svg = d3.select("svg"),
width = +svg.attr("width"),
height = +svg.attr("height");

let color = d3.scaleOrdinal(d3.schemeCategory20);

let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("miserables.json", function(error, graph) {
  if (error) throw error;

  const radius = 50;
    
  let link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  //Nodes
  let node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g")
    
  // Circles in nodes
  let circles = node.append("circle")
      .attr("r", radius)
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
    
    let side = 2 * radius * Math.cos(Math.PI / 4),
        dx = radius - side / 2;
    
    let g = circles.append('g')
    .attr('transform', 'translate(' + [dx, dx] + ')');

    g.append("foreignObject")
        .attr("width", side)
        .attr("height", side)
        .append("xhtml:body")
        .html("Lorem ipsum dolor sit amet, ...");
    
    
  let lables = node.append("text")
      .text(function(d) { return d.id; })
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
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

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