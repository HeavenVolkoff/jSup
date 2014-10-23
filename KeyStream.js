/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';

/**
 *
 *
 * @param {string} key
 * @param {string} macKey
 * @constructor
 */
function KeyStream(key, macKey){
	const DROP = 768;
    /*global RC4*/
	Object.defineProperties(this, {
		'rc4': {
			'value': new RC4(key, DROP)
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

KeyStream.prototype = {
	/**
	 * Generate the crypto keys from password with salt nonce
	 *
	 * @param {string} password
	 * @param {string} nonce
	 * @returns {string[]}
	 */
	 'generateKeys': function generateKeys(password, nonce){
        var array = [];
        var crypto = require('crypto');

		var func = function fillArray(err, key){
			if(!err){
				array.push(key.toString('binary'));
			}else{
				throw  err;
			}
		};

        for(var count = 0; count < 4; count++){
            var pseudoNonce = nonce + String.fromCharCode(count + 1);
            crypto.pbkdf2(password, pseudoNonce, 2, 20, func);
        }
        return array;
	 },

	/**
	 * Calculate HMAC from given buffer;
	 *
	 * @param {string} buffer
	 * @param {int} offset
	 * @param {int} length
	 * @returns {string}
	 */
	'computeMac': function computeMac(buffer, offset, length){
        var crypto = require('crypto');
        var hmac = crypto.createHmac('sha1', this.macKey);
        hmac.update(buffer.substr(offset, length));
        var string = String.fromCharCode(this.seq >> 24) +
                     String.fromCharCode(this.seq >> 16) +
                     String.fromCharCode(this.seq >> 8)  +
                     String.fromCharCode(this.seq);
        hmac.update(string);
        this.seq++;
        return hmac.digest('binary');
	},

	/**
	 * Decode given buffer message
	 *
	 * @param {string} buffer
	 * @param {int} macOffset
	 * @param {int} offset
	 * @param {int} length
	 * @returns {string}
	 */
	'decodeMessage': function decodeMessage(buffer, macOffset, offset, length){
		var mac = this.computeMac(buffer, offset, length);
		//Validate Mac
		for(var count = 0; count < 4; count++){
			var bufferVerifier = buffer.charCodeAt(macOffset + 1);
			var macVerifier = mac.charCodeAt(count);

			if(bufferVerifier !== macVerifier){
				throw Error('Mac mismatch: bufferVerifier: ' + bufferVerifier + ' != macVerifier' + macVerifier);
			}
		}
		return this.rc4.cipher(buffer, offset, length);
	},

	/**
	 * Encode given buffer message
	 *
	 * @param {string} buffer
	 * @param {int} macOffset
	 * @param {int} offset
	 * @param {int} length
	 * @returns {string}
	 */
	'encodeMessage': function encodeMessage(buffer, macOffset, offset, length){
		var data = this.rc4.cipher(buffer, offset, length);
		var mac = this.computeMac(data, offset, length);

		return data.substr(0, macOffset) + mac.substr(0, 4) + data.substr(macOffset + 4);
	}
};

