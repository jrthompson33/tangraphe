/**
 * Created by John Thompson
 */

(function(){

    // The global objects for the visualization
    main = {};
    data = {};

    var chart, svg, height, width, swipe, press;

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

        // Initialize all of the helper tools for the visualization
        tool.init(params);

        // Have the relevant tools draw the visualization
        tool.draw(params);



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

  var link = svg.selectAll(".link")
      .data(main.graph.links)
    .enter().append("line")
      .attr("class", "link")
      .attr('id', function(d){ return d.source.name+'-'+d.target.name})
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.selectAll(".node")
      .data(main.graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 50)
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag);

  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", tick);  

    var myElement = document.getElementById("vis");
    var hammertime = new Hammer(myElement);
    hammertime.on("hammer.input", function(ev) {
        if(ev.pointerType=="touch"){
            px = ev.pointers[0].clientX
            py = ev.pointers[0].clientY
            if (ev.isFirst) {
                if(swipe) {
                    if (swipe.type === 'single') {
                        swipe.selection.css('stroke', '#ccc').css('stroke-width', '1');
                        $('#menu').remove();
                    }
                    
                }
                swipe = {selection: $([]), points: []};
                if(ev.pointers.length == 1) {
                    swipe.type = 'single';
                } else {
                    swipe.type = 'multi';
                }
            } 
            if (ev.isFinal) {
                var linkIds = getPassThroughLinks(swipe.points[0],{x:px,y:py});
                $(linkIds).css('stroke', '#f00').css('stroke-width', '2');
                swipe.selection = swipe.selection.add($(linkIds));
                if(ev.pointers.length > 1) {
                    swipe.type = 'multi';
                }
                if(swipe.type === 'single') {
                    svg.append('circle')
                        .attr('id', 'menu')
                        .attr('cx', ev.pointers[0].clientX)
                        .attr('cy', ev.pointers[0].clientY)
                        .attr('r', '20')
                        .attr('fill', '#333')
                        .attr('opacity', '0.7');
                        console.log('reached!')
                }

                
            } else {
                if(ev.pointers.length > 1) {
                    swipe.type = 'multi';
                }

            }
            if(swipe) swipe.points.push({x: px, y: py});
            var e = document.elementFromPoint(px,py);
            // console.log(e);
            if(swipe && swipe.type === 'single') {
                if(hasClass(e, 'link')) {
                    $(e).css('stroke', '#f00').css('stroke-width', '2');
                    swipe.selection = swipe.selection.add($(e));
                }
            } else if(swipe && swipe.type === 'multi') {

            }
        }
    });
    
    hammertime.on("tap",function(e){
        console.log("tap")
    });    

    };

    function getPassThroughLinks(p1,p2) {
        var select = '';
        d3.selectAll('.link').each(function(l){
            if(lineIntersect(p1.x,p1.y,p2.x,p2.y,l.source.x,l.source.y,l.target.x,l.target.y)) {
                select += '#'+l.source.name+'-'+l.target.name+', ';
            }
        });
        return select.length > 0 ? select.substring(0, select.length-2) : '';
    }

    function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
        var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
        var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
        if (isNaN(x)||isNaN(y)) {
            return false;
        } else {
            if (x1>=x2) {
                if (!(x2<=x&&x<=x1)) {return false;}
            } else {
                if (!(x1<=x&&x<=x2)) {return false;}
            }
            if (y1>=y2) {
                if (!(y2<=y&&y<=y1)) {return false;}
            } else {
                if (!(y1<=y&&y<=y2)) {return false;}
            }
            if (x3>=x4) {
                if (!(x4<=x&&x<=x3)) {return false;}
            } else {
                if (!(x3<=x&&x<=x4)) {return false;}
            }
            if (y3>=y4) {
                if (!(y4<=y&&y<=y3)) {return false;}
            } else {
                if (!(y3<=y&&y<=y4)) {return false;}
            }
        }
        return true;
    }

    function hasClass(elem, cls) {
        return (' ' + ((elem.className instanceof SVGAnimatedString) ? elem.className.baseVal : elem.className) + ' ').indexOf(' ' + cls + ' ') > -1;
    };

    main.loadData = function(params) {
        // Load data for the visualization here
    };

    main.resizeWindow = function() {
        // Resize the visualization

    };
})();
