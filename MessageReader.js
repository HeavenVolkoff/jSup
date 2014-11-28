/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';

var KeyStream = require('./KeyStream');
var MessageNode = require('./MessageNode');
var TokenMap = require('./TokenMap');
var basicFunc = require('./BasicFunctions');
var async = require('async');
var Transform = require('stream').Transform;
require('util').inherits(MessageReader, Transform);
module.exports = MessageReader;

/**
 * MessageReader Class
 *
 * @constructor {BinTreeNodeReader}
 */
function MessageReader(){
	Transform.call(this, {objectMode: true});

	this.on('pushed', this.readMessage);
	this.on('decoded', this.clearPos);

	var messages = [];

	this.clearIntBuff = function clearInternalBuffer(){
		messages = [];
	};

    Object.defineProperties(this, {
	    'messages':{
		    get: function(){
			    return messages;
		    },
		    set: function(data){
			    messages.push(data);
		    }
	    },
        'key': {
        	writable: true
        }
    });
}

/**
 * Internal _transform Function (DO NOT USE EXTERNALLY)
 *
 * @param chunk
 * @param encoding
 * @param done
 */
MessageReader.prototype._transform = function transform(chunk, encoding, done){
	var self = this;

	if(chunk.length > 3) { //check if chunk size is bigger than a header
		async.whilst(
			function () {
				return chunk.length > 0;
			},
			function (callback) {
				var length;
				var header = chunk.slice(0, 3); //get Message Header

				if (header.length === 3) {
					length = (basicFunc.shiftLeft(header[0] & 0x0F, 16) | basicFunc.shiftLeft(header[1], 8) | header[2]) + header.length; //calculate message size and sum the header length

					if (chunk[length - 1] !== undefined) {	//Verifies if message length is valid
						var message = [basicFunc.shiftRight(chunk[0] & 0xF0, 4), length - header.length, chunk.slice(3, length)]; //add [flag, size, message] to internal buffer
						var index = self.messages.indexOf(null);	//get Null position in array if it exists

						if (index !== -1) {	//push message to messages internal array
							self.messages[index] = message;

						} else {
							self.messages = message;
							index = self.messages.length - 1;
						}

						chunk = chunk.slice(length); //reduce chunk the size of the message;
						self.emit('pushed', index); //emit pushed event
						callback();

					} else {
						callback(new Error('Invalid Message Size', 'MSG_SIZE'));
					}

				} else {
					callback(new Error('Invalid Header Size', 'HEADER_SIZE'));
				}
			},
			function(error){
				if(error){
					self.emit('error', error);
				}
				done();
			}
		);
	}else{
		self.emit('error', new Error('Message Size Error', 'MSG_SIZE'));
	}
};

/**
 * Reset this.key
 */
MessageReader.prototype.resetKey =  function resetKey(){
	this.key = null;
};

/**
 * Clear the given position from message array
 *
 * @param index
 */
MessageReader.prototype.clearPos = function clearInternalArrayPosition(index){
	if(this.messages[index]){
		delete this.messages[index];
		this.messages[index] = null;
	}
};

/**
 * Return 1 byte from message Internal Buffer and remove it
 *
 * @param index
 * @param [offset = 0]
 * @returns {Number}
 */
MessageReader.prototype.readInt8 = function readInt8FromInternalBuffer(index, offset){
	offset = isNaN(Number(offset))? 0 : offset;
	var int = this.messages[index][2].readUInt8(offset);

	this.messages[index][2] = this.messages[index][2].slice(offset + 1);

	return int;
};

/**
 * Return 2 byte from message Internal Buffer and remove it
 *
 * @param index
 * @param [offset = 0]
 * @returns {Number}
 */
MessageReader.prototype.readInt16 = function readInt16FromInternalBuffer(index, offset){
	offset = isNaN(Number(offset))? 0 : offset;
	var int = this.messages[index][2].readUInt16BE(offset);

	this.messages[index][2] = this.messages[index][2].slice(offset + 2);

	return int;
};

