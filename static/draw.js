var width = 960;
var height = 600;
var svg = d3.select("div#map").append("svg")
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

var tooltip = d3.select("div#map").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

function getProjectedPoint(projector, airport){
	projectedPoint = projector([airport.origin_long, airport.origin_lat]);
	if (projectedPoint == null){
		// return an empty point
		return [-10,-10];
	}
	return projectedPoint;
}

function drawRoutes(routeGraph, projector, origin, dests){
	var projectedOrigin = projector([origin.origin_long, origin.origin_lat]);
	var projectedDests = []
	for (dest of dests){
		var projectedDest = projector([dest.origin_long, dest.origin_lat]);
		projectedDests.push(projectedDest);
	}
	// remove old lines
	routeGraph.selectAll("line").remove();
	// draw new lines
	routeGraph.selectAll("line")
		.data(projectedDests)
		.enter()
		.append("line")
		.attr('x1', projectedOrigin[0])
		.attr('y1', projectedOrigin[1])
		.attr('x2', function(item){return item[0];})
		.attr('y2', function(item){return item[1];})
		.attr("class", "route");
}

function airportOnClick(routeGraph, projector, airport){
	$.ajax({
		url: "http://127.0.0.1:5000/delayed-route/"+airport.ORIGIN,
		success: function(response){
			dests = response;
			drawRoutes(routeGraph, projector, airport, dests);
		},
		error: function(response){
			console.log("request error");
		}
	});
	$.ajax({
		url: "http://127.0.0.1:5000/delayed-carrier/"+airport.ORIGIN,
		success: function(response){
			var delayed_carriers = response;
			carrier_names = []
			var percentage_delays = [];
			for (delayed_carrier of delayed_carriers){
				carrier_names.push(delayed_carrier.carrier_name);
				percentage_delays.push(delayed_carrier.pct_delay_flight);
			}

			var graph_data = [{
		   		x: carrier_names,
		  		y: percentage_delays,
			  	type: 'bar'
			}];

			Plotly.react('carrier-bar', graph_data);
		},
		error: function(response){
			console.log("request error");
		}
	});
}

function displayTooltip(item){
	tooltip.transition().duration(200);
	tooltip.html(item.ORIGIN + "<br>"
				 + item.origin_city + "<br>"
				+ "Delayed flights: " + parseFloat(item.pct_delay_flight).toFixed(2) + "%" + "<br>"
				+ "Average delay: " + parseFloat(item.avg_delay).toFixed(0) + " minutes")
		.style("opacity", 0.9)
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 64) + "px");
}

function hideTooltip(){
	tooltip.transition().duration(200)
		.style("opacity", 0);
}

function getAirportLevel(delay_flights, avg_delay_flights){
	if (delay_flights > avg_delay_flights){
		return "8px";
	}
	return "3px";
}

var airportGraph = svg.append("g");
var routeGraph = svg.append("g");
d3.csv("http://127.0.0.1:5000/static/origin_delay.csv").then(function(data){
	var min_delay_flights = Number.MAX_SAFE_INTEGER;
	var max_delay_flights = 0;
	for (airport of data){
		var delay_flights = parseInt(airport.DEP_DEL15);
		if (delay_flights < min_delay_flights){
			min_delay_flights = delay_flights;
		}
		if (delay_flights > max_delay_flights){
			max_delay_flights = delay_flights;
		}
	}
	var avg_delay_flights = (max_delay_flights - min_delay_flights)/2;
	
	airportGraph.selectAll("circleOrigin")
		.data(data)
		.enter()
		.append("circle")
		.attr('cx', function (item) { return getProjectedPoint(projection, item)[0]; })
		.attr('cy', function (item) { return getProjectedPoint(projection, item)[1]; })
		.attr('name', function (item) { return item.ORIGIN; })
		.attr('r', function (item) {return getAirportLevel(parseInt(item.DEP_DEL15), avg_delay_flights); })
		.attr('class', 'airport')
		.on("click", function(item){ airportOnClick(routeGraph, projection, item);})
		.on("mouseover", function(item){ displayTooltip(item); })
		.on("mouseout", function(item){ hideTooltip() });
});
