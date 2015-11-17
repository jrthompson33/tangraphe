/**
 * Created by John Thompson & Arjun Srinivasan
 */
(function() {

    // The global objects for the visualization and selection states.
    main = {
        contextMenu: false
    };
    data = {};

    var chart, svg, height, width, swipe, press, tick, timer, tapCount = 0,
        force, linkVar, nodeVar, movingNode = null,
        graphContainer, panThreshold = 0,
        pinchThreshold = 0;
    var nodeRadius = 25,
        isTap, isLongPress;
    var detailedSelectionOn = false,
        activeNodeIds = [],
        detailsNodeId;

    var isPinch = 0,
        isPan = 0;
    var nodeG, linkG, menuG, annotG;
    var startDistance = null;

    var moveThreshold = 9;
    var swipeReduceTime = 10;
    var longPressThreshold = 15;
    var longPressTimeout = 350;
    var viewCenter;
    var viewZoom = 1;
    var color = d3.scale.category20();

    var bundleCA = new ContextAction('BUNDLE', 'linkbundle', ["M26.7,34.1c1.3,1.4,7.5,4.9,7.5,4.9l2.4-4.7c0,0-10-4.8-9.8-9.6v-6l0,0H31L24,9l-7.1,9.6h0h4.4l0,0v6 " + "c0.1,4.8-9.8,9.6-9.8,9.6l2.4,4.7c0,0,6.2-3.5,7.5-4.9l2.6-2.3L26.7,34.1z"]);

    var collapseCA = new ContextAction('COLLAPSE', 'nodecollapse', ["M26,22 L27.7,11 L30.6,13.9 L36.5,8 L40,11.5 L34,17.4 L37,20.3 L26,22",
        "M22,26 L20.3,37 L17.4,34.1 L11.5,40 L8,36.5 L13.9,30.6 L11,27.7 L22,26",
        "M22,22 L11,20.3 L13.9,17.4 L8,11.5 L11.5,8 L17.4,13.9 L20.3,11 L22,22",
        "M26,26 L37,27.7 L34.1,30.6 L40,36.5 L36.5,40 L30.6,34.1 L27.7,37 L26,26"
    ]);

    var expandCA = new ContextAction('EXPAND', 'nodeexpand', ["M40,8 L38.3,19 L35.4,16.1 L29.5,22 L26,18.5 L31.9,12.6 L29,9.7 L40,8",
        "M8,40 L9.7,29 L12.6,31.9 L18.5,26 L22,29.5 L16.1,35.4 L19,38.3 L8,40",
        "M8,8 L19,9.7 L16.1,12.6 L22,18.5 L18.5,22 L12.6,16.1 L9.7,19 L8,8",
        "M40,40 L29,38.3 L31.9,35.4 L26,29.5 L29.5,26 L35.4,31.9 L38.3,29 L40,40"
    ]);

    var noderemoveCA = new ContextAction('REMOVE', 'noderemove', ["M39,11.3 L36.7,9 L24,21.7 L11.3,9 L9,11.3 L21.7,24 L9,36.7 L11.3,39 L24,26.3 L36.7,39 L39,36.7 L26.3,24 L39,11.3"]);

    var linkremoveCA = new ContextAction('REMOVE', 'linkremove', ["M39,11.3 L36.7,9 L24,21.7 L11.3,9 L9,11.3 L21.7,24 L9,36.7 L11.3,39 L24,26.3 L36.7,39 L39,36.7 L26.3,24 L39,11.3"]);

    var linkCA = new ContextAction('SEL LINKS', 'selectlinks', ["M35.2,30.6c-1.7,0-3.1,0.7-4.1,1.9l-13-7c0.1-0.5,0.2-1,0.2-1.5s-0.1-1-0.2-1.5l13-7c1,1.2,2.5,1.9,4.1,1.9 " + "c3,0,5.5-2.4,5.5-5.5c0-3-2.5-5.5-5.5-5.5c-3,0-5.5,2.5-5.5,5.5c0,0.5,0.1,1,0.2,1.5l-13,7c-1-1.1-2.5-1.9-4.1-1.9 " + "c-3,0-5.5,2.4-5.5,5.4s2.5,5.4,5.5,5.4c1.6,0,3.1-0.7,4.1-1.9l13,7c-0.1,0.5-0.2,1-0.2,1.5c0,3,2.5,5.5,5.5,5.5c3,0,5.5-2.5,5.5-5.5 " + "C40.7,33,38.2,30.6,35.2,30.6z"]);

    var nodeCA = new ContextAction('SEL NODES', 'selectnodes', ["M35.2,30.6c-1.7,0-3.1,0.7-4.1,1.9l-13-7c0.1-0.5,0.2-1,0.2-1.5s-0.1-1-0.2-1.5l13-7c1,1.2,2.5,1.9,4.1,1.9 " + "c3,0,5.5-2.4,5.5-5.5c0-3-2.5-5.5-5.5-5.5c-3,0-5.5,2.5-5.5,5.5c0,0.5,0.1,1,0.2,1.5l-13,7c-1-1.1-2.5-1.9-4.1-1.9 " + "c-3,0-5.5,2.4-5.5,5.4s2.5,5.4,5.5,5.4c1.6,0,3.1-0.7,4.1-1.9l13,7c-0.1,0.5-0.2,1-0.2,1.5c0,3,2.5,5.5,5.5,5.5c3,0,5.5-2.5,5.5-5.5 " + "C40.7,33,38.2,30.6,35.2,30.6z"]);

    var linkCMList = [linkremoveCA, bundleCA, nodeCA];
    var nodeCMList = [noderemoveCA, expandCA, collapseCA, linkCA];


    main.graph = {
        "nodes": [],
        "links": []
    };


    /**
     * Initialize the visualization
     * @param params - functions as the context of the tool
     */
    main.init = function(params) {

        // initializes the graph with 50 nodes and links from the graphDb in graphData.js
        for (var i = 0; i < 50; i++) {
            main.graph.nodes.push(graphDb.nodes[i]);
            main.graph.links.push(graphDb.links[i]);
        }

        $("#vis").on('contextmenu', function(e) {
            return false;
        })
        
        //Initialize things for the overall visualization
        chart = d3.select("#vis");
        height = params.height || 500;
        width = params.width || 960;
        chart.selectAll("svg").data([{
            height: height,
            width: width
        }]).enter().append("svg");
        svg = chart.select("svg");
        svg.attr("height", function(d) {
                return d.height;
            })
            .attr("width", function(d) {
                return d.width;
            });

        viewCenter = {
            x: 0,
            y: 0
        };

        graphContainer = svg.append("g", 'graph-container'); // container group used for all zoom + pan transforms
        linkG = graphContainer.append('g').attr('id', 'link-group'); // container group used for links
        nodeG = graphContainer.append('g').attr('id', 'node-group'); // container group used for nodes
        annotG = graphContainer.append('g').attr('id', 'annot-group'); // container group used for drawing selection feedback
        menuG = graphContainer.append('g').attr('id', 'menu-group'); // container group used for context menu

        zoomed();

        // Create the context menus to be used later
        createContextMenu(linkCMList, 'link');
        createContextMenu(nodeCMList, 'node');

        // Load the data after we've set up the vis
        main.loadData(params);

        // initialize force layout parameters
        force = d3.layout.force()
            .charge(-120)
            .linkDistance(500)
            .size([width, height]);


        force.nodes(main.graph.nodes)
            .links(main.graph.links)
            .start();

        // add and draw links
        linkVar = linkG.selectAll(".link")
            .data(main.graph.links)
            .enter().append("line")
            .attr("class", function(d) {
                return "link link-" + d.source.id + " link-" + d.target.id;
            })
            .attr('id', function(d) {
                return d.source.id + '-' + d.target.id
            })
            .style("stroke-width", function(d) {
                return Math.sqrt(d.value);
            });

        // add and draw nodes
        nodeVar = nodeG.selectAll(".node")
            .data(main.graph.nodes)
            .enter().append("circle")
            .attr('id', function(d) {
                return d.id;
            })
            .attr("class", "node")
            .attr("r", nodeRadius);

        nodeVar.append("title")
            .text(function(d) {
                return d.name;
            });

        force.on("tick", main.tick);

        // recognize all raw touch inputs on the visualization div
        var hammertime = new Hammer(document.getElementById("vis"));
        hammertime.on("hammer.input", function(ev) {
            if (ev.pointerType == "touch") {
                main.handleTouchEvent(ev);
            }
        });
    };

    // tick function to update node and link positions
    main.tick = function() {
        linkVar.attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        nodeVar.attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });
    };

    // re-draw function for the visualization after data change (expand, collapse, delete etc.)
    main.updateGraph = function() {
        linkVar = linkVar.data(main.graph.links);
        var exitingLinks = linkVar.exit();
        exitingLinks.remove();
        var newLinks = linkVar.enter();
        newLinks.insert("line", ".node").attr('id', function(d) {
                var curLink = d,
                    n1, n2;
                if (curLink.source === parseInt(curLink.source, 10)) {
                    n1 = main.graph.nodes[curLink.source];
                    n2 = main.graph.nodes[curLink.target];
                } else {
                    n1 = curLink.source;
                    n2 = curLink.target;
                }
                d.source = n1;
                d.target = n2;
                return n1.id + '-' + n2.id
            })
            .attr("class", function(d) {
                return "link link-" + d.source.id + " link-" + d.target.id;
            });

        nodeVar = nodeVar.data(main.graph.nodes, function(d) {
            return d.id;
        });
        var exitingNodes = nodeVar.exit();
        exitingNodes.remove();
        var newNodes = nodeVar.enter();

        newNodes.append("circle")
            .attr("r", nodeRadius)
            .attr("class", "node")
            .attr("id", function(d) {
                return d.id;
            });

        nodeVar.append("title")
            .text(function(d) {
                return d.name;
            });

        force.start();
        force.on("tick", main.tick);
    }


    /**
     * Processes all touch events
     * @param event - raw touch event as collected by hammer.js
     */ 
    main.handleTouchEvent = function(event) {
        var px = event.center.x;
        var py = event.center.y;

        if (event.isFirst) {
            // Create a new press object to handle this event stream
            press = {
                time: event.timeStamp,
                centers: [event.center],
                events: [event],
                touches: event.pointers.length
            };

        } else {
            // Check if this event moved enough, then start a swipe
            if (!swipe && (event.distance > moveThreshold || (press && press.touches == 2))) { // TODO: check the 2nd condition since it is invoking a touchend event (2nd case below) at the start of two-finger swipe
                press.centers.push(event.center);
                press.events.push(event);
                var pressCentersForTransform = press.centers.slice(0);
                var transformedPressCenters = [];
                for (var i = 0; i < pressCentersForTransform.length; i++) {
                    transformedPressCenters.push(convertToPoint(pressCentersForTransform[i].x, pressCentersForTransform[i].y))
                }
                swipe = {
                    time: event.timeStamp,
                    transformedCenters: transformedPressCenters.slice(0),
                    centers: press.centers.slice(0),
                    events: press.events.slice(0),
                    touches: event.pointers.length,
                    firstPointers: event.pointers
                };
                // Handle if this is a new touch event - clear off the vis
                handleNewTouch(event);
            }
            if (swipe) {
                if (event.timeStamp > swipe.time) {
                    swipe.time = event.timeStamp;
                    swipe.centers.push(event.center);
                    swipe.transformedCenters.push(convertToPoint(event.center.x, event.center.y));
                    swipe.events.push(event);
                    if (event.pointers.length > swipe.touches) {
                        // update first pointers for the event
                        swipe.firstPointers = event.pointers;
                    }
                }

                // Always take the greater of the two
                // if a swipe starts out as one finger but ends as two we want it to be a double swipe

                swipe.touches = swipe.touches > event.pointers.length ? swipe.touches : event.pointers.length;


                // Handles a switch such that we override any events that were triggered from a different swipe
                if (swipe.touches == 1) {
                    handleSingleSwipeEvent(event);
                } else if (swipe.touches == 2) {
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
                    if (!press) {
                        return;
                    }
                    press.time = event.timeStamp;
                    press.centers.push(event.center);
                    press.events.push(event);
                    // Always take the greater of the two
                    // if a press starts out as one finger but ends as two we want it to be a double press
                    press.touches = press.touches > event.pointers.length ? press.touches : event.pointers.length;
                    if (press.touches == 1) {
                        handleSinglePressEvent(event);
                    } else {
                        handleMultiPressEvent(event);
                    }
                }, 250);
            }
        }
    };

    /**
     * Handles a new touch and clears the current selections
     * @param event - new touch event
    */
    function handleNewTouch(event) {
        if (main.contextMenu) dismissContextMenu();
        svgRemoveClass('.link', 'selected');
        svgRemoveClass('.node', 'selected');
        $('.swipetrace').remove();
    }

    /**
     * Handler for single press events. These include tap, long press, and double tap.
     * @param event - touch event
    */
    function handleSinglePressEvent(event) {
        var e = document.elementFromPoint(event.center.x, event.center.y);
        if (tapCount == 1) { // handle a single tap event (tap or long press)
            // console.log("single press handler")
            if ((press.events[1].timeStamp - press.events[0].timeStamp) > 125) {
                // console.log("long press")     
                isLongPress = true;
            } else {
                // console.log("tap")
                isTap = true;
            }
            if (hasClass(e, 'node')) {
                // Handle if this is a new touch event - clear off the vis
                handleNewTouch(event);
                if (isLongPress) { // handle long press event on node (trigger detailed selection mode)
                    console.log("long press on node")
                    var focusNode = getFocusNode(event.center.x, event.center.y);
                    main.drawDetailedSelectionMode(focusNode);
                } else { // handle tap event on node (trigger node network highlight)
                    console.log("tap on node")
                    var focusNode = getFocusNode(event.center.x, event.center.y);
                    main.highlightNodeNetwork(focusNode);
                }
            } else if (main.contextMenu && hasClass(e, 'contextmenu-slice')) { // tap is on context menu
                if (!e.__data__.hasOwnProperty('className')) {
                    e = e.parentNode;
                }
                main.contextMenuListener[e.__data__.className]();
            } else { // clear selections, new touch event
                // Handle if this is a new touch event - clear off the vis
                handleNewTouch(event);
                main.refreshGraphVis();
            }
        } else {
            if (tapCount == 2) { // handle double tap event
                // console.log("double tap handler")
                if (hasClass(e, 'node')) { // double tap event on node
                    // console.log("on node")
                    // console.log($(e).attr('id'))
                    var curNodeId = $(e).attr('id');
                    if (hasClass(e, 'expanded')) { // if node is expanded, collapse it
                        svgRemoveClass("#" + curNodeId, 'expanded');
                        collapseNode(curNodeId);
                    } else { // if node is node expanded, expand it
                        svgAddClass("#" + curNodeId, 'expanded');
                        expandNode(curNodeId);
                    }
                    main.updateGraph();
                } else { // double tap event outside node
                    console.log("on bg")
                }
            }
        }
        tapCount = 0;
        isLongPress = false;
        isTap = false;
    }

    function handleMultiPressEvent(event) {}

    /**
     * Handler for single swipe events. These include dragging and selection of links.
     * @param event - touch event with one finger swipe
    */
    function handleSingleSwipeEvent(event) {
        var elm = document.elementFromPoint(event.center.x, event.center.y); // get element under touch point
        // Reduce the points in the swipe if time has passed beyond threshold
        if (swipe.events.length > 2 && (swipe.events[swipe.events.length - 1].timeStamp - swipe.events[swipe.events.length - 2].timeStamp) > swipeReduceTime) {
            swipe.centers = pointReduction(swipe.centers);
        }
        var linkSelect = [];
        // check which links the swipe went through
        for (var i = 1; i < swipe.centers.length; i++) {
            linkSelect = linkSelect.concat(getPassThroughLinks(swipe.centers[i - 1], swipe.centers[i]));
        }
        // turn all of the selectors into a selection string
        var linkQuery = '';
        linkSelect = linkSelect.getUnique();
        for (var j = 0; j < linkSelect.length; j++) {
            linkQuery += linkSelect[j] + ((j == linkSelect.length - 1) ? '' : ', ');
        }
        if (movingNode != null || hasClass(elm, 'node')) { // check if the swipe is on the node, if yes then it is a drag event
            var focusNode = getFocusNode(event.center.x, event.center.y);
            if (focusNode != {}) movingNode = focusNode;
            main.dragNode(focusNode, event);
            force.stop();
            main.tick();
        } else { //else, select the links        
            console.log("swiping")
            if (linkQuery != "") svgAddClass(linkQuery, 'selected');
        }
        if (event.isFinal) { // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
            if (hasClass(elm, 'node')) {
                console.log("dragend")
                main.dragEnd(event);
                movingNode = null;
                force.resume();
                main.tick();
            } else {
                console.log("swipe end");
                var pt = convertToPoint(event.center.x, event.center.y);
                // Set up the context menu at this point for the selected links
                if (linkQuery != "") showContextMenu(event, 'link');
            }
            eventCleanup();
        }
    }

    /**
     * Handler for double swipe events. These include pinch (zoom) and pan.
     * @param event - touch event with two finger swipe
    */
    function handleDoubleSwipeEvent(event) {
        if (event.isFinal) { // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
            eventCleanup();
            console.log("two finger swipe end")
            return;
        }
        if (event.pointers.length != 2) {
            return;
        }
        var curPointX = event.center.x;
        var curPointY = event.center.y;
        var curScale = event.scale;
        var swipePointsLength = swipe.centers.length;


        var prevPointX, prevPointY, prevScale;
        if (swipePointsLength < 2) {
            prevPointX = swipe.centers[swipePointsLength - 1].x;
            prevPointY = swipe.centers[swipePointsLength - 1].y;
            prevScale = swipe.events[swipePointsLength - 1].scale;
        } else {
            prevPointX = swipe.centers[swipePointsLength - 2].x;
            prevPointY = swipe.centers[swipePointsLength - 2].y;
            prevScale = swipe.events[swipePointsLength - 2].scale;
        }
        var deltaY = curPointY - prevPointY;
        var deltaX = curPointX - prevPointX;


        var point1 = event.pointers[0];
        var point2 = event.pointers[1];
        var zoomDelta = curScale - prevScale;

        var pt1 = {
            x: event.pointers[0].clientX,
            y: event.pointers[0].clientY
        };
        var pt2 = {
            x: event.pointers[1].clientX,
            y: event.pointers[1].clientY
        };

        var startPt1Center = {
            x: swipe.firstPointers[0].clientX,
            y: swipe.firstPointers[0].clientY
        };
        var startPt2Center = {
            x: swipe.firstPointers[1].clientX,
            y: swipe.firstPointers[1].clientY
        };

        var curDist = getDistanceBetweenPoints(pt1, pt2);
        var startDist = getDistanceBetweenPoints(startPt1Center, startPt2Center);
        var movementFromCenter = getDistanceBetweenPoints(event.center, swipe.centers[1]);

        if (isPinch == 1) { // handle pinch event
            if (zoomDelta > 0) {
                console.log("pinch out");
            } else {
                console.log("pinch in");
            }

            // applying necessary scale and transform for zoom
            var newZoom = Math.pow(2, zoomDelta) * viewZoom;
            newZoom = newZoom > 8 ? 8 : (newZoom < 1 ? 1 : newZoom);

            var adjust = {
                x: (event.center.x - width / 2) * (Math.pow(2, zoomDelta) - 1),
                y: (event.center.y - height / 2) * (Math.pow(2, zoomDelta) - 1)
            };
            var translate0 = {
                x: (width / 2 - viewCenter.x) / viewZoom,
                y: (height / 2 - viewCenter.y) / viewZoom
            };
            var l = {
                x: translate0.x * newZoom + viewCenter.x,
                y: translate0.y * newZoom + viewCenter.y
            };
            if (newZoom > 1 && newZoom < 8) {
                interpolateZoom([width / 2 - l.x - adjust.x, height / 2 - l.y - adjust.y], newZoom);
            }
        } else if (isPan == 1) { // applying necessary transform (and constant scale carried over from previous value) for pan
            console.log("pan")
            viewCenter.x += deltaX;
            viewCenter.y += deltaY;
            zoomed();
        } else if ((!pointInCircle(startPt1Center.x, startPt1Center.y, pt1.x, pt1.y, 3) && !pointInCircle(startPt2Center.x, startPt2Center.y, pt2.x, pt2.y, 3)) || Math.abs(curDist - startDist) >= 5) { // if both centers are within offset radius then the pan vs pinch hasn't been decided yet
            console.log("not sure yet")
            if (Math.abs(curDist - startDist) >= 5) { // if fingers come close or move far apart from each other, it is a pinch
                isPinch = 1;
            } else if (Math.abs(movementFromCenter) >= 8) { // if the center of the line between the two fingers changes a lot then it is a pan
                isPan = 1;
            }
        }
    }

    /**
     * Performs the actual zoom + pan     
    */
    function zoomed() {
        graphContainer.attr("transform", "translate(" + viewCenter.x + "," + viewCenter.y + ")scale(" + viewZoom + ")");
        menuG.selectAll('g.contextmenu-slice').attr('transform', 'scale(' + 1 / viewZoom + ')');
    }


    function interpolateZoom(translate, scale) {
        viewZoom = scale;
        viewCenter.x += translate[0];
        viewCenter.y += translate[1];
        zoomed();
    }

    function location(p) {
        return {
            x: (p.x - viewCenter.x) / viewZoom,
            y: (p.y - viewCenter.y) / viewZoom
        };
    }


    /**
     * Handler for triple swipe events. These create polygons for selecting nodes.
     * @param event - touch event with three finger swipe
    */
    function handleTripleSwipeEvent(event) {
        // Reduce the points in the swipe if time has passed beyond threshold
        if (swipe.events.length > 2) {
            swipe.centers = pointReduction(swipe.centers);
            swipe.transformedCenters = pointReduction(swipe.transformedCenters);
        }

        annotG.selectAll('.swipetrace').remove();

        var traceSelect = annotG.selectAll('.swipetrace')
            // .data([swipe.centers], function(d){return d.length});
            .data([swipe.transformedCenters], function(d) {
                return d.length
            });

        // append the tracepath for feedback
        traceSelect.enter().append('path')
            .attr('d', function(d) {
                if (d.length < 2) {
                    return '';
                }
                var pth = 'M ' + d[0].x + ' ' + d[0].y;
                for (var i = 1; i < d.length; i++) {
                    if (d[i].x > d[0].x) {}
                    pth += ' L ' + d[i].x + ' ' + d[i].y;
                }
                return pth;
            })
            .attr('class', 'swipetrace')
            .style('fill', '#73ad21')
            .style('fill-opacity', 0.4)
            .style('stroke', '#73ad21')
            .style('stroke-width', 3)
            .style('stroke-opacity', 0.8);

        var nodeSelect = [];
        // check which links the swipe encloses in a convex shape
        for (var i = 1; i < swipe.transformedCenters.length; i++) {
            nodeSelect = nodeSelect.concat(getNodesInside(swipe.transformedCenters));
        }
        // turn all of the selectors into a selection string
        var nodeQuery = '';
        nodeSelect = nodeSelect.getUnique();
        for (var j = 0; j < nodeSelect.length; j++) {
            nodeQuery += nodeSelect[j] + ((j == nodeSelect.length - 1) ? '' : ', ');
        }
        // Select the nodes
        svgAddClass(nodeQuery, 'selected');
        if (event.isFinal == true) { // checks if it is the end of a swipe event, if yes then resets the swipe.centers list
            // Set up the context menu at this point for the selected links
            if ($('.node.selected').length > 0) showContextMenu(event, 'node');

            // Clean up after the event
            eventCleanup();
            console.log("three finger swipe end")
        }
    }

    /**
     * Handler for hand swipe events. In advanced selection mode, pulls or pushes partnering nodes.
     * @param event - touch event with five finger swipe
    */
    function handleHandSwipeEvent(event) {
        // Good chance that three or less fingers were down first, remove the trace
        $('.swipetrace').remove();
        if (detailedSelectionOn && swipe.events.length > 2) {
            var maxFromCenter = 0;
            var maxDelta = 0;
            var detailed = $('#' + detailsNodeId)[0].__data__;
            detailed.fixed = true;
            var center = convertToPoint(detailed.x, detailed.y);
            for (var i = 0; i < event.pointers.length; i++) {
                var p0 = swipe.events[swipe.events.length - 2].pointers;
                var pt1 = convertToPoint(event.pointers[i].clientX, event.pointers[i].clientY);
                var pt0 = convertToPoint(p0[i].clientX, p0[i].clientY);
                var delta = getDistanceBetweenPoints(pt1, pt0);
                var r = getDistanceBetweenPoints(pt1, center);
                if (r > maxFromCenter) maxFromCenter = r;
                if (delta > maxDelta) maxDelta = delta;
            }
            annotG.selectAll('circle').remove();
            annotG.selectAll('circle')
                .data([{
                    x: center.x,
                    y: center.y,
                    r: maxFromCenter
                }])
                .enter().append('circle').style('fill', '#f00')
                .style('fill-opacity', 0.1).style('stroke', '#f00')
                .style('stroke-width', 3).style('stroke-opacity', '0.4')
                .attr('cx', function(d) {
                    return d.x;
                })
                .attr('cy', function(d) {
                    return d.y;
                })
                .attr('r', function(d) {
                    return d.r;
                });
            for (var j = 0; j < activeNodeIds.length; j++) {
                if (activeNodeIds[j] !== detailsNodeId) {
                    var n = $('#' + activeNodeIds[j])[0].__data__;
                    n.fixed = true;
                    var theta = Math.atan2(n.x - center.x, n.y - center.y);
                    n.x += (1 - event.scale) * Math.cos(theta);
                    n.y += (1 - event.scale) * Math.sin(theta);
                    n.px += (1 - event.scale) * Math.cos(theta);
                    n.py += (1 - event.scale) * Math.sin(theta);
                }

            }
            main.updateGraph();
        }
        if (event.isFinal) {
            annotG.selectAll('circle').remove();
            eventCleanup();
        }
    }

    /**
     * Clean up variables from previous gesture     
    */
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
        isLongPress = false;
        isTap = false;
        // console.log(activeNodeIds,detailedSelectionOn)
        // detailedSelectionOn = false;
        // activeNodeIds = [];
    }

    /**
     * Brings the context menu on the screen
     * @param event - touch event
     * @param event - menu type (link or node)
    */
    function showContextMenu(event, type) {
        var pt = convertToPoint(event.center.x, event.center.y);

        // Set the context menu flag to be true
        main.contextMenu = true;

        // Move the context menu to the correct point and show it
        d3.select('#contextmenu-' + type)
            .attr('transform', 'translate(' + (pt.x) + ',' + (pt.y) + ')')
            .attr('visibility', 'visible');
    }


    // set of listeners for the context menu
    main.contextMenuListener = {};

    // deletion of selected node(s)
    main.contextMenuListener.noderemove = function() {
        console.log('remove');
        $('.node.selected').each(function(i, n) {
            deleteNode(n.__data__);
        });
        main.updateGraph();
        dismissContextMenu();
        $('.swipetrace').remove();
    };

    // expand selected node(s)
    main.contextMenuListener.nodeexpand = function() {
        console.log('expand');
        svgAddClass('.node.selected', 'expanded');
        $('.node.selected').each(function(i, n) {
            expandNode(n.__data__.id);
        });
        main.updateGraph();
        dismissContextMenu();
        $('.swipetrace').remove();
    };

    // collapse selected node(s)
    main.contextMenuListener.nodecollapse = function() {
        console.log('collapse');
        svgRemoveClass('.node.selected', 'expanded');
        $('.node.selected').each(function(i, n) {
            collapseNode(n.__data__.id);
        });
        main.updateGraph();
        dismissContextMenu();
        $('.swipetrace').remove();
    };

    // select links for selected node(s)
    main.contextMenuListener.selectlinks = function() {
        var linkQuery = '';
        $('.node.selected').each(function(i, n) {
            linkQuery += '.link-' + n.__data__.id + ', ';
        });
        linkQuery = linkQuery.substring(0, linkQuery.length - 2);
        svgAddClass(linkQuery, 'selected');
        svgRemoveClass('.node', 'selected');
        dismissContextMenu();
        $('.swipetrace').remove();
    };

    // select nodes for selected link(s)
    main.contextMenuListener.selectnodes = function() {
        var nodeQuery = '';
        $('.link.selected').each(function(i, l) {
            nodeQuery += '#' + l.__data__.source.id + ', #' + l.__data__.target.id + ', ';
        });
        nodeQuery = nodeQuery.substring(0, nodeQuery.length - 2);
        svgAddClass(nodeQuery, 'selected');
        svgRemoveClass('.link', 'selected');
        dismissContextMenu();
    };

    main.contextMenuListener.linkbundle = function() {
        dismissContextMenu();
    };

    // delete selected link(s)
    main.contextMenuListener.linkremove = function() {
        console.log('remove');
        $('.link.selected').each(function(i, l) {
            deleteLink(l.__data__);
        });
        main.updateGraph();
        dismissContextMenu();
    };


    // clear context menu from screen
    function dismissContextMenu() {
        main.contextMenu = false;
        // just move the context menu to the origin, that should be off-screen
        d3.select('#contextmenu-node')
            .attr('transform', 'translate(0,0)')
            .attr('visibility', 'hidden');

        d3.select('#contextmenu-link')
            .attr('transform', 'translate(0,0)')
            .attr('visibility', 'hidden');
    }

    function createContextMenu(list, type) {
        var cmInnerRadius = 35;
        var cmOuterRadius = 115;
        var cmInnerMargin = 4 / cmInnerRadius;
        var cmOuterMargin = 4 / cmOuterRadius;

        var deg = 2 * Math.PI / (list.length);
        for (var i = 0; i < (list.length); i++) {
            var mid = Math.PI / 2 + i * deg;
            var start = mid - deg / 2;
            var end = mid + deg / 2;
            list[i].angle = mid;
            list[i].start = start;
            list[i].end = end;
        }

        // Can't do more than 8 modes, also need to have the delete but always be at the bottom
        var cm = menuG.append('g')
            .attr('id', 'contextmenu-' + type);

        var select = cm.selectAll('.contextmenu-slice')
            .data(list, function(d) {
                return d.angle;
            });

        var enter = select.enter().append('g')
            .attr('id', function(d) {
                return 'slice-' + d.classname;
            })
            .attr('class', 'contextmenu-slice');

        // add the path that defines the slice of the contextmenu first
        enter.append('path')
            .attr('class', 'contextmenu-slice')
            .attr('d', function(d) {
                return 'M' + (cmInnerRadius * Math.cos(d.start + cmInnerMargin)) + ' ' + (cmInnerRadius * Math.sin(d.start + cmInnerMargin)) + ' L' + (cmOuterRadius * Math.cos(d.start + cmOuterMargin)) + ' ' + (cmOuterRadius * Math.sin(d.start + cmOuterMargin)) + ' A' + cmOuterRadius + ' ' + cmOuterRadius + ' 0 0 1 ' + (cmOuterRadius * Math.cos(d.end - cmOuterMargin)) + ' ' + (cmOuterRadius * Math.sin(d.end - cmOuterMargin)) + ' L' + (cmInnerRadius * Math.cos(d.end - cmInnerMargin)) + ' ' + (cmInnerRadius * Math.sin(d.end - cmInnerMargin)) + ' A' + cmInnerRadius + ' ' + cmInnerRadius + ' 0 0 0 ' + (cmInnerRadius * Math.cos(d.start + cmInnerMargin)) + ' ' + (cmInnerRadius * Math.sin(d.start + cmInnerMargin));
            });

        var middle = enter.append('g')
            .attr('class', 'middle')
            .attr('transform', function(d) {
                return 'translate(' + (Math.cos(d.angle) * (cmOuterRadius - cmInnerRadius)) + ',' + (Math.sin(d.angle) * (cmOuterRadius - cmInnerRadius * 1.25)) + ')';
            });

        middle.append('text')
            .attr('class', 'contextmenu-label contextmenu-slice')
            .attr('y', '22px')
            .attr('fill', '#fff')
            .text(function(d) {
                return d.displayName;
            });

        var icon = middle.append('g')
            .attr('class', 'contextmenu-icon')
            .attr('transform', 'translate(-24,-38)');

        icon.selectAll('path').data(function(d) {
                return d.icon;
            })
            .enter().append('path')
            .attr('class', 'contextmenu-slice')
            .attr('fill', '#fff')
            .attr('d', function(d) {
                return d;
            });

        cm.attr('visibility', 'hidden');
    }

    function getNodesInside(poly) {
        var select = [];
        d3.selectAll('.node').each(function(n) {
            if (isCircleInPoly(poly, n, nodeRadius)) {
                if (activeNodeIds.length > 0) {
                    if (activeNodeIds.indexOf(n.id) > -1) {
                        select.push('#' + n.id);
                    }
                } else {
                    select.push('#' + n.id);
                }
            }
        });
        return select;
    }

    function getPassThroughLinks(p1, p2) {
        var pt1 = convertToPoint(p1.x, p1.y);
        var pt2 = convertToPoint(p2.x, p2.y);
        var select = [];
        $('.link').each(function(i, l) {
            var lnk = $(l);
            var s = {
                x: Number(lnk.attr('x1')),
                y: Number(lnk.attr('y1'))
            };
            var t = {
                x: Number(lnk.attr('x2')),
                y: Number(lnk.attr('y2'))
            };
            if (lineIntersect(pt1, pt2, s, t)) {
                if (activeNodeIds.length > 0) {
                    if (activeNodeIds.indexOf(l.__data__.source.id) > -1 && activeNodeIds.indexOf(l.__data__.target.id) > -1 && (l.__data__.target.id == detailsNodeId || l.__data__.source.id == detailsNodeId)) {
                        select.push('#' + l.__data__.source.id + '-' + l.__data__.target.id);
                    }
                } else {
                    select.push('#' + l.__data__.source.id + '-' + l.__data__.target.id);
                }
            }
        });
        return select;
    }

    function convertToPoint(px, py) {
        return {
            x: px / viewZoom - viewCenter.x / viewZoom,
            y: py / viewZoom - viewCenter.y / viewZoom
        };
    }

    function getFocusNode(px, py) {
        var pt = convertToPoint(px, py);
        var select = movingNode;
        d3.selectAll('.node').each(function(curNode) {
            if (pointInCircle(curNode.x, curNode.y, pt.x, pt.y, nodeRadius)) {
                if (movingNode == null) {
                    if (activeNodeIds.length > 0) {
                        if (activeNodeIds.indexOf(curNode.id) > -1) {
                            select = curNode;
                        }
                    } else {
                        select = curNode;
                    }
                }
            }
        });
        return select;
    }

    main.dragNode = function(focusNode, event) {
        var pt = convertToPoint(event.center.x, event.center.y);
        focusNode.px = pt.x;
        focusNode.x = pt.x;
        focusNode.py = pt.y;
        focusNode.y = pt.y;
    }

    main.dragEnd = function(event) {
        var pt = convertToPoint(event.center.x, event.center.y);
        px = pt.x;
        py = pt.y;
        d3.selectAll('.node').each(function(curNode) {
            if (pointInCircle(curNode.x, curNode.y, px, py, nodeRadius)) {
                curNode.fixed = true;
                d3.select(this).classed("isFixed", "true")
            }
        });
    }

    main.drawDetailedSelectionMode = function(focusNode) {
        detailsNodeId = focusNode.id;
        detailedSelectionOn = true;
        d3.selectAll(".link")
            .style("stroke-opacity", function(curLink) {
                if (curLink.source.id == focusNode.id || curLink.target.id == focusNode.id) {
                    return 1;
                } else {
                    return 0.3;
                }
            });
        d3.selectAll(".node").each(function(curNode) {
                if (curNode.id == focusNode.id || isPartner(curNode, focusNode) == 1) {
                    if (activeNodeIds.indexOf(curNode.id) == -1) {
                        activeNodeIds.push(curNode.id);
                    }
                }
            })
            .style("fill-opacity", function(curNode) {
                if (curNode.id == focusNode.id || isPartner(curNode, focusNode) == 1) {
                    return 1;
                } else {
                    return 0.3;
                }
            });
        //console.log(activeNodeIds)
    }

    main.highlightNodeNetwork = function(focusNode) {
        d3.selectAll(".link")
            .classed("selected", function(curLink) {
                if (curLink.source.id == focusNode.id || curLink.target.id == focusNode.id) {
                    return true;
                } else {
                    return false;
                }
            });
        d3.selectAll(".node")
            .classed("selected", function(curNode) {
                if (curNode.id == focusNode.id || isPartner(curNode, focusNode) == 1) {
                    return true;
                } else {
                    return false;
                }
            });
    }

    main.refreshGraphVis = function() {
        d3.selectAll(".link")
            .style("stroke-opacity", 1);
        d3.selectAll(".node")
            .style("fill-opacity", 1);
        activeNodeIds = [];
        detailedSelectionOn = false;
        detailsNodeId = '';
    }

    function isPartner(node1, node2) {
        for (var i = 0; i < main.graph.links.length; i++) {
            var curLink = main.graph.links[i];
            var n1 = curLink.source,
                n2 = curLink.target;
            // if (curLink.source === parseInt(curLink.source, 10)){
            //     n1 = main.graph.nodes[curLink.source];
            //     n2 = main.graph.nodes[curLink.target];
            // }else{
            //     n1 = curLink.source;
            //     n2 = curLink.target;
            // }
            if ((n1.id == node1.id && n2.id == node2.id) || (n1.id == node2.id && n2.id == node1.id)) {
                return 1;
            }
        }
        return -1;
    }

    function collapseNode(nodeId) {
        var nodesToDelete = [],
            linksToDelete = [];
        for (var i = 0; i < main.graph.links.length; i++) {
            var curLink = main.graph.links[i];
            var n1 = curLink.source,
                n2 = curLink.target;
            if ((n1.id == nodeId)) {
                if (isRemovableNode(n2)) {
                    var linksToRemove = getLinks(n2);
                    for (var linkIndex = 0; linkIndex < linksToRemove.length; linkIndex++) {
                        linksToDelete.push(linksToRemove[linkIndex]);
                    }
                    nodesToDelete.push(n2);
                }
            } else if ((n2.id == nodeId)) {
                if (isRemovableNode(n1)) {
                    var linksToRemove = getLinks(n1);
                    for (var linkIndex = 0; linkIndex < linksToRemove.length; linkIndex++) {
                        linksToDelete.push(linksToRemove[linkIndex]);
                    }
                    nodesToDelete.push(n1);
                }
            }
        }
        for (var i = 0; i < linksToDelete.length; i++) {
            var x = main.graph.links.indexOf(linksToDelete[i]);
            if (x != -1) {
                main.graph.links.splice(x, 1);
            }
        }
        for (var i = 0; i < nodesToDelete.length; i++) {
            var x = main.graph.nodes.indexOf(nodesToDelete[i]);
            if (x != -1) {
                main.graph.nodes.splice(x, 1);
            }
        }
    }

    function isRemovableNode(targetNode) {
        var linkCount = 0;
        for (var i = 0; i < main.graph.links.length; i++) {
            var curLink = main.graph.links[i];
            if (curLink.source.id == targetNode.id || curLink.target.id == targetNode.id) {
                linkCount += 1;
            }
        }
        return (linkCount > 1) ? false : true;
    }

    function getLinks(targetNode) {
        var links = [];
        for (var i = 0; i < main.graph.links.length; i++) {
            var curLink = main.graph.links[i];
            if (curLink.source.id == targetNode.id || curLink.target.id == targetNode.id) {
                links.push(curLink);
            }
        }
        return links;
    }

    function isExistingLink(currentLink) {
        for (var i = 0; i < main.graph.links.length; i++) {
            if (((main.graph.nodes[currentLink.source] == main.graph.links[i].source) && (main.graph.nodes[currentLink.target] == main.graph.links[i].target)) || ((main.graph.nodes[currentLink.source] == main.graph.links[i].target) && (main.graph.nodes[currentLink.target] == main.graph.links[i].source)) || ((main.graph.nodes[currentLink.target] == main.graph.links[i].source) && (main.graph.nodes[currentLink.source] == main.graph.links[i].target))) {
                return 1;
            }
        }

        for (var i = 0; i < main.graph.links.length; i++) {
            if (((currentLink.source == main.graph.links[i].source) && (currentLink.target == main.graph.links[i].target)) || ((currentLink.source == main.graph.links[i].target) && (currentLink.target == main.graph.links[i].source)) || ((currentLink.target == main.graph.links[i].source) && (currentLink.source == main.graph.links[i].target))) {
                return 1;
            }
        }
        return -1;
    }

    function getNodeIndexByIdInVis(nodeId) {
        for (var i = 0; i < main.graph.nodes.length; i++) {
            var curNode = main.graph.nodes[i];
            if (curNode.id == nodeId) {
                return i;
            }
        }
        return -1;
    }

    function getNodeIndexByIdFromDb(nodeId) {
        for (var i = 0; i < graphDb.nodes.length; i++) {
            var curNode = graphDb.nodes[i];
            if (curNode.id == nodeId) {
                return i;
            }
        }
        return -1;
    }

    function expandNode(nodeId) {
        var partnerList = getConnectedNodesFromDb(nodeId);
        for (var i = 0; i < partnerList.length; i++) {
            if (getNodeIndexByIdInVis(partnerList[i]) != -1) { // if partner exists in viz
                var sindex = getNodeIndexByIdInVis(nodeId);
                var tindex = getNodeIndexByIdInVis(partnerList[i]);
                if (sindex > -1 && tindex > -1) {
                    var partnerNode = main.graph.nodes[tindex];
                    var currentLink = {
                        "source": sindex,
                        "target": tindex
                    };
                    if (isExistingLink(currentLink) == -1) { // if current link does not already exist
                        main.graph.links.push(currentLink)
                    }
                }
            } else { //if partner does not exist in viz, add and create link
                var nodeIndex = getNodeIndexByIdFromDb(partnerList[i]);
                var newNode = {
                    "name": graphDb.nodes[nodeIndex].name,
                    "id": partnerList[i]
                };
                main.graph.nodes.push(newNode);
                var sindex = getNodeIndexByIdInVis(nodeId);
                var tindex = getNodeIndexByIdInVis(partnerList[i]);
                if (sindex > -1 && tindex > -1) {
                    var currentLink = {
                        "source": sindex,
                        "target": tindex
                    };
                    if (isExistingLink(currentLink) == -1) { // if current link does not already exist
                        main.graph.links.push(currentLink);
                    }
                }
            }
        }
    }

    function getConnectedNodesFromDb(nodeId) {
        var nodeIndex = getNodeIndexByIdFromDb(nodeId);
        var connectedNodes = [];
        for (var i = 0; i < graphDb.links.length; i++) {
            var curLink = graphDb.links[i];
            if (curLink.source == nodeIndex) {
                connectedNodes.push(graphDb.nodes[curLink.target].id);
            } else if (curLink.target == nodeIndex) {
                connectedNodes.push(graphDb.nodes[curLink.source].id);
            }
        }
        return connectedNodes;
    }

    function deleteNode(node) {
        var nodeToDeleteIndex = main.graph.nodes.indexOf(node);
        if (nodeToDeleteIndex != -1) {
            main.graph.nodes.splice(nodeToDeleteIndex, 1);
        }
        var linksToDelete = [];
        for (var i = 0; i < main.graph.links.length; i++) {
            if ((main.graph.links[i]['source']['id'] == node.id) || (main.graph.links[i]['target']['id'] == node.id)) {
                linksToDelete.push(main.graph.links[i]);
            }
        }
        for (var i = 0; i < linksToDelete.length; i++) {
            var x = main.graph.links.indexOf(linksToDelete[i]);
            if (x != -1) {
                main.graph.links.splice(x, 1);
            }
        }
    }

    function deleteLink(link) {
        var linkToDeleteIndex = main.graph.links.indexOf(link);
        if (linkToDeleteIndex != -1) {
            main.graph.links.splice(linkToDeleteIndex, 1);
        }
    }

    main.loadData = function(params) {
        // Load data for the visualization here
    };

    main.resizeWindow = function() {
        // Resize the visualization
    };
})();