/**
 * Return 3 byte from message Internal Buffer and remove it
 *
 * @param index
 * @param [offset = 0]
 * @returns {Number}
 */
MessageReader.prototype.readInt24 = function readInt24FromInternalBuffer(index, offset){
	offset = isNaN(Number(offset))? 0 : offset;
	var int = this.messages[index][2].readUInt16BE(offset);
		int = basicFunc.shiftLeft(int, 16) | this.messages[index][2][offset + 2];

	this.messages[index][2] = this.messages[index][2].slice(offset + 3);

	return int;
};

/**
 * Return token related to tokenIndex inside primary or secondary string of TreeMap
 * Note: if token is a empty string from primaryString, tries to return the token from secondaryString related to the first byte of this.input
 *
 * @param {int} index
 * @param {int} tokenIndex
 * @returns {string}
 */
MessageReader.prototype.getToken =  function getToken(index, tokenIndex){
	var subDict = false;
	var token;
	var tokenMap = new TokenMap();
	var tokenArray = tokenMap.getToken(tokenIndex, subDict);

	subDict = tokenArray[0];
	token = tokenArray[1];

	if(!token){
		tokenIndex = this.readInt8(index);
		tokenArray = tokenMap.getToken(tokenIndex, subDict);

		token = tokenArray[1];

		if(!token){
			this.emit('error', new Error('Invalid token index' + tokenIndex, 'TOKEN_INDEX'));
			return null;
		}
	}

	return token;
};

/**
 * Slice Internal Buffer to length size and return it
 *
 * @param index
 * @param length
 * @returns {Buffer}
 */
MessageReader.prototype.fillArray = function fillArray(index, length){
	var buff = new Buffer(0);

	if(this.messages[index][2].length >= length){
		buff = this.messages[index][2].slice(0, length);
		this.messages[index][2] = this.messages[index][2].slice(length);
	}

	return buff;
};

/**
 * Return Token depending on TokenIndex, normally it should return getToken(), but it also treats some special cases(close to 2^8 - a byte || characters input are inside 0-255)
 * Special Cases:
 * - 0:     return empty string.
 * - 250:   Recursive step (probably related with all of the others steps), create two new variables (user and server)
 *      that are equals to readString from the first and second byte of this.input, return server if user length less than 0, or return user+@+server if not.
 * - 252:   return this.input substring starting from it's first byte with length equal to the first byte.
 * - 253:   return this.input substring starting from it's third byte with length equal to the first byte
 *      multiplied by (2*16) OR'ed with the second and third byte multiplied by (2*8).
 * - 254:   return getToken() with index equals to the first byte of this.input + 245. TODO: verifies, This should throw an error in getToken(), tokenIndex seems to be bigger than TokenMap's arrays length
 *
 * @param {int} index
 * @param {int} tokenIndex
 * @returns {string}
 */
MessageReader.prototype.readString =  function readString(index, tokenIndex){
	var token = '';

	if (tokenIndex === -1){
		this.emit('error', new Error('Invalid tokenIndex' + tokenIndex, 'TOKEN_INDEX'));

	} else if(tokenIndex === 0){
		token = '';

	} else if((tokenIndex > 2) && (tokenIndex < 245)){
		token = this.getToken(index, tokenIndex);

	} else if(tokenIndex === 252){
		token = this.fillArray(index, this.readInt8(index));

	} else if(tokenIndex === 253){
		token = this.fillArray(index, this.readInt24(index));

	} else if(tokenIndex === 254){
		tokenIndex = this.readInt8(index);
		token = this.getToken(index, tokenIndex + 245);

	} else if (tokenIndex === 250){
		var user = this.readString(index, this.readInt8(index));
		var server = this.readString(index, this.readInt8(index));

		if((user.length > 0) && (server.length > 0)){
			token = user.toString() + '@' + server.toString();
		} else if(server.length > 0){
			token = server;
		}
	}
	return token;
};

