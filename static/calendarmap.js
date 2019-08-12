
var width = 900,
    height = 105,
    cellSize = 13; // cell size
    week_days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

var day = d3.timeFormat("%w"),
    week = d3.timeFormat("%U"),
    percent = d3.format(".1%"),
	format = d3.timeFormat("%Y%m%d");
	parseDate = d3.timeFormat("%Y%m%d").parse;

var heatmap_tooltip = d3.select(".calender-map").append("div")
    	.attr("class", "heatmap-tooltip")
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
    .attr("font-size",10)
    .style("text-anchor", "middle")
    .text(function(d) { return d; });

for (var i=0; i<7; i++)
{
svg.append("text")
    .attr("transform", "translate(-5," + cellSize*(i+1) + ")")
    .style("text-anchor", "end")
    .attr("dy", "-.25em")
    .attr("font-size",12)
    .text(function(d) { return week_days[i]; });
 }

var legend = svg.selectAll(".legend")
    .data(month)
    .enter().append("g")
    .attr("class", "legend")
    .attr("font-size",12)
    .attr("transform", function(d, i) { return "translate(" + (((i+1) * 55)+8) + ",0)"; });

legend.append("text")
   .attr("class", function(d,i){ return month[i] })
   .style("text-anchor", "start")
   .attr("dy", "-.25em")
   .attr("dx", "-2.5em")
   .text(function(d,i){ return month[i] });

   var rect = svg.selectAll(".day")
         //.data(csv)
         .data(function(d) {
           return d3.timeDay.range(new Date(d, 0, 1), new Date(d + 1, 0, 1));
          })
         .enter()
     	  .append("rect")
         .attr("class", "day")
         .attr("width", cellSize)
         .attr("height", cellSize)
         .attr("x", function(d) {return week(d) * cellSize;})
         .attr("y", function(d) { return day(d) * cellSize; })
         .attr("fill",'#fff')
         //.attr("fill", function(d) { return color(d);})
         .datum(format);

   svg.selectAll(".month")
          //.data(csv)
          .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
          .enter().append("path")
          .attr("class", "month")
          .attr("id", function(d,i){
            return month[i]; })
          .attr("d", monthPath);


var timeparse = d3.timeParse("%Y%m%d")

d3.csv("http://127.0.0.1:5000/static/heatmap_data.csv").then( function(csv) {

  csv.forEach(function(d) {
    d.DEP_DEL15 = parseFloat(d.DEP_DEL15);
  });

// svg.selectAll(".day")
//       .data(csv)
//       .enter()
//   	  .append("rect")
//       .attr("class", "day")
//       .attr("width", cellSize)
//       .attr("height", cellSize)
//       .attr("x", function(d) { return week(timeparse(d.FL_DATE)) * cellSize; })
//       .attr("y", function(d) { return day(timeparse(d.FL_DATE)) * cellSize; })
//       .attr("fill",'#000')
//       .attr("fill", function(d) { return color(d);})
//       .on("mouseover", function(d){displayTooltip_calendar(d); })
//       .on("mouseout", function(d){ hideTooltip() })

  //
  // svg.selectAll(".month")
  //    .data(csv)
  //    //.data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  //    .enter().append("path")
  //    .attr("class", "month")
  //    .attr("id", function(d,i){ return month[i]; })
  //    .attr("d", function(d,i){return monthPath(d);})
  var data = d3.nest()
    .key(function(d) { return d.FL_DATE; })
    .map(csv);

    rect.filter(function(d) {
        return ("$"+d) in data;
      })
      .attr("fill", function(d) {
        return color(data[("$" +  d)][0]);
      })
     .on("mouseover", function(d){displayTooltip_calendar(data[("$" +  d)][0]); })
     .on("mouseout", function(d){ hideHeatmapTooltip() })

	 //$("rect").tooltip({container: 'body', html: true, placement:'top'});
});


function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}

function displayTooltip_calendar(d){
  var date = timeparse(d.FL_DATE)
  var yyyy = date.getFullYear().toString();
  var mm = (date.getMonth()+1).toString();
  var dd  = date.getDate().toString();
  heatmap_tooltip.transition().duration(200);
  heatmap_tooltip.html('Date: ' + yyyy + '/' + mm + '/' + dd + "<br>"
       + "Delay Percentage: "+ d.DEP_DEL15.toFixed(2) + "<br>")
  .style("opacity", 0.9)
  .style("left", (d3.event.pageX+16) + "px")
  .style("top", (d3.event.pageY) + "px")
  .style("height","32px")
}

function hideHeatmapTooltip(){
	heatmap_tooltip.transition().duration(200)
		.style("opacity", 0);
}

function color(d) {
  if (d.DEP_DEL15<10){
    return '#a8eb91';
  }
  if(d.DEP_DEL15 >= 10 && d.DEP_DEL15 < 15){
    return '#d6a774';
  }
  if(d.DEP_DEL15 >= 15 && d.DEP_DEL15 < 20){
    return '#c46f56'
  }
  if(d.DEP_DEL15>=20){
    return '#c75858';
  }
}
