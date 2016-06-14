var height = 600,
    width = 500,
    padding = 50,
    monthGraphHeight = 400,
    dotRadius = 8,
    circleRadius = 20,
    rawData,
    currentPlayer = "Tyler",
    currentPlayerGames,
    comparatorGames,
    winScale,
    names = [],
    line,
    monthNest,
    monthGames,
    monthRates,
    emptyData,
    oldData,
    winRate,
    oldWinRate,
    winPercentage = d3.format("%"),
    xMin,
    xMax,
    xScale,
    xAxis,
    transitionSpeed = 1000,
    parseTime = d3.time.format("%Y%m%d"),
    comparingTo,
    vizOverall = d3.select('#winRateOverall')
      .attr("width", width + padding * 2)
      .attr("height", 50)
      .attr('transform', 'translate(' + padding + ',0)')
      .attr("id", "vizOverall"),
    gamesWon = vizOverall.append('g')
      .attr('width', "width")
      .attr('height', "100")
      .attr('id', "gamesWon"),
    vizMontly = d3.select('#winRateMonthly')
      .attr("width", width + padding * 2)
      .attr("height", height + padding * 2)
      .attr('transform', 'translate(' + padding + ',0)')
      .attr("id", "vizMonthly"),
    monthGraph = vizMontly.append('g')
      .attr('id', "monthGraph")
      .attr('width', width + padding * 2)
      .attr('height', monthGraphHeight + padding + 2)
      .attr('y', '0')
      .attr('x', '0')
      .attr('transform', 'translate(0,9)');
      
    firstPlayerSelect = d3.select("#playerSelect").append('svg')
      //placeholder height
      .attr('width', width + padding * 2)
      .attr("height", padding * 2)
      .attr("transform", "translate(" + (padding * 4.6) + "," + padding + ")")
      .attr("id", "firstPlayerSelectSvg")
      .attr("data-currentPlayer", "Tyler");

    secondPlayerSelect = d3.select("#playerSelect").append('svg')
      //placeholder height
      .attr('width', width + padding * 2)
      // .attr("height", 0)
      .attr("height", padding * 2)
      .attr("transform", "translate(" + (padding * 4.6) + "," + padding + ")")
      .attr("id", "secondPlayerSelectSvg")
      .attr("data-currentPlayer", "Tyler");

