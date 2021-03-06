// Entire month
//let format = "%Y-%m-%d",
//    timeRange = [new Date("May 1, 2015 00:00:00"), new Date("May 31, 2015 00:00:00")];

let format = "%H:%M",
    timeRange = [new Date("May 30, 2015 00:00:00"), new Date("May 31, 2015 00:00:00")];

// set the dimensions and margins of the graph
// bottom: 25 for dates
let margin = {top: 0, right: 0, bottom: 10, left: 0},
    width = 0.7 * window.innerWidth,
    height = 50 - margin.top - margin.bottom;

// set the ranges
let x = d3.scaleTime()
  .domain(timeRange)
  .range([40, width]);

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#time")//.style("background-color", "green")
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
//.call(zoom);

// Add the X Axis
  svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat(format)));
/*
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");
*/

let brushX = d3.brushX() // Add the brush feature using the d3.brush function
        .extent( [ [40,0], [width,70] ] ) // initialise the brush area: start at 40,0 and finishes at width,height: it means I select the whole graph area
            .on("end", brushended)
 let timeBrush = d3.select("#time")
      .call(brushX );

function brushended() {
  if (!d3.event.sourceEvent) return; // Only transition after input.
  if (!d3.event.selection) return; // Ignore empty selections.
  let d0 = d3.event.selection.map(x.invert),
      d1 = d0.map(d3.timeHour.round);

  // If empty when rounded, use floor & ceil instead.
  if (d1[0] >= d1[1]) {
    d1[0] = d3.timeHour.floor(d0[0]);
    d1[1] = d3.timeHour.offset(d1[0]);
  }

  d3.select(this).transition().call(d3.event.target.move, d1.map(x));
}

// Rescale axis on window resize
function redraw() { 
  oldRange = x.range();
  //console.log(oldRange);
  
  // Extract the width and height that was computed by CSS.
  width = 0.7 * window.innerWidth;
  //console.log(width);
  
  x = d3.scaleTime()
    .domain(timeRange)
    .range([40, width]);
  
  let ratio = oldRange/x.range();      
  
  svg.select(".axis")
    .call(d3.axisBottom(x)
      .tickFormat(d3.timeFormat(format)));
  
  //Uppdatera brush selection & overlay!
  
  //Get selection range to use for rescaling
  let start = Number(d3.select("#time").select(".selection").attr("x"));
  let end = Number(d3.select("#time").select(".selection").attr("width")) + start;
  //Update selections range/rescale
  d3.select("#time").select(".selection").attr("x", start);
  d3.select("#time").select(".selection").attr("width", end - start);
  d3.select("#time").select(".overlay").attr("width", width); //fel sak att ändra på? ändrar inte gränserna...
  
  /*if(start !== null && end !== null)
     brushX.move(timeBrush, x.range().map(() => {x.range()[0] = start;x.range()[1] = end;}));*/
      }

redraw();
      // Redraw based on the new size whenever the browser window is resized.
      window.addEventListener("resize", redraw);