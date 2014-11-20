/**
 * Created by HeavenVolkoff on 11/11/14.
 */

'use strict';

var async = require('async');
var basicFunc = require('./BasicFunctions');
var Constants = require('./Constants');
var crypto = require('crypto');
var fs = require('fs');
var generateKeys = require('./KeyStream').generateKeys;
var KeyStream = require('./KeyStream');
var MessageReader = require('./MessageReader');
var MessageWriter = require('./MessageWriter');
var Socket = require('net').Socket;
var util = require('util');


util.inherits(Sup, Socket);
function Sup(number, nickname, messageWriter) {
    if (!(this instanceof Sup)){
        return new Sup(number, nickname, messageWriter);
    }
    if (!(number || nickname)){
        throw Error('Missing Basic Info');
    }

    Constants.call(this);                                           //Call Constants superConstructor to setup constants
    Socket.call(this, {port: this.PORT, host: this.WHATSAPP_HOST}); //Call Socket superConstructor with the necessary connection info
    this.connect({port: this.PORT, host: this.WHATSAPP_HOST});      //Call connect function and connect to WhatsApp Servers

    //########################## Private Variables ###################################
    var self = this;    //Reference to the Object (Only to be used for properties cross-reference)
    var count = 0;      //Sent Message Counter (also used to form sent messages id)
    var sendMsg = [];   //Message Index Array to verify with MessageWriter
    var writingMsg = [];//Message Index Array to verify with MessageWriter what messages, from this User, are being written

    //########################## Public Variables ####################################
    this._reader = new MessageReader();                  //Message Reader Internal Object
    this._writer = messageWriter || new MessageWriter(); //Message Writer Internal Object
    this.pipe(this._reader);                             //Pipe Sup (Stream) to Message Reader

    //########################## Public Functions ####################################
    this.clearSentMsg = function clearInternalMessagesArray(length){
      if(length >= writingMsg.length){
          writingMsg = [];
      }else{
          writingMsg = writingMsg.slice(length);
      }
    };

    //######################### Some Default Set-Up's ################################
    this.setupListeners();
    this.setTimeout(self.TIMEOUT_SEC);

    //############################# Properties #######################################
    Object.defineProperties(this, {
        //################ WhatsApp User Info properties #############################
        name: {
            value: nickname,
            writable: true,
            enumerable: true
        },
        phoneNumber: {
            value: number,
            enumerable: true
        },
        password: {
            writable: true
        },
        identity: {
            value: self.buildIdentity(number, function(error, data){
                if(!error){
                    self.identity = data;
                }else{
                    self.emit('error', error);
                }
            }),
            writable: true,
            enumerable: true
        },
        loginStatus: {
            value: 'disconnected',
            writable: true,
            enumerable: true
        },
        groupList: {
            value: [],
            writable: true,
            enumerable: true
        },
        msgCount: {
            get: function(){
                return count;
            }
        },
        mediaFileInfo: {
            value: [],
            writable: true,
            enumerable: true
        },
        mediaQueue: {
            value: [],
            writable: true,
            enumerable: true
        },

        //#################### Internal Properties ####################################
        _challengeData: {
            writable: true
        },
        _writingMsg: {
            get: function(){
                return writingMsg;
            },
            set: function(index){
                if (!isNaN(index = Number(index))){
                    writingMsg.push(index);
                }
            }
        },
        _writerKeyIndex: {
            writable: true
        },
        _writerKey: {
            get: function(){
                if(!isNaN(self._writerKeyIndex)){
                    return self._writer.key[self._writerKeyIndex];
                }
                return null;
            },
            set: function(key){
                if(key instanceof KeyStream){
                    if(!isNaN(self._writerKeyIndex)){
                        self._writer.key[self._writerKeyIndex] = key;
                    }else{
                        self._writerKeyIndex = self._writer.key.push(key) - 1;
                    }
                }
            }
        },
        _msgId:{
            get: function(){
                return count++;
            },
            set: function(id){
                if(typeof id === 'string'){
                    id = Number(id.replace(new RegExp('message-[0-9]{10}-', 'g'), ''));
                }

                if(typeof id === 'number'){
                    var index = sendMsg.indexOf(id);

                    if(index !== -1){
                        delete sendMsg[index];
                        sendMsg[index] = null;

                        self.emit('msgReceived', id);
                    }
                }
            }
        }
    });
}

Sup.prototype._onChallenge = function processChallengeData(challenge){
    var self = this;
    self._challengeData = challenge;

    generateKeys(self.password, self._challengeData,
        function (error, keys) {
            if (!error) {
                self._reader.key = new KeyStream(keys[2], keys[3]);
                self._writerKey = new KeyStream(keys[0], keys[1]);

                var buffer = Buffer.concat([new Buffer('\0\0\0\0' + self.phoneNumber), self._challengeData]);
                var array = self._writerKey.encodeMessage(buffer, 0, 4, buffer.length - 4);
                self._writer.writeNewMsg('response', {response: array, msgId: self.phoneNumber+'-'+self._msgId});

            }else{
                self.emit('error', error);
            }
        }
    );
};

