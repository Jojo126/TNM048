// set the dimensions and margins of the graph
let margin = {top: 0, right: 0, bottom: 25, left: 40},
    width = 2400 / 2 - margin.left - margin.right,
    height = 100 / 2 - margin.top - margin.bottom;

// parse the date / time
let parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
let x = d3.scaleTime().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#time").style("background-color", "green")
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("data/data.csv", function(error, data) {
  if (error) throw error;

  // format the data
  data.forEach(function(d) {
      d.date = parseTime(d.date);
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.date; }));

  // Add the X Axis
  svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat("%Y-%m-%d")))
      .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

});