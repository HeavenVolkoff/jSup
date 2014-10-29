/**
 * Created by HeavenVolkoff on 18/10/14.
 */

'use strict';

/**
 * Construct RC4 symmetric cipher
 *
 * @param key
 * @param drop
 * @constructor [RC4]
 */
function RC4(key, drop){
    var range = require('./php.js').range;

	this.s = range(0, 255);
	this.i = 0;
	this.j = 0;

	for(var i = 0, j = 0, k = 0; i < 256; i++){
		k = key.charCodeAt(i % key.length);
		j = (j + k + this.s[i]) & 0xff;
		this.swap(i, j);
	}

	Object.defineProperties(this, {
		'key': {
			value: key
		},
		'drop': {
			value: drop
		}
	});
}

module.exports = RC4;

RC4.prototype = {
	/**
	 * Swap array 's' value from position i to position j
	 *
	 * @param {int} i
	 * @param {int} j
	 */
	'swap': function swap(i, j){
		var c = this.s[i];
		this.s[i] = this.s[j];
		this.s[j] = c;
	},

	/**
	 *
	 * @param {string} data
	 * @param {int} offset
	 * @param {int } length
	 * @returns {*}
	 */
	'cipher': function cipher(data, offset, length){
		var out = data;
		for(var n = length; n > 0; n--){
			this.i = this.i + 1;// & 0xFF
			this.j = this.j + this.s[this.i];// & 0xFF
			this.swap(this.i, this.j);
			var d = data.charCodeAt(offset);
			out[offset] = String.fromCharCode(d ^ this.s[(this.s[this.i] + this.s[this.j])]);// & 0xFF
			offset++;
		}
		return out;
	}
};