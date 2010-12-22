var _reg, _data, _scr, _precision, _xstart, _ystart, _w, _h;

self.onmessage = function(event) {
    _reg = event.data.reg;
    _data = event.data.data;
    _scr = event.data.scr;
    _precision = event.data.precision;
    _xstart = event.data.xstart;
    _ystart = event.data.ystart;
    _w = event.data.w;
    _h = event.data.h;
    fractalPlot();
    this.postMessage(
	{
	    data: _data,
	    x: _xstart,
	    y: _ystart
	}
    );
};

function x2X(x) {
    return _reg.X.min + (x * _reg.X.__normed_range);
}

function y2Y(y) {
    return  _reg.Y.max - (y * _reg.Y.__normed_range);
}



function pix(x, y, r, g, b, a) {
    var index = (x + y * _data.width) * 4;
    _data.data[index+0] = r;
    _data.data[index+1] = g;
    _data.data[index+2] = b;
    _data.data[index+3] = a;
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
	// Z = Z² + P
	// Z² = r² - i² + 2 r i sqrt(-1)
	// Z = Z² + P = (r² - i² + X) + (2 r i + Y) sqrt(-1)

	i = 2 * r * i + Y;
	r = r2 - i2 + X;
    }
    return 0;
}
function fractalPlot () {
    for(var x = 0 ; x <= _w ; x++) {
	var X = x2X(x + _xstart);
	for(var y = 0 ; y <= _h ; y++) {
	    pix(x, y, mandelbrot(X, y2Y(y + _ystart)) * 20, 0, 0, 255);
	}
    }
}
