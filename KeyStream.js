/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';

var RC4 = require('./RC4');

/**
 *
 * @param {string} key
 * @param {string} macKey
 * @constructor
 */
function KeyStream(key, macKey){
    /*global RC4*/
	Object.defineProperties(this, {
		'rc4': {
			'value': new RC4(key, 768)
		},
		'macKey': {
			value: new Buffer(macKey)
		},
		'seq': {
			'value': 0,
			'writable': true
        }
	});
}

module.exports = KeyStream;

KeyStream.prototype = {
	/**
	 * Calculate HMAC from given buffer;
	 * @param {Buffer} buffer
	 * @param {int} offset
	 * @param {int} length
	 * @returns {SlowBuffer}
	 */
	'computeMac': function computeMac(buffer, offset, length){
        var crypto = require('crypto');
        var hmac = crypto.createHmac('sha1', this.macKey);
        var seqBuff = new Buffer(   String.fromCharCode(this.seq >> 24) +
                                    String.fromCharCode(this.seq >> 16) +
                                    String.fromCharCode(this.seq >> 8)  +
                                    String.fromCharCode(this.seq)
                                );

		hmac.update(buffer.slice(offset, offset + length));
        hmac.update(seqBuff);
        this.seq++;
        return hmac.digest();
	},

	/**
	 * Decode given buffer message
	 *
	 * @param {Buffer} buffer
	 * @param {int} macOffset
	 * @param {int} offset
	 * @param {int} length
	 * @returns {Buffer}
	 */
	'decodeMessage': function decodeMessage(buffer, macOffset, offset, length){
		var mac = this.computeMac(buffer, offset, length);
		//Validate Mac
		for(var count = 0; count < 4; count++){
			var bufferVerifier = buffer[macOffset + count];
			var macVerifier = mac[count];

			if(bufferVerifier !== macVerifier){
				return Error('Mac mismatch: bufferVerifier: ' + bufferVerifier + ' != macVerifier: ' + macVerifier);
			}
		}
		return this.rc4.cipher(buffer, offset, length);
	},

	/**
	 * Encode given buffer message
	 *
	 * @param {Buffer} buffer
	 * @param {int} macOffset
	 * @param {int} offset
	 * @param {int} length
	 * @returns {Buffer}
	 */
	'encodeMessage': function encodeMessage(buffer, macOffset, offset, length){
		var data = this.rc4.cipher(buffer, offset, length);
		var mac = this.computeMac(data, offset, length);

		return Buffer.concat([data.slice(0, macOffset), mac.slice(0, 4), data.slice(macOffset + 4)]);
	}
};

