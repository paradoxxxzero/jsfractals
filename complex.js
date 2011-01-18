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

function Complex(r, i) {
    this.r = r;
    this.i = i;
}

Complex.prototype.toString = function () {
    return this.r + (this.i == 0 ? "" : (this.i > 0 ? " + " : " - ") + Math.abs(this.i) + "i"); 
};

Complex.prototype.add = function (c) {
    if(typeof(c) == "number") c = new Complex(c, 0);
    this.r += c.r;
    this.i += c.i;
    return this;
}

Complex.prototype.sub = function (c) {
    if(typeof(c) == "number") c = new Complex(c, 0);
    this.r -= c.r;
    this.i -= c.i;
    return this;
}

Complex.prototype.mul = function (c) {
    if(typeof(c) == "number") c = new Complex(c, 0);
    var r = c.r;
    var i = c.i;
    var tr = this.r;
    this.r = this.r * r - this.i * i;
    this.i = tr * i + this.i * r;
    return this;
}

Complex.prototype.div = function (c) {
    if(typeof(c) == "number") c = new Complex(c, 0);
    var sn = c.squareNorm();
    var r = c.r;
    var i = c.i;
    var tr = this.r;
    this.r = (this.r * r + this.i * i) / sn;
    this.i = (r * this.i - tr * i) / sn;
    return this;
}

Complex.prototype.pow = function (exp) {
    if(exp == 0) {
	this.r = 1;
	this.i = 0;
    } else {
	var r = this.r;
	var i = this.i;
	for(var e = 1 ; e < exp ; e++) {
	    this.mul(new Complex(r, i));
	}
    }
    return this;
}

Complex.prototype.squareNorm = function () {
    return this.r * this.r + this.i * this.i;
}

Complex.prototype.norm = function () {
    return Math.sqrt(this.squareNorm());
}

Complex.prototype.conjugate = function () {
    this.i = - this.i;
    return this;
}

Complex.prototype.clone = function () {
    return new Complex(this.r, this.i);
}