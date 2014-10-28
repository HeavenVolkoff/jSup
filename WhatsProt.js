/**
 * Created by HeavenVolkoff on 24/10/14.
 */
'use strict';

/**
 *
 * @constructor
 */
function WhatsProt(number, identity, nickname, debug) {
	var BinTreeNodeReader = require('./BinTreeNodeReader');
	var BinTreeNodeWriter = require('./BinTreeNodeWriter')

	/**
	 * Constant declarations.
	 */
	Object.defineProperties(this, {
		'CONNECTED_STATUS': {
			value: 'connected'
		},
		'COUNTRIES':{
			value: 'countries.csv'
		},
		'DISCONNECTED_STATUS': {
			value: 'disconnected'
		},
		'MEDIA_FOLDER': {
			value: 'media'
		},
		'PICTURES_FOLDER': {
			value: 'pictures'
		},
		'PORT': {
			value: 443
		},
		'TIMEOUT_SEC': {
			value: 2
		},
		'TIMEOUT_USEC': {
			value: 0
		},
		'WHATSAPP_CHECK_HOST': {
			value: 'v.whatsapp.net/v2/exist'
		},
		'WHATSAPP_GROUP_SERVER': {
			value: 'g.us'
		},
		'WHATSAPP_HOST': {
			value: 'c.whatsapp.net'
		},
		'WHATSAPP_REGISTER_HOST': {
			value: 'v.whatsapp.net/v2/register'
		},
		'WHATSAPP_REQUEST_HOST': {
			value: 'v.whatsapp.net/v2/code'
		},
		'WHATSAPP_SERVER': {
			value: 's.whatsapp.net'
		},
		'WHATSAPP_UPLOAD_HOST': {
			value: 'https://mms.whatsapp.net/client/iphone/upload.php'
		},
		'WHATSAPP_DEVICE': {
			value: 'Android'
		},
		'WHATSAPP_VER': {
			value: '2.11.209'
		},
		'WHATSAPP_USER_AGENT': {
			value: 'WhatsApp/2.11.209 Android/4.3 Device/GalaxyS3'
		}
	});


	// TODO: finish commenting the properties
	Object.defineProperties(this, {
		/*global BinTreeNodeWriter, BinTreeNodeReader*/
		/**
		 * The Account Info object.
		 *
		 * @name WhatsProt#accountInfo
		 * @type {Object}
		 */
		'accountInfo': {
			writable: true
		},
		/**
		 * The challenge data file.
		 *
		 * @name WhatsProt#achallengeData
		 * @type {String}
		 */
		'challengeData': {
			writable: true
		},
		'challengeDataLocation': {
			value: '',
			writable: true
		},
		'debug': {
			value: debug || false
		},
		'event': {
			writable: true
		},
		'groupList': {
			value: [],
			writable: true
		},
		'identity': {
			/**
			 * Identity validation, if not valid compute new identity
			 */
			value: identity && decodeURIComponent(identity).length === 20? identity : this.buildIdentity(identity)
		},
		'incompleteMessage': {
			value: '',
			writable: true
		},
		'inputKey': {
			writable: true
		},
		'outputKey': {
			writable: true
		},
		'groupId': {
			value: false,
			writable: true
		},
		'lastId': {
			value: false,
			writable: true
		},
		'loginStatus': {
			value: WhatsProt.DISCONNECTED_STATUS,
			writable: true
		},
		'mediaFileInfo': {
			value: [],
			writable: true
		},
		'mediaQueue': {
			value: [],
			writable: true
		},
		'messageCounter': {
			value: 1,
			writable: true
		},
		'messageQueue': {
			value: [],
			writable: true
		},
		'name': {
			value: nickname,
			writable: true
		},
		'newMsgBind': {
			value: false,
			writable: true
		},
		'outQueue': {
			value: [],
			writable: true
		},
		'password': {
			writable: true
		},
		'phoneNumber': {
			value: number
		},
		'reader': {
			value: new BinTreeNodeReader()
		},
		'serverReceivedId': {
			writable: true
		},
		'socket': {
			writable: true
		},
		'writer': {
			value: new BinTreeNodeWriter()
		}
	});
}


WhatsProt.prototype = {
	'buildIdentity': function computeIdentitySha1(identity){
		var crypto = require('crypto');
		var sha1 = crypto.createHash('sha1');

		sha1.update(identity);

		return sha1.digest('binary');
	},

	'connect': function createASocketToWhatsappNetwork(){
		var net = require('net');
		this.socket = net.connect(this.PORT, this.WHATSAPP_HOST, function onConnected(){
			console.log('logged in');
			//TODO: this.event.connected(this.phoneNumber, this);
		});
		this.socket.on('data', function onMessageInbound(data){
			console.log(data);//TODO: Bind message listener here.
		});
		this.socket.on('end', function onEnd(){
			console.log('connection ended by the partner');//TODO: Bind connection end listener here; Emitted when the other end of the socket sends a FIN packet.
		});
		this.socket.on('error', function onError(error){
			console.log('connection error');//TODO: Bind ERROR listener here.
			throw error;
		});
		this.socket.on('timeout', function onTimeOut(){
			console.log('connection on idle');//TODO: Bind Timeout listener here, WARNING: connection on timeout only enter in idle, it do not close.
		});
		this.socket.on('drain', function onWriteBufferEmpty(){
			console.log('write buffer empty');//TODO: i don't know if it useful; Emitted when the write buffer becomes empty. Can be used to throttle uploads.
		});
		this.socket.on('close', function onClose(hadError){
			if(hadError){
				console.log('connection closed by you');//TODO: Bind connection closed listener here.
			}else{
				console.log('connection closed due to a transmission error.');//TODO: Bind connection closed error listener here.
			}
		});

		this.socket.setTimeout(this.TIMEOUT_SEC, function onTimeOut(){
			/**
			 * This is added to the TimeOut Listener
			 */
			console.log('timeout');
		});
	},

	'disconnect': function endSocketConnection(){
		this.socket.end();
		this.socket.destroy();
	},

	'createFeaturesNode': function createFeaturesNode(){
		/*global ProtocolNode*/
		return new ProtocolNode('stream:features', null, null, null);
	},

	'openCSV': function OpenCSVFile(path, callback){
		var fs = require('fs');
		var csv = require('fast-csv');

		fs.exists(path, function(exists) {
			if (exists) {
				csv.fromPath(path)
					.on('data', callback)
					.on('end', function(){
						console.log('done');
					});
			}else{
				callback(null, new Error('file' + path + 'not found'));
			}
		});
	},

	'dissectPhone': function dissectCountryCodeFromPhoneNumber(path, phone, callback) {
		//TODO: make this a database to make queries
		this.openCSV(path, function openCSVCountries(data, error){
			if(!error){
				if(phone.indexOf(data[1]) === 0){

					//Hot-fix for North America Country code
					if(data[1].substr(0, 1) === '1'){
						data[1] = '1';
					}

					phone = {
						'country': data[0],
						'cc': data[1],
						'phone': phone.substr(data[1].length),
						'mcc': data[2].split('|')[0],
						'ISO3166': data[3],
						'ISO639': data[4]
					};

					callback(phone, null);
				}
			}else{
				console.log(error);
				callback(null, error);
			}
		});
	}
};


var data = new WhatsProt('5521989316579', '012345678901234', 'teste', true);
data.dissectPhone(data.COUNTRIES, data.phoneNumber, function callback(output, error){
	if(!error){
		console.log(output);
	}else{
		console.log(error);
	}
});
