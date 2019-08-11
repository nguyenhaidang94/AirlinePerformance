var width = 780;
var height = 480;
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

$("#airportSelection").change(function(){
	var airportCode = $("#airportSelection").val();
	if (airportCode != ""){
		airportGraph.select("circle[name='" + airportCode + "']").dispatch("click");
	}
});

var airportGraph = svg.append("g");
var routeGraph = svg.append("g");
d3.csv("http://127.0.0.1:5000/static/origin_delay.csv").then(function(data){
	var min_delay_flights = Number.MAX_SAFE_INTEGER;
	var max_delay_flights = 0;
	var airportSelectionData = [{id:"", text:"Select"}]; // data for airport selection
	for (airport of data){
		var delay_flights = parseInt(airport.DEP_DEL15);
		if (delay_flights < min_delay_flights){
			min_delay_flights = delay_flights;
		}
		if (delay_flights > max_delay_flights){
			max_delay_flights = delay_flights;
		}

		// push data to airport selection
		airportSelectionData.push({id: airport.ORIGIN, text: airport.origin_city + ", " + airport.ORIGIN});
	}
	var avg_delay_flights = (max_delay_flights - min_delay_flights)/2;
   	
	// load data for airport selection
	$("#airportSelection").select2({data: airportSelectionData});

	airportGraph.selectAll("circle")
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

	// add legend
	var mapLegend = d3.select("svg#map-legend");
	mapLegend.append("circle")
		.attr("cx", 8)
		.attr("cy", 8)
		.attr("r", "8px")
		.attr('class', 'airport');
	mapLegend.append("text")
		.attr("x", 20)
		.attr("y", 12)
		.text(": Total delayed flights > " + avg_delay_flights);

	mapLegend.append("circle")
		.attr("cx", 8)
		.attr("cy", 40)
		.attr("r", "3px")
		.attr('class', 'airport');
	mapLegend.append("text")
		.attr("x", 20)
		.attr("y", 44)
		.text(": Total delayed flights <= " + avg_delay_flights);
});

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

function handleDrawingRoute(routeGraph, projector, airport){
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
}

function handleDrawingBarCarrier(airport){
	$.ajax({
		url: "http://127.0.0.1:5000/delayed-carrier/"+airport.ORIGIN,
		success: function(response){
			var delayed_carriers = response;
			carrier_names = []
			var percentage_delays = [];
			var percentage_delays_display = [];
			for (delayed_carrier of delayed_carriers){
				carrier_names.push(delayed_carrier.carrier_name);
				percentage_delays.push(delayed_carrier.pct_delay_flight);
				percentage_delays_display.push((delayed_carrier.pct_delay_flight*100).toFixed(0));
			}
			var graphData = [{
		   		type: 'bar',
		   		x: carrier_names,
		  		y: percentage_delays,
		  		text: percentage_delays_display.map(String),
		  		textposition: 'auto'
			}];

			var barGap = 0.1;
			if (delayed_carriers.length < 5){
				barGap = 0.7;
			}
			var layout = {
				title: airport.ORIGIN + ", " + airport.origin_city,
				yaxis: {
					title: {
						text: "% delayed flight"
					},
					tickformat: '%',
				},
				bargap: barGap
			}

			Plotly.react('carrier-bar', graphData, layout);
		},
		error: function(response){
			console.log("request error");
		}
	});
}

function airportOnClick(routeGraph, projector, airport){
	handleDrawingRoute(routeGraph, projector, airport);
	handleDrawingBarCarrier(airport);
}

function displayTooltip(item){
	tooltip.transition().duration(200);
	tooltip.html(item.ORIGIN + "<br>"
				 + item.origin_city + "<br>"
				+ "Delayed flights: " + parseFloat(item.pct_delay_flight).toFixed(2) + "%" + "<br>"
				+ "Average delay: " + parseFloat(item.avg_delay).toFixed(0) + " minutes")
		.style("opacity", 0.9)
		.style("left", (d3.event.pageX - 90) + "px")
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