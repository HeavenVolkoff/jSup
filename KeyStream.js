/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';
function KeyStream(key, macKey){
    /*global RC4*/
	Object.defineProperties(this, {
        'DROP': {
            'value': 768
        },
		'rc4': {
			'value': new RC4(key, this.DROP)
		},
		'macKey': {
			get: function get(){
				return macKey;
			}
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
        /*global bin2hex*/
        var array = [];
        var crypto = require('crypto');
        nonce += '0';

        for(var count = 0; count < 4; count++){
            nonce[nonce.length - 1] = String.fromCharCode(count + 1);
            array.push(crypto.pbkdf2(password, nonce, 2, 20));//TODO: this function returns a buffer need attention
        }
        return array;
	 },

	/**
	 * Calculate HMAC from given buffer;
	 *
	 * @param {Buffer} buffer
	 * @param {int} offset
	 * @param {int} length
	 * @returns {string}
	 */
	'computeMac': function computeMac(buffer, offset, length){
        var crypto = require('crypto');
		//TODO: verifies that this.macKey is in binary string form or is a buffer.
        var hmac = crypto.createHmac('sha1', this.macKey);
        hmac.update(buffer.substr(offset, length));
        var string = String.fromCharCode(this.seq >> 24) +
                     String.fromCharCode(this.seq >> 16) +
                     String.fromCharCode(this.seq >> 8) +
                     String.fromCharCode(this.seq);
        hmac.update(string);
        this.seq++;
        return hmac.digest('binary');
	},

	/**
	 * Decode given buffer message
	 *
	 * @param {Buffer} buffer
	 * @param {int} macOffsset
	 * @param {int} offset
	 * @param {int} length
	 * @returns {string}
	 */
	'decodeMessage': function decodeMessage(buffer, macOffsset, offset, length){
		var mac = this.computeMac(buffer, offset, length);
		//Validate Mac
		for(var count = 0; count < 4; count++){
			var bufferVerifier = buffer.charCodeAt(macOffsset + 1);
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
	 * @param {Buffer} buffer
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

