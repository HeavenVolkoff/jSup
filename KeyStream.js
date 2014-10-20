/**
 * Created by HeavenVolkoff on 16/10/14.
 */


function KeyStream(key, macKey){
	const DROP = 768;

	Object.defineProperties(this, {
		'rc4': {
			'value': new RC4(key, DROP)
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
	})
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
		 nonce += '0';

		 for(var j = 0; j < 4; j++){
			 nonce[nonce.length - 1] = String.fromCharCode(j + 1);
			 array.push(waPbkdf2('SHA-1', password, nonce, 2, 20, true));
		 }
		 return array;
	 },

	/**
	 * Calculate HMAC from given buffer;
	 *
	 * @param {Buffer} buffer
	 * @param {int} offset
	 * @param {int} lenght
	 * @returns {string}
	 */
	'computeMac': function computeMac(buffer, offset, lenght){
		var crypto = require('crypto');
		var hmac = crypto.createHmac('sha1', this.macKey);
		hmac.update(buffer.substr(offset, lenght));
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
		for(var i = 0; i < 4; i++){
			var bufferVerifier = buffer.charCodeAt(macOffsset + 1);
			var macVerifier = mac.charCodeAt(i);

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

