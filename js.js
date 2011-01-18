/*
 fractals.tk - An html5 fractals drawer

 Copyright (C) 2011 Mounier Florian aka paradoxxxzero

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see http://www.gnu.org/licenses/.
 */

var _canvas, _c, _scr, _mode, _time, _timer, _data, _metadata;
var _smooth = true;
var _plotid = 0;
var _flex = 3;
var _pow = 1.1;
var _precision = 25;
var _epsilon = .0001;
var _gamma = 2;
var _juliacoef = 2;
var _juliacst = new Complex(-.8, .156);
var _fractal = mandelbrot;
var _step = 1;
var _reg = {
    X: {
	min: 0,
	max: 0,
	__range: 0, // max - min for optimisation purpose
	__normed_range: 0, // max - min / screen for optimisation purpose
	zcoef: 5
    },
    Y: {
	min: 0,
	max: 0,
	__range: 0, // max - min for optimisation purpose
	__normed_range: 0, // max - min / screen for optimisation purpose
	zcoef: 5
    }
};
var _dragging = {
    on: false,
    x: 0,
    y: 0
};

function x2X(x) {
    return _reg.X.min + (x * _reg.X.__normed_range);
}

function y2Y(y) {
    return  _reg.Y.max - (y * _reg.Y.__normed_range);
}


function dx2DX(dx) {
    return dx * (_reg.X.max - _reg.X.min) / _scr.w;
}

function dy2DY(dy) {
    return dy * (_reg.Y.max - _reg.Y.min) / _scr.h;
}

function preCompute() {
    _reg.X.__range = _reg.X.max - _reg.X.min;
    _reg.Y.__range = _reg.Y.max - _reg.Y.min;
    _reg.X.__normed_range = _reg.X.__range / _scr.w;
    _reg.Y.__normed_range = _reg.Y.__range / _scr.h;
}

function mandelbrot(X, Y) {
    var X2 = X*X;
    var X2X = X2 + 2*X;
    var Y2 = Y*Y;
    var sN = X2 + Y2;
    if(
    // Eliminating the main cardioid
	sN * (8 * sN - 3) < .09375 - X ||
	    // And the period 2 cycle
	    X2X + Y2 < -.9375
    ) {
	return [0, 0, 0];
    }
    // Iterating to see if Z is cool
    var r = 0;
    var i = 0;
    for(var n = 0; n < _precision; n++) {
	var r2 = r*r;
	var i2 = i*i;
	// |Z| must be inferior to 2 (Mandelbrot voodoo 2 ~ +∞)
	if (r2 + i2 > 4) {
	    if(_smooth) n -= Math.log(Math.log(r2+i2)) / Math.LN2;
	    n = 3 * 255 * n / _precision;
	    return [n, n - 255, n - 2 * 255];
	}
	// Next step :
	// Z = Z² + P = r + i sqrt(-1)
	// Z² = r² - i² + 2 r i sqrt(-1)
	// Z = Z² + P = (r² - i² + X) + (2 r i + Y) sqrt(-1)

	i = 2 * r * i + Y;
	r = r2 - i2 + X;
    }
    return [0, 0, 0];
}

function newton(X, Y) {
    var r = X;
    var i = Y;
    //var c = new Complex(X, Y);
    for(var n = 0; n < _precision; n++) {
	// c = c.sub(c.mul(c.mul(c)).sub(1).div(c.mul(c).mul(3)));
	var rr = r * r;
	var ii = i * i;

	var r2 = rr - ii;
	var i2 = 2 * r * i;

	var r3 = r * r2 - i * i2;
	var i3 = r * i2 + i * r2;

	var d = (r2 * r2 + i2 * i2) * 3;
	r -= (r2 * (r3 - 1) + i2 * i3) / d;
	i -= (r2 * i3 - i2 * (r3 - 1)) / d;

	var n1 = (r - 1) * (r - 1) + i * i;
	var n2 = (r + .5) * (r + .5) + (i - .866025404) * (i - .866025404);
	var n3 = (r + .5) * (r + .5) + (i + .866025404) * (i + .866025404);
	if(n1 < _epsilon) return [255 - (_smooth ? (n - Math.log(Math.log(1/(50*n1)))) : n) * _precision, 0, 0];
	if(n2 < _epsilon) return [0, 255 - (_smooth ? (n - Math.log(Math.log(1/(50*n2)))): n) * _precision, 0];
	if(n3 < _epsilon) return [0, 0, 255 - (_smooth ? (n - Math.log(Math.log(1/(50*n3)))) : n) * _precision];
    }
    return [0, 0, 0];
}

