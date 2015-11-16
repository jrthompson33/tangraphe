
/**
 * Created by John Thompson
 */

(function(){

    // The global objects for the visualization
    main = {contextMenu: false};
    data = {};

    var chart, svg, height, width, swipe, press, tick, timer, tapCount= 0, force, linkVar,nodeVar, movingNode = null, graphContainer ,panThreshold = 0, pinchThreshold =0;

    var nodeG, linkG, menuG;
    var startDistance = null;

    var moveThreshold = 9;
    var swipeReduceTime = 10;
    var longPressThreshold = 15;
    var longPressTimeout = 350;
    var viewCenter = {x:0,y:0};
    var viewZoom = 1;
    var zoomScale = d3.scale.linear().domain([0,1]).range([1,4]);    
    var color = d3.scale.category20();

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

        graphContainer = svg.append("g", 'graph-container');
        linkG = graphContainer.append('g').attr('id', 'link-group');
        nodeG = graphContainer.append('g').attr('id', 'node-group');
        annotG = graphContainer.append('g').attr('id', 'annot-group');
        menuG = graphContainer.append('g').attr('id', 'menu-group');

        createContextMenu();

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
            .attr('id', function(d){ return d.source.name+'-'+d.target.name})
            .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        nodeVar = nodeG.selectAll(".node")
            .data(main.graph.nodes)
            .enter().append("circle")
            .attr('id', function(d){return d.name;})
            .attr("class", "node")
            .attr("r", 50)
            .style("fill", function(d) { return color(d.group); });

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
        newLinks.insert("line",".node").attr("class","link");

        nodeVar = nodeVar.data(main.graph.nodes,function(d){return d.name;});
        var exitingNodes = nodeVar.exit();
        exitingNodes.remove();
        var newNodes = nodeVar.enter();

        newNodes.append("circle")
             .attr("r", 50)
             .attr("class","node")
             .style("fill", function(d) { return color(d.group); });

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
            if(!swipe && event.distance > moveThreshold) { // TODO: check the 2nd condition since it is invoking a touchend event (2nd case below) at the start of two-finger swipe
                press.centers.push(event.center);
                press.events.push(event);
                swipe = {time: event.timeStamp, centers: press.centers.slice(0), events: press.events.slice(0), touches: event.pointers.length};
            }
            if (swipe) {
                if(event.timeStamp > swipe.time) {
                    swipe.time = event.timeStamp;
                    swipe.centers.push(event.center);
                    swipe.events.push(event);
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
            }else{
                console.log("on bg")
                if(main.contextMenu) dismissContextMenu();
            }            
        }else{
            if(tapCount==2){
                console.log("double tap handler")            
                if(hasClass(e, 'node')) {
                    console.log("on node")
                    main.graph.nodes.push({"name":"New_Node","group":1})
                    main.graph.links.push({"source":8,"target":1,"value":1});
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
                console.log("swipe end")
                // Set up the context menu at this point for the selected links
                if(linkQuery!=""){
                    d3.select('#contextmenu')
                    .attr('transform',  'translate('+(event.center.x)+','+(event.center.y)+')')
                    .attr('visibility', 'visible');
                    main.contextMenu = true;                       
                }                
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

        //console.log(event.pointers.length)
        viewZoom += zoomDelta;
        viewCenter.x += deltaX;
        viewCenter.y += deltaY; 
        if(zoomDelta>0){
            // console.log("pinch out");
        }else{
            // console.log("pinch in");
        }
        // console.log(event)
        // (Math.abs(event.center.x-twoFingerSwipeStartCenter.x) < 10) && (Math.abs(event.center.y-twoFingerSwipeStartCenter.y) < 10)
        var pt1 = {x:event.pointers[0].clientX,y:event.pointers[0].clientY};
        var pt2 = {x:event.pointers[1].clientX,y:event.pointers[1].clientY};
        var d = getDistanceBetweenPoints(pt1,pt2);

       
        var movementFromCenter = getDistanceBetweenPoints(event.center,swipe.centers[0]);
            if(Math.abs(movementFromCenter)>=3){
                console.log("pan")
            }else{
                console.log("pinch")
            }
            // panThreshold += 1;
            // console.log("pan")
        // }else{
            // console.log(panThreshold)
            // if(panThreshold>15)
            // {
            //     pinchThreshold += 1;
            // }            
            // console.log("pinch")
        // }        
        // if(pinchThreshold>0){
        //     console.log("pinch")
        // }else{
        //     console.log("pan")
        // }
        // if(){        
            // console.log("pinch")
        // }else{
            // console.log("pan")            
        // }

        // graphContainer.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")")
        // graphContainer.attr("transform","translate("+viewCenter.x+","+viewCenter.y+")scale("+zoomScale(viewZoom)+")")
        // graphContainer.attr("transform","scale("+zoomScale(viewZoom)+")")        
    }

    function handleTripleSwipeEvent(event) {
        // Reduce the points in the swipe if time has passed beyond threshold
        if(swipe.events.length > 2 ) {
            swipe.centers = pointReduction(swipe.centers);
        }

        annotG.selectAll('.swipetrace').remove();
        
        var traceSelect = annotG.selectAll('.swipetrace')
            .data([swipe.centers], function(d){return d.length});

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
        for(var i = 1; i < swipe.centers.length; i++) {
            nodeSelect = nodeSelect.concat(getNodesInside(swipe.centers));
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
            d3.select('#contextmenu')
                .attr('transform',  'translate('+(event.center.x)+','+(event.center.y)+')')
                .attr('visibility', 'visible');

            main.contextMenu = true;

            // TODO set up listeners here

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
    }

    function dismissContextMenu(){
        main.contextMenu = false;
        // just move the context menu to the origin, that should be off-screen
        d3.select('#contextmenu')
            .attr('transform',  'translate(0,0)')
            .attr('visibility', 'hidden');
    }

    function createContextMenu() {
        var slices = [];
        var cmInnerRadius = 35;
        var cmOuterRadius = 115;
        var cmInnerMargin = 4/cmInnerRadius;
        var cmOuterMargin = 4/cmOuterRadius;

        var modes = ['DELETE, BUNDLE, CLEAR'];

        var trashIcon = ["M116,161.7c0-0.1-0.1-0.3-0.3-0.4c-1.1,1.1-5.5,1.3-10.7,1.3s-9.6-0.2-10.7-1.3c-0.1,0.1-0.2,0.3-0.3,0.4h0"
        +"l0,0.1c0,0,0,0,0,0c0,0,0,0,0,0.1l0.9,17.5h0c0.1,1.4,1.6,3.4,10.1,3.4c8.5,0,10.1-2.1,10.1-3.4h0l0.9-17.5c0,0,0,0,0-0.1"
        +"C116,161.8,116,161.8,116,161.7L116,161.7L116,161.7z",
            "M110.2,152.5v-4.1c0-0.7-0.6-1.4-1.4-1.4h-8.2c-0.7,0-1.4,0.6-1.4,1.4v4.2c-4,0.5-6.8,1.4-6.8,2.5v2"
            +"c0,0.4,0.4,0.8,1.2,1.2c2,0.9,6.3,1.6,11.3,1.6c5,0,9.3-0.7,11.3-1.6c0.8-0.4,1.2-0.8,1.2-1.2v-2"
            +"C117.5,153.9,114.5,152.9,110.2,152.5z M101.9,152.3l-0.3,0v-1.7c0-0.7,0.1-1.4,0.2-1.4c0.1,0,0.8,0,1.6,0h2.7c0.7,0,1.5,0,1.6,0"
            +"c0.1,0,0.2,0.6,0.2,1.4v1.7c-0.9,0-1.9-0.1-3-0.1C103.9,152.2,102.9,152.3,101.9,152.3z"];

        var deg = 2*Math.PI/(3);
        for(var i = 0; i < (3); i++) {
            var mid = Math.PI/2 + i*deg;
            // console.log(mid*180/Math.PI);
            var start = mid - deg/2;
            var end = mid + deg/2;
            slices.push({angle: mid, start: start, end: end});
        }

        // Can't do more than 8 modes, also need to have the delete but always be at the bottom
        var cm = menuG.append('g')
            .attr('id', 'contextmenu');

        var select = cm.selectAll('.contextmenu-slice')
            .data(slices, function(d){return d.angle;});

        var enter = select.enter().append('g')
            .attr('id', function(d,i){return 'slice-'+((i==0)?'r':(i-1));})
            .attr('class', function(d,i){return'contextmenu-slice'+(i==0?'':' slice-mode');});

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
            .attr('transform', function(d){return'translate('+(Math.cos(d.angle)*(cmOuterRadius-cmInnerRadius*1.25))+','
                + (Math.sin(d.angle)*(cmOuterRadius-cmInnerRadius*1.25))+')';});

        middle.append('text')
            .attr('class', 'contextmenu-label')
            .attr('y', '22px')
            .text(function(d,i){return modes[i];});

        var deleteMiddle = d3.select('#slice-r .middle');

        deleteMiddle.append('path')
            .style('-webkit-transform', 'translate(-104px,-176px)')
            .style('fill', '#F00')
            .style('fill-opacity', '0.5')
            .attr('d', trashIcon[0]);

        deleteMiddle.append('path')
            .style('transform', 'translate(-104px,-176px)')
            .style('-webkit-transform', 'translate(-104px,-176px)')
            .style('fill', '#F00')
            .style('fill-opacity', '0.5')
            .attr('d', trashIcon[1]);

        cm.attr('visibility', 'hidden');
    }

    function getNodesInside(poly) {
        var select = [];
        d3.selectAll('.node').each(function(n){

            if(isCircleInPoly(poly,n,50)) {
                select.push('#'+ n.name);
            }
        });
        return select;
    }

    function getPassThroughLinks(p1,p2) {
        var select = [];
        d3.selectAll('.link').each(function(l){
            if(lineIntersect(p1,p2,l.source,l.target)) {
                select.push('#'+l.source.name+'-'+l.target.name);
            }
        });
        return select;
    }

    function getFocusNode(px,py) {
        var select = movingNode;        
        d3.selectAll('.node').each(function(curNode){
            if(pointInCircle(curNode.x,curNode.y,px,py,50)) {
                if(movingNode==null){
                    select = curNode;                    
                }
            }
        });
        return select;
    }

    main.dragNode = function(focusNode,event){
        focusNode.px = event.center.x;
        focusNode.x = event.center.x;
        focusNode.py = event.center.y;
        focusNode.y = event.center.y;
    }

    main.dragEnd = function(event){
        px = event.center.x;
        py = event.center.y;
        d3.selectAll('.node').each(function(curNode){
            if(pointInCircle(curNode.x,curNode.y,px,py,50)) {
                curNode.fixed = true;
            }
        });
    }

    main.loadData = function(params) {
        // Load data for the visualization here
    };

    main.resizeWindow = function() {
        // Resize the visualization
    };
})();