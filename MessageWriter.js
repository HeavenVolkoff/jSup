/**
 * Created by HeavenVolkoff on 21/10/14.
 */

'use strict';

var async = require('async');
var Constants = require('./Constants');
var MessageNode = require('./MessageNode');
var EventEmitter = require('events').EventEmitter;      //EventEmitter Constructor
var util = require('util');
util.inherits(MessageWriter, EventEmitter);  //Bind EventEmitter Prototype with MessageWriter Prototype
module.exports = MessageWriter;                         //Exports MessageWriter so it can be use by others classes

function MessageWriter(){
	Constants.call(this);
	EventEmitter.call(this); //Call EventEmitter Constructor

	this.on('pushed', this.write);		//call write function every time a new message is pushed to internal array
	this.on('written', this.clearPos);	//call clearPost every time it finish witting a message

	this.output = [];        //Array of MessageNodes
	this.control = [];       //Array of Indexes
	this.key = [];           //Array of Keys

	Object.defineProperties(this, {
		writing: {
			value: false,
			writable: true
		}
	});
}

/**
 *  ======================================== MessageWriter Prototype Public ============================================
 */

/**
 * Reset this.key
 */
MessageWriter.prototype.resetKey = function resetKey(index){
	if(index && this.key[index]) {
		delete this.key[index];
		this.key[index] = null;
	}
};

/**
 * Create a New Message Node of given type and push it into Output array
 *
 * @param {String} type
 * @param {Object} info
 * @param {Function} [callback  = null]
 */
