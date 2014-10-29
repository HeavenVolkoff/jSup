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
	var BinTreeNodeWriter = require('./BinTreeNodeWriter');

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
			value: '2.11.378'
		},
		'WHATSAPP_USER_AGENT': {
			value: 'WhatsApp/2.11.378 Android/4.3 Device/GalaxyS3'
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
			writable: true,
			enumerable: true
		},
		/**
		 * The challenge data file.
		 *
		 * @name WhatsProt#achallengeData
		 * @type {String}
		 */
		'challengeData': {
			writable: true,
			enumerable: true
		},
		'challengeDataFileName': {
			value: 'nextChallenge.dat',
			writable: true,
			enumerable: true
		},
		'debug': {
			value: debug || false,
			enumerable: true
		},
		'event': {
			writable: true,
			enumerable: true
		},
		'groupList': {
			value: [],
			writable: true,
			enumerable: true
		},
		'identity': {
			/**
			 * Identity validation, if not valid compute new identity
			 */
			value: identity && decodeURIComponent(identity).length === 20? identity : this.buildIdentity(identity),
			enumerable: true
		},
		'inputKey': {
			writable: true,
			enumerable: true
		},
		'outputKey': {
			writable: true,
			enumerable: true
		},
		'groupId': {
			value: false,
			writable: true,
			enumerable: true
		},
		'lastId': {
			value: false,
			writable: true,
			enumerable: true
		},
		'loginStatus': {
			value: 'disconnected',
			writable: true,
			enumerable: true
		},
		'mediaFileInfo': {
			value: [],
			writable: true,
			enumerable: true
		},
		'mediaQueue': {
			value: [],
			writable: true,
			enumerable: true
		},
		'messageCounter': {
			value: 1,
			writable: true,
			enumerable: true
		},
		'messageQueue': {
			value: [],
			writable: true,
			enumerable: true
		},
		'name': {
			value: nickname,
			writable: true,
			enumerable: true
		},
		'newMsgBind': {
			value: false,
			writable: true,
			enumerable: true
		},
		'outQueue': {
			value: [],
			writable: true,
			enumerable: true
		},
		'password': {
			writable: true,
			enumerable: true
		},
		'phoneNumber': {
			value: number,
			enumerable: true
		},
		'reader': {
			value: new BinTreeNodeReader(),
			enumerable: true
		},
		'serverReceivedId': {
			writable: true,
			enumerable: true
		},
		'socket': {
			writable: true,
			enumerable: true
		},
		'writer': {
			value: new BinTreeNodeWriter(),
			enumerable: true
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
			console.log(data.toString('utf8'));//TODO: Bind message listener here.
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

	'openCSV': function OpenCSVFile(path, callback){
		var fs = require('fs');
		var csv = require('fast-csv');

		fs.exists(path, function(exists) {
			if (exists) {
				csv.fromPath(path)
					.on('data', function(data){callback(null, data);});//TODO: this function is a listener that dont stop even after the callback has returned true, check if there is a way to kill it.
			}else{
				callback(new Error('file' + path + 'not found'), null);
			}
		});
	},

	'dissectPhone': function dissectCountryCodeFromPhoneNumber(path, phone, callback) {
		//TODO: make this a database to make queries
		this.openCSV(path, function openCSVCountries(error, data){
			if(!error){
				if(phone.indexOf(data[1]) === 0){
					//Hot-fix for North America Country code
					if(data[1].substr(0, 1) === '1'){
						data[1] = '1';
					}

					var phoneInfo = {
						'country': data[0],
						'cc': data[1],
						'phone': phone.substr(data[1].length),
						'mcc': data[2].split('|')[0],
						'ISO3166': data[3],
						'ISO639': data[4]
					};

					callback(null, phoneInfo);
				}
			}else{
				callback(error, null);
			}
		});
	},

	'createFeaturesNode': function createFeaturesNode(){
		var ProtocolNode = require('./ProtocolNode');
		return new ProtocolNode('stream:features', {}, {}, '');
	},

	'createAuthBlob': function createAuthBlob(callback){
		var async = require('async');
		var crypto = require('crypto');
		var KeyStream = require('./KeyStream');
		var strPad = require('./php.js').strPad;
		var WhatsProt = this;

		if(this.challengeData) {
			async.parallel([
				function (callback) {
					async.waterfall(
						[
							function (callback) {
								crypto.pbkdf2(WhatsProt.password, WhatsProt.challengeData, 16, 20, callback);
							},
							function setKeys(key, callback) {
								key = key.toString('binary');
								WhatsProt.inputKey = new KeyStream(key[2], key[3]);
								WhatsProt.outputKey = new KeyStream(key[0], key[1]);
								WhatsProt.reader.key = WhatsProt.inputKey;
								/**
								 * $this->writer->setKey($this->outputKey);
								 * was commented in the original code
								 */
								callback(null);
							}
						], callback
					);
				},
				function (callback) {
					async.waterfall([
						function (callback) {
							WhatsProt.dissectPhone(WhatsProt.COUNTRIES, WhatsProt.phoneNumber, callback);
						},
						function encodeAuthMessage(phoneInfo, callback) {
							var time = parseInt(new Date().getTime() / 100);
							var array = '\0\0\0\0' + WhatsProt.phoneNumber + WhatsProt.challengeData + time + WhatsProt.WHATSAPP_USER_AGENT + ' MccMnc/' + strPad(phoneInfo.mcc, 3, '0', 'STR_PAD_LEFT') + '001';
							callback(null, array);
						}
					], callback);
				}
			], function authBlobReturn(error, value) {
				WhatsProt.challengeData = null;
				callback(error, WhatsProt.outputKey.encodeMessage(value[1], 0, value[1].length, 0));
			});
		}else{
			callback(null, ''); //new Error('ChallengeData not found')
		}
	},

	'createAuthNode': function createAuthNode(callback){
		var ProtocolNode = require('./ProtocolNode');
		var authHash = {};
		authHash.xmlns = 'urn:ietf:params:xml:ns:xmpp-sasl';
		authHash.mechanism = 'WAUTH-2';
		authHash.user = this.phoneNumber;

		this.createAuthBlob(function authBlobCallback(error, value){
			callback(error, new ProtocolNode('auth', authHash, {}, value));
		});
	},

	'sendData': function sendData(data, callback){
		if(this.socket){
			this.socket.write(data, callback);
		}
	},

	'sendNode': function sendNode(node, encrypt, callback){
		encrypt = encrypt || true;

		console.log(node.nodeString('tx '));
		this.sendData(this.writer.write(node, encrypt), callback);
	},

	'doLogin': function doLogin() {
		var WhatsProt = this;
		var async = require('async');

		this.writer.resetKey();
		this.reader.resetKey();

		var resources = this.WHATSAPP_DEVICE + '-' + this.WHATSAPP_VER + '-' + this.PORT;

		async.series([
			function authNode(callback){
				var data = WhatsProt.writer.startStream(WhatsProt.WHATSAPP_SERVER, resources);
				var feat = WhatsProt.createFeaturesNode();
				callback(null, data, feat);
			},
			function authNode(callback){
				WhatsProt.createAuthNode(callback);
			}
		],function sendData(error, data){
			async.series([
				function sendData(callback){
					WhatsProt.sendData(data[0][0], function sendDataCallback(){
						callback(null);
					});
				},
				function sendFeat(callback){
					WhatsProt.sendNode(data[0][1], true, function sendFeatCallback(){
						callback(null);
					});
				},
				function sendAuth(callback){
					WhatsProt.sendNode(data[1], true, function sendAuthCallback(){
						callback(null);
					});
				}
			], function(error, data) {
				console.log('true');
			});
		});
	}
};

var teste = new WhatsProt('5521989316579','012345678901234','Xing Ling Lee', true);
teste.password = new Buffer('eW8hwE74KhuApT3n6VZihPt+oPI=', 'base64').toString('binary');
teste.connect();
teste.doLogin();



