/**
 * Created by John on 11/15/15.
 */

function hasClass(elem, cls) {
    return (' ' + ((elem.className instanceof SVGAnimatedString) ? elem.className.baseVal : elem.className) + ' ').indexOf(' ' + cls + ' ') > -1;
}

/**
 *
 * @param s0
 * @param s1
 * @param t0
 * @param t1
 * @returns {boolean}
 */
function lineIntersect(s0,s1,t0,t1) {
    var x=((s0.x*s1.y-s0.y*s1.x)*(t0.x-t1.x)-(s0.x-s1.x)*(t0.x*t1.y-t0.y*t1.x))/((s0.x-s1.x)*(t0.y-t1.y)-(s0.y-s1.y)*(t0.x-t1.x));
    var y=((s0.x*s1.y-s0.y*s1.x)*(t0.y-t1.y)-(s0.y-s1.y)*(t0.x*t1.y-t0.y*t1.x))/((s0.x-s1.x)*(t0.y-t1.y)-(s0.y-s1.y)*(t0.x-t1.x));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (s0.x>=s1.x) {
            if (!(s1.x<=x&&x<=s0.x)) {return false;}
        } else {
            if (!(s0.x<=x&&x<=s1.x)) {return false;}
        }
        if (s0.y>=s1.y) {
            if (!(s1.y<=y&&y<=s0.y)) {return false;}
        } else {
            if (!(s0.y<=y&&y<=s1.y)) {return false;}
        }
        if (t0.x>=t1.x) {
            if (!(t1.x<=x&&x<=t0.x)) {return false;}
        } else {
            if (!(t0.x<=x&&x<=t1.x)) {return false;}
        }
        if (t0.y>=t1.y) {
            if (!(t1.y<=y&&y<=t0.y)) {return false;}
        } else {
            if (!(t0.y<=y&&y<=t1.y)) {return false;}
        }
    }
    return true;
}

/**
 *
 * @param poly
 * @param seg0
 * @param seg1
 * @returns {boolean}
 */
function isSegmentInPoly(poly, seg0, seg1) {
    var n = poly.length;
    var k = Math.round(n / 2);
    // rotate around and see if any of the segments inside polygon intersect with the line segment
    for(var j = 0; j < n; j++) {
        if(lineIntersect(poly[j], poly[k], seg0, seg1)) {
            return true
        }
        k = k+1 == n ? 0 : k+1;
    }
    // if we haven't returned true yet then it does not intersect, probably not inside
    return false;
}

/**
 *
 * @param poly
 * @param pt
 * @returns {boolean}
 */
function isPointInPoly(poly, pt){
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
}

/**
 *
 * @param poly
 * @param pt
 * @param r
 * @returns {boolean}
 */
function isCircleInPoly(poly, pt, r) {
    if(isPointInPoly(poly,pt)) {
        return true;
    } else {
        for (var i = 1; i < poly.length; i++) {
            if(distPointToSegment(pt,poly[i-1],[i]) <= r) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Doulgas-Peucker polyline reduction algorithm
 * @param points
 * @returns {Array} array of reduced points
 */
function pointReduction(points) {
    var tolerance = 5;

    var marked = Array.apply(null, Array(points.length)).map(Number.prototype.valueOf,0);
    marked[0] = 1;
    marked[points.length-1] = 1;

    decimate(tolerance, points, 0, points.length-1, marked);

    var reduced = [];
    for(var i = 0; i < points.length; i++) {
        if(marked[i] == 1) {
            reduced.push(points[i]);
        }
    }
    return reduced;
}

function decimate(t,points,j,k,mk) {
    if(k <= j+1) {
        return;
    }

    // Index of vertex farthest from S
    var maxI = j;
    // distance squared of farthest vertex
    var maxD2 = 0;
    // tolerance squared
    var tol2 = t*t;
    // Segment from j to k
    var s0 = points[j], s1 = points[k];
    // Segment direction
    var u = new Vector(s1.x-s0.x,s1.y-s0.y);
    // Segment length squared
    var cu = u.dot(u);

    // test each vertex v[i] for max distance from S
    var w;
    var p;
    var b,cw,dv2;

    for (var i = j+1; i < k; i++) {
        w = new Vector(points[i].x-s0.x,points[i].y-s0.x);
        cw = w.dot(u);
        if(cw <= 0) {
            dv2 = (new Vector(points[i].x-s0.x, points[i].y-s0.y)).norm2();
        } else if (cu <= cw) {
            dv2 = (new Vector(points[i].x-s1.x, points[i].y-s1.y)).norm2();
        } else {
            b = cw/cu;
            p = {x:s0.x+b*u.x,y:s0.y+b*u.y};
            dv2 = (new Vector(points[i].x-p.x,points[i].y-p.y)).norm2();
        }

        if (dv2 <= maxD2) continue;
        maxI = i;
        maxD2 = dv2;
    }
    if (maxD2 > tol2) {
        // split the polyline at the farthest vertex from S
        mk[maxI] = 1;
        // recursively decimate the two subpolylines at v[maxI]
        decimate(t,points,j,maxI,mk);
        decimate(t,points,v,maxI,k,mk);
    }
}

/**
 * Algorithm that returns the nearest point to a line segment
 * @param point - object with x and y values
 * @param seg0 - first point of line segment, object with x and y values
 * @param seg1 - end point of line segment, object with x and y values
 * @returns {JSNumber} distance
 */
function distPointToSegment(point, seg0, seg1) {
    var v = new Vector(seg1.x-seg0.x,seg1.y-seg0.y);
    var w = new Vector(point.x-seg0.x,point.y-seg0.y);

    var c1 = w.dot(v);
    if(c1 <= 0) return (new Vector(p.x-seg0.x, p.y-seg0.y)).norm();
    var c2 = v.dot(v);
    if (c2 <= c1) return (new Vector(p.x-seg1.x, p.y-seg1.y)).norm();

    var b = c1/c2;
    var p = {x: seg0.x+b*v.x, y: seg0.y+b*v.y};
    return (new Vector(p.x-p.x, p.y-p.y)).norm();
}

Vector = function(x,y) {
    this.x = x;
    this.y = y;
};

Vector.prototype = {
    dot: function(v) {
        return this.x* v.x + this.y+v.y;
    },
    norm: function(){
        return Math.sqrt(this.dot(this));
    },
    norm2: function() {
        return this.dot(this);
    }
};

Array.prototype.getUnique = function(){
    var u = {}, a = [];
    for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
}

function pointInCircle(cx,cy,px,py,r){
    return Math.sqrt((px-cx)*(px-cx) + (py-cy)*(py-cy)) < r;
}