MessageWriter.prototype.writeNewMsg = function pushNewMessageNodeToOutputArray(type, info, callback){
		callback = callback || null;
	var messageNode;

	if(!(info.hasOwnProperty('msgId'))){
		this.emit('error', new Error('Missing Message ID property in object info: ' + util.inspect(info, { showHidden: false, depth: null, colors: true }), 'MISSING_PROP'));
		return;
	}

	switch(type){
		case 'text':
			if(info.hasOwnProperty('text') && info.hasOwnProperty('key')){
				/** The text need to be parsed for emojis before being pushed to Writer */
				messageNode = new MessageNode(
					'message',
					{
						to: this.genJID(info.to),
						type: 'text',
						id: 'message' + '-' + Math.floor(new Date().getTime() / 1000) + '-' + info.id,
						t: Math.floor(new Date().getTime() / 1000).toString()
					},
					[new MessageNode('body', null, null, info.text, info.msgId)],
					null, info.msgId, info.key, callback
				);

				this.pushMsgNode(messageNode);

			}else{
				this.emit('error', new Error('Missing property in object info: ' + info, 'MISSING_PROP'));
			}

			break;
		case 'image':
			info.type = 'media';
			//TODO: Implement image message composer
			break;
		case 'audio':
			info.type = 'media';
			//TODO: Implement audio message composer
			break;
		case 'video':
			info.type = 'media';
			//TODO: Implement video message composer
			break;
		case 'location':
			info.type = 'media';
			//TODO: Implement location message composer
			break;
		case 'state':
			//info.type = 'media';
			//TODO: Implement state message composer
			break;

		/**
		 * ===================== Special Cases ==========================
		 ***************** Only to be used internally *******************
		 */

		case 'start:stream':
			if(info.hasOwnProperty('domain') && info.hasOwnProperty('resource')){
				this.once('pushed', this.startStream);

				messageNode = new MessageNode(null, {to: info.domain, resource: info.resource}, null, null, info.msgId);
				this.pushMsgNode(messageNode, false);

			}else{
				this.emit('error', new Error('Missing property in object info: ' + info, 'MISSING_PROP'));
			}

			break;

		case 'stream:features':
			var childrens = [
				new MessageNode('readreceipts', null, null, null, info.msgId),
				new MessageNode('groups_v2', null, null, null, info.msgId),
				new MessageNode('privacy', null, null, null, info.msgId),
				new MessageNode('presence', null, null, null, info.msgId)
			];
			messageNode = new MessageNode('stream:features', null, childrens, null, info.msgId);
			this.pushMsgNode(messageNode);

			break;

		case 'auth':
			if(info.hasOwnProperty('mechanism') && info.hasOwnProperty('user') && info.hasOwnProperty('authBlob')){
				//Todo: WARNING info.authBlob Needs to be encrypted before write the MessageNode
				messageNode = new MessageNode('auth', {mechanism: info.mechanism, user: info.user}, null, info.authBlob, info.msgId);
				this.pushMsgNode(messageNode);

			}else{
				this.emit('error', new Error('Missing property in object info: ' + info, 'MISSING_PROP'));
			}

			break;
		case 'response':
			if(info.hasOwnProperty('response')) {
				messageNode = new MessageNode('response', {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'}, null, info.response, info.msgId);
				this.pushMsgNode(messageNode);
			}else{
				this.emit('error', new Error('Missing property in object info: ' + info, 'MISSING_PROP'));
			}

			break;
		case 'presence':
			if(info.hasOwnProperty('name') && info.hasOwnProperty('key')) {
				messageNode = new MessageNode('presence', {name: info.name}, null, null, info.msgId, info.key, callback);
				this.pushMsgNode(messageNode);

			}else{
				this.emit('error', new Error('Missing property in object info: ' + info, 'MISSING_PROP'));
			}

			break;
		case 'receipt':
			if(info.hasOwnProperty('type') && info.hasOwnProperty('to') && info.hasOwnProperty('id')){
				messageNode = new MessageNode('receipt', {type: info.type, to: info.to, id: info.id, t: Math.floor(new Date().getTime() / 1000).toString()}, null, null, info.msgId, info.key, callback);
				this.pushMsgNode(messageNode);

			}else{
				this.emit('error', new Error('Missing property in object info: ' + info, 'MISSING_PROP'));
			}

			break;
	}
};

/**
 * Push New MessageNode into Output array and return it's index
 *
 * @param {MessageNode} messageNode
 * @param {Boolean} [control = true]
 * @returns {Number} MessageNode Index
 */
MessageWriter.prototype.pushMsgNode = function pushMessageNodeToInternalBuffer(messageNode, control){
	control = typeof control === 'boolean'? control : true;

	if(messageNode) {
		var index = this.output.indexOf(null);

		if (index !== -1) {
			this.output[index] = messageNode;
		} else {
			index = this.output.push(messageNode) - 1; //Don't know why but Array.prototype.push return the index + 1
		}

		if (control) {
			this.control.push(index);
		}

		this.emit('pushed', index, messageNode.id);
	}
};

/**
 * Write MessageNode
 *
 * @param {boolean} [childProcess = false]
 * @returns {Buffer}
 */
MessageWriter.prototype.write = function write(childProcess){
	childProcess = typeof childProcess === 'boolean'? childProcess : false;

	var self = this;
	var length = self.control.length;

	if(!self.writing){
		self.writing = true;
		process.nextTick(function () {
			self.write(true);
		});
	}

	if(childProcess) {
		if(length > 0) {
			async.each(
				this.control.slice(0, length),
				function (index, callback) {
					self.emit('composing', index);
					self.writeInfo(index);
					self.flushBuffer(index);
					callback(null);
				},
				function () {
					self.control = self.control.slice(length);
					process.nextTick(function () {
						self.write(true);
					});
				}
			);
		}else if(self.writing){
			self.writing = false;
			self.slimOutput();
		}
	}
};

/**
 *  ======================================= MessageWriter Prototype Private ============================================
 */

/**
 * Clear the given position from Output array
 *
 * @param {int} index
 */
MessageWriter.prototype.clearPos = function clearOutputIndexPosition(index){
	if(this.output[index]){
		delete this.output[index];
		this.output[index] = null;
	}
};

/**
 * Decrease the Output Array as it Become Empty
 */
MessageWriter.prototype.slimOutput = function decreaseOutputArrayAsItBecomeEmpty(){
	for(var length = this.output.length - 1; this.output[length] === null; length--) {
		delete this.output[length];
	}
	this.output = this.output.slice(0, length);
};

/**
 * Receive a binary formatted string and write it inside output with it's length
 *
 * @param {int} index
 * @param {string} bytes
 */
MessageWriter.prototype.writeBytes = function writeBytesToStream(index, bytes){
	var length = bytes.length;

	if(length >= 0x100){
		this.output[index].write('\xfd').write(length, 'int24');
	}else{
		this.output[index].write('\xfc').write(length, 'int8');
	}

	this.output[index].write(bytes);
};


/**
 * Write token inside this.output
 *
 * @param {int} index
 * @param {int} token
 */
MessageWriter.prototype.writeToken = function writeToken(index, token){
	if(token < 0xF5){
		this.output[index].write(token, 'int8');
	}else if(token <= 0x1F4){
		this.output[index].write('\xfe').write(token - 0xF5);
	}
};

/**
 * Write user and server values inside this.output
 *
 * @param {int} index
 * @param {string} user
 * @param {string} server
 */
MessageWriter.prototype.writeJabberId = function writeJabberId(index, user, server){
	this.output[index].write('\xfa');

	if(user.length > 0){
		this.writeString(index, user);
	}else{
		this.writeToken(index, 0);
	}

	this.writeString(index, server);
};

/**
 * Write tag value inside this.output
 *
 * @param {int} index
 * @param tag
 */
MessageWriter.prototype.writeString = function writeString(index, tag) {
	var TokenMap = require('./TokenMap');

	var tokenMap = new TokenMap();
	var token = tokenMap.getTokenIndex(tag);

	if(token){
		if(token[0]){
			this.writeToken(index, 236);
		}
		this.writeToken(index, token[1]);
	}else{
		var position = typeof tag === 'string'? tag.indexOf('@') : -1;

		if(position !== -1){
			var server = tag.substr(position + 1);
			var user = tag.substr(0, position);
			this.writeJabberId(index, user, server);
		}else{
			this.writeBytes(index, tag);
		}
	}
};

/**
 * write attributes key and value inside this.output
 *
 * @param {int} index
 * @param {object} attributes
 */
MessageWriter.prototype.writeAttributes = function writeAttributes(index, attributes){
	if(attributes){
		for(var key in attributes){
			if(attributes.hasOwnProperty(key)){
				var value = attributes[key];
				this.writeString(index, key);
				this.writeString(index, value);
			}
		}
	}
};

/**
 * Write length inside this.output
 *
 * @param {int} index
 * @param {int} length
 */
MessageWriter.prototype.writeLength = function writeLength(index, length) {
	if(length === 0){
		this.output[index].write('\x00');
	}else if(length < 256){
		this.output[index].write('\xf8').write(length, 'int8');
	}else{
		this.output[index].write('\xf9').write(length, 'int16');
	}
};

/**
 * Write Message info (attributeHash and tag) and it's children's info
 *
 * @param {int} index
 * @param {MessageNode} [child = null]
 */
MessageWriter.prototype.writeInfo = function writeInternalInfo(index, child){
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

	if(data && data.length > 0){
		this.writeBytes(index, data);
	}

	if(children){
		this.writeLength(index, children.length);

		for(var key in children){ //TODO: make a use of async to write the children info in parallel
			if(children.hasOwnProperty(key)){
				child = children[key];
				this.writeInfo(index, child);
			}
		}
	}
};

/**
 * Write message header and encrypt it if needed
 *
 * @param {int} index
 * @param {Buffer} [header = null]
 * @returns {Buffer}
 */
MessageWriter.prototype.flushBuffer = function flushBuffer(index, header){
	var basicFunc = require('./BasicFunctions');
	header = Buffer.isBuffer(header) ? header : null;

	var size = this.output[index].length;
	var data = this.output[index].getMessage();
	var key = this.key[this.output[index]._writerKeyIndex];

	console.log('Send Not Encoded');
	console.log(data);

	if(key){
		this.output[index].overwrite(key.encodeMessage(data, size, 0, size));
		size = this.output[index].length;

		var blockSize = new Buffer(3);
		blockSize[0] = basicFunc.shiftLeft(8, 4) | basicFunc.shiftRight((size & 0xFF0000), 16);
		blockSize[1] = basicFunc.shiftRight(size & 0xFF00, 8);
		blockSize[2] = size & 0xFF;

		size = blockSize;
	}
	this.output[index].writeHeader(size).writeHeader(header);
	//console.log(this.output[index].nodeString('tx  '));
	console.log('Send');
	console.log(this.output[index].getMessage());
	console.log(util.inspect(this.output[index], { showHidden: false, depth: null, colors: true }));
	this.emit('written', index, this.output[index].id, this.output[index].getMessage(), this.output[index]._callback);
};

/**
 * ============================== MessageWriter Prototype Private WriteNewMsg Cases ====================================
 * Here is where writeNewMsg cases specifics functions go (if needed)
 */

/**
 * Return WhatsApp Hand-Shake message (to start communicating with WhatsApp Server)
 *
 * @param {int} index
 * @returns {Buffer}
 */
MessageWriter.prototype.startStream = function startStream(index){
	var self = this;
	self.emit('composing', index);

	var header = new Buffer(4);
	header.write('WA', 0);
	header.writeInt8(1, 2);
	header.writeInt8(4, 3);

	self.writeLength(index, Object.keys(self.output[index].attributeHash).length * 2 + 1);
	self.output[index].write('\x01');
	self.writeAttributes(index, self.output[index].attributeHash);

	self.flushBuffer(index, header);
};

MessageWriter.prototype.genJID = function generateJabberId(number){
	number = number? number.toString() : null;

	if (number && !isNaN(Number(number))){
		if(number.indexOf('@') === -1){
			var index = number.indexOf('-');

			if(index !== -1){
				return number += '@' + this.WHATSAPP_GROUP_SERVER;
			}else{
				return number += '@' + this.WHATSAPP_SERVER;
			}
		}

	}else {
		this.emit(new TypeError('Number is not a phone formatted string'));
		return number;
	}
};

/**
 * =========================================== MessageWriter Prototype End =============================================
 */