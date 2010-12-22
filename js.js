/*
 fractals.tk - An html5 fractals drawer

 Copyright (C) 2010 Mounier Florian aka paradoxxxzero

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

var _canvas, _c, _scr, _mode, _time;
var _pow = 1.1;
var _precision = 25;
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

function pix(x, y, r, g, b, a, data) {
    var index = (x + y * _scr.w) * 4;
    data[index++] = r;
    data[index++] = g;
    data[index++] = b;
    data[index] = a;
}

function mandelbrot(X, Y) {
    // Iterating to see if Z is cool
    var r = 0;
    var i = 0;
    for(var n = 0; n < _precision; n++) {
	var r2 = r*r;
	var i2 = i*i;
	// |Z| must be inferior to 2 (Mandelbrot voodoo 2 ~ +∞)
	if (r2 + i2 > 4) {
	    return n;
	}
	// Next step :
	// Z = Z² + P = r + i sqrt(-1)
	// Z² = r² - i² + 2 r i sqrt(-1)
	// Z = Z² + P = (r² - i² + X) + (2 r i + Y) sqrt(-1)

	i = 2 * r * i + Y;
	r = r2 - i2 + X;
    }
    return 0;
}

function fractalPlot(data) {
    for(var x = 0 ; x <= _scr.w ; x++) {
	var X = x2X(x);
	for(var y = 0 ; y <= _scr.h ; y++) {
	    var nit = mandelbrot(X, y2Y(y));
	    var r = nit * 15;
	    var g = 0;
	    var b = 0;
	    pix(x, y, r, g, b, 255, data);
	}
    }
}

function plot() {
    _time = new Date().getTime();
    var data = _c.createImageData(_scr.w, _scr.h);
    var metadata = data.data;
    fractalPlot(metadata);
    data.data = metadata;
    _c.putImageData(data, 0, 0);
    document.title = "" + (new Date().getTime() - _time);
}

function size() {
    _scr = {
	h: _canvas.height = window.innerHeight - 3,
	w: _canvas.width = window.innerWidth - 3};
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
   if(event.keyCode == 107) {
       _precision *= 2;
       plot();
   } else if(event.keyCode == 109) {
       _precision /= 2;
       plot();
   }
}

function wheel(event, delta) {
    var d = {
	x: 0,
	y: 0
    };
    if(delta < 0) { // Zoom out
	if(!event.shiftKey && _mode != 'y') {
	    _reg.X.zcoef += _step;
	    // a^n - a^(n-k) = (a^k-1)a^(n-k)
	    // <=> Math.pow(_pow, _reg.X.zcoef) - Math.pow(_pow, _reg.X.zcoef - _step)
	    d.x = (Math.pow(_pow, _step) - 1) * Math.pow(_pow, _reg.X.zcoef - _step);
	}
	if(!event.altKey && _mode != 'x') {
	    _reg.Y.zcoef += _step;
	    d.y = (Math.pow(_pow, _step) - 1) * Math.pow(_pow, _reg.Y.zcoef - _step);
	}
    } else { // Zoom in
	if(!event.shiftKey && _mode != 'y') {
	    d.x = (1 - Math.pow(_pow, _step)) * Math.pow(_pow, _reg.X.zcoef - _step);
	    _reg.X.zcoef -= _step;
	}
	if(!event.altKey && _mode != 'x') {
	    d.y = (1 - Math.pow(_pow, _step)) * Math.pow(_pow, _reg.Y.zcoef - _step);
	    _reg.Y.zcoef -= _step;
	}
    }
    var p = {
	x: event.clientX / _scr.w,
	y: event.clientY / _scr.h};
    _reg.X.min -= (2 * d.x * event.clientX) / _scr.w;
    _reg.X.max += (2 * d.x * (_scr.w - event.clientX)) / _scr.w;
    _reg.Y.min -= (2 * d.y * (_scr.h - event.clientY)) / _scr.h;
    _reg.Y.max += (2 * d.y * event.clientY) / _scr.h;
    preCompute();
    plot();
    event.stopPropagation();
    return false;
}

$(window).load(
    function() {
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
	var nw = {
	    x: Math.pow(_pow, _reg.X.zcoef),
	    y: Math.pow(_pow, _reg.Y.zcoef)
	};
	_reg.X.min -= nw.x + .5;
	_reg.X.max += nw.x - .5;
	_reg.Y.min -= nw.y;
	_reg.Y.max += nw.y;
	preCompute();
	plot();
    }
);
