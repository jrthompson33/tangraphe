
/**
 * Created by John Thompson
 */

(function(){

    // The global objects for the visualization
    main = {contextMenu: false};
    data = {};

    var chart, svg, height, width, swipe, press, tick, timer, tapCount= 0, force, linkVar,nodeVar, movingNode = null, graphContainer ,panThreshold = 0, pinchThreshold =0;    
    var nodeRadius = 50;
    var detailedSelectionOn = false;

    var isPinch=0,isPan=0;
    var nodeG, linkG, menuG, annotG;
    var startDistance = null;

    var moveThreshold = 9;
    var swipeReduceTime = 10;
    var longPressThreshold = 15;
    var longPressTimeout = 350;
    var viewCenter;
    var viewZoom = 1;
    var zoomScale = d3.scale.linear().domain([0,1]).range([1,8]);    
    var color = d3.scale.category20();

    var bundleCA = new ContextAction('BUNDLE', 'bundle', ["M26.7,34.1c1.3,1.4,7.5,4.9,7.5,4.9l2.4-4.7c0,0-10-4.8-9.8-9.6v-6l0,0H31L24,9l-7.1,9.6h0h4.4l0,0v6 "
    +"c0.1,4.8-9.8,9.6-9.8,9.6l2.4,4.7c0,0,6.2-3.5,7.5-4.9l2.6-2.3L26.7,34.1z"]);

    var collapseCA = new ContextAction('COLLAPSE', 'collapse', ["M26,22 L27.7,11 L30.6,13.9 L36.5,8 L40,11.5 L34,17.4 L37,20.3 L26,22",
        "M22,26 L20.3,37 L17.4,34.1 L11.5,40 L8,36.5 L13.9,30.6 L11,27.7 L22,26",
        "M22,22 L11,20.3 L13.9,17.4 L8,11.5 L11.5,8 L17.4,13.9 L20.3,11 L22,22",
        "M26,26 L37,27.7 L34.1,30.6 L40,36.5 L36.5,40 L30.6,34.1 L27.7,37 L26,26"]);

    var expandCA = new ContextAction('EXPAND', 'expand', ["M40,8 L38.3,19 L35.4,16.1 L29.5,22 L26,18.5 L31.9,12.6 L29,9.7 L40,8",
        "M8,40 L9.7,29 L12.6,31.9 L18.5,26 L22,29.5 L16.1,35.4 L19,38.3 L8,40",
        "M8,8 L19,9.7 L16.1,12.6 L22,18.5 L18.5,22 L12.6,16.1 L9.7,19 L8,8",
        "M40,40 L29,38.3 L31.9,35.4 L26,29.5 L29.5,26 L35.4,31.9 L38.3,29 L40,40"]);

    var removeCA = new ContextAction('REMOVE', 'remove', ["M39,11.3 L36.7,9 L24,21.7 L11.3,9 L9,11.3 L21.7,24 L9,36.7 L11.3,39 L24,26.3 L36.7,39 L39,36.7 L26.3,24 L39,11.3"]);

    var linkCA = new ContextAction('SEL LINKS', 'selectlinks', ["M35.2,30.6c-1.7,0-3.1,0.7-4.1,1.9l-13-7c0.1-0.5,0.2-1,0.2-1.5s-0.1-1-0.2-1.5l13-7c1,1.2,2.5,1.9,4.1,1.9 "
        +"c3,0,5.5-2.4,5.5-5.5c0-3-2.5-5.5-5.5-5.5c-3,0-5.5,2.5-5.5,5.5c0,0.5,0.1,1,0.2,1.5l-13,7c-1-1.1-2.5-1.9-4.1-1.9 "
        +"c-3,0-5.5,2.4-5.5,5.4s2.5,5.4,5.5,5.4c1.6,0,3.1-0.7,4.1-1.9l13,7c-0.1,0.5-0.2,1-0.2,1.5c0,3,2.5,5.5,5.5,5.5c3,0,5.5-2.5,5.5-5.5 "
        +"C40.7,33,38.2,30.6,35.2,30.6z"]);

    var nodeCA = new ContextAction('SEL NODES', 'selectnodes', ["M35.2,30.6c-1.7,0-3.1,0.7-4.1,1.9l-13-7c0.1-0.5,0.2-1,0.2-1.5s-0.1-1-0.2-1.5l13-7c1,1.2,2.5,1.9,4.1,1.9 "
    +"c3,0,5.5-2.4,5.5-5.5c0-3-2.5-5.5-5.5-5.5c-3,0-5.5,2.5-5.5,5.5c0,0.5,0.1,1,0.2,1.5l-13,7c-1-1.1-2.5-1.9-4.1-1.9 "
    +"c-3,0-5.5,2.4-5.5,5.4s2.5,5.4,5.5,5.4c1.6,0,3.1-0.7,4.1-1.9l13,7c-0.1,0.5-0.2,1-0.2,1.5c0,3,2.5,5.5,5.5,5.5c3,0,5.5-2.5,5.5-5.5 "
    +"C40.7,33,38.2,30.6,35.2,30.6z"]);

    var linkCMList = [removeCA,bundleCA,nodeCA];
    var nodeCMList = [removeCA,expandCA,collapseCA,linkCA];


    main.graph = {
        "nodes":[
          {
           "id": "208251", 
           "name": "Conoco Inc"
          }, 
          {
           "id": "24978T", 
           "name": "Derby Refining Co"
          }, 
          {
           "id": "573810", 
           "name": "Marubeni Corp"
          }, 
          {
           "id": "96990C", 
           "name": "Williams Terminals Co"
          }, 
          {
           "id": "80412W", 
           "name": "ARAMCO"
          }, 
          {
           "id": "80412K", 
           "name": "SABIC"
          }, 
          {
           "id": "097023", 
           "name": "Boeing Co"
          }
        ],
        "links":[
          {
           "source": 0, 
           "synopsis": "Iranian Shipping Line and state-owned Pakistan National Shipping Corp have\nsigned a final agreement to form a joint shipping venture.  The partners\nhad signed a memorandum of understanding in 1983, but the Pakistani\ngovernment had not given the go-ahead for the launch of the venture until\nJanuray 1995.  The new company was owned 51% by Iranian Shipping and 49% by\nPakistan National Shpping.", 
           "target": 1
          }, 
          {
           "source": 2, 
           "synopsis": "Saudi Arabian Oil Co{ARAMCO} and Mobil Yanbu Refining Co Inc (Mobil Yanbu),\na unit of Exxonmobil Corp formed a joint venture named Saudi Aramco Mobil\nRefinery Co Ltd{SAMREF} to provide oil and gas exploration services.", 
           "target": 3
          }   
        ]
    };  


    /**
     * Initialize the visualization
     * @param params - functions as the context of the tool
     */
    main.init = function (params) {
        $("#vis").on('contextmenu', function(e) {        
            return false;
        })
  //       Initialize things for the overall visualization
        chart = d3.select("#vis");
        height = params.height || 500;
        width = params.width || 960;
        chart.selectAll("svg").data([{height: height, width: width}]).enter().append("svg");
        svg = chart.select("svg");
        svg.attr("height", function(d) {return d.height;})
            .attr("width", function(d) {return d.width;});

        // viewCenter = {x:width/2,y:height/2};//{x:0,y:0};
        viewCenter = {x:0,y:0};

        graphContainer = svg.append("g", 'graph-container');
        linkG = graphContainer.append('g').attr('id', 'link-group');
        nodeG = graphContainer.append('g').attr('id', 'node-group');
        annotG = graphContainer.append('g').attr('id', 'annot-group');
        menuG = graphContainer.append('g').attr('id', 'menu-group');

        zoomed();

        // Create the context menus to be used later
        createContextMenu(linkCMList,'link');
        createContextMenu(nodeCMList,'node');

        // Load the data after we've set up the vis
        main.loadData(params);               

        force = d3.layout.force()
            .charge(-120)
            .linkDistance(500)
            .size([width, height]);


        force.nodes(main.graph.nodes)
            .links(main.graph.links)
            .start();

        linkVar = linkG.selectAll(".link")
            .data(main.graph.links)
            .enter().append("line")
            .attr("class", "link")
            .attr('id', function(d){ return d.source.id+'-'+d.target.id})
            .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        nodeVar = nodeG.selectAll(".node")
            .data(main.graph.nodes)
            .enter().append("circle")
            .attr('id', function(d){return d.id;})
            .attr("class", "node")
            .attr("r", nodeRadius);

        nodeVar.append("title")
            .text(function(d) { return d.name; });

        force.on("tick", main.tick);

        var hammertime = new Hammer(document.getElementById("vis"));
        hammertime.on("hammer.input", function(ev) {
            if (ev.pointerType == "touch") {
                main.handleTouchEvent(ev);
            }
        });
    };

    main.tick = function() {
            linkVar.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            nodeVar.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
          };

    main.updateGraph = function(){
        linkVar = linkVar.data(main.graph.links);
        var exitingLinks = linkVar.exit();
        exitingLinks.remove();
        var newLinks = linkVar.enter();
        newLinks.insert("line",".node").attr("class","link").attr('id', function(d){ return d.source.id+'-'+d.target.id});

        nodeVar = nodeVar.data(main.graph.nodes,function(d){return d.id;});
        var exitingNodes = nodeVar.exit();
        exitingNodes.remove();
        var newNodes = nodeVar.enter();

        newNodes.append("circle")
             .attr("r", nodeRadius)
             .attr("class","node");

        nodeVar.append("title")
            .text(function(d) { return d.name; });

        force.start();
        force.on("tick", main.tick);
    }

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
            if(!swipe && (event.distance > moveThreshold || (press && press.touches == 2))) { // TODO: check the 2nd condition since it is invoking a touchend event (2nd case below) at the start of two-finger swipe
                press.centers.push(event.center);
                press.events.push(event);
                var pressCentersForTransform = press.centers.slice(0);
                var transformedPressCenters = [];
                for(var i =0 ;i<pressCentersForTransform.length;i++){
                    transformedPressCenters.push(convertToPoint(pressCentersForTransform[i].x,pressCentersForTransform[i].y))
                }
                console.log(press.centers.slice(0))
                console.log(transformedPressCenters)
                swipe = {time: event.timeStamp, transformedCenters: transformedPressCenters.slice(0), centers: press.centers.slice(0), events: press.events.slice(0), touches: event.pointers.length, firstPointers: event.pointers};
            }
            if (swipe) {
                if(event.timeStamp > swipe.time) {
                    swipe.time = event.timeStamp;
                    swipe.centers.push(event.center);
                    swipe.transformedCenters.push(convertToPoint(event.center.x,event.center.y));
                    swipe.events.push(event);
                    if(event.pointers.length > swipe.touches) {
                        // update first pointers for the event
                        swipe.firstPointers = event.pointers;
                    }
                }
                
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
                    if(!press) {
                        return;
                    }
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
            console.log("single press handler")
            // console.log(press.events[1].timeStamp-press.events[0].timeStamp)
            if((press.events[1].timeStamp-press.events[0].timeStamp)>125){
                console.log("long press")                
            }else{
                console.log("tap")
            }
            if(hasClass(e, 'node')) {
                console.log("on node")                
                var focusNode = getFocusNode(event.center.x,event.center.y);
                main.drawDetailedSelectionMode(focusNode);                            
            }else{
                console.log("on bg")
                if(main.contextMenu) dismissContextMenu();
                main.refreshGraphVis();
            }            
        }else{
            if(tapCount==2){
                console.log("double tap handler")            
                if(hasClass(e, 'node')) {
                    console.log("on node")
                    // console.log($(e).attr('id'))
                    var curNodeId = $(e).attr('id');
                    if(hasClass(e,'expanded')){
                        svgRemoveClass("#"+curNodeId,'expanded');                        
                        collapseNode(curNodeId);
                    }else{
                        svgAddClass("#"+curNodeId,'expanded');
                        // main.graph.nodes.push({"name":"New_Node","group":1})
                        // main.graph.links.push({"source":8,"target":1,"value":1});
                        // console.log("attempting to expand ",curNodeName)
                        expandNode(curNodeId);
                    }
                    main.updateGraph();
                }else{
                    console.log("on bg")
                }
            }            
        }
        // console.log("resetting tapCount")
        tapCount = 0;
    }

    function handleMultiPressEvent(event) {
    }

    function handleSingleSwipeEvent(event) {
        var elm = document.elementFromPoint(event.center.x,event.center.y);
        // Reduce the points in the swipe if time has passed beyond threshold
        if(swipe.events.length > 2 && (swipe.events[swipe.events.length-1].timeStamp - swipe.events[swipe.events.length-2].timeStamp) > swipeReduceTime) {
            swipe.centers = pointReduction(swipe.centers);
        }
        var linkSelect = [];
        // check which links the swipe went through
        for(var i = 1; i < swipe.centers.length; i++) {
            linkSelect = linkSelect.concat(getPassThroughLinks(swipe.centers[i-1],swipe.centers[i]));
        }
        // turn all of the selectors into a selection string
        var linkQuery = '';
        linkSelect = linkSelect.getUnique();
        for(var j = 0; j < linkSelect.length; j++) {
            linkQuery += linkSelect[j] + ((j == linkSelect.length-1) ? '':', ');
        }
        // Select the links
        // console.log(linkQuery)        
        //console.log($(linkQuery));
        if(hasClass(elm, 'node')) {
            var focusNode = getFocusNode(event.center.x,event.center.y);
            if(focusNode!={}) movingNode = focusNode;
            console.log("dragging",focusNode.name)
            main.dragNode(focusNode,event);            
            force.stop();
            main.tick();
        }else{
            console.log("swiping")
            if(linkQuery!="") svgAddClass(linkQuery,'selected');            
        }
        if(event.isFinal){ // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
            if(hasClass(elm, 'node')) {
                console.log("dragend")
                main.dragEnd(event);
                movingNode = null;
                force.resume();
                main.tick();                   
            }else{
                console.log("swipe end");
                var pt = convertToPoint(event.center.x,event.center.y);
                // Set up the context menu at this point for the selected links
                if(linkQuery!="") showContextMenu(event,'link');
            }
            eventCleanup();
        }
    }

    function handleDoubleSwipeEvent(event) { // ISSUE: both events are always triggered together (might need to re-think about these interactions).
        if(event.isFinal){ // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
           eventCleanup();
           console.log("two finger swipe end")
           return;
        }
        if(event.pointers.length!=2){
            return;
        }
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


        var point1 = event.pointers[0];
        var point2 = event.pointers[1];        
        var zoomDelta = curScale-prevScale;
        // offsetX = -(curPointX * zoomDelta);
        // offsetY = -(curPointY * zoomDelta);
        
        // console.log(event)
        // (Math.abs(event.center.x-twoFingerSwipeStartCenter.x) < 10) && (Math.abs(event.center.y-twoFingerSwipeStartCenter.y) < 10)
        var pt1 = {x:event.pointers[0].clientX,y:event.pointers[0].clientY};
        var pt2 = {x:event.pointers[1].clientX,y:event.pointers[1].clientY};
        
        // console.log(swipe.events[1])

        var startPt1Center = {x:swipe.firstPointers[0].clientX,y:swipe.firstPointers[0].clientY};
        var startPt2Center = {x:swipe.firstPointers[1].clientX,y:swipe.firstPointers[1].clientY};

        var curDist = getDistanceBetweenPoints(pt1,pt2);
        var startDist = getDistanceBetweenPoints(startPt1Center,startPt2Center);
        var movementFromCenter = getDistanceBetweenPoints(event.center,swipe.centers[1]);

        if(isPinch==1){
            if(zoomDelta>0){
                console.log("pinch out");
                // viewCenter.x += event.center.x;
                // viewCenter.y += event.center.y;
            }else{
                console.log("pinch in");
                // viewCenter.x -= event.center.x;
                // viewCenter.y -= event.center.y;
            }

            // var dx = width,
            //       dy = height,
            //       cx = event.center.x ? event.center.x : dx / 2,
            //       cy = event.center.y ? event.center.y : dy / 2,
            //       i = d3.interpolateZoom(
            //         [(cx - viewCenter.x) / view.k, (cy - viewCenter.y) / view.k, dx / view.k],
            //         [(cx - viewCenter.x) / view1.k, (cy - viewCenter.y) / view1.k, dx / view1.k]
            //       );
            
            // scalechange = newscale - oldscale;

            // d3.select({}).transition().tween()
            var newZoom = Math.pow(2, zoomDelta) * viewZoom;
            newZoom = newZoom > 8 ? 8 : (newZoom < 1 ? 1 : newZoom);
            // console.log(1-Math.pow(2, zoomDelta));

            // offX = -1 * (event.center.x * zoomDelta);
            // offY = -1 * (event.center.y * zoomDelta);
            // viewCenter.x += offX
            // viewCenter.y += offY
            // var scaleVal = zoomScale(viewZoom) > 8 ? 8 : zoomScale(viewZoom);

            // console.log(event.center.x*viewZoom);
            // console.log(adjust);
            var adjust = {x: (event.center.x - width/2)*(Math.pow(2, zoomDelta)-1), y: (event.center.y - height/2)*(Math.pow(2, zoomDelta)-1)};
            var translate0 = {x: (width/2 - viewCenter.x)/viewZoom, y: (height/2 - viewCenter.y)/viewZoom};
            var l = {x: translate0.x * newZoom + viewCenter.x, y: translate0.y * newZoom + viewCenter.y};
            if(newZoom > 1 && newZoom < 8) {
                interpolateZoom([width/2-l.x-adjust.x, height/2-l.y-adjust.y], newZoom);
            }
        }else if(isPan==1){
            console.log("pan")
            viewCenter.x += deltaX;
            viewCenter.y += deltaY;   
            zoomed();     
        }else if((!pointInCircle(startPt1Center.x,startPt1Center.y,pt1.x,pt1.y,3) && !pointInCircle(startPt2Center.x,startPt2Center.y,pt2.x,pt2.y,3)) || Math.abs(curDist-startDist)>=5){
            console.log("not sure yet")
            if(Math.abs(curDist-startDist)>=5){
                isPinch = 1;
            }else if(Math.abs(movementFromCenter)>=8){
                isPan = 1;
            }            
        }

        // graphContainer.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")")
        // graphContainer.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")scale("+zoomScale(viewZoom)+")")
        // graphContainer.attr("transform","scale("+zoomScale(viewZoom)+")")        
    }

    function zoomed() {
        graphContainer.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")scale("+viewZoom+")");
    }

    function interpolateZoom(translate, scale) {
        viewZoom = scale;
        viewCenter.x += translate[0];
        viewCenter.y += translate[1];
        zoomed();
    }

    function location(p) {
        return {x:(p.x-viewCenter.x)/viewZoom,y:(p.y-viewCenter.y)/viewZoom};
    }

    function handleTripleSwipeEvent(event) {
        // Reduce the points in the swipe if time has passed beyond threshold
        if(swipe.events.length > 2 ) {
            swipe.centers = pointReduction(swipe.centers);
            swipe.transformedCenters = pointReduction(swipe.transformedCenters);
        }

        annotG.selectAll('.swipetrace').remove();
        
        var traceSelect = annotG.selectAll('.swipetrace')
            // .data([swipe.centers], function(d){return d.length});
            .data([swipe.transformedCenters], function(d){return d.length});

        traceSelect.enter().append('path')
            .attr('d', function(d){
                if(d.length < 2){
                    return '';
                }
                var pth = 'M '+d[0].x+' '+d[0].y;
                for(var i = 1; i < d.length; i++) {
                    if(d[i].x > d[0].x) {
                    }
                    pth += ' L '+d[i].x+' '+d[i].y;
                }
                return pth;
            })
            .attr('class', 'swipetrace')
            .style('fill', 'none')
            .style('stroke', '#777')
            .style('stroke-width', '3')
            .style('stroke-opacity', 0.6)
            .style('stroke-dasharray', '3 1');

        var nodeSelect = [];
        // check which links the swipe encloses in a convex shape
        for(var i = 1; i < swipe.transformedCenters.length; i++) {
            nodeSelect = nodeSelect.concat(getNodesInside(swipe.transformedCenters));
        }
        // turn all of the selectors into a selection string
        var nodeQuery = '';
        nodeSelect = nodeSelect.getUnique();
        for(var j = 0; j < nodeSelect.length; j++) {
            nodeQuery += nodeSelect[j] + ((j == nodeSelect.length-1) ? '':', ');
        }
        // Select the nodes
        svgAddClass(nodeQuery,'selected');
        if(event.isFinal==true){ // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
            // Set up the context menu at this point for the selected links
            if($('.node.selected').length > 0) showContextMenu(event,'node');

            // Clean up after the event
            eventCleanup();
            console.log("three finger swipe end")
        }
    }

    function handleHandSwipeEvent(event) {

    }

    function eventCleanup() {
        swipe = null;
        press = null;
        startDistance = null;           
        panThreshold = 0;
        pinchThreshold = 0;
        tapCount = 0;
        startCenter = null;
        isPinch = 0;
        isPan = 0;
    }

    function showContextMenu(event, type) {
        var pt = convertToPoint(event.center.x,event.center.y);

        // Set the context menu flag to be true
        main.contextMenu = true;


        // Move the context menu to the correct point and show it
        d3.select('#contextmenu-'+type)
            .attr('transform',  'translate('+(pt.x)+','+(pt.y)+')')
            .attr('visibility', 'visible');


    }

    function dismissContextMenu(){
        main.contextMenu = false;
        // just move the context menu to the origin, that should be off-screen
        d3.select('#contextmenu')
            .attr('transform',  'translate(0,0)')
            .attr('visibility', 'hidden');
    }

    function createContextMenu(list,type) {
        var cmInnerRadius = 35;
        var cmOuterRadius = 115;
        var cmInnerMargin = 4/cmInnerRadius;
        var cmOuterMargin = 4/cmOuterRadius;

        var deg = 2*Math.PI/(list.length);
        for(var i = 0; i < (list.length); i++) {
            var mid = Math.PI/2 + i*deg;
            var start = mid - deg/2;
            var end = mid + deg/2;
            list[i].angle = mid;
            list[i].start = start;
            list[i].end = end;
        }

        // Can't do more than 8 modes, also need to have the delete but always be at the bottom
        var cm = menuG.append('g')
            .attr('id', 'contextmenu-'+type);

        var select = cm.selectAll('.contextmenu-slice')
            .data(list, function(d){return d.angle;});

        var enter = select.enter().append('g')
            .attr('id', function(d){return 'slice-'+ d.classname;})
            .attr('class','contextmenu-slice');

        // add the path that defines the slice of the contextmenu first
        enter.append('path')
            .attr('d', function(d){return 'M'+(cmInnerRadius*Math.cos(d.start+cmInnerMargin))+' '+(cmInnerRadius*Math.sin(d.start+cmInnerMargin))
                +' L'+(cmOuterRadius*Math.cos(d.start+cmOuterMargin))+' '+(cmOuterRadius*Math.sin(d.start+cmOuterMargin))
                +' A'+cmOuterRadius+' '+cmOuterRadius+' 0 0 1 '
                +(cmOuterRadius*Math.cos(d.end-cmOuterMargin))+' '+(cmOuterRadius*Math.sin(d.end-cmOuterMargin))
                +' L'+(cmInnerRadius*Math.cos(d.end-cmInnerMargin))+' '+(cmInnerRadius*Math.sin(d.end-cmInnerMargin))
                +' A'+cmInnerRadius+' '+cmInnerRadius+' 0 0 0 '
                +(cmInnerRadius*Math.cos(d.start+cmInnerMargin))+' '+(cmInnerRadius*Math.sin(d.start+cmInnerMargin))
                ;});

        var middle = enter.append('g')
            .attr('class', 'middle')
            .attr('transform', function(d){return'translate('+(Math.cos(d.angle)*(cmOuterRadius-cmInnerRadius))+','
                + (Math.sin(d.angle)*(cmOuterRadius-cmInnerRadius*1.25))+')';});

        middle.append('text')
            .attr('class', 'contextmenu-label')
            .attr('y', '22px')
            .attr('fill', '#fff')
            .text(function(d){return d.displayName;});

        var icon = middle.append('g')
            .attr('class', 'contextmenu-icon')
            .attr('transform', 'translate(-24,-38)');

        icon.selectAll('path').data(function(d){return d.icon;})
            .enter().append('path')
            .attr('fill', '#fff')
            .attr('d', function(d){return d;});

        cm.attr('visibility', 'hidden');
    }

    function getNodesInside(poly) {
        var select = [];
        d3.selectAll('.node').each(function(n){
            if(isCircleInPoly(poly,n,50)) {
                select.push('#'+ n.id);
            }
        });
        return select;
    }

    function getPassThroughLinks(p1,p2) {
        var pt1 = convertToPoint(p1.x,p1.y);
        var pt2 = convertToPoint(p2.x,p2.y);
        var select = [];
        d3.selectAll('.link').each(function(l){
            if(lineIntersect(pt1,pt2,l.source,l.target)) {
                select.push('#'+l.source.id+'-'+l.target.id);
            }
        });
        return select;
    }

    function convertToPoint(px,py) {
        return {x: px / viewZoom - viewCenter.x/viewZoom, y: py / viewZoom - viewCenter.y/viewZoom};
    }

    function getFocusNode(px,py) {
        var pt = convertToPoint(px,py);
        // console.log(pt);
        var select = movingNode;        
        d3.selectAll('.node').each(function(curNode){
            if(pointInCircle(curNode.x,curNode.y,pt.x,pt.y,50)) {
                if(movingNode==null){
                    select = curNode;                    
                }
            }
        });
        return select;
    }

    main.dragNode = function(focusNode,event){
        var pt = convertToPoint(event.center.x,event.center.y);
        focusNode.px = pt.x;
        focusNode.x = pt.x;
        focusNode.py = pt.y;
        focusNode.y = pt.y;
    }

    main.dragEnd = function(event){
        var pt = convertToPoint(event.center.x,event.center.y);
        px = pt.x;
        py = pt.y;
        d3.selectAll('.node').each(function(curNode){
            if(pointInCircle(curNode.x,curNode.y,px,py,50)) {
                curNode.fixed = true;
            }
        });
    }

    main.drawDetailedSelectionMode = function(focusNode){
        d3.selectAll(".link")
            .style("stroke-opacity",function(curLink){
                if(curLink.source.name == focusNode.name || curLink.target.name==focusNode.name){
                    return 1;
                }else{
                    return 0.3;
                }
            });
        d3.selectAll(".node")
            .style("fill-opacity",function(curNode){
                if(curNode.name == focusNode.name || isPartner(curNode,focusNode)==1){
                    return 1;
                }else{
                    return 0.5;
                }
            });
    }

    main.refreshGraphVis = function(){
        d3.selectAll(".link")
            .style("stroke-opacity",1);
        d3.selectAll(".node")
            .style("fill-opacity",1);
    }

    function isPartner(node1,node2){
        console.log(main.graph.links.length);
        for(var i =0 ;i< main.graph.links.length;i++){
            var curLink = main.graph.links[i];
            var n1=curLink.source,n2=curLink.target;
            // if (curLink.source === parseInt(curLink.source, 10)){
            //     n1 = main.graph.nodes[curLink.source];
            //     n2 = main.graph.nodes[curLink.target];
            // }else{
            //     n1 = curLink.source;
            //     n2 = curLink.target;
            // }
            if((n1.id==node1.id && n2.id==node2.id) || (n1.id==node2.id && n2.id==node1.id)){
                return 1;
            }
        }
        return -1;
    }

    function collapseNode(nodeId){
        var nodesToDelete = [], linksToDelete = [];
        for(var i=0;i<main.graph.links.length;i++){
            var curLink = main.graph.links[i];
            var n1=curLink.source,n2=curLink.target;
            if((n1.id==nodeId)){
                if(isRemovableNode(n2)){
                    var linksToRemove = getLinks(n2);
                    for(var linkIndex =0;linkIndex < linksToRemove.length;linkIndex++){
                        linksToDelete.push(linksToRemove[linkIndex]);
                    }
                    nodesToDelete.push(n2);                    
                }
            }else if((n2.id==nodeId)){
                if(isRemovableNode(n1)){
                    var linksToRemove = getLinks(n1);
                    for(var linkIndex =0;linkIndex < linksToRemove.length;linkIndex++){
                        linksToDelete.push(linksToRemove[linkIndex]);
                    }
                    nodesToDelete.push(n1);
                }
            }
        }
        for(var i=0;i<linksToDelete.length;i++){
            var x = main.graph.links.indexOf(linksToDelete[i]);
            if(x != -1) {
                main.graph.links.splice(x, 1);
            }
        }
        for(var i=0;i<nodesToDelete.length;i++){
            var x = main.graph.nodes.indexOf(nodesToDelete[i]);
            if(x != -1) {
                main.graph.nodes.splice(x, 1);
            }        
        }
    }

    function isRemovableNode(targetNode){
        var linkCount = 0;
        for(var i=0;i<main.graph.links.length;i++){
            var curLink = main.graph.links[i];
            if(curLink.source.id == targetNode.id || curLink.target.id == targetNode.id){
                linkCount += 1;
            }
        }
        return (linkCount>1) ? false : true;
    }

    function getLinks(targetNode){
        var links = [];
        for(var i=0;i<main.graph.links.length;i++){
            var curLink = main.graph.links[i];
            if(curLink.source.id == targetNode.id || curLink.target.id == targetNode.id){
                links.push(curLink);
            }
        }
        return links;
    }

    function isExistingLink(currentLink){
        for(var i=0;i<main.graph.links.length;i++){
            if(((main.graph.nodes[currentLink.source] == main.graph.links[i].source) && (main.graph.nodes[currentLink.target] == main.graph.links[i].target)) || ((main.graph.nodes[currentLink.source] == main.graph.links[i].target) && (main.graph.nodes[currentLink.target] == main.graph.links[i].source)) || ((main.graph.nodes[currentLink.target] == main.graph.links[i].source) && (main.graph.nodes[currentLink.source] == main.graph.links[i].target))){
                return 1;
            }
        }

        for(var i=0;i<main.graph.links.length;i++){
            if(((currentLink.source == main.graph.links[i].source) && (currentLink.target == main.graph.links[i].target)) || ((currentLink.source == main.graph.links[i].target) && (currentLink.target == main.graph.links[i].source)) || ((currentLink.target == main.graph.links[i].source) && (currentLink.source == main.graph.links[i].target))){
                return 1;
            }
        }
        return -1;
    }

    function getNodeIndexByIdInVis(nodeId){
        for(var i=0;i<main.graph.nodes.length;i++){
            var curNode = main.graph.nodes[i];
            if(curNode.id==nodeId){
                return i;
            }
        }
        return -1;
    }

    function getNodeIndexByIdFromDb(nodeId){
        for(var i=0;i<graphDb.nodes.length;i++){
            var curNode = graphDb.nodes[i];
            if(curNode.id==nodeId){
                return i;
            }
        }
        return -1;   
    }

    function expandNode(nodeId){
        var partnerList = getConnectedNodesFromDb(nodeId);
        for(var i=0;i<partnerList.length;i++){
                if(getNodeIndexByIdInVis(partnerList[i])!=-1){ // if partner exists in viz
                    var sindex = getNodeIndexByIdInVis(nodeId);
                    var tindex = getNodeIndexByIdInVis(partnerList[i]);
                    if(sindex>-1 && tindex>-1){
                        var partnerNode = main.graph.nodes[tindex];
                        var currentLink = {"source":sindex,"target":tindex};
                        if(isExistingLink(currentLink)==-1){ // if current link does not already exist
                            main.graph.links.push(currentLink)
                        }                        
                    }
                }else{ //if partner does not exist in viz, add and create link
                    var nodeIndex = getNodeIndexByIdFromDb(partnerList[i]);
                    var newNode = {
                        "name":graphDb.nodes[nodeIndex].name,
                        "id":partnerList[i]
                    };
                    
                    main.graph.nodes.push(newNode);                    
                    var sindex = getNodeIndexByIdInVis(nodeId);
                    var tindex = getNodeIndexByIdInVis(partnerList[i]);
                    if(sindex>-1 && tindex>-1){
                        var currentLink = {"source":sindex,"target":tindex};
                        if(isExistingLink(currentLink)==-1){ // if current link does not already exist
                            main.graph.links.push(currentLink);
                    }
            }
            }
        }
    }

    function getConnectedNodesFromDb(nodeId){
        var nodeIndex = getNodeIndexByIdFromDb(nodeId);
        // console.log(nodeName,nodeIndex)
        var connectedNodes = [];
        for(var i=0;i<graphDb.links.length;i++){
            var curLink = graphDb.links[i];
            if(curLink.source==nodeIndex){
                connectedNodes.push(graphDb.nodes[curLink.target].id);
            }else if(curLink.target==nodeIndex){
                connectedNodes.push(graphDb.nodes[curLink.source].id);
            }
        }
        return connectedNodes;
    }

    function deleteNode(node){
        var nodeToDeleteIndex = main.graph.nodes.indexOf(node);
        if(nodeToDeleteIndex!=-1){
            main.graph.nodes.splice(nodeToDeleteIndex,1);
        }
        var linksToDelete = [];
        for(var i=0;i<main.graph.links.length;i++){
            if((main.graph.links[i]['source']['id']==node.id) || (main.graph.links[i]['target']['id']==node.id)){
                linksToDelete.push(main.graph.links[i]);
            }
        }
        for(var i=0;i<linksToDelete.length;i++){
            var x = main.graph.links.indexOf(linksToDelete[i]);
            if(x != -1) {
                main.graph.links.splice(x, 1);
            }
        }
    }

    function deleteLink(link){
        var linkToDeleteIndex = main.graph.links.indexOf(link);
        if(linkToDeleteIndex!=-1){
            main.graph.links.splice(linkToDeleteIndex,1);
        }
    }

    main.loadData = function(params) {
        // Load data for the visualization here
    };

    main.resizeWindow = function() {
        // Resize the visualization
    };
})();