(function (){

    main = {};
    var force,node,link,svg;

    main.init = function(){
        main.drawGraph();
    }

    main.drawGraph = function(){
        var width = 1800,
            height = 900;

        force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([width, height]);

        svg = d3.select("#vis").append("svg")
            .attr("width", width)
            .attr("height", height);

        force.nodes(graphData.nodes)
             .links(graphData.links)
             .start();

        link = svg.selectAll(".link")
                        .data(graphData.links)
                        .enter().append("line")
                        .attr("class", "link");

        node = svg.selectAll(".node")
                        .data(graphData.nodes)
                        .enter().append("g")
                        .attr("class", "node")
                        .call(force.drag);

        nodeCircles = node.append("circle")
                            .attr("r", 5);

        nodeLabels = node.append("text")
                             .attr("dx", 12)
                             .attr("dy", ".35em")
                             .style("font-color","black")
                             .text(function(d) { return d.label; });


        force.on("tick", tick);

        d3.selectAll(".node").select("circle")
            .on("mouseover",function(d){
                main.highlightNode(d);           
            })
            .on("mouseout",function(){
                main.clearHighlighting();           
            });        
    }

    main.updateGraph = function(){
        link = link.data(graphData.links);
        var exitingLinks = link.exit();
        exitingLinks.remove();
        var newLinks = link.enter();
        newLinks.insert("line",".node").attr("class","link");

        node = node.data(graphData.nodes,function(d){return d.id;});
        var exitingNodes = node.exit();
        exitingNodes.remove();
        var newNodes = node.enter().append("g").attr("class","node").call(force.drag);

        nodeCircles = newNodes.append("circle")
                        .attr("r", 5);

        nodeLabels = newNodes.append("text")
                        .attr("dx", 12)
                        .attr("dy", ".35em")
                        .style("font-color","black")
                        .text(function(d) { return d.label; });
        force.start();
        force.on("tick", tick);

        d3.selectAll(".node").select("circle")
            .on("mouseover",function(d){
                main.highlightNode(d);           
            })
            .on("mouseout",function(){
                main.clearHighlighting();           
            })
            .on("contextmenu",function(d) {
                pushNeighbors(d);
            });
    }

    tick = function(){
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    main.processGesture = function(gestureObj){

    }

    main.pushNeighbors = function (node) {
        force.linkDistance(function(d) {
            if(node==d.source || node==d.target){                        
                return parseInt(node.id) * 10;
            }
        });
    }

    function modifyData(){
        graphData.nodes.push( {"id":"3","label":"C"} );
        graphData.nodes.push( {"id":"4","label":"D"} );
        graphData.links.push( {"source":0,"target":2} );
    }

    main.highlightNode = function(d){
        d3.selectAll(".node")
            .select("circle")
            .style("fill", function(o) {
              if(d==o || areNeighbors(d.id,o.id)==1){
                return "red";
              }else{
                return "black";
              }
            });
        d3.selectAll(".link")
            .style("stroke", function(o) {
              if(d==o.source || d==o.target){
                return "red";
              }
            });
    }

    main.clearHighlighting = function () {
        d3.selectAll(".node")
            .select("circle")
            .style("fill","black");

        d3.selectAll(".link")
            .style("stroke","black");
    }

    main.pinNode = function (node) {
        node.fixed = true;
    }

    function areNeighbors(node1Id,node2Id){
        for(var linkIndex in graphData.links){
            var node1 = graphData.links[linkIndex].source;
            var node2 = graphData.links[linkIndex].target;

            if (node1 === parseInt(node1, 10) || node2 === parseInt(node2, 10)){
                node1 = graphData.nodes[node1];
                node2 = graphData.nodes[node2];
            }                
            if((node1.id==node1Id && node2.id==node2Id) || (node2.id==node1Id && node1.id==node2Id)){
                return 1;
            }
        }
        return -1;
    }

})();