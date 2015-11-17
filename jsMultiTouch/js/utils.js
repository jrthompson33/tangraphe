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
            var d = distPointToSegment(pt,poly[i-1],poly[i]);
            if(d <= r) {
                return true;
            }
        }
    }
    return false;
}

// square distance between 2 points
function getSqDist(p1, p2) {

    var dx = p1.x - p2.x,
        dy = p1.y - p2.y;

    return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p, p1, p2) {

    var x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2.x;
            y = p2.y;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

// simplification using Ramer-Douglas-Peucker algorithm
function pointReduction(points) {
    var last = points.length - 1;

    var simplified = [points[0]];
    simplifyDPStep(points, 0, last, 1, simplified);
    simplified.push(points[last]);

    return simplified;
}

/**
 * Algorithm that returns the nearest point to a line segment
 * @param point - object with x and y values
 * @param seg0 - first point of line segment, object with x and y values
 * @param seg1 - end point of line segment, object with x and y values
 * @returns {JSNumber} distance
 */
function distPointToSegment(pt, seg0, seg1) {
    var v = new Vector(seg1.x-seg0.x,seg1.y-seg0.y);
    var w = new Vector(pt.x-seg0.x,pt.y-seg0.y);
    var point = new Vector(pt.x,pt.y);

    var c1 = w.dot(v);
    if(c1 <= 0) return point.distSeg(seg0.x,seg0.y);
    var c2 = v.dot(v);
    if (c2 <= c1) return point.distSeg(seg1.x,seg1.y);

    var b = c1/c2;
    var p = {x: seg0.x+b*v.x, y: seg0.y+b*v.y};
    var d = point.distSeg(p.x,p.y);
    return d;
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
    },
    dist: function(v) {
        return Math.sqrt((this.x-v.x)*(this.x-v.x)+(this.y-v.y)*(this.y-v.y));
    },
    distSeg: function(x0,y0) {
        return Math.sqrt((this.x-x0)*(this.x-x0)+(this.y-y0)*(this.y-y0));
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

function svgAddClass(selector, cls) {
    $(selector).each(function(i,n){
        if(n.className instanceof SVGAnimatedString) {
            if((' '+n.className.baseVal+' ').indexOf(' '+cls+' ') == -1) n.className.baseVal += ' '+cls;
            if((' '+n.className.animVal+' ').indexOf(' '+cls+' ') == -1) n.className.animVal += ' '+cls;
        } else {
            n.addClass(cls);
        }
    });
}

function svgRemoveClass(selector, cls) {
    $(selector).each(function(i,n){
        if(n.className instanceof SVGAnimatedString) {
            n.className.baseVal = (' '+n.className.baseVal+' ').replace(' '+cls+' ').trim();
            n.className.animVal = (' '+n.className.animVal+' ').replace(' '+cls+' ').trim();
        } else {
            n.removeClass(cls);
        }
    });
}

function getDistanceBetweenPoints(p1,p2){
    x1 = p1.x;
    x2 = p2.x;
    y1 = p1.y;
    y2 = p2.y;
    return Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) );
}