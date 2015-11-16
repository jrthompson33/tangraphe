/**
 * Created by John Thompson
 */

(function(){

    // The global objects for the visualization
    main = {};
    data = {};

    var chart, svg, height, width, swipe, press, tick, container, timer, tapCount=0;

    var moveThreshold = 9;
    var longPressThreshold = 15;
    var longPressTimeout = 350;
    var viewCenter = {x:0,y:0};
    var viewZoom = 1;
    var zoomScale = d3.scale.linear().domain([0,1]).range([1,4]);    

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
            press = {time: event.timeStamp, centers: [event.center], events: [event], touches: event.pointers.length};

            // are these needed? There will never be a single press event (since the minimum is touchstart and touchend)
            // if(event.pointers.length == 1) {
            //     handleSinglePressEvent(event);
            // } else {
            //     handleMultiPressEvent(event);
            // }            
            // console.log("touch down")         
        } else {
            // Check if this event moved enough, then start a swipe
            if(!swipe && event.distance > moveThreshold) { // TODO: check the 2nd condition since it is invoking a touchend event (2nd case below) at the start of two-finger swipe
                press.centers.push(event.center);
                press.events.push(event);
                swipe = {time: event.timeStamp, centers: press.centers, events: press.events, touches: event.pointers.length};
            }
            if (swipe) {
                
                // console.log("swipe")
                swipe.time = event.timestamp;
                swipe.centers.push(event.center);
                swipe.events.push(event);
                // Always take the greater of the two
                // if a swipe starts out as one finger but ends as two we want it to be a double swipe

                // WHAT HAPPENS WHEN WE GO FROM TWO FINGERS TO ONE? this condition sets swipe.touches to 2 in that case. This is causing the jump at the end of a pan event.
                swipe.touches =  swipe.touches > event.pointers.length ? swipe.touches : event.pointers.length;
                

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
                
                // console.log("touch up")
                tapCount += 1;        
                if (timer) clearTimeout(timer);
                timer = setTimeout(function() {
                    press.time = event.timeStamp;
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
                }, 250);                
            }
        }
    };

    function handleNewTouch(event) {

    }

    function handleSinglePressEvent(event) {
        var e = document.elementFromPoint(event.center.x,event.center.y);            
        if(tapCount==1){
            console.log("handle single here")
            console.log(press.events[1].timeStamp-press.events[0].timeStamp)
            if((press.events[1].timeStamp-press.events[0].timeStamp)>125){
                console.log("long press")
            }else{
                console.log("tap")
            }
            if(hasClass(e, 'node')) {
                console.log("on node")
            }
        }else{
            if(tapCount==2){
                console.log("handle double here")            
                if(hasClass(e, 'node')) {
                    console.log("on node")
                }
            }            
        }
        tapCount = 0;
    }

    function handleMultiPressEvent(event) {

    }

    function handleSingleSwipeEvent(event) {
        if(event.isFinal==true){ // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
           swipe = null;
           console.log("single swipe end")
        }        
    }

    function handleDoubleSwipeEvent(event) { // ISSUE: both events are always triggered together (might need to re-think about these interactions).
        var curPointX = event.center.x;
        var curPointY = event.center.y;
        var curScale = event.scale;

        var swipePointsLength = swipe.centers.length;
        var prevPointX,prevPointY, prevScale;
        if(swipePointsLength<2){
            prevPointX = swipe.centers[swipePointsLength-1].x;
            prevPointY = swipe.centers[swipePointsLength-1].y;
            prevScale = swipe.events[swipePointsLength-1].scale;
        }else{
            prevPointX = swipe.centers[swipePointsLength-2].x;
            prevPointY = swipe.centers[swipePointsLength-2].y;
            prevScale = swipe.events[swipePointsLength-2].scale;
        }
        var deltaY = curPointY-prevPointY;
        var deltaX = curPointX-prevPointX;

        if(event.isFinal==true){ // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
           swipe = null;
           console.log("two finger swipe end")
        }


        var point1 = event.pointers[0];
        var point2 = event.pointers[1];        
        var zoomDelta = curScale-prevScale;
        // offsetX = -(curPointX * zoomDelta);
        // offsetY = -(curPointY * zoomDelta);

        if(zoomDelta>0){
            // console.log("pinch out");
        }else{
            // console.log("pinch in");
        }
        //console.log(event.pointers.length)
        viewZoom += zoomDelta;
        viewCenter.x += deltaX;
        viewCenter.y += deltaY;      
        // container.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")")
        // container.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")scale("+zoomScale(viewZoom)+")")
        // container.attr("transform","scale("+zoomScale(viewZoom)+")")
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