function julia(X, Y) {
//    var z = new Complex(X, Y);
    var r = X;
    var i = Y;
    for(var n = 0; n < _precision; n++) {
//	z = z.mul(z).add(_juliacst);
	var rr = r * r;
	var ii = i * i;
	i = 2 * r * i;
	r = rr - ii;
	r += _juliacst.r;
	i += _juliacst.i;
	if(rr + ii > _gamma) {
	    if(_smooth) n -= Math.log(Math.log(rr + ii))*1.25;
	    n *= _juliacoef;
	    return [n, n - 255 , n - 2 * 255];
	}
    }
    return [0, 0, 0];
}



function fractalPlot(it, plotid) {
    var xstart, ystart, ft;
    xstart = Math.floor(it / _flex);
    ystart = it % _flex;
    for(var x = xstart ; x <= _scr.w ; x+=_flex) {
	var X = x2X(x);
	if(plotid != _plotid) return;
	for(var y = ystart ; y <= _scr.h ; y+=_flex) {
	    var nit = _fractal(X, y2Y(y));
	    var i = (x + y * _scr.w) * 4;
	    _metadata[i++] = nit[0];
	    _metadata[i++] = nit[1];
	    _metadata[i++] = nit[2];
	    _metadata[i++] = 255;
	}
    }
}

function rplot(lvl, plotid) {
    fractalPlot(lvl, plotid);
    _data.data = _metadata;
    _c.putImageData(_data, 0, 0);
    var stime = ".";
    for(var p = 0; p < lvl; p++) {
	stime += ".";
    }
    document.title = (new Date().getTime() - _time) + stime;
    if(lvl < _flex*_flex - 1) {
	_timer = setTimeout(
	    function () {
		rplot(lvl+1, plotid);
	    }, 5
	);
    }
}

function plot() {
    _plotid++;
    clearTimeout(_timer);
    _time = new Date().getTime();
    _data = _c.getImageData(0, 0, _scr.w, _scr.h);
    _metadata = _data.data;
    _timer = setTimeout(
	function () {
	    rplot(0, _plotid);
	}, 10
    );
}

function size() {
    _scr = {
	h: _canvas.height = window.innerHeight,
	w: _canvas.width = window.innerWidth
    };
    preCompute();
}

function resize() {
    size();
    setTimeout(function () {plot();}, 10);
}

function mdown(event) {
    _dragging.on = true;
    _dragging.x = event.clientX;
    _dragging.y = event.clientY;
    event.stopPropagation();
    $("body").addClass("moving");
    return false;
}

function mmove(event) {
    if(!_dragging.on) return true;
    var d = {
	x: _dragging.x - event.clientX,
	y: _dragging.y - event.clientY};
    var D = {
	X: dx2DX(d.x),
	Y: dy2DY(d.y)};
    _reg.X.min += D.X;
    _reg.X.max += D.X;
    _reg.Y.min -= D.Y;
    _reg.Y.max -= D.Y;
    _dragging.x = event.clientX;
    _dragging.y = event.clientY;
    event.stopPropagation();
    plot();
    return false;
}

function mup(event) {
    _dragging.on = false;
    event.stopPropagation();
    $("body").removeClass("moving");
    return false;
}

function kdown(event) {
    switch(event.keyCode) {
    case 107:
    case 38:
	_precision *= 2;
	$("#precision").val(_precision);
	break;
    case 109:
    case 40:
	_precision /= 2;
	$("#precision").val(_precision);
	break;
    case 39:
	_precision *= 1.1;
	$("#precision").val(_precision);
	break;
    case 37:
	_precision /= 1.1;
	$("#precision").val(_precision);
	break;
    case 32:
	_smooth = !_smooth;
	$("#smoothing").attr("checked", (!$("#smoothing").is(":checked")));
	break;
    default:
	return;
    }
    plot();
}

function wheel(event, delta) {
    zoom(delta < 0, event.clientX, event.clientY ,event.shiftKey, event.altKey);
}

