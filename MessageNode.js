/**
 * Created by HeavenVolkoff on 15/10/14.
 */

'use strict';

/**
 *
 * @param {string} tag
 * @param {Object} attributeHash
 * @param {Array} children
 * @param {string} data
 * @param {int} writerKeyIndex
 * @constructor [MessageNode]
 */
function MessageNode(tag, attributeHash, children, data, writerKeyIndex){
	var message = [];
	var length = 0;

	this.clearIntBuff = function clearInternalBuffer(){
		message = [];
		length = 0;
	};

	this.pushAsFirst = function pushAsFirst(data){
		if(data.length) {
			message.unshift(data);
			length += data.length;
		}
	};

	Object.defineProperties(this, {
		'message': {
			get: function getMessageArray(){
				return message;

			},
			set: function pushValueToMessageArray(data){
				if(data.length){
					message.push(data);
					length += data.length;
				}
			}
		},
		'length': {
			get: function getMessageArrayLength(){
				return length;
			}
		},
		'tag': {
			value: tag,
			enumerable: true
		},
		'attributeHash': {
			value: attributeHash,
			enumerable: true
		},
		'children': {
			value: children,
			enumerable: true
		},
		'data': {
			value: data,
			enumerable: true
		},
		_writerKeyIndex:{
			value: writerKeyIndex
		}
	});
}

