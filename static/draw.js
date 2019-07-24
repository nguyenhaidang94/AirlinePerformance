var width = 960;
var height = 600;
var svg = d3.select("div.graphic").append("svg")
	.attr("width", width)
	.attr("height", height);

var projection = d3.geoAlbersUsa()
					.translate([width/2, height/2])
					.scale([1000]);
var path = d3.geoPath(projection);

var map = svg.append("g");
d3.json("http://127.0.0.1:5000/static/us-states.json").then(function(json) {
	map.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "state");
});

function getProjectedPoint(projector, airport){
	projectedPoint = projector([airport.origin_long, airport.origin_lat]);
	if (projectedPoint == null){
		// return an empty point
		return [-10,-10];
	}
	return projectedPoint;
}

function drawRoute(routeGraph, projector, airport){
	console.log(airport.ORIGIN);
	/*
	var origin = projector([airport.origin_long, airport.origin_lat]);
	var geo1 = projector([-87.9048, 41.9786]);
	var geo2 = [50, 250];
	
	// remove old lines
	routeGraph.selectAll("line").remove();
	// draw new lines
	routeGraph.selectAll("line")
		.data([geo1, geo2])
		.enter()
		.append("line")
		.attr('x1', origin[0])
		.attr('y1', origin[1])
		.attr('x2', function(item){return item[0];})
		.attr('y2', function(item){return item[1];})
		.attr("class", "route");
	*/
}

var airport = svg.append("g");
var route = svg.append("g");
d3.csv("http://127.0.0.1:5000/static/us_airports.csv").then(function(data){
	airport.selectAll("circleOrigin")
		.data(data)
		.enter()
		.append("circle")
		.attr('cx', function (item) { return getProjectedPoint(projection, item)[0]; })
		.attr('cy', function (item) { return getProjectedPoint(projection, item)[1]; })
		.attr('name', function (item) { return item.ORIGIN;})
		.attr('r', '3px')
		.attr('class', 'airport')
		.on("click", function(item){ drawRoute(route, projection, item)});
});