Sup.prototype._onConnected = function onConnectedSuccessEvent(challenge){
    var self = this;

    fs.open(self.CHALLENGE_DATA_FILE_NAME, 'w', function (error, file) {
        if (!error) {
            fs.write(file, challenge, 0, challenge.length, 0);
        } else {
            self.emit('error', error);
        }
    });
    self._writer.writeNewMsg('presence', {name: self.name, key: self._writerKeyIndex, msgId: self.phoneNumber+'-'+self._msgId}, function(){
        self.loginStatus = self.CONNECTED_STATUS;
    });
};

Sup.prototype.onDecode = function processNodeInfo(index, messageNode){

    //console.log(messageNode.nodeString('rx  '));
    console.log('Received');
    console.log(util.inspect(messageNode, { showHidden: false, depth: null, colors: true }));
    if(messageNode.attributeHash.hasOwnProperty('id')){
        this._msgId = messageNode.id;
    }

    switch(messageNode.tag){
        case 'challenge':
            this.emit('_challenge', messageNode.data);

            break;
        case 'success':
            this.emit('connected', messageNode.data);

            break;
        default:
            break;
    }
};

Sup.prototype._onPushed = function onPushedEvent(index, id){
    if(id.slice(0, id.indexOf('-')) === this.phoneNumber){
        this._writingMsg = index;
    }
};

Sup.prototype._onSend = function onSendEvent(bufferArray){
    var self = this;
    //console.log('send '+ bufferArray.toString());

    async.eachSeries(
        bufferArray,
        function(buff, callback){
            try{
                self.write(buff[0]);   //Write Message to Socket
                self.emit('sent', buff[1]);  //Emit Event Sent Message

                if(typeof buff[2] === 'function') {
                    buff[2](); //TODO: maybe give message buff and/or id to callback??????
                }
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
};

Sup.prototype._onWritten = function onWrittenEvent(index, id, buff, callback){
    var self = this;

    index = self._writingMsg.indexOf(index);
    if(index !== - 1) {
        self._writingMsg[index] = [buff, id, callback];

        if (index === 0) {
            process.nextTick(function () {
                var bufferArray = [];

                async.whilst(
                    function () {
                        return self._writingMsg[index] instanceof Array && Buffer.isBuffer(self._writingMsg[index][0]);
                    },
                    function (callback) {
                        bufferArray.push(self._writingMsg[index]);
                        index++;
                        callback();
                    },
                    function () {
                        self.clearSentMsg(index);
                        self.emit('_send', bufferArray);
                    }
                );
            });
        }

    }else{
        self.emit('error', new Error('Incorrect Message Index', 'MSG_INDEX'));
    }
};

Sup.prototype.setupListeners = function setupInternalListeners(){
    var self = this;

    self.on('end', function onEnd(){
        //console.log('connection ended by the partner');
    });
    self.on('error', function onError(error){
        //console.log('connection error');
        throw error;
    });
    self.on('timeout', function onTimeOut(){
        //console.log('connection on idle');
    });
    self.on('drain', function onWriteBufferEmpty(){
        //console.log('write buffer empty');
    });
    self.on('close', function onClose(hadError){
        if(hadError){
            //console.log('connection closed');
        }else{
            //console.log('connection closed due to a transmission error.');
        }
    });

    self.on(        '_send',        function (bufferArray)                  {  self._onSend     (bufferArray);                  });     //Send Event Listener that send messages to whatsApp server
    self.on(        '_challenge',   function (challenge)                    {  self._onChallenge(challenge);                    });     //Challenge Event Listener that process the received challenge data
    self.on(        'connected',    function (challenge)                    {  self._onConnected(challenge);                    });     //Connected (a.k.a Success) Event Listener that process future connection challengeData
    self._writer.on('pushed',       function (index, id)                    {  self._onPushed   (index, id);                    });     //Writer Pushed Event Listener that add the pushed message index into internal array
    self._writer.on('written',      function (index, id, buffer, callback)  {  self._onWritten  (index, id, buffer, callback);  });     //Writer Written Event Listener that add the written message to outgoing queue
    self._reader.on('decoded',      function (index, messageNode)           {  self.onDecode    (index, messageNode);           });     //Reader decoded Event Listener that process every message received
};

Sup.prototype.disconnect = function endSocketConnection(){
    this.end();
    this.destroy();
};

Sup.prototype.buildIdentity = function buildIdentity(identity, callback){
    var self = this;

    fs.readFile(identity+'.dat', function(error, data){
        if(!error && data.length === self.IDENTITY_LENGTH) {
            callback(null, data);
        }else{
            crypto.pseudoRandomBytes(16, function(error, buff){
                if(!error){
                    var count = 0;
                    var identityBuff = new Buffer(buff.length * 2 + 1);
                    identityBuff.write('%', count++);

                    async.eachSeries(
                        buff,
                        function(data, callback){
                            identityBuff.writeUInt8(data, count++);
                            identityBuff.write('%', count++);
                            callback();
                        },
                        function(){
                            fs.writeFile(identity+'.dat', identityBuff, function(error){
                                if(error) {
                                    self.emit('error', error);
                                }
                            });
                            callback(null, identityBuff);
                        }
                    );
                }else{
                    callback(error, null);
                }
            });
        }
    });
};

Sup.prototype.openCSV = function OpenCSVFile(path, callback){
    var csv = require('fast-csv');

    fs.exists(path, function(exists) {
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
                    country: data[0],
                    cc: data[1],
                    phone: phone.substr(data[1].length),
                    mcc: data[2].split('|')[0],
                    ISO3166: data[3],
                    ISO639: data[4],
                    mnc: data[5]
                };

                callback(null, phoneInfo);
            }
        }else{
            callback(error, null);
        }
    });
};

