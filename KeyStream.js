/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';

var RC4 = require('./RC4');
var crypto = require('crypto');

/**
 *
 * @param {string} key
 * @param {string} macKey
 * @constructor
 */
module.exports = KeyStream;
function KeyStream(key, macKey){
	macKey = Buffer.isBuffer(macKey)? macKey : typeof macKey === 'number'? macKey.toString(16) : null;

	if(typeof macKey === 'string') {
		if (macKey.length % 2) {
			macKey = '0' + macKey;
		}

		macKey = new Buffer(macKey, 'hex');
	}

    /*global RC4*/
	Object.defineProperties(this, {
		rc4: {
			value: new RC4(key, 768)
		},
		macKey: {
			value: macKey
		},
		seq: {
			value: 0,
			writable: true,
			enumerable: true
        }
	});
}

KeyStream.prototype = {
	/**
	 * Calculate HMAC from given buffer;
	 * @param {Buffer} buffer
	 * @param {int} offset
	 * @param {int} length
	 * @returns {SlowBuffer}
	 */
	'computeMac': function computeMac(buffer, offset, length){
        var hmac = crypto.createHmac('sha1', this.macKey);
        var seqBuff = new Buffer(   String.fromCharCode(this.seq >> 24) +
                                    String.fromCharCode(this.seq >> 16) +
                                    String.fromCharCode(this.seq >> 8)  +
                                    String.fromCharCode(this.seq)
                                );

		hmac.write(buffer.slice(offset, offset + length));
        hmac.write(seqBuff);
		hmac.end();
        this.seq++;
        return hmac.read();
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

/**
 * Generate the crypto keys from password with salt nonce
 *
 * @param {Buffer} password
 * @param {Buffer} challenge
 * @param {function} callback
 * @returns {Buffer[]}
 */
module.exports.generateKeys = function generateKeys(password, challenge, callback){
	var async = require('async');
	var crypto = require('crypto');
	var array = [];

	async.each(
		[1, 2, 3, 4],
		function(count, callback) {
			var countBuff = new Buffer(1);
			countBuff.writeUInt8(count, 0);
			var nonce = Buffer.concat([challenge, countBuff]);
			crypto.pbkdf2(password, nonce, 2, 20,
				function (error, key) {
					if (!error) {
						array[count - 1] = key;
						callback(null);
					} else {
						callback(error, null);
					}
				}
			);
		},
		function(error){
			if(!error){
				callback(null, array);
			}else{
				callback(error);
			}
		}
	);
};