//Load Data from JSON
  d3.json('data/games.json', function(error, json) {
    if(error){
      return console.warn(error);
    }
    rawData = json;
    //Get all players names
    rawData.forEach(function(d){
      //Gimmie a date instead of a string
      d.date = parseTime.parse(d.date);
      // console.log(parseTime.parse(d.date));
      if ((names.indexOf(d.player1) === -1) && (d.player1.length > 0)) {
        names.push(d.player1);
      }
      if ((names.indexOf(d.player2) === -1)&& (d.player2.length > 0)) {
        names.push(d.player2);
      }
    });

    gamesWon.append('rect')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('fill', 'gray')
      .attr('width', width)
      .attr('height', '40');

    monthGraph.append('g')
      .attr('class', 'axis');

    monthGraph.append('g')
      .attr('class', 'yAxis');

    monthGraph.append('path')
        .attr("class", "line")
        .attr("d", function(d){
          return "";
        })
        .attr("opacity", 0);

    //Create Player circles
    firstPlayerSelect.selectAll("circle")
      .data(names)
      .enter()
      .append("g")
      .attr("class", "playerCircle firstPlayerCircle")
      .attr("data-player", function(d){return d})
      .attr("transform", function(d, i){
        return "translate(" + (i * ((circleRadius * 2) + 5) ) + ", 0)"; 
      })
      .append("circle")
      .attr("r", circleRadius);

    firstPlayerSelect.selectAll("g.firstPlayerCircle")
      .classed("selected", false)
      .on("click", function(d){
        firstPlayerSelect.selectAll("g.firstPlayerCircle").classed("selected", false);
        this.classList.add("selected");
        // secondPlayerSelect.transition().duration(transitionSpeed).attr("height", padding * 2);
        currentPlayer = d;
        draw("firstPlayer")
      })
      .append("text")
      .text(function(d){
        return d.substring(0,1);
      })
      .attr("text-anchor", "middle")
      .attr("y", 5);

    secondPlayerSelect.selectAll("circle")
      .data(names)
      .enter()
      .append("g")
      .attr("class", "playerCircle secondPlayerCircle")
      .attr("data-player", function(d){return d})
      .attr("transform", function(d, i){
        return "translate(" + (i * ((circleRadius * 2) + 5) ) + ", 0)"; 
      })
      .append("circle")
      .attr("r", circleRadius);

    secondPlayerSelect.selectAll("g.secondPlayerCircle")
      .classed("selected", false)
      .on("click", function(d){
       //compare functions
       comparingTo = "";
       currentPlayer = d;
       draw("player2");
      })
      .append("text")
      .text(function(d){
        return d.substring(0,1);
      })
      .attr("text-anchor", "middle")
      .attr("y", 5);

    //Set Currentplayergames
    currentPlayerGames = rawData.filter(function(d){
      return ((d.player1 === currentPlayer || d.player2 === currentPlayer)&& d.player1 != d.player2);
    });
    getMonthRates();
    oldWinRate = 0;
    //draw empty monthLine
    
    line = d3.svg.line()
        .x(function(d) { 
          var date = new Date('January 1, 2016 00:00:00');
        date.setMonth(d.key);
        var x = xScale(date);
        return x;
        })
        .y(function(d) { 
          return yScale(d.values); 
        });
        oldData = monthRates.map( function( datum ) {
            return {
              key : datum.key,
              values : 0
            };
        });
        monthGraph.select("path.line")
        .data(oldData)
          .attr("d", function(d){
            return line(d);
          });

    //Don't call draw here so oldData starts as empty  
    drawWinBar("firstPlayer");
    drawMonthGraph("firstPlayer");
  });

  var draw = function(whichPlayer){
    //Single Player View
    currentPlayerGames = rawData.filter(function(d){
      return ((d.player1 === currentPlayer || d.player2 === currentPlayer)&& d.player1 != d.player2);
    });
    document.getElementById('currentPlayer').innerHTML = currentPlayer;
    getMonthRates(whichPlayer);
    drawWinBar(whichPlayer);
    drawMonthGraph(whichPlayer);

  }
  var drawWinBar = function(whichPlayer){ 
    //Games Won
    var totalPlayed = currentPlayerGames.length;
    var winningGames = currentPlayerGames.filter(function(d){
      return (d.player1 === currentPlayer && d.player1Score === 11) || (d.player2 === currentPlayer && d.player2Score === 11);
    });
    if (winRate > 0) {
      oldWinRate = winRate;
    }
    winRate = (winningGames.length/totalPlayed);
    console.log (currentPlayer + "'s win rate is " + Math.floor(winRate * 100) + "%");

    winScale = d3.scale.linear()
      .range([0, width])
      .domain([0, totalPlayed]);
    
    gamesWonLines = gamesWon.selectAll("g." + whichPlayer + "WinLine")
      .data(winningGames, function(d){return d.length});

    gamesWonLines
      .enter()
      .append('g')
      .attr("class", "" + whichPlayer + "WinLine")
      .append('rect')
        .attr('width', 0)
        .attr('height', '40')
        .attr('fill', 'blue')
        .attr('stroke-width', '0')
        .transition().duration(transitionSpeed)
        .attr('width', function(){
          return winRate * width;
        });

    gamesWonLines.enter()
      .append('text')
      .attr('class', "" + whichPlayer + 'WinRateText')
      .attr("x", 0)
      .attr("y", 25)
      .text(function(){
        return 0;
      });

    gamesWonLines.selectAll('rect')
      .transition().duration(transitionSpeed)
        .attr('width', function(){
          return winRate * width;
        });

    gamesWon.selectAll("text." + whichPlayer + "WinRateText")
      .datum(winRate)
      .transition().duration(transitionSpeed)
      .attr("x", function(){
        return (winRate * width) - 50;
      })
      .tween('text', function(d){
        var winRateInterpolator = d3.interpolate(oldWinRate, d);
        return function(t){
          d3.select(this).text(winPercentage(winRateInterpolator(t)));
        }
      });
  }
  var drawMonthGraph = function(player){
    console.log(player)
    xAxis = d3.svg.axis().scale(xScale)
      .orient('bottom')
      .ticks(d3.time.months)
      .tickSize(monthGraphHeight,1);

    yAxis = d3.svg.axis().scale(yScale)
      .orient('right')
      .ticks(10)
      .tickSize(width,0)
      .tickFormat(winPercentage);

    monthGraph.select('g.axis')
      .call(xAxis)
      .selectAll('text')
        .attr("transform", function(){
          return "rotate(45)";
        })
        .style('text-anchor', 'start')
        .style('font-size', '10px')
        .attr('dx', ''+ (monthGraphHeight - 110) + 'px')
        .attr('dy', ''+ (-width + 390) + 'px');

    monthGraph.select('g.axis .domain')
      .attr('transform', 'translate(0, ' + monthGraphHeight +')');

    monthGraph.select('g.yAxis')
      .call(yAxis)
      .selectAll('g.tick')
        
      .selectAll('text')
        .attr('dx', ''+ (-width - 20) + 'px')
        // .attr('dy', ''+ (-monthGraphHeight + 100) + 'px')
        .style('text-anchor', 'end')
        .style('font-size', '10px');

    var circles = monthGraph.selectAll('g.monthCircle')
      .data(monthRates);

    circles.enter().append('g')
      .attr('class', 'monthCircle')
      .attr('transform', function(d, i){
        var date = new Date('January 1, 2016 00:00:00');
        date.setMonth(d.key);
        var x = xScale(date);
        return 'translate(' + x + ',' + monthGraphHeight + ')';
      })
      .append('circle')
        .attr('r', dotRadius);

    d3.selectAll('g.monthCircle')
      .data(monthRates)
      .append('text')
      .text(function(d){
        return d.date;
      });

    circles.transition().duration(transitionSpeed)
    .attr('transform', function(d, i){
      var date = new Date('January 1, 2016 00:00:00');
      date.setMonth(d.key);
      var x = xScale(date),
      y = yScale(d.values);

      return 'translate(' + x + ',' + y + ')';
    });

    var interpolator = d3.interpolateArray(oldData, monthRates);
    monthGraph.select("path.line")
      .data(monthRates)
        .attr("opacity", 0)
        .transition().duration(transitionSpeed)
        .attrTween('d', function(){
          // debugger;
            return function(t){
              return line(interpolator (t));
            }
          })
        .transition().delay(1000).duration(transitionSpeed/1.5)
        .attr("opacity", 1);

    circles.exit()
      .selectAll('circle')
      .remove();
  }