Sup.prototype.createAuthBlob = function createAuthBlob(callback){
    var strPad = require('./php.js').strPad;
    var self = this;

    if(self._challengeData) {
        async.parallel([
            function (callback) {
                async.waterfall(
                    [
                        function (callback) {
                            crypto.pbkdf2(self.password, self._challengeData, 16, 20, callback);
                        },
                        function setKeys(key, callback) {
                            self._reader.key = new KeyStream(key[2], key[3]);
                            self._writerKey = new KeyStream(key[0], key[1]);
                            callback(null);
                        }
                    ], callback
                );
            },
            function (callback) {
                async.waterfall(
                    [
                        function (callback) {
                            self.dissectPhone(self.COUNTRIES, self.phoneNumber, callback);
                        },
                        function encodeAuthMessage(phoneInfo, callback) {
                            var time = parseInt(new Date().getTime() / 100);
                            var buff = new Buffer('\0\0\0\0' + self.phoneNumber + self._challengeData + time + self.WHATSAPP_USER_AGENT + ' MccMnc/' + strPad(phoneInfo.mcc, 3, '0', 'STR_PAD_LEFT') + phoneInfo.mnc);
                            callback(null, buff);
                        }
                    ], callback
                );
            }
        ], function authBlobReturn(error, value) {
                if(!error){
                    self._challengeData = null;
                    callback(error, self._writerKey.encodeMessage(value[1], 0, value[1].length, 0));
                }else {
                    self.emit('error', error);
                }
        });
    }else{
        callback(null, null);
    }
};

Sup.prototype.doLogin = function doLogin(){
    var self = this;

    self._writer.resetKey(this._writerKeyIndex);
    self._reader.resetKey();

    self.createAuthBlob(function(error, authBlob){
        self._writer.writeNewMsg('start:stream', {domain: self.WHATSAPP_SERVER, resource: self.WHATSAPP_DEVICE + '-' + self.WHATSAPP_VER + '-' + self.PORT, msgId: self.phoneNumber+'-'+self._msgId});
        self._writer.writeNewMsg('stream:features', {msgId: self.phoneNumber+'-'+self._msgId});
        self._writer.writeNewMsg('auth', {mechanism: 'WAUTH-2', user: self.phoneNumber, authBlob: authBlob, msgId: self.phoneNumber+'-'+self._msgId});
    });
};

Sup.prototype.login = function loginToWhatsAppServer(password){
    var self = this;

    if(password){
        if(Buffer.isBuffer(password)){
            self.password = password;
        }else if(typeof password === 'string'){
            self.password = new Buffer(password, 'base64');
        }else{
            self.emit('error', new TypeError('Password need to be a Base64 encoded String or a Buffer'));
        }

        fs.readFile(self.CHALLENGE_DATA_FILE_NAME,
            function(error, data){
                if(!error && data.length){
                    self._challengeData = data;
                }

                self.doLogin();
            }
        );
    }else{
        //Todo: receive new Password from whatsApp Servers
    }
};

Sup.prototype.sendMessage = function sendTextMessage(to, text, callback){
    var self = this;

    if(self.loginStatus === self.CONNECTED_STATUS) {
        var msgId = self._msgId;
            text = basicFunc.parseMsgEmojis(text);

        self._writer.writeNewMsg('text', {
            text: text,
            key: self._writerKeyIndex,
            name: self.name,
            to: to,
            id: msgId,
            msgId: self.phoneNumber + '-' + msgId
        }, callback);
    }else {
        setImmediate(function () {
            self.sendMessage(to, text, callback);
        });
    }
};

var teste = new Sup('5521989316579', 'Xing Ling Lee');
teste.login('eW8hwE74KhuApT3n6VZihPt+oPI=');
//teste.sendMessage('5521999667644', 'This is Sup Bitch Yeah!!!!!! WORKING \\o/\\o/');
//teste.sendMessage('5521999840775', 'This is Sup Bitch Yeah!!!!!! WORKING \\o/\\o/');
//teste.sendMessage('5521991567340', 'This is Sup Bitch Yeah!!!!!! WORKING \\o/\\o/');