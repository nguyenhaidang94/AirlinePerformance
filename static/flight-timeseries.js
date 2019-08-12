function unpack(rows, key) {
	return rows.map(function(row) { return row[key]; });
}

d3.csv("http://127.0.0.1:5000/static/flight-timeseries.csv").then(function(flights){
	var trace1 = {
	  type: "scatter",
	  mode: "lines",
	  name: 'Flights',
	  x: unpack(flights, 'FL_DATE'),
	  y: unpack(flights, 'n_flights'),
	  line: {color: 'steelblue'}
	}

	var trace2 = {
	  type: "scatter",
	  mode: "lines",
	  name: 'Delayed Flights',
	  x: unpack(flights, 'FL_DATE'),
	  y: unpack(flights, 'DEP_DEL15'),
	  line: {color: 'darkorange'}
	}

	var data = [trace1, trace2];

	var layout = {
	  title: 'Total flights during the time',
	};

	Plotly.newPlot('flight-timeseries', data, layout);
});