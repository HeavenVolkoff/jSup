/**
 * Created by HeavenVolkoff on 21/10/14.
 */

'use strict';

function BinTreeNodeWriter(){
	Object.defineProperties(this, {
		'output': {
			value: '',
			writable: true
		},
		'key': {
			writable: true
		}
	});
}

module.exports = BinTreeNodeWriter;

/**
 * 'þ' = '\xfe' = 0xFE = 254
 * 'ú' = '\xfa' = 0xFa = 250
 *
 * @type {{resetKey: resetKey, writeInt8: writeInt8, writeInt16: writeInt16, writeInt24: writeInt24, parseInt24: parseInt24, getInt24: getInt24, writeBytes: writeBytes, writeToken: writeToken, writeString: writeString, writeJabberid: writeJabberId, writeAttributes: writeAttributes, writeListStart: writeListStart, flushBuffer: flushBuffer, writeInternal: writeInternal, write: write, startStream: startStream}}
 */
BinTreeNodeWriter.prototype = {
	/**
	 * Reset this.key
	 */
	'resetKey': function resetKey(){
		this.key = null;
	},

	/**
	 * Return the char correlated to int value
	 *
	 * @param {int} int
	 * @returns {string}
	 */
	'writeInt8': function writeInt8(int){
        return String.fromCharCode(int); //it was (int & 0xFF), but that doesn't do a fucking thing as 0xFF is equal to 11111111
	},

	/**
	 * Split int value into two bytes (0xFF00 and 0x00FF) and return the correlated char to both as a string
	 *
	 * @param {int} int
	 * @returns {string}
	 */
	'writeInt16': function writeInt16(int){
		var char = String.fromCharCode((int & 0xFF00) >> 8);
		char += String.fromCharCode(int & 0x00FF);

		return char;
	},

	/**
	 * Split int value into three bytes (0xFF0000, 0x00FF00 & 0x0000FF) and return the correlated char to them as a string
	 *
	 * @param {int} int
	 * @returns {string}
	 */
	'writeInt24': function writeInt24(int){
		var char = String.fromCharCode((int & 0xFF0000) >> 16);
		char += String.fromCharCode((int & 0x00FF00) >> 8);
		char += String.fromCharCode((int & 0x0000FF));

		return char;
	},

	/**
	 * Return int value from split char's, Inverse to writeInt24()
	 *
	 * @param data
	 * @returns {Number}
	 */
	'parseInt24': function parseInt24(data){
		var int = data.charCodeAt(0) << 16;
		int += data.charCodeAt(1) << 8;
		int += data.charCodeAt(2);

		return int;
	},

	/**
	 * Almost same thing as writeInt24(), only difference is that it only get the first 4 bits of the third byte, instead of the whole byte
	 *
	 * @param {int} length
	 * @returns {string}
	 */
	'getInt24': function getInt24(length){
		var string = '';
		string += String.fromCharCode((length & 0xF0000) >> 16);
		string += String.fromCharCode((length & 0xFF00) >> 8);
		string += String.fromCharCode(length & 0x00FF);

		return string;
	},

	/**
	 * Receive a binary formatted string and write inside output the length of it
	 *
	 * @param {string} bytes
	 */
	'writeBytes': function writeBytes(bytes){
		var length = bytes.length;

		if(length >= 0x100){
			this.output += '\xfd';
			this.output += this.writeInt24(length);
		}else{
			this.output += '\xfc';
			this.output += this.writeInt8(length);
		}

		this.output += bytes;
	},


	/**
	 * Write token inside this.output
	 *
	 * @param {int} token
	 */
	'writeToken': function writeToken(token){
		if(token < 245){
			this.output += String.fromCharCode(token);
		}else if(token <= 500){
			this.output += '\xfe' + String.fromCharCode(token - 245);
		}
	},

	/**
	 * Write tag value inside this.output
	 *
	 * @param tag
	 */
	'writeString' : function writeString(tag) {
		var TokenMap = require('./TokenMap');

		var tokenMap = new TokenMap();
		var token = tokenMap.getTokenIndex(tag);

		if(token){
			if(token[0]){
				this.writeToken(236);
			}
			this.writeToken(token[1]);
		}else{
			var index = tag.indexOf('@');

			if(index !== -1){
				var server = tag.substr(index + 1);
				var user = tag.substr(0, index);
				this.writeJabberId(user, server);
			}else{
				this.writeBytes(tag);
			}
		}
	},

	/**
	 * Write user and server values inside this.output
	 *
	 * @param {string} user
	 * @param {string} server
	 */
	'writeJabberId': function writeJabberId(user, server){
		this.output += '\xfa';
		if(user.length > 0){
			this.writeString(user);
		}else{
			this.writeToken(0);
		}
		this.writeString(server);
	},

	/**
	 * write attributes key and value inside this.output
	 *
	 * @param {object} attributes
	 */
	'writeAttributes': function writeAttributes(attributes){
		if(attributes){
			for(var key in attributes){
				if(attributes.hasOwnProperty(key)){
					var value = attributes[key];
					this.writeString(key);
					this.writeString(value);
				}
			}
		}
	},

	/**
	 * Write length inside this.output
	 *
	 * @param {int} length
	 */
	'writeListStart': function writeListStart(length) {
		if(length === 0){
			this.output += '\x00';
		}else if(length < 256){
			this.output += '\xf8' + String.fromCharCode(length);
		}else{
			this.output += '\xf9' + this.writeInt16(length);
		}
	},

	/**
	 * Return encrypted[or not] header from this.output
	 *
	 * @param {boolean} [encrypt = true]
	 * @returns {string}
	 */
	'flushBuffer': function flushBuffer(encrypt){
		encrypt = encrypt || true;

		var size = this.output.length;
		var data = this.output;

		if(this.key && encrypt){
			var blockSize = this.getInt24(size);
			//encrypt
			data = this.key.encodeMessage(data, size, 0, size);
			var length = data.length;
			blockSize[0] = String.fromCharCode((8 << 4) | ((length & 0xFF0000) >> 16));
			blockSize[1] = String.fromCharCode((length & 0xFF00) >> 8);
			blockSize[2] = String.fromCharCode(length & 0xFF);
			size = this.parseInt24(blockSize);
		}

		var header = this.writeInt24(size);
		header += data;

		this.output = '';

		return header;
	},

	/**
	 * Receive Node and write it on this.output
	 *
	 * @param {ProtocolNode} node
	 */
	'writeInternal': function writeInternal(node){
		console.log(node);
		var length = 1;

		if(node.attributeHash !== null){
			length += Object.keys(node.attributeHash).length * 2;
		}
		if(Object.keys(node.children).length > 0){
			length += 1;
		}
		if(node.data.length > 0){//TODO: verifies if data is an object or not
			length += 1;
		}

		this.writeListStart(length);
		this.writeString(node.tag);
		this.writeAttributes(node.attributeHash);

		if(node.data > 0){
			this.writeBytes(node.data);
		}
		if(node.children){
			this.writeListStart(Object.keys(node.children).length);

			for(var key in this.children){
				if(this.children.hasOwnProperty(key)){
					var child = this.children[key];
					this.writeInternal(child);
				}
			}
		}
	},

	/**
	 * Write nodes into this.output and return header
	 *
	 * @param {ProtocolNode} node
	 * @param {boolean} [encrypt = true]
	 * @returns {string}
	 */
	'write': function write(node, encrypt){
		encrypt = encrypt || true;

		if(node === null || node === undefined){
			this.output += '\x00';
		}else{
			this.writeInternal(node);
		}

		return this.flushBuffer(encrypt);
	},

	/**
	 * Return Header with this.flashBuffer
	 *
	 * @param {string} domain
	 * @param {string} resource
	 * @returns {string}
	 */
	'startStream': function startStream(domain, resource){
		var attributes = {to: '', resource: ''};

		var header = 'WA';
		header += this.writeInt8(1);
		header += this.writeInt8(4);

		attributes.to = domain;
		attributes.resource = resource;

		this.writeListStart(Object.keys(attributes).length * 2 + 1);
		this.output += '\x01';
		this.writeAttributes(attributes);

		header = header + this.flushBuffer();

		return header;
	}
};