function zoom(out, x, y, shift, alt) {
    var d = {
	x: 0,
	y: 0
    };
    if(out) { // Zoom out
	if(!shift && _mode != 'y') {
	    _reg.X.zcoef += _step;
	    // a^n - a^(n-k) = (a^k-1)a^(n-k)
	    // <=> Math.pow(_pow, _reg.X.zcoef) - Math.pow(_pow, _reg.X.zcoef - _step)
	    d.x = (Math.pow(_pow, _step) - 1) * Math.pow(_pow, _reg.X.zcoef - _step);
	}
	if(!alt && _mode != 'x') {
	    _reg.Y.zcoef += _step;
	    d.y = (Math.pow(_pow, _step) - 1) * Math.pow(_pow, _reg.Y.zcoef - _step);
	}
    } else { // Zoom in
	if(!shift && _mode != 'y') {
	    d.x = (1 - Math.pow(_pow, _step)) * Math.pow(_pow, _reg.X.zcoef - _step);
	    _reg.X.zcoef -= _step;
	}
	if(!alt && _mode != 'x') {
	    d.y = (1 - Math.pow(_pow, _step)) * Math.pow(_pow, _reg.Y.zcoef - _step);
	    _reg.Y.zcoef -= _step;
	}
    }
    var p = {
	x: x / _scr.w,
	y: y / _scr.h};
    _reg.X.min -= (2 * d.x * x) / _scr.w;
    _reg.X.max += (2 * d.x * (_scr.w - x)) / _scr.w;
    _reg.Y.min -= (2 * d.y * (_scr.h - y)) / _scr.h;
    _reg.Y.max += (2 * d.y * y) / _scr.h;
    preCompute();
    plot();
    event.stopPropagation();
    return false;
}

function fractalChange() {
    var val = $("#fractal").val();
    _fractal = window[val];
    switch(val) {
    case "mandelbrot":
	_precision = 25;
	$("#precision").val(_precision);
	$(".julia").hide("fast");
	$(".juliacustom").hide("fast");
	break;
    case "newton":
	_precision = 20;
	$("#precision").val(_precision);
	$(".julia").hide("fast");
	$(".juliacustom").hide("fast");
	break;
    case "julia":
	_precision = 2000;
	$("#precision").val(_precision);
	$(".julia").show("fast");
	juliaConstantChange();
	break;
    }
    plot();
}

function juliaConstantChange() {
    var juliacst = $("#juliacst").val();
    if(juliacst == "custom") {
	$("#juliacstr").val(_juliacst.r);
	$("#juliacsti").val(_juliacst.i);

	$(".juliacustom").show("fast");
    } else {
	$(".juliacustom").hide("fast");
	eval(juliacst);
	plot();
    }
}

function juliaCustomClick() {
    var r = $("#juliacstr").val();
    var i = $("#juliacsti").val();
    if(!r || !i || r == "" || i == "") return;
    try {
	r = parseFloat(r);
	i = parseFloat(i);
    } catch(x) {
	return;
    }
    _juliacst = new Complex(r, i);
    plot();
}

function smoothChange() {
    _smooth = !_smooth;
    plot();
}

function precisionChange() {
    _precision = $("#precision").val();
    plot();
}

$(window).load(
    function() {
	// UI init
	$("#fractal").change(fractalChange);
	$("#juliacst").change(juliaConstantChange);
	$("#juliacustombtn").click(juliaCustomClick);
	$("#smoothing").change(smoothChange);
	$("#precision").bind("input", precisionChange);
	$("#zoomplus").click(function () { zoom(false, _scr.w/2, _scr.h/2, false, false); });
	$("#zoomminus").click(function () { zoom(true, _scr.w/2, _scr.h/2, false, false); });
	$("#close").click(function () { $("#top").hide("slow"); $("#open").show("slow"); });
	$("#open").click(function () { $("#top").show("slow");  $("#open").hide("slow"); });
	var eventSource = $('canvas');
	eventSource.mousedown(mdown);
	eventSource.mousemove(mmove);
	eventSource.mouseup(mup);
	eventSource.mouseout(mup);
	eventSource.mousewheel(wheel);
	$(window).keydown(kdown);
	$(window).resize(resize);
	_canvas = $('#canvas')[0];
	_c = _canvas.getContext('2d');
	size();
	_reg.X.zcoef = _reg.Y.zcoef * _scr.w / _scr.h;
	var nw = {
	    x: Math.pow(_pow, _reg.X.zcoef),
	    y: Math.pow(_pow, _reg.Y.zcoef)
	};
	_reg.X.min -= nw.x;
	_reg.X.max += nw.x;
	_reg.Y.min -= nw.y;
	_reg.Y.max += nw.y;
	preCompute();
	fractalChange();
    }
);