var getMonthRates = function(){
  //Get the monthly information
  //Win Percentage by Month
  oldData = monthRates;
  monthNest = d3.nest();

  monthNest.key(function(d){
    return d.date.getMonth();
  })
  .sortKeys(d3.ascending);
  
  monthGames = monthNest.entries(currentPlayerGames);
  //Get win percentage by month
  monthRates = d3.nest()
    .key(function(d){
    return parseInt(d.date.getMonth());
    })
    .sortKeys(function (a, b){
      return a-b;
    })
    .rollup(function(data){
      var totalPlayedMonthly = data.length,
      monthlyWins = data.filter(function(d){
        return (d.player1 === currentPlayer && d.player1Score === 11) || (d.player2 === currentPlayer && d.player2Score === 11);
      }),
      monthlyWinRate = (monthlyWins.length/totalPlayedMonthly);
      return monthlyWinRate;
  })
  .entries(currentPlayerGames);;
  //Axis stuff
  //Horizontal Axis
  xMin = d3.min(rawData, function(d){
    var time = d.date;
    time.setMonth(time.getMonth() - 1);
    return time;
  });
  xMax = d3.max(rawData, function(d){
    var time = d.date;
    time.setMonth(time.getMonth() + 1);
    return time;
  });
  xScale = d3.time.scale()
    .range([0,width])
    .domain([xMin, xMax]);
  yScale = d3.scale.linear()
    .range([monthGraphHeight, 0])
    .domain([0, 1]);
}
