// // jquery for control
//     $( function() {
//        // run the currently selected effect
//        function redraw() {
//          // get effect type from
//          var selectedChart = $( "#barchart" ).val();
//
//          // Most effect types need no options passed by default
//          var link_data = "http://127.0.0.1:5000/static/groupbarchart.json";
//          // some effects have required parameters
//          if ( selectedChart === "CARRIER" ) {
//            link_data = "http://127.0.0.1:5000/static/carrier.json";
//          } else if ( selectedChart === "AIRPORT" ) {
//            link_data = "http://127.0.0.1:5000/static/airport_bc.json";
//          }
//          else if (selectedChart === "CITY"){
//            link_data = "http://127.0.0.1:5000/static/groupbarchart.json";
//          }
//
//          // Remove svg
//          var div = document.getElementById("mydiv");
//          var remove_children = div.childNodes;
//          //remove the current chart
//          div.removeChild(remove_children[remove_children.length -1]);
//          // redraw
//          draw(link_data);
//
//        };
//
//        // Redraw when hit button
//        $( "#button" ).on( "click", function() {
//          redraw();
//        });
//
//      } );



    function draw(link,text){
        d3.json(link, function(d) {
          return {
                DAY_OF_WEEK: d.DAY_OF_WEEK,
                NAME: d.NAME,
                delay_time: +d.delay_time,
                type :d.type
          };
        }).then(function(rows) {
          render(rows,text);
        });
      }

    draw("http://127.0.0.1:5000/static/carrier.json","Carrier");
    draw("http://127.0.0.1:5000/static/airport_bc.json","Airport");
    draw("http://127.0.0.1:5000/static/mean.json","MEAN");



    function render(data,text) {

      var margin = {top: 50, right: 20, bottom: 60, left: 100},
          width = 750 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;



      var tooltip = d3.select("div#mydiv")
          	.append("div")
          	.style("position", "absolute")
          	.style("z-index", "10")
          	.style("visibility", "hidden")
            .style("font-family", "sans-serif")
            .style("background-color","white");

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
          .attr("width", width + margin.left + margin.right + 70)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left  + "," + margin.top + ")");

          if (text == "MEAN") {
          svg2.append("text")
              .attr("class", "title")
              .attr("x", width/2)
              .attr("y", height + (margin.bottom/2 ))
              .attr("dy", "1.35em")
              .attr("font-weight","bold")
              .attr("text-anchor", "middle")
              .text("Barchart shows the mean delay time in each day of week");
            } else{
              svg2.append("text")
                  .attr("class", "title")
                  .attr("x", width/2)
                  .attr("y", height + (margin.bottom/2 ))
                  .attr("dy", "1.35em")
                  .attr("font-weight","bold")
                  .attr("text-anchor", "middle")
                  .text("Barchart shows the most delay " + text + " in each day of week");

            }


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
                .call(xAxis)
                .append("text")
                .attr("x",width+50)
                .attr("y",7)
                .attr("dy", ".71em")
                .attr("fill","black")
                .attr("font-size","12px")
                .style("text-anchor", "end")
                .style('font-weight','bold')
                .text("Day of Week");


            svg2.append("g")
                .attr("class", "y axis")
                .style('opacity','0')
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("x",0)
                .attr("dy", ".71em")
                .attr("fill","black")
                .attr("font-size","12px")
                .style("text-anchor", "end")
                .style('font-weight','bold')
                .text("Minutes");

            svg2.select('.y').transition().duration(500).delay(1300).style('opacity','1');

            var slice = svg2.selectAll(".slice")
                .data(data)
                .enter().append("g")
                .attr("class", "g")
                .attr("transform",function(d) { return "translate(" + x0(d.key) + ",0)"; });
                if (text == "MEAN") {
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
                                                  tooltip.text("Delay time: " + d.delay_time.toFixed(2)+" minutes")
                                                          .style("visibility", "visible")
                                                          .style("left", (d3.event.pageX) + "px")
                                                          .style("top", (d3.event.pageY - 10) + "px");;
                                                      })
                                              .on("mouseout", function(d) {
                                                      d3.select(this).style("fill", color(d.type));
                                                      tooltip.style("visibility", "hidden") ;
                                                    }));

                    } else  {
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
                                                      tooltip.text("Delay time: " + d.delay_time.toFixed(2)+" minutes")
                                                              .style("visibility", "visible")
                                                              .style("left", (d3.event.pageX) + "px")
                                                          		.style("top", (d3.event.pageY - 10) + "px");;
                                                          })
                                                  .on("mouseout", function(d) {
                                                          d3.select(this).style("fill", color(d.type));
                                                          tooltip.style("visibility", "hidden") ;
                                                          }))
                          .call((parent)=>parent.append("text")
                          .text(function(d){return d.NAME})
                          .attr("x", function(d, i) {
                            return x1(d.type) +20 ;
                            })
                          .attr("text-anchor", "middle")
                            )
                            ;
                      slice.selectAll("text")
                            .attr("y", function(d) { return y(d.delay_time) - 5 ; });


                    }



            slice.selectAll("rect")
                .transition()
                .delay(function (d) {return Math.random()*1000;})
                .duration(1000)
                .attr("y", function(d) { return y(d.delay_time); })
                .attr("height", function(d) { return height - y(d.delay_time); })
                ;




            //Legend
            var legend = svg2.selectAll(".legend")
                .data(data[0].values.map(function(d) { return d.type; }).reverse())
            .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; })
                .style("opacity","0");

            legend.append("rect")
                .attr("x", width + 70)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", function(d) { return color(d); });

            legend.append("text")
                .attr("x", width +60)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) {return d; });

            legend.transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1");


    }