/**
 * Parse this.input into an object that has {'key': 'value'}, where key is equal to the first byte and value to the next.
 *
 * @param {int} index
 * @param {int} size
 * @returns {Object}
 */
MessageReader.prototype.readAttributes =  function readAttributes(index, size){
	var attributes = {};
	var attributesCount = ((size - 2) + (size % 2)) / 2;

	//TODO: Make this a async whilst
	for(var count = 0; count < attributesCount; count++){
		var key = this.readString(index, this.readInt8(index));
		attributes[key] = this.readString(index, this.readInt8(index));
	}
	return attributes;
};

/**
 * Don't know what hell this mean
 *
 * @param {int} token
 * @returns {boolean}
 */
MessageReader.prototype.isListTag =  function isListTag(token){
	return ((token === 248) || (token === 0) || (token === 249));
};

/**
 * I think this is related with isListTag(), return first byte of this.input or first and second byte OR'ed multiply by (2*8)
 *
 * @param {int} index
 * @param {int} tokenIndex
 * @returns {int}
 */
MessageReader.prototype.readListSize =  function treadListSize(index, tokenIndex){
	var size = 0;

	if(tokenIndex === 248){
		size = this.readInt8(index);
	}else if(tokenIndex === 249){
		size = this.readInt16(index);
	}else {
		this.emit('error', new Error('Invalid tokenIndex: '  +  tokenIndex, 'TOKEN_INDEX'));
	}

	return size;
};

/**
 * Return an array of MessageNode's, child Messages
 *
 * @param {int} index
 * @param {int} tokenIndex
 * @returns {Array}
 */
MessageReader.prototype.readList =  function readList(index, tokenIndex){
	var size = this.readListSize(index, tokenIndex);
	var array = [];

	//TODO: Make this a async whilst
	for(var count = 0; count < size; count++){
		array.push(this.readInternal(index, true));
	}

	return array;
};

/**
 * Decrypt Received Message
 *
 * @param index
 */
MessageReader.prototype.readMessage = function readMessageNode(index){
	if(this.messages[index][0]){ //check if message is encrypted
		if(this.key instanceof KeyStream){
			var realSize = this.messages[index][1] - 4;
			this.messages[index][2] = this.key.decodeMessage(this.messages[index][2], realSize, 0, realSize); //decrypt message

		}else{
			this.emit('error', new Error('Encountered encrypted message, missing key', 'MISSING_KEY'));
		}
	}

	if(this.messages[index][1] > 0){
		this.readInternal(index);
	}else{
		this.emit('error', new Error('Invalid Message Size (header Only)', 'MSG_SIZE'));
	}
};

/**
 * Read Internal Properties from message and return the message
 *
 * @param {int} index
 * @param {Boolean} [child = false]
 */
MessageReader.prototype.readInternal = function readInternalAttributesFromMessages(index, child){
	child = typeof child === 'boolean'? child : false;

	var messageNode = null;
	var attributesHash;
	var token;
	var size;
	var tag;

	token = this.readInt8(index);
	size = this.readListSize(index, token);
	token = this.readInt8(index);

	if(token === 1){
		attributesHash = this.readAttributes(index, size);

		messageNode = new MessageNode('start', attributesHash, null, null);
	}else if(token === 2){
		if(!child){
			//this.emit('error', new Error('Null Message', 'MSG_NULL'));
			console.log('Null Message');
			this.clearPos(index);
		}
	}else {
		tag = this.readString(index, token);
		attributesHash = this.readAttributes(index, size);

		if(size % 2 !== 0){
			messageNode = new MessageNode(tag, attributesHash, null, null);
		}else{
			token = this.readInt8(index);

			if(this.isListTag(token)){
				messageNode = new MessageNode(tag, attributesHash, this.readList(index, token), null);
			}else{
				messageNode = new MessageNode(tag, attributesHash, null, this.readString(index, token));
			}
		}
	}

	if(!child && messageNode){
		this.emit('decoded', index, messageNode);
	}

	return messageNode;
};
