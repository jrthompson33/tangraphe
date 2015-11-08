(function (){

    var graphData = {
        "nodes":[
            {"id":"1","label":"A"},
            {"id":"2","label":"B"}
        ],
        "links":[
            {"source":0,"target":1}
        ]
    };

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
            .gravity(0.5)
            .linkDistance(150)
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

        setTimeout(function(){
            modifyData();
            main.updateGraph();
        }, 3000);
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

    function modifyData(){
        graphData.nodes.push( {"id":"3","label":"C"} );
        graphData.links.push( {"source":0,"target":2} );
    }
})();