module.exports = MessageNode;

	MessageNode.prototype = {
		/**
		 * Write received data to Internal Buffer
		 *
		 * @param {buffer, string, int} data
		 * @param {string} [encoding = null]
		 */
		'write': function writeToInternalBuffer(data, encoding){
			if(Buffer.isBuffer(data)){
				//if data is a buffer just push it to message array
				this.message = data;
			}else if(typeof data === 'string'){
				//if data is a string encode it into a buffer and push it to message array. Only accepts Hex and Binary encoding
				switch(encoding){
					case 'hex':
						this.message = new Buffer(data, encoding);
						break;
					default:
						this.message = new Buffer(data, 'binary');
						break;
				}
			}else if(typeof data === 'number'){
				//if data is a number, encode it into a buffer and push it to message array. Only accepts int.
				if(!encoding){
					var hexString;

					if(data % 1 === 0){
						//if not int make it int
						hexString = Math.floor(data).toString(16);
					}else{
						hexString = data.toString(16);
					}

					if(hexString.length % 2){
						//Hot-fix for buffer not accepting odd string length in hex encoding
						hexString = '0' + hexString;
					}

					this.message = new Buffer(hexString, 'hex');
				}else{
					//if encoding was defined to a number then try to do it like was asked
					var buffer;

					switch (encoding){
						case 'int8':
							buffer = new Buffer(1);
							buffer.writeUInt8(data, 0);
							this.message = buffer;
							break;
						case 'int16':
							buffer = new Buffer(2);
							buffer.writeUInt16BE(data, 0);
							this.message = buffer;
							break;
						case 'int24':
							buffer = new Buffer(4);
							buffer.writeUInt32BE(data, 0);
							this.message = buffer.slice(-3);
							break;
						case 'int32':
							buffer = new Buffer(4);
							buffer.writeUInt32BE(data, 0);
							this.message = buffer;
							break;
						default:
							//if encoding is not recognised and data is a number call write again without encoding
							return this.write(data, null);
					}
				}
			}

			return this; //for funny concatenation
		},

		/**
		 * Write Message Header
		 *
		 * @param {Buffer} buff
		 * @returns {MessageNode}
		 */
		'writeHeader': function writeMessageHeader(buff){
			if(Buffer.isBuffer(buff)){
				this.pushAsFirst(buff);
			}else if(typeof buff === 'number') {
				//Hot-Fix to length of non-encrypted messages
				var buffer = new Buffer(4);

				buffer.writeUInt32BE(buff, 0);
				this.pushAsFirst(buffer.slice(-3));
			}else if(buff){
				console.log(new Error('Trying To Write Non-Buffer Object as Header', 'HEADER_NO_BUFFER'));
			}

			return this; //for funny concatenation
		},

		/**
		 * Clear Internal Buffer and write new value to it
		 *
		 * @param {Buffer} [data = null]
		 * @returns {boolean}
		 */
		'overwrite': function overwriteInternalBuffer(data){
			this.clearIntBuff();
			return this.write(data);
		},

		/**
		 * Return Internal Buffer
		 *
		 * @returns {Buffer}
		 */
		'getMessage': function readMessageFromInternalBuffer(){
			return Buffer.concat(this.message, this.length);
		},

		/**
		 * Verifies if message was completed written to the Stream
		 *
		 * @deprecated //TODO: make it read an encrypted Header (still probably won't work with encrypted messages because the encrypted size might not be the same as the decrypted size)
		 * @param [offset = 0]
		 * @param [sizes = []]
		 * @returns {int[] | Error}
		 */
		'chkMsgSize': function checkMessageSizeFromInternalBuffer(offset, sizes){
			offset = offset || 0;
			sizes = sizes || [];
			var i = 0;
			var j = 0;
			var message;
			var messageSize;

			while(i + j < this.length && i + j < offset + 3){
				if(this.message[i].length() === 1){
					i++;
				}else{
					j++;
				}
			}

			if(i + j !== offset + 3){
				return new Error('Header size Error', 'HEADER_SIZE');
			}

			if(i > 0){
				message = Buffer.concat(this.message.slice(offset, i + 1));
			}else{
				message = this.message[offset];
			}

			messageSize = ((message[1] << 8) | message[2]) + 3;
			sizes.push(messageSize);

			if(this.length < messageSize){
				return new Error('Message is not complete', 'MESSAGE_SIZE');
			}else if(this.length > messageSize){
				this.chkMsgSize(messageSize, sizes);
			}

			return sizes;
		},

		/**
		 * @param {string} prefix
		 * @param {bool} [isChild = false]
		 * @return {string}
		 */
		nodeString: function nodeString(prefix, isChild){
			prefix = prefix || '';
			isChild = isChild || false;

			//Formaters
			var lower = '<';
			var greater = '>';
			var nul = '\n';
			//---------

			var string = prefix + lower + this.tag;
			if(this.attributeHash){
				for(var key in this.attributeHash){
					if(this.attributeHash.hasOwnProperty(key)){
						var value = this.attributeHash[key];
						string += ' ' + key + '="' + value + '"';
					}
				}
			}
			string += greater;
			if(this.data && this.data.length > 0){
				if(this.data.length < 1024){
					//if message is a text add text
					string += this.data;
				}else{
					//if message isn`t a text (image, audio, vCard, ...) add raw data length
					string += ' ' + this.data.length + ' byte data';
				}
			}
			if(this.children){
				string += nul;
				var childArray = [];

				for(var key1 in this.children){
					if(this.children.hasOwnProperty(key1)){
						var value1 = this.children[key1];
						childArray.push(value1.nodeString(prefix + ' ', true));
					}
				}

				string += childArray.join(nul);
				string += nul + prefix;
			}

			string += lower + '/' + this.tag + greater;

			if(!isChild){
				string += nul;
			}

			return string;
		},

		/**
		 * @param {string} attribute
		 * @return string
		 */
		getAttribute: function getAttributeInsideAttributeHash(attribute){
			attribute = this.attributeHash[attribute];

			if(attribute !== undefined || attribute !== null){
				return attribute;
			}

			return null;
		},

		/**
		 * @deprecated //TODO: see if it will be used if not delete it
		 * @param {string} id
		 * @return boolean
		 */
		nodeContainsId: function checkIfNodeContainsId(id){
			return this.getAttribute('id').indexOf(id) !== false;
		},

		/**
		 * Get children supports string tag or children index
		 *
		 * @param {string|int} tag
		 * @return MessageNode
		 */
		getChild: function getChild(tag){
			if(this.children){
				//Check if tag is a int
				if(!isNaN(Number(tag)) && (tag % 1 === 0)){
					if(this.children[tag] !== undefined || this.children[tag] !== null){
						return this.children[tag];
					}else{
						return null;
					}
				}else{
					this.children.forEach(function(child){
						if(child.tag === tag){
							return child;
						}else{
							var string = child.children.getChild(tag);
							if(string){
								return string;
							}
						}
					});
				}
			}

			return null;
		},

		/**
		 * @deprecated //TODO: see if it will be used if not
		 * @param {string} tag
		 * @return bool
		 */
		hasChild: function checkIfHasChild(tag){
			return (this.children[tag] !== null && this.children[tag] !== undefined);
		},

		/**
		 * @param {int} offset
		 */
		refreshTimes: function refreshTimes(offset){
			offset = offset || 0;

			if(this.attributeHash.id){
				var id = this.attributeHash.id;
				var parts = id.split('-');
				parts[0] = Math.floor(new Date().getTime()/1000) + offset;
				this.attributeHash.id = parts.join('-') ;
			}
			if(this.attributeHash.t){
				this.attributeHash.t = Math.floor(new Date().getTime()/1000);
			}
		},

		/**
		 * Print human readable MessageNode object
		 *
		 * @return string
		 */
		toString: function toString(){
			var printReadable = require('./php.js').printReadable;
			var readableNode = {
				'tag': this.tag,
				'attributeHash': this.attributeHash,
				'children': this.children,
				'data': this.data
			};

			return printReadable(readableNode ,true);
		}

	};

