var customTimeFormat = timeFormat([
  ["00:00", function () { return true; }],
  ["06:00", function (d) { return 3 <= d.getHours() && d.getHours() < 9; }],
  ["12:00", function (d) { return 9 <= d.getHours() && d.getHours() < 15; }],
  ["18:00", function (d) { return 15 <= d.getHours() && d.getHours() < 21; }]
]);

var margin = {top: 250, right: 40, bottom: 250, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.time.scale()
    .domain([new Date(2012, 0, 1), new Date(2012, 0, 3)])
    .range([0, width]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(customTimeFormat);

var svg = d3.select("div").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

function timeFormat(formats) {
  return function(date) {
    var i = formats.length - 1, f = formats[i];
    while (!f[1](date)) f = formats[--i];
    return d3.functor(f[0])(date);
  };
}