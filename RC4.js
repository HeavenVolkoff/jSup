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
		j = (j + k + this.s[i  % this.s.length]) & 0xFF;
		this.swap(i, j);
	}

	this.cipher(range(0, drop), 0, drop);
}

module.exports = RC4;

RC4.prototype = {
	/**
	 * Swap array 's' value from position i to position j
	 *
	 * @param {int} i
	 * @param {int} j
	 */
	swap: function swap(i, j){
		var c = this.s[i % this.s.length];
		this.s[i % this.s.length] = this.s[j % this.s.length];
		this.s[j % this.s.length] = c;
	},

	/**
	 * Encrypt and Decrypt Messages
	 *
	 * @param {Buffer | Array} buffer
	 * @param {int} offset
	 * @param {int} length
	 * @returns {Buffer | Array}
	 */
	cipher: function cipher(buffer, offset, length){
		for(var n = length; n > 0; n--){
			this.i = (this.i + 1) & 0xFF;
			this.j = (this.j + this.s[this.i % this.s.length]) & 0xFF;
			this.swap(this.i, this.j);
			buffer[offset] = (buffer[offset] ^ this.s[(((this.s[this.i % this.s.length] + this.s[this.j % this.s.length])) % this.s.length) & 0xFF]);
			offset++;
		}
		return buffer;
	}
};
