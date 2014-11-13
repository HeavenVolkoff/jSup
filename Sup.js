/**
 * Created by HeavenVolkoff on 11/11/14.
 */

'use strict';

var Fs = require('fs');
var Socket = require('net').Socket;
var Async = require('async');
var Crypto = require('crypto');
var KeyStream = require('./KeyStream');
var MessageReader = require('./MessageReader');
var MessageWriter = require('./MessageWriter');

require('util').inherits(Sup, Socket);

function Sup(number, identity, nickname, messageWriter) {
    if (!(this instanceof Sup)){
        return new Sup(number, identity, nickname, messageWriter);
    }

    var self = this;                                    //Reference to the Object (Only to be used for properties cross-reference)
    var whatsApp = {port: 443, host: 'c.whatsapp.net'}; //Object with basic info to connect to WhatsApp Server

    Socket.call(this, whatsApp);    //Call Socket superConstructor with the necessary connection info
    this.connect(whatsApp);       //Call connect function and connect to whatsApp Servers

    this.writeMsg = [];                                 //Message Index Array to verify with MessageWriter
    this.reader = new MessageReader();                  //Message Reader Internal Object
    this.writer = messageWriter || new MessageWriter(); //Message Writer Internal Object
    this.pipe(this.reader);                             //Pipe Sup (Stream) to Message Reader

    this.clearSentMsg = function clearInternalMessagesArray(length){
      if(length >= this.writeMsg.length){
          this.writeMsg = [];
      }else{
          this.writeMsg = this.writeMsg.slice(length);
      }
    };

    Object.defineProperties(this, {
        password: {
            writable: true
        },
        challengeData: {
            writable: true
        },
        writerKeyIndex: {
            writable: true
        },
        writerKey: {
            get: function(){
                if(!isNaN(self.writerKeyIndex)){
                    return self.writer.key[self.writerKeyIndex];
                }
                return null;
            },
            set: function(key){
                if(key instanceof KeyStream){
                    if(self.writerKeyIndex){
                        self.writer.key[self.writerKeyIndex] = key;
                    }else{
                        self.writerKeyIndex = self.writer.key.push(key) - 1;
                    }
                }
            }
        },
        'accountInfo': {
            writable: true,
            enumerable: true
        },
        'challengeDataFileName': {
            value: 'nextChallenge.dat',
            writable: true,
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
        'phoneNumber': {
            value: number,
            enumerable: true
        },
        'serverReceivedId': {
            writable: true,
            enumerable: true
        }
    });

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
}

Sup.prototype.setupListeners = function setupInternalListeners(){
    var self = this;

    self.on('end', function onEnd(){
        console.log('connection ended by the partner');//TODO: Bind connection end listener here; Emitted when the other end of the socket sends a FIN packet.
    });
    self.on('error', function onError(error){
        console.log('connection error');//TODO: Bind ERROR listener here.
        throw error;
    });
    self.on('timeout', function onTimeOut(){
        console.log('connection on idle');//TODO: Bind Timeout listener here, WARNING: connection on timeout only enter in idle, it do not close.
    });
    self.on('drain', function onWriteBufferEmpty(){
        console.log('write buffer empty');//TODO: i don't know if it useful; Emitted when the write buffer becomes empty. Can be used to throttle uploads.
    });
    self.on('close', function onClose(hadError){
        if(hadError){
            console.log('connection closed');//TODO: Bind connection closed listener here.
        }else{
            console.log('connection closed due to a transmission error.');//TODO: Bind connection closed error listener here.
        }
    });

    self.setTimeout(self.TIMEOUT_SEC, function onTimeOut(){
        /**
         * This is added to the TimeOut Listener
         */
        console.log('timeout');
    });

    self.on('send', function(bufferArray){  //Send Event Listener that send messages to whatsApp server
        Async.eachSeries(
            bufferArray,
            function(buff, callback){
                try{
                    console.log(buff);
                    self.write(buff);   //Write Message to Socket
                    self.emit('sent');  //Emit Event Sent Message
                    callback();
                }catch(error){
                    callback(error);
                }
            },
            function(error){
                if(error){
                    self.emit('error', error);
                }
            }
        );
    });

    self.writer.on('pushed', function(index){
        self.writeMsg.push(index);
    });     //writer Pushed Event Listener that add the pushed message index into internal array

    self.writer.on('written', function(index, buff){  //writer Written Event Listener that add the written message to outgoing queue
        index = self.writeMsg.indexOf(index);
        if(index !== - 1) {
            self.writeMsg[index] = buff;

            if (index === 0) {
                process.nextTick(function () {
                    var bufferArray = [];

                    Async.whilst(
                        function () {
                            return Buffer.isBuffer(self.writeMsg[index]);
                        },
                        function (callback) {
                            bufferArray.push(self.writeMsg[index]);
                            index++;
                            callback();
                        },
                        function () {
                            self.clearSentMsg(index);
                            self.emit('send', bufferArray);
                        }
                    );
                });
            }

        }else{
            self.emit('error', new Error('Incorrect Message Index', 'MSG_INDEX'));
        }
    });

    self.reader.on('decoded', function(index, node){
        self.processNode(index, node);
    });
};

Sup.prototype.disconnect = function endSocketConnection(){
    this.end();
    this.destroy();
};

Sup.prototype.buildIdentity =  function computeIdentitySha1(identity){
    var sha1 = Crypto.createHash('sha1');

    sha1.update(identity);

    return sha1.digest('binary');
};

Sup.prototype.openCSV = function OpenCSVFile(path, callback){
    var csv = require('fast-csv');

    Fs.exists(path, function(exists) {
        if (exists) {
            csv.fromPath(path)
                .on('data', function(data){callback(null, data);});//TODO: this function is a listener that don't stop even after the callback has returned true, check if there is a way to kill it.
        }else{
            callback(new Error('file' + path + 'not found', 'FILE_NOT_FOUND'), null);
        }
    });
};

Sup.prototype.dissectPhone = function dissectCountryCodeFromPhoneNumber(path, phone, callback) {
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
};

/**
 * Generate the crypto keys from password with salt nonce
 *
 * @param {Buffer} password
 * @param {Buffer} challenge
 * @param {function} callback
 * @returns {Buffer[]}
 */
Sup.prototype.generateKeys = function generateKeys(password, challenge, callback){
    var array = [];

    Async.each(
        [1, 2, 3, 4],
        function(count, callback) {
            var countBuff = new Buffer(1);
                countBuff.writeUInt8(count, 0);
            var nonce = Buffer.concat([challenge, countBuff]);
            Crypto.pbkdf2(password, nonce, 2, 20,
                function (error, key) {
                    if (!error) {
                        array[count - 1] = key;
                        callback(null);
                    } else {
                        callback(error, null);
                    }
                }
            );
        },
        function(error){
            if(!error){
                callback(null, array);
            }else{
                callback(error);
            }
        }
    );
};

Sup.prototype.createAuthBlob = function createAuthBlob(callback){
    var strPad = require('./php.js').strPad;
    var self = this;

    if(self.challengeData) {
        Async.parallel([
            function (callback) {
                Async.waterfall(
                    [
                        function (callback) {
                            Crypto.pbkdf2(self.password, self.challengeData, 16, 20, callback);
                        },
                        function setKeys(key, callback) {
                            self.reader.key = new KeyStream(key[2], key[3]);
                            self.writerKey = new KeyStream(key[0], key[1]);
                            callback(null);
                        }
                    ], callback
                );
            },
            function (callback) {
                Async.waterfall(
                    [
                        function (callback) {
                            self.dissectPhone(self.COUNTRIES, self.phoneNumber, callback);
                        },
                        function encodeAuthMessage(phoneInfo, callback) {
                            var time = parseInt(new Date().getTime() / 100);
                            var buff = new Buffer('\0\0\0\0' + self.phoneNumber + self.challengeData + time + self.WHATSAPP_USER_AGENT + ' MccMnc/' + strPad(phoneInfo.mcc, 3, '0', 'STR_PAD_LEFT') + '001');
                            callback(null, buff);
                        }
                    ], callback
                );
            }
        ], function authBlobReturn(error, value) {
                if(!error){
                    self.challengeData = null;
                    callback(error, self.writerKey.encodeMessage(value[1], 0, value[1].length, 0));
                }else {
                    self.emit('error', error);
                }
        });
    }else{
        callback(null, null);
    }
};

Sup.prototype.login = function loginToWhatsAppServer(password){
    if(password){
        if(Buffer.isBuffer(password)){
            this.password = password;
        }else if(typeof password === 'string'){
            this.password = new Buffer(password, 'base64');
        }else{
            this.emit('error', new TypeError('Password need to be a Base64 encoded String or a Buffer'));
        }
        //Todo: read challengeData File
    }else{
        //Todo: receive new Password from whatsApp Servers
    }

    this.doLogin();
};

Sup.prototype.doLogin = function doLogin(){
    var self = this;

    self.setupListeners();

    self.writer.resetKey(this.writerKeyIndex);
    self.reader.resetKey();

    self.createAuthBlob(function(error, authBlob){
        self.writer.writeNewMsg('start:stream', {domain: self.WHATSAPP_SERVER, resource: self.WHATSAPP_DEVICE + '-' + self.WHATSAPP_VER + '-' + self.PORT});
        self.writer.writeNewMsg('stream:features');
        self.writer.writeNewMsg('auth', {authHash: {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl', mechanism: 'WAUTH-2',user: self.phoneNumber}, authBlob: authBlob});
    });
};

Sup.prototype.processChallengeData = function processChallengeData(node){
    var self = this;
    self.challengeData = node.data;

    Async.parallel(
        [
            function(callback) {
                Fs.open(self.challengeDataFileName, 'w', function (error, file) {
                    if (!error) {
                        Fs.write(file, node.data, 0, node.data.length, 0, callback);
                    } else {
                        callback(error);
                    }
                });
            },
            function(callback) {
                self.generateKeys(self.password, self.challengeData,
                    function (error, keys) {
                        if (!error) {
                            self.reader.key = new KeyStream(keys[2], keys[3]);
                            self.writerKey = new KeyStream(keys[0], keys[1]);

                            var buffer = Buffer.concat([new Buffer('\0\0\0\0' + self.phoneNumber), self.challengeData]);
                            var array = self.writerKey.encodeMessage(buffer, 0, 4, buffer.length - 4);
                            self.writer.writeNewMsg('response', {response: array});
                            callback(null);

                        }else{
                            callback(error);
                        }
                    }
                );
            }
        ],
        function(error){
            if(error){
                self.emit(error);
            }
        }
    );
};

Sup.prototype.processNode = function processNodeInfo(index, messageNode){
    console.log(messageNode);
    if(messageNode.attributeHash.hasOwnProperty('id')){
        //TODO: check if id received is the same as the sent messages to acknowledge that WhatsApp server has received it
    }

    switch(messageNode.tag){
        case 'challenge':
            this.processChallengeData(messageNode);
            break;

        default:
            break;
    }
};

var teste = new Sup('5521989316579','012345678901234','Xing Ling Lee');
teste.login('eW8hwE74KhuApT3n6VZihPt+oPI=');