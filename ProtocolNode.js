/**
 * Created by HeavenVolkoff on 15/10/14.
 */

'use strict';

//Referece to TokenMap.js
//Reference to Decode.js

function ProtocolNode(tag, attributeHash, children, data){
	Object.defineProperties(this, {
		'data': {
			value: data,
			enumerable: true
		},
		'children': {
			value: children,
			enumerable: true
		},
		'attributeHash': {
			//TODO:AttributeHash must be an object as in php it is an HashTable
			value: attributeHash,
			enumerable: true
		},
		'tag': {
			value: tag,
			enumerable: true
		}
	});
}

module.exports = ProtocolNode;

	ProtocolNode.prototype = {
		/**
		 * @param {string} indent
		 * @param {bool} [isChild = false]
		 * @return {string}
		 */
		nodeString: function generateNodeString(indent, isChild){
			isChild = isChild || false;

			//Formaters
			//TODO: on php it use < or &lt, depending if runs on terminal or not, verifies if on javascript it also need this
			var lower = '<';
			var greater = '>';
			var nul = '\n';
			//---------

			var string = indent + lower + this.tag;
			if(!this.attributeHash){
				for(var key in this.attributeHash){
					if(this.attributeHash.hasOwnProperty(key)){
						var value = this.attributeHash[key];
						string += ' ' + key + '="' + value + '"';
					}
				}
			}
			string += greater;
			if(this.data.length > 0){
				if(this.data.length < 1024){
					//if Whatsapp message is a text add text
					string += this.data;
				}else{
					//if Whatsapp message isn`t a text (image, audio, vCard, ...) add raw data length
					string += ' ' + this.data.length + ' byte data';
				}
			}
			if(this.children){
				string += nul;
				var childArray = [];

				for(var key1 in this.children){
					if(this.children.hasOwnProperty(key1)){
						var value1 = this.children[key1];
						childArray.push(value1.nodeString(indent + ' ', true));
					}
				}

				string += childArray.join(nul);
				string += nul + indent;
			}
			if(!isChild){
				string += nul;
				//TODO: on php it add another nul if it isn` running inside the command line, verifies if on javascript it also need this
			}

			return string;
		},

		/**
		 * @param {string} attribute
		 * @return string
		 */
		getAttribute: function getAttributeInsideAttributeHash(attribute){
			//TODO:AttributeHash must be an object as in php it is an HashTable
			attribute = this.attributeHash[attribute];

			if(attribute !== undefined || attribute !== null){
				return attribute;
			}

			return null;
		},

		/**
		 * @param {string} id
		 * @return boolean
		 */
		nodeContainsId: function checkIfNodeContainsId(id){
			//TODO:AttributeHash must be an object as in php it is an HashTable
			return this.getAttribute('id').indexOf(id) !== false;
		},

		//get children supports string tag or int index
		/**
		 * @param {string|int} tag
		 * @return ProtocolNode
		 */
		getChild: function getChild(tag){
			var string = null;
			var children = this.children;
			if(children){
				//Check if tag is a int
				if(tag === +tag && isFinite(tag) && (tag % 1 === 0)){
					if(children[tag] !== undefined || children[tag] !== null){
						return children[tag];
					}else{
						return null;
					}
				}else{
					children.forEach(function(child){
						if(child.tag === tag){
							return child;
						}else{
							string = child.children;
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
			offset = Math.floor(offset) || 0;

			if(this.attributeHash.id !== undefined && this.attributeHash.id !== null){
				var id = this.attributeHash.id;
				var parts = id.split('-');
				parts[0] = Math.floor(new Date().getTime()/1000) + offset;
				this.attributeHash.id = parts.join('-') ;
			}
			if(this.attributeHash.t !== undefined && this.attributeHash.t !== null){
				this.attributeHash.t = Math.floor(new Date().getTime()/1000);
			}
		},

		/**
		 * Print human readable ProtocolNode object
		 *
		 * @return string
		 */
		toString: function toString(){
            /*global print_r*/
			//TODO: verifies if it works on web (modified php.js method)
			var readableNode = {
				'tag': this.tag,
				'attributeHash': this.attributeHash,
				'children': this.children,
				'data': this.data
			};

			return print_r(readableNode ,true);
		}

	};

