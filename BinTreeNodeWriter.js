/**
 * Created by HeavenVolkoff on 21/10/14.
 */

'use strict';

function BinTreeNodeWriter(){
	Object.defineProperties(this, {
		'output': {
			writable: true
		},
		'key': {
			writable: true
		}
	});
}

/**
 * 'þ' = '\xfe' = 0xFE = 254
 * 'ú' = '\xfa' = 0xFa = 250
 * @type {{resetKey: resetKey, writeInt8: writeInt8, writeInt16: writeInt16, writeInt24: writeInt24, parseInt24: parseInt24, getInt24: getInt24, writeBytes: writeBytes, writeToken: writeToken, protected: writeJid}}
 */
BinTreeNodeWriter.prototype = {
	/**
	 * Reset this.key
	 */
	'resetKey': function resetKey(){
		this.key = null;
	},

	'writeInt8': function writeInt8(int){
		var char = String.fromCharCode(int & 0xFF);

		return char;
	},

	'writeInt16': function writeInt16(int){
		var char = String.fromCharCode((int & 0xFF00) >> 8);
		char += String.fromCharCode(int & 0x00FF);

		return char;
	},

	'writeInt24': function writeInt24(int){
		var char = String.fromCharCode((int & 0xFF0000) >> 16);
		char += String.fromCharCode((int & 0x00FF00) >> 8);
		char += String.fromCharCode((int & 0x0000FF));

		return char;
	},

	'parseInt24': function parseInt24(data){
		var int = data.charCodeAt(0) << 16;
		int += data.charCodeAt(1) << 8;
		int += data.charCodeAt(2);

		return int;
	},

	'getInt24': function getInt24(length){
		var string = '';
		string += String.fromCharCode((length & 0xF0000) >> 16);
		string += String.fromCharCode((length & 0xFF00) >> 8);
		string += String.fromCharCode(length & 0xFF);

		return string;
	},

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

	'writeToken': function writeToken(token){
		if(token < 245){
			this.output += String.fromCharCode(token);
		}else if(token <= 500){
			this.output += '\xfe' + String.fromCharCode(token - 245);
		}
	},

	'writeString' : function writeString(tag) {
		/*global TokenMap*/
		var tokenMap = new TokenMap();
		var token = tokenMap.getTokenIndex(tag);

		if(token){
			if(token[0]){
				this.writeToken(236);
			}
			this.writeToken(token[1]);
		}else{
			var index = tag.indexOf('@');

			if(index){
				var server = tag.substr(index + 1);
				var user = tag.substr(0, index);
				this.writeJid(user, server);
			}else{
				this.writeBytes(tag);
			}
		}

	},

	//Rename J
	'writeJid': function writeJid(user, server){
		this.output += "\xfa";
		if(user.length > 0){
			this.writeString(user);
		}else{
			this.writeToken(0);
		}
		this.writeString(server);
	},

	'writeAttibutes': function writeAttributes(attrobutes){
		if(attributes){
			attributes.forEach(function(value, key){
				this.writeString(key);
				this.writeString(value);
			});
		}
	},

	'writeListStart': function writeListStart(length) {
		if(length == 0){
			this.output += '\x00';
		}else if(length < 256){
			this.output += '\xf8' + String.fromCharCode(length);
		}else{
			this.output += '\xf9' + this.writeInt16(length);
		}
	}
};