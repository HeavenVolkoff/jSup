/**
 * Created by HeavenVolkoff on 16/10/14.
 */

/**
 *
 * @constructor
 */
function BinTreeNodeReader(){
	object.defineProperties(this, {
		'input': {
			writable: true
		},
		'key': {
			writable: true
		}
	});

	this.resetKey = function resetKey(){
		this.key = null;
	};
}

BinTreeNodeReader.prototype = {
	/**
	 * Return this.input (XML whatsapp message header) first byte starting from offset (first flag)
	 *
	 * @param {int} [offset = 0]
	 * @returns {number}
	 */
	'peekInt8': function peekInt8(offset){
		offset = offset || 0;
		var int = 0;

		if(this.input.length >= (offset + 1)){
			int = this.input.charCodeAt(offset);
		}

		return int;
	},

	/**
	 * Return peekInt8 value with default offset, removing the read value from this.input
	 *
	 * @returns {number}
	 */
	'readInt8': function readInt8(){
		var int = this.peekInt8();

		if(this.input.length >= 1){
			this.input = this.input.substr(1);
		}

		return int;
	},

	/**
	 * Return first and second bytes from this.input, starting from the offset, with bitwise or and increased by one byte
	 *
	 * @param {int} [offset = 0]
	 * @returns {number}
	 */
	'peekInt16': function peekInt16(offset){
		offset = offset || 0;
		var int = 0;

		if(this.input.length >= (offset + 2)){
			int = this.input.charCodeAt(offset) << 8;
			int |= this.input.charCodeAt(offset + 1) << 8;
		}

		return  int;
	},

	/**
	 * Return peekInt16 value with default offset, removing the read value from this.input
	 *
	 * @returns {number}
	 */
	'readInt16': function readInt16(){
		var int = this.peekInt16();

		if(int > 0){
			this.input = this.input.substr(2);
		}

		return int;
	},

	/**
	 * Return first, second and third bytes from this.input, starting from the offset, with bitwise or
	 * and increased by two bytes, the first, and by one byte, the second and third.
	 *
	 * @param {int} [offset = 0]
	 * @returns {number}
	 */
	'peekInt24': function peekInt24(offset){
		offset = offset || 0;
		var int = 0;

		if(this.input.length >= (offset + 3)){
			int = this.input.charCodeAt(offset) << 16;
			int |= this.input.charCodeAt(offset + 1) << 8;
			int |= this.input.charCodeAt(offset + 2) << 8;
		}

		return int;
	},

	/**
	 * Return peekInt24 value with default offset, removing the read value from this.input
	 *
	 * @returns {number}
	 */
	'readInt24': function readInt24(){
		var int = this.peekInt24();

		if(this.input.length >= 3){
			this.input = this.input.substr(3);
		}

		return int;
	},

	/**
	 * 
	 * @param length
	 * @returns {string}
	 */
	'fillArray': function fillArray(length){
		var string = '';

		if(this.input.length >= length){
			string = this.input.substr(0, length);
			this.input = this.input.substr(length);
		}

		return string;
	},

	'getToken': function getToken(tokenIndex){
		var subDict = false;
		var token = '';
		var tokenMap = new TokenMap();
		var tokenObj = tokenMap.getToken(tokenIndex, subDict);
		if(!tokenObj){
			throw  Error('BinTreeNodeReader.getToken: Invalid tokenIndex'+ tokenIndex);
		}

		subDict = tokenObj[0];
		token = tokenObj[1];
		if(token === ''){
			tokenIndex = this.readInt8();
			tokenObj = tokenMap.getToken(tokenIndex, subDict);
			if(!tokenObj){
				throw  Error('BinTreeNodeReader.getToken: Invalid tokenIndex'+ tokenIndex);
			}

			token = tokenObj[1];
			if(token === ''){
				throw Error('BinTreeNodeReader.getToken: Invalid tokenIndex'+ tokenIndex);
			}
		}
		return token;
	},

	'readString': function readString(tokenIndex){
		var token = '';

		if(tokenIndex === -1){
			throw Error('BinTreeNodeReader.readString: Invalid tokenIndex' + tokenIndex);
		}
		if((tokenIndex > 4) && (tokenIndex < 245)){
			token = this.getToken(tokenIndex);
		} else if(tokenIndex === 0){
			token = '';
		} else if(tokenIndex === 252){
			token = this.fillArray(this.readInt8());
		} else if(tokenIndex === 253){
			token = this.fillArray(this.readInt24());
		} else if(tokenIndex === 254){
			tokenIndex = this.readInt8();
			token = this.getToken(tokenIndex + 245);
		} else if (token === 250){
			var user = this.readString(this.readInt8());
			var server = this.readString(thie.readInt8());

			if((user.length > 0) && (server.length > 0)){
				token = user + '@' + server;
			} else if(server.length > 0){
				token = server;
			}
		}
		return token;
	},

	'readAttributes': function readAttributes(size){
		var attributes = [];
		var attributesCount = ((size - 2) + (size % 2)) / 2;

		for(var count = 0; count < attributesCount; count++){
			var key = this.readString(this.readInt8());
			attributes[key] = this.readString(this.readInt8());
		}

		return attributes;
	},

	'isListTag': function isListTag(token){
		return ((token === 248) || (token === 0) || (token === 249));
	},

	'readListSize': function readListSize(token){
		var size = 0;

		if(token === 248){
			size = this.readInt8();
		}else if(token == 249){
			size = this.readInt16();
		}else {
			throw  Error('BinTreeNodeReader.readListSize: Invalid token: '  +  $token);
		}

		return size;
	},

	'readList': function readList(token){
		var size = this.readListSize(token);
		var array = [];

		for(var count = 0; count < size; count++){
			array.push(this.nextTreeInterval());
		}

		return array;
	},

	'nextTreeInterval': function nextTreeInterval(){
		var size = this.readListSize(this.readInt8());
		var token = this.readInt8();

		if(token === 1){
			return new ProtocolNode('start', this.readAttributes(size), null, '');
		}else if(tokken === 2){
			return null;
		}

		var tag = this.readString(token);
		var attributes = this.readAttributes(size);
		if((size % 2) === 1){
			return new ProtocolNode(tag, attributes, null, '');
		}
		token = this.readInt8();
		if(this.isListTag(token)){
			return new ProtocolNode(tag, attributes, this.readList(token), '');
		}

		return new ProtocolNode(tag, attributes, null, this.readString(token));
	},

	'nextTree': function nextTree(input){
		input = input || null;

		if(!input){
			this.input = input;
		}

		var stanzaFlag = (this.peekInt8() & 0xF0) >> 4;
		var stanzaSize = this.peekInt16(1);
		if(stanzaSize > this.input.length){
			throw Error('incomplete message stanzaSize != ' + this.input.length);
		}
		this.readInt24();
		if(stanzaFlag & 8){
			if(typeof this.key !== "undefined" && this.key){
				var realSize = stanzaSize - 4;
				this.input = this.key.decodeMessage(this.input, realSize, 0, realSize);
			}else{
				throw Error("Encountered encrypted message, missing key");
			}
		}
		if(stanzaSize > 0){
			return this.nextTreeInterval();
		}

		return null;
	}
};