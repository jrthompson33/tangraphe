/**
 * Created by John Thompson
 */

(function(){

    // The global objects for the visualization
    main = {};
    data = {};

    var chart, svg, height, width, swipe, press, tick, container;

    var moveThreshold = 9;
    var longPressThreshold = 15;
    var longPressTimeout = 350;
    var viewCenter = {x:0,y:0};


    main.graph = {
        "nodes":[
        {"name":"Myriel","group":1},
        {"name":"Napoleon","group":1},
        {"name":"Mlle_Baptistine","group":1},
        {"name":"Mme_Magloire","group":1},
        {"name":"CountessdeLo","group":1},
        {"name":"Geborand","group":1},
        {"name":"Champtercier","group":1},
        {"name":"Cravatte","group":1}
        ],
        "links":[
        {"source":1,"target":0,"value":1},
        {"source":2,"target":0,"value":8},
        {"source":3,"target":0,"value":10},
        {"source":3,"target":2,"value":6},
        {"source":4,"target":0,"value":1},
        {"source":5,"target":0,"value":1}
        ]
    };  


    /**
     * Initialize the visualization
     * @param params - functions as the context of the tool
     */
    main.init = function (params) {
  //       Initialize things for the overall visualization
        chart = d3.select("#vis");
        height = params.height || 500;
        width = params.width || 960;
        chart.selectAll("svg").data([{height: height, width: width}]).enter().append("svg");
        svg = chart.select("svg");
        svg.attr("height", function(d) {return d.height;})
            .attr("width", function(d) {return d.width;});

        // Load the data after we've set up the vis
        main.loadData(params);

        tick = function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
          };

        var color = d3.scale.category20();

        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(500)
            .size([width, height]);


        force.nodes(main.graph.nodes)
            .links(main.graph.links)
            .start();


        container = svg.append("g");
        var link = container.selectAll(".link")
            .data(main.graph.links)
            .enter().append("line")
            .attr("class", "link")
            .attr('id', function(d){ return d.source.name+'-'+d.target.name})
            .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        var node = container.selectAll(".node")
            .data(main.graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 50)
            .style("fill", function(d) { return color(d.group); });

        node.append("title")
            .text(function(d) { return d.name; });

        force.on("tick", tick);

        var hammertime = new Hammer(document.getElementById("vis"));

        hammertime.on("hammer.input", function(ev) {
            if (ev.pointerType == "touch") {
                main.handleTouchEvent(ev);
            }
        });

    };

    main.handleTouchEvent = function(event) {
        var px = event.center.x;
        var py = event.center.y;

        if(event.isFirst) {
            // Handle if this is a new touch event - clear off the vis
            handleNewTouch(event);

            // Create a new press object to handle this event stream
            press = {time: event.timestamp, centers: [event.center], events: [event], touches: event.pointers.length};
            if(event.pointers.length == 1) {
                handleSinglePressEvent(event);
            } else {
                handleMultiPressEvent(event);
            }
        } else {
            // Check if this event moved enough, then start a swipe
            if(!swipe && event.distance > moveThreshold) {
                press.centers.push(event.center);
                press.events.push(event);
                swipe = {time: event.timestamp, centers: press.centers, events: press.events, touches: event.pointers.length};
            }
            if (swipe) {
                swipe.time = event.timestamp;
                swipe.centers.push(event.center);
                swipe.events.push(event);
                // Always take the greater of the two
                // if a swipe starts out as one finger but ends as two we want it to be a double swipe

                // WHAT HAPPENS WHEN WE GO FROM TWO FINGERS TO ONE? this condition sets swipe.touches to 2 in that case.
                swipe.touches = swipe.touches > event.pointers.length ? swipe.touches : event.pointers.length;
                

                // TODO handle a switch so that we override any events that were triggered from a different swipe
                if(swipe.touches == 1) {
                    handleSingleSwipeEvent(event);
                } else if (swipe.touches == 2){
                    handleDoubleSwipeEvent(event);
                } else if (swipe.touches == 3) {
                    handleTripleSwipeEvent(event);
                } else {
                    handleHandSwipeEvent(event);
                }
            } else {
                press.time = event.timestamp;
                press.centers.push(event.center);
                press.events.push(event);
                // Always take the greater of the two
                // if a press starts out as one finger but ends as two we want it to be a double press
                press.touches = press.touches > event.pointers.length ? press.touches : event.pointers.length;
                if(press.touches == 1) {
                    handleSinglePressEvent(event);
                } else {
                    handleMultiPressEvent(event);
                }
            }
        }
    };

    function handleNewTouch(event) {

    }

    function handleSinglePressEvent(event) {

    }

    function handleMultiPressEvent(event) {

    }

    function handleSingleSwipeEvent(event) {

    }

    function handleDoubleSwipeEvent(event) {

        if(event.isFinal==true){ // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
            swipe.centers = [];
        }

        var curPointX = event.center.x;
        var curPointY = event.center.y;
        var swipePointsLength = swipe.centers.length;
        var prevPointX,prevPointY;
        if(swipePointsLength<2){
            prevPointX = swipe.centers[swipePointsLength-1].x;
            prevPointY = swipe.centers[swipePointsLength-1].y;
        }else{
            prevPointX = swipe.centers[swipePointsLength-2].x;
            prevPointY = swipe.centers[swipePointsLength-2].y;
        }
        var deltaY = curPointY-prevPointY;
        var deltaX = curPointX-prevPointX;

        viewCenter.x += deltaX;
        viewCenter.y += deltaY;                    
        container.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")")
    }

    function handleTripleSwipeEvent(event) {

    }

    function handleHandSwipeEvent(event) {

    }

    function getPassThroughLinks(p1,p2) {
        var select = '';
        d3.selectAll('.link').each(function(l){
            if(lineIntersect(p1.x,p1.y,p2.x,p2.y,l.source.x,l.source.y,l.target.x,l.target.y)) {
                select += '#'+l.source.name+'-'+l.target.name+', ';
            }
        });
        return select.length > 0 ? select.substring(0, select.length-2) : '';
    }

    main.loadData = function(params) {
        // Load data for the visualization here
    };

    main.resizeWindow = function() {
        // Resize the visualization

    };
})();
