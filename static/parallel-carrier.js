function unpack(rows, key) {
	return rows.map(function(row) { return row[key]; });
}

d3.csv("http://127.0.0.1:5000/static/carrier_delay.csv").then(function(carriers){
	var range = [];
	for (var i = 1; i <= carriers.length; i++){
		range.push(i);
	}
	var data = [{
		type: 'parcoords',
		dimensions: [{
			label: "Airline",
			values: range.reverse(),
			tickvals: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
			ticktext: unpack(carriers, "OP_UNIQUE_CARRIER").reverse()
		}, {
			label: "Total flights",
			values: unpack(carriers, "n_flights")
		}, {
			label: "Percentage delayed flights (%)",
			values: unpack(carriers, "pct_delay_flight")
		}, {
			label: "Average delay (minutes)",
			values: unpack(carriers, "avg_delay")
		}]
	}];
	var layout = {
	  title: 'Carrier delay',
	};
	Plotly.newPlot('parallel-carrier', data, layout);
});