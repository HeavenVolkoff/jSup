/**
 * Created by HeavenVolkoff on 18/10/14.
 */

/**
 * Construct RC4 RC4 symmetric cipher
 *
 * @param key
 * @param drop
 * @constructor [RC4]
 */
function RC4(key, drop){
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
	 * @param {int } lenght
	 * @returns {*}
	 */
	'cipher': function cipher(data, offset, lenght){
		var out = data;
		for(var n = lenght; n > 0; n--){
			this.i = (this.i + 1) & 0xff;
			this.j = (this.j + this.s[this.i]) & 0xff;
			this.swap(this.i, this.j);
			var d = data.charCodeAt(offset);
			out[offset] = String.fromCharCode(d ^ this.s[(this.s[this.i] + this.s[this.j])] & 0xff);
			offset++;
		}
		return out;
	}
};