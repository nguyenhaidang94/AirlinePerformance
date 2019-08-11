
var width = 900,
    height = 105,
    cellSize = 12; // cell size
    week_days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    //month = ['Jan']

var day = d3.timeFormat("%w"),
    week = d3.timeFormat("%U"),
    percent = d3.format(".1%"),
	format = d3.timeFormat("%Y%m%d");
	parseDate = d3.timeFormat("%Y%m%d").parse;

//var color = d3.scale.linear().range(["white", 'red'])
//    .domain([0, 1])

var tooltip = d3.select(".calender-map").append("div")
    	.attr("class", "tooltip")
    	.style("opacity", 0);

var svg = d3.select(".calender-map").selectAll("svg")
    .data(d3.range(2019,2020))
    .enter().append("svg")
    .attr("width", '100%')
    .attr("data-height", '0.5678')
    .attr("viewBox",'0 0 900 105')
    .attr("class", "RdYlGn")
    .append("g")
    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

svg.append("text")
    .attr("transform", "translate(-38," + cellSize * 3.5 + ")rotate(-90)")
    .style("text-anchor", "middle")
    .text(function(d) { return d; });

for (var i=0; i<7; i++)
{
svg.append("text")
    .attr("transform", "translate(-5," + cellSize*(i+1) + ")")
    .style("text-anchor", "end")
    .attr("dy", "-.25em")
    .text(function(d) { return week_days[i]; });
 }




var legend = svg.selectAll(".legend")
      .data(month)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (((i+1) * 50)+8) + ",0)"; });

legend.append("text")
   .attr("class", function(d,i){ return month[i] })
   .style("text-anchor", "start")
   .attr("dy", "-.25em")
   .attr("dx", "-2.5em")
   .text(function(d,i){ return month[i] });

var timeparse = d3.timeParse("%Y%m%d")

d3.csv("http://127.0.0.1:5000/static/data.csv").then( function( csv) {

  csv.forEach(function(d) {
    d.DEP_DEL15 = parseFloat(d.DEP_DEL15);
  });

 var DEP_DEL15_Max = d3.max(csv, function(d) { return d.DEP_DEL15; });

  // var data = d3.nest()
  //   .key(function(d) { return d.FL_DATE; })
  //   //.rollup(function(d) { return  Math.sqrt(d[0].DEP_DEL15 / DEP_DEL15_Max); })
  //   .rollup(function(d) { return  d[0].DEP_DEL15; })
  //   .map(csv);

  var rect = svg.selectAll(".day")
      .data(csv)
      //.data(function(d) { return d3.timeDay(new Date(d, 0, 1), new Date(d+1, 0, 1)); })
      .enter()
  	  .append("rect")
      .attr("class", "day")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("x", function(d) { return week(timeparse(d.FL_DATE)) * cellSize; })
      .attr("y", function(d) { return day(timeparse(d.FL_DATE)) * cellSize; })
      .attr("fill",'#fff')
      .attr("fill", function(d) { return color(d.DEP_DEL15); })
      .on("mouseover", function(d){ displayTooltip(d.FL_DATE,d.DEP_DEL15); })
      .on("mouseout", function(d){ hideTooltip() })
      .datum(format);


  // rect.filter(function(d) { return d in csv; })
  //     .attr("fill", function(d) { return color(d.DEP_DEL15); })
	//     //.attr("data-title", function(d) { return "value : " + Math.round(data[d])})
  //     .on("mouseover", function(d){ displayTooltip(d,data[d]); })
  //     .on("mouseout", function(d){ hideTooltip() });

	//$("rect").tooltip({container: 'body', html: true, placement:'top'});

  svg.selectAll(".month")
      .data(csv)
      .enter().append("path")
      .attr("class", "month")
      .attr("id", function(i){ return month[i]; })
      .attr("d",function(d){return monthPath(timeparse(d.FL_DATE));});
});

// function numberWithCommas(x) {
//     x = x.toString();
//     var pattern = /(-?\d+)(\d{3})/;
//     while (pattern.test(x))
//         x = x.replace(pattern, "$1,$2");
//     return x;
// }

function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth()+1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}
function displayTooltip(d,value){
  tooltip.transition().duration(200);
  tooltip.html('Date: ' + d + "<br>"
       + "Delay Percentage: "+ value.toFixed(2) + "<br>")
      //+ "Delayed flights: " + parseFloat(item.pct_delay_flight).toFixed(2) + "%" + "<br>"
      //+ "Average delay: " + parseFloat(item.avg_delay).toFixed(0) + " minutes")
  .style("opacity", 0.9)
  .style("left", (d3.event.pageX) + "px")
  .style("top", (d3.event.pageY - 32) + "px");
}

function hideTooltip(){
	tooltip.transition().duration(200)
		.style("opacity", 0);
}

function color(d) {
  if (d<10){
    return '#a8eb91';
  }
  if(d >= 10 && d < 15){
    return '#d6a774';
  }
  if(d >= 15 && d < 20){
    return '#c46f56'
  }
  if(d>=20){
    return '#c75858';
  }
}