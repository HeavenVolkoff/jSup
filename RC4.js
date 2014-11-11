/**
 * Created by HeavenVolkoff on 18/10/14.
 */

'use strict';

/**
 * Construct RC4 symmetric cipher
 *
 * @param {Buffer} key
 * @param {int} drop
 * @constructor [RC4]
 */
function RC4(key, drop){
    var range = require('./php.js').range;

	this.s = range(0, 255);
	this.i = 0;
	this.j = 0;

	for(var i = 0, j = 0, k = 0; i < 256; i++){
		k = key[i % key.length];
		j = (j + k + this.s[i]) & 0xFF;
		this.swap(i, j);
	}

	this.cipher(range(0, drop), 0, drop);

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
	 * Encrypt and Decrypt Messages
	 *
	 * @param {Buffer | Array} buffer
	 * @param {int} offset
	 * @param {int} length
	 * @returns {Buffer | Array}
	 */
	'cipher': function cipher(buffer, offset, length){
		var out = buffer;

		for(var n = length; n > 0; n--){
			this.i = (this.i + 1) & 0xFF;
			this.j = (this.j + this.s[this.i]) & 0xFF;
			this.swap(this.i, this.j);
			var d = buffer[offset];
			out[offset] = (d ^ this.s[(this.s[this.i] + this.s[this.j])]) & 0xFF;
			offset++;
		}

		return out;
	}
};