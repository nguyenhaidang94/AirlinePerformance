
// var data;
//   d3.json("http://127.0.0.1:5000/static/groupbarchart.json", function(dataFromServer) {
//       data = dataFromServer;
//     });

    d3.json("http://127.0.0.1:5000/static/groupbarchart.json", function(d) {
      return {
            DAY_OF_WEEK: d.DAY_OF_WEEK,
            OP_UNIQUE_CARRIER: d.OP_UNIQUE_CARRIER,
            delay_time: +d.delay_time,
            type :d.type
      };
    }).then(function(rows) {
      console.log(rows);
      render(rows);
    });

    function render(data) {

      var margin = {top: 20, right: 20, bottom: 30, left: 40},
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;


      var x0 =  d3.scaleBand()
          .rangeRound([0, width])
          // .round(.1);
          .padding(.1);

      var x1 = d3.scaleOrdinal();

      var y = d3.scaleLinear()
          .range([height, 0]);



      var xAxis = d3.axisBottom(x0);
      var yAxis = d3.axisLeft(y);

      var color = d3.scaleOrdinal()
          .range(["#ca0020","#0571b0"]);

      var svg2 = d3.select('div#mydiv').append("svg:svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



          data = d3.nest()
                        .key(function(d) { return d.DAY_OF_WEEK;})
                        .entries(data);



            var categoriesNames = data.map(function(d) { return d.key; });
            var rateNames = data[0].values.map(function(d) { return d.type; });

            x0.domain(categoriesNames);
            x1.domain(rateNames).range([0, x0.bandwidth()/2]);
            y.domain([0, d3.max(data, function(categorie) { return d3.max(categorie.values, function(d) { return d.delay_time; }); })]);

            svg2.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg2.append("g")
                .attr("class", "y axis")
                .style('opacity','0')
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .attr("color","black")
                .attr("font-size","12px")
                .style("text-anchor", "end")
                .style('font-weight','bold')
                .text("Minute");

            svg2.select('.y').transition().duration(500).delay(1300).style('opacity','1');

            var slice = svg2.selectAll(".slice")
                .data(data)
                .enter().append("g")
                .attr("class", "g")
                .attr("transform",function(d) { return "translate(" + x0(d.key) + ",0)"; });

            slice.selectAll("rect")
                .data(function(d) { return d.values; })
                .enter()
                .call((parent)=> parent.append("rect")
                                       .attr("width",x0.bandwidth()/2)
                                       .attr("x", function(d) { return x1(d.type); })
                                       .style("fill", function(d) { return color(d.type)})
                                       .attr("y", function(d) { return y(2); })
                // .attr("height", function(d) { return height - y(2); })
                                        .attr("height", function(d) { return height - y(2);})
                                        .on("mouseover", function(d) {
                                            d3.select(this).style("fill", d3.rgb(color(d.type)).darker(2));
                                                })
                                        .on("mouseout", function(d) {
                                                d3.select(this).style("fill", color(d.type));
                                                }))
                .call((parent)=>parent.append("text")
                .text(function(d){return d.OP_UNIQUE_CARRIER})
                .attr("x", function(d, i) {
                  return x1(d.type) + 20;
                  })
                  );
            slice.selectAll("text")
                  .attr("y", function(d) { return y(d.delay_time) - 5 ; });


            slice.selectAll("rect")
                .transition()
                .delay(function (d) {return Math.random()*1000;})
                .duration(1000)
                .attr("y", function(d) { return y(d.delay_time); })
                .attr("height", function(d) { return height - y(d.delay_time); });




            //Legend
            var legend = svg2.selectAll(".legend")
                .data(data[0].values.map(function(d) { return d.type; }).reverse())
            .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; })
                .style("opacity","0");

            legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", function(d) { return color(d); });

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) {return d; });

            legend.transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1");


    }
