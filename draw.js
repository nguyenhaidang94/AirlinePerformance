var width = 960;
var height = 600;
var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

var projection = d3.geoAlbersUsa()
					.translate([width/2, height/2])
					.scale([1000]);
var path = d3.geoPath(projection);

map = svg.append("g");
d3.json("us-states.json").then(function(json) {
	map.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "state");
});

airport = svg.append("g");
var originGeo = [-73.87259674, 40.77719879]
airport.selectAll("circleOrigin")
	.data([originGeo])
	.enter()
	.append("circle")
	.attr('cx', function (d) { return projection(d)[0]; })
	.attr('cy', function (d) { return projection(d)[1]; })
	.attr('r', '3px')
	.attr('class', 'airport');