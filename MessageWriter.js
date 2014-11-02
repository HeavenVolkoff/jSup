/**
 * Created by HeavenVolkoff on 21/10/14.
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
require('util').inherits(MessageWriter, EventEmitter);

function MessageWriter(){
	EventEmitter.call(this);

	this.output = [];

	Object.defineProperties(this, {
		'key': {
			writable: true
		}
	});
}

module.exports = MessageWriter;

/**
 * 'þ' = '\xfe' = 0xFE = 254
 * 'ú' = '\xfa' = 0xFA = 250
 */
MessageWriter.prototype = {
	/**
	 * Reset this.key
	 */
	'resetKey': function resetKey(){
		this.key = null;
	},

	/**
	 * Create a New Message Node of given type and push it into Output array
	 *
	 * @param {String} type
	 * @param {Object} info
	 */
	'writeNewMsg': function pushNewMessageNodeToOutputArray(type, info){
		var self = this;
		var MessageNode = require('./MessageNode');
		var messageNode;
		var index = -1;

		switch(type){
			case 'text':
				if(info.hasOwnProperty('text')){
					messageNode = new MessageNode('body', null, null, info.text);
					//TODO: Implement text message composer
				}else{
					return new Error('Missing property in object info' + info, 'MISSING_PROP');
				}
				break;
			case 'image':
				//TODO: Implement image message composer
				break;
			case 'audio':
				//TODO: Implement audio message composer
				break;
			case 'video':
				//TODO: Implement video message composer
				break;
			case 'location':
				//TODO: Implement location message composer
				break;
			case 'state':
				//TODO: Implement state message composer
				break;

			/**
			 * ===================== Special Cases ==========================
			 ***************** Only to be used internally *******************
			 */

			case 'start:stream':
				if(info.hasOwnProperty('to') && info.hasOwnProperty('from')){
					messageNode = new MessageNode(null, {to: info.domain, from: info.resource}, null, null);

					index = self.pushMsgNode(messageNode);

					process.nextTick(function(){
						self.emit('composing', index);
						self.startStream(index);
					});
				}else{
					self.emit('error', new Error('Missing property in object info' + info, 'MISSING_PROP'));
				}
				break;

			case 'stream:features':
				messageNode = new MessageNode('stream:features', null, null, null);

				index = self.pushMsgNode(messageNode);

				process.nextTick(function(){
					self.emit('composing', index);
					self.write(index, false);
				});
				break;

			case 'auth':
				if(info.hasOwnProperty('authHash') && info.hasOwnProperty('authBlob')){
					messageNode = new MessageNode('auth', info.authHash, null, info.authBlob);

					index = self.pushMsgNode(messageNode);

					process.nextTick(function(){
						self.emit('composing', index);
						//Todo: WARNING info.authBlob Needs to be encrypted before write the MessageNode
						self.write(index, false);
					});
				}else{
					self.emit('error', new Error('Missing property in object info' + info, 'MISSING_PROP'));
				}
		}
	},

	/**
	 * Push New MessageNode into Output array and return it's index
	 *
	 * @param {MessageNode} messageNode
	 * @returns {Number} MessageNode Index
	 */
	'pushMsgNode': function pushMessageNodeToInternalBuffer(messageNode){
		this.slimOutput();
		var index = this.output.indexOf(null);

		if(index !== -1){
			this.output[index] = messageNode;
		}else{
			index = this.output.push(messageNode);
		}

		this.emit('pushed', index);
	},

	/**
	 * Clear the given position from Output array
	 *
	 * @param {int} index
	 */
	'clearPos': function clearOutputIndePosition(index){
		this.output[index].clearIntBuff();
		delete this.output[index];
		this.output[index] = null;
	},

	/**
	 * Decrease the Output Array as it Become Empty
	 * TODO: Maybe Do This Function Using Async Parallel
	 */
	'slimOutput': function decreaseOutputArrayAsItBecomeEmpty(){
		for(var length = this.output.length - 1; this.output[length] === null; length--){
			delete this.output[length];
			this.output = this.output.slice(0, length);
		}
	},

	/**
	 * Receive a binary formatted string and write it inside output with it's length
	 *
	 * @param {int} index
	 * @param {string} bytes
	 */
	'writeBytes': function writeBytesToStream(index, bytes){
		var length = bytes.length;

		if(length >= 0x100){
			this.output[index].write('\xfd').write(length, 'int24');
		}else{
			this.output[index].write('\xfc').write(length, 'int8');
		}

		this.output[index].write(bytes);
	},


	/**
	 * Write token inside this.output
	 *
	 * @param {int} index
	 * @param {int} token
	 */
	'writeToken': function writeToken(index, token){
		if(token < 0xF5){
			this.output[index].write(token, 'int8');
		}else if(token <= 0x1F4){
			this.output[index].write('\xfe').write(String.fromCharCode(token - 0xF5));
		}
	},

	/**
	 * Write user and server values inside this.output
	 *
	 * @param {int} index
	 * @param {string} user
	 * @param {string} server
	 */
	'writeJabberId': function writeJabberId(index, user, server){
		this.output[index].write('\xfa');

		if(user.length > 0){
			this.writeString(index, user);
		}else{
			this.writeToken(index, 0);
		}

		this.writeString(index, server);
	},

	/**
	 * Write tag value inside this.output
	 *
	 * @param {int} index
	 * @param tag
	 */
	'writeString' : function writeString(index, tag) {
		var TokenMap = require('./TokenMap');

		var tokenMap = new TokenMap();
		var token = tokenMap.getTokenIndex(tag);

		if(token){
			if(token[0]){
				this.writeToken(index, 236);
			}
			this.writeToken(index, token[1]);
		}else{
			var position = tag.indexOf('@');

			if(position !== -1){
				var server = tag.substr(position + 1);
				var user = tag.substr(0, position);
				this.writeJabberId(index, user, server);
			}else{
				this.writeBytes(index, tag);
			}
		}
	},

	/**
	 * write attributes key and value inside this.output
	 *
	 * @param {int} index
	 * @param {object} attributes
	 */
	'writeAttributes': function writeAttributes(index, attributes){
		if(attributes){
			for(var key in attributes){
				if(attributes.hasOwnProperty(key)){
					var value = attributes[key];
					this.writeString(index, key);
					this.writeString(index, value);
				}
			}
		}
	},

	/**
	 * Write length inside this.output
	 *
	 * @param {int} index
	 * @param {int} length
	 */
	'writeLength': function writeLength(index, length) {
		if(length === 0){
			this.output[index].write('\x00');
		}else if(length < 256){
			this.output[index].write('\xf8').write(length, 'int8');
		}else{
			this.output[index].write('\xf9').write(length, 'int16');
		}
	},

	/**
	 * Write Message info (attributeHash and tag) and it's children's info
	 *
	 * @param {int} index
	 * @param {MessageNode} [child = null]
	 */
	'writeInfo': function writeInternalInfo(index, child){
		child = child || null;
		var tag =           child ? child.tag           :   this.output[index].tag;
		var attributeHash = child ? child.attributeHash :   this.output[index].attributeHash;
		var children =      child ? child.children      :   this.output[index].children;
		var data =          child ? child.data          :   this.output[index].data;
		var length = 1;

		if(attributeHash){
			length += Object.keys(attributeHash).length * 2;
		}
		if(children && Object.keys(children).length > 0){
			length += 1;
		}
		if(data && data.length > 0){
			length += 1;
		}

		this.writeLength(index, length);
		this.writeString(index, tag);
		this.writeAttributes(index, attributeHash);

		if(data.length > 0){
			this.writeBytes(index, data);
		}

		if(children){
			this.writeLength(index, Object.keys(children).length);

			for(var key in children){ //TODO: make a asynchronous Function that write the children info in parallel
				if(children.hasOwnProperty(key)){
					child = children[key];
					this.writeInfo(index, child);
				}
			}
		}
	},

	/**
	 * Write message header and encrypt it if needed
	 *
	 * @param {int} index
	 * @param {boolean} [encrypt = true]
	 * @returns {Buffer}
	 */
	'flushBuffer': function flushBuffer(index, encrypt){
		var basicFunc = require('./BasicFunctions');

		encrypt = encrypt || true;

		var size = this.output[index].length;
		var data = this.output[index].getMessage();

		if(this.key && encrypt){
			this.output[index].overwrite(this.key.encodeMessage(data, size, 0, size));//TODO: Remake encoding function
			size = this.output.length;

			var blockSize = new Buffer(3);
			blockSize[0] = basicFunc.shiftLeft(8, 4) | basicFunc.shiftRight((size & 0xFF0000), 16);
			blockSize[1] = basicFunc.shiftRight(size & 0xFF00, 8);
			blockSize[2] = size & 0xFF;

			size = blockSize;
		}
		this.output[index].writeHeader(size);

		this.emit('written', this.output[index].getMessage(), index);

		this.clearPos(index); //Clear output position after emitting written event
	},

	/**
	 * Write MessageNode
	 *
	 * @param {int} index
	 * @param {boolean} [encrypt = true]
	 * @returns {Buffer}
	 */
	'write': function write(index, encrypt){
		encrypt = encrypt || true;

		this.writeInfo(index);

		process.nextTick(this.flushBuffer(index, encrypt)); //TODO: Maybe nextTick isn't needed
	}
};


/**
 * Return WhatsApp Hand-Shake message (to start communicating with WhatsApp Server)
 *
 * @param {int} index
 * @returns {Buffer}
 */
MessageWriter.prototype.startStream = function startStream(index){
	this.output[index].write('WA').write(1).write(4);

	this.writeLength(index, Object.keys(this.output[index].attributeHash).length * 2 + 1);
	this.output.write('\x01');
	this.writeAttributes(index, this.output[index].attributeHash);

	process.nextTick(this.flushBuffer(index, false)); //TODO: Maybe nextTick isn't needed
};