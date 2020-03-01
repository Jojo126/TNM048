// Todo: create brush to filter out time/date

// Entire month
//let format = "%Y-%m-%d",
//    timeRange = [new Date("May 1, 2015 00:00:00"), new Date("May 31, 2015 00:00:00")];

// One day
let format = "%I:%M %p",
    timeRange = [new Date("May 30, 2015 00:00:00"), new Date("May 31, 2015 00:00:00")];

// set the dimensions and margins of the graph
let margin = {top: 0, right: 0, bottom: 25, left: 40},
    width = 2400 / 2 - margin.left - margin.right,
    height = 100 / 2 - margin.top - margin.bottom;

// set the ranges
let x = d3.scaleTime()
  .domain(timeRange)
  .range([0, 1150]);

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#time").style("background-color", "green")
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Add the X Axis
  svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat(format)))
      .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");