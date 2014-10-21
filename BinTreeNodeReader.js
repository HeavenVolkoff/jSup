/**
 * Created by HeavenVolkoff on 16/10/14.
 */

/**
 *
 * @constructor
 */

'use strict';
function BinTreeNodeReader(){
    Object.defineProperties(this, {
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
	 * Remove from begin of this.input array the given length and return it
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

    /**
     * Return token related to tokenIndex inside primary or secondary string of TreeMap
     * Note: if token is a empty string from primaryString, tries to return the token from secondaryString related to the first byte of this.input
     *
     * @param {int} tokenIndex
     * @returns {string}
     */
	'getToken': function getToken(tokenIndex){
        /*global TokenMap*/
		var subDict = false;
		var tokenMap = new TokenMap();
		var tokenObj = tokenMap.getToken(tokenIndex, subDict);
		if(!tokenObj){
			throw new Error('BinTreeNodeReader.getToken: Invalid tokenIndex'+ tokenIndex);
		}

		subDict = tokenObj[0];
		var token = tokenObj[1];
		if(token === ''){
			tokenIndex = this.readInt8();
			tokenObj = tokenMap.getToken(tokenIndex, subDict);
			if(!tokenObj){
				throw new Error('BinTreeNodeReader.getToken: Invalid tokenIndex'+ tokenIndex);
			}

			token = tokenObj[1];
			if(token === ''){
				throw new Error('BinTreeNodeReader.getToken: Invalid tokenIndex'+ tokenIndex);
			}
		}
		return token;
	},

    /**
     * Return Token depending on TokenIndex, normally it should return getToken(), but it also treats some special cases(close to 2^8 - a byte)
     * Special Cases:
     * - 0:     return empty string.
     * - 250:   Recursive step (probably related with all of the others steps), create two new variables (user and server)
     *      that are equals to readString from the first and second byte of this.input, return server if user length less than 0, or return user+@+server if not.
     * - 252:   return this.input substring starting from it's first byte with length equal to the first byte.
     * - 253:   return this.input substring starting from it's third byte with length equal to the first byte
     *      multiplied by (2*16) OR'ed with the second and third byte multiplied by (2*8).
     * - 254:   return getToken() with index equals to the first byte of this.input + 245. TODO: verifies, This should throw an error in getToken(), tokenIndex seems to be bigger than TokenMap's arrays length
     * @param {int} tokenIndex
     * @returns {string}
     */
	'readString': function readString(tokenIndex){
		var token = '';

		if(tokenIndex === -1){
			throw new Error('BinTreeNodeReader.readString: Invalid tokenIndex' + tokenIndex);
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
			var server = this.readString(this.readInt8());

			if((user.length > 0) && (server.length > 0)){
				token = user + '@' + server;
			} else if(server.length > 0){
				token = server;
			}
		}
		return token;
	},

    /**
     * Parse this.input into an object that has {'key': 'value'}, where key is equal to the first byte and value to the next.
     *
     * @param {int} size
     * @returns {Object}
     */
	'readAttributes': function readAttributes(size){
		var attributes = {};
		var attributesCount = ((size - 2) + (size % 2)) / 2;

		for(var count = 0; count < attributesCount; count++){
			var key = this.readString(this.readInt8());
			attributes[key] = this.readString(this.readInt8());
		}

		return attributes;
	},

	/**
	 * Don't know what hell this mean
	 *
	 * @param {int} token
	 * @returns {boolean}
	 */
	'isListTag': function isListTag(token){
		return ((token === 248) || (token === 0) || (token === 249));
	},

	/**
	 * I thisk this is related with isListTag(), return first byte of this.input or first and second byte OR'ed multiply by (2*8)
	 *
	 * @param {int} tokenIndex
	 * @returns {int}
	 */
	'readListSize': function readListSize(tokenIndex){
		var size = 0;

		if(tokenIndex === 248){
			size = this.readInt8();
		}else if(tokenIndex === 249){
			size = this.readInt16();
		}else {
			throw new Error('BinTreeNodeReader.readListSize: Invalid tokenIndex: '  +  tokenIndex);
		}

		return size;
	},

	/**
	 * Return an array of ProtocolNode's, probably all the messages that are on the server
	 *
	 * @param {int} tokenIndex
	 * @returns {Array}
	 */
	'readList': function readList(tokenIndex){
		var size = this.readListSize(tokenIndex);
		var array = [];

		for(var count = 0; count < size; count++){
			array.push(this.nextTreeInterval());
		}

		return array;
	},

	/**
	 * Return Protocol Node, representing new Messages(i think).
	 *
	 * @returns {ProtocolNode}
	 */
	'nextTreeInterval': function nextTreeInterval() {
        /*global ProtocolNode(tag, attributeHash, children, data)*/
        var size = this.readListSize(this.readInt8());
        var tokenIndex = this.readInt8();

        if (tokenIndex === 1) {
	        /**
	         * Probably some special first ProtocolNode
	         */
            return new ProtocolNode('start', this.readAttributes(size), null, '');
        }
        if (tokenIndex === 2) {
            return null;
        }

        var tag = this.readString(tokenIndex);
        var attributes = this.readAttributes(size);
        if ((size % 2) === 1) {
	        /**
	         * Null ProtocolNode (i think)
	         */
            return new ProtocolNode(tag, attributes, null, '');
        }
        tokenIndex = this.readInt8();
        if (this.isListTag(tokenIndex)) {
	        /**
	         * ProtocolNode with an array of it's children's (recursive)
	         */
            return new ProtocolNode(tag, attributes, this.readList(tokenIndex), '');
        }
		/**
		 * ProtocolNode with data equals to some token from TokenMap, or a special case.
		 */
        return new ProtocolNode(tag, attributes, null, this.readString(tokenIndex));
    },

	/**
	 * Receive input (probably whatsapp server message) and set it, treating errors.
	 *
	 * @param {string} input
	 * @returns {ProtocolNode}
	 */
	'nextTree': function nextTree(input){
		input = input || null;

		if(!input){
			this.input = input;
		}

		var stanzaFlag = (this.peekInt8() & 0xF0) >> 4;
		var stanzaSize = this.peekInt16(1);
		if(stanzaSize > this.input.length){
			throw new Error('incomplete message stanzaSize != ' + this.input.length);
		}
		this.readInt24();
		if(stanzaFlag & 8){
			if(this.key !== 'undefined' && this.key){
				var realSize = stanzaSize - 4;
				this.input = this.key.decodeMessage(this.input, realSize, 0, realSize);
			}else{
				throw new Error('Encountered encrypted message, missing key');
			}
		}
		if(stanzaSize > 0){
			return this.nextTreeInterval();
		}

		return null;
	}
};