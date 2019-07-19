var width = 960;
var height = 600;
var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

var projection = d3.geoAlbersUsa()
					.translate([width/2, height/2])
					.scale([1000]);
var path = d3.geoPath(projection);

var map = svg.append("g");
d3.json("us-states.json").then(function(json) {
	map.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "state");
});

var airport = svg.append("g");
d3.csv("delayed_airports.csv").then(function(data){
	airport.selectAll("circleOrigin")
		.data(data)
		.enter()
		.append("circle")
		.attr('cx', function (item) { return projection([item.origin_long, item.origin_lat])[0]; })
		.attr('cy', function (item) { return projection([item.origin_long, item.origin_lat])[1]; })
		.attr('name', function (item) { return item.ORIGIN;})
		.attr('r', '10px')
		.attr('class', 'airport')
		.on("click", function(item){console.log(item);});
});

/*
var originGeo = [-117.383003235, 34.597499847399995]
var destGeo = [-73.87259674, 40.77719879]
var route = svg.append("g");
route.append("path")
	.datum({type: "LineString", coordinates: [originGeo, destGeo]})
	.attr("d", path)
	.attr("class", "route");
*/