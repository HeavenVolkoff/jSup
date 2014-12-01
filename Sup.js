/**
 * Created by HeavenVolkoff on 11/11/14.
 */

'use strict';

var async = require('async');
var basicFunc = require('./BasicFunctions');
var Constants = require('./Constants');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var generateKeys = require('./KeyStream').generateKeys;
var https = require('https');
var KeyStream = require('./KeyStream');
var MessageReader = require('./MessageReader');
var MessageWriter = require('./MessageWriter');
var Socket = require('net').Socket;
var url = require('url');
var util = require('util');


function buildIdentity(identity, callback){
    fs.readFile(identity+'.dat', function(error, data){
        if(!error && data.length === 48) {
            callback(null, data);
        }else{
            crypto.pseudoRandomBytes(16, function(error, buff){
                if(!error){
                    var count = 0;
                    var identityBuff = new Buffer(buff.length * 3);
                    identityBuff.write('%', count++);

                    async.eachSeries(
                        buff,
                        function(data, callback){
                            data = data.toString(16);
                            if(data.length % 2){
                                data = '0' + data;
                            }

                            identityBuff.write(data.toLowerCase(), count);
                            count += 2;
                            identityBuff.write('%', count++);
                            callback();
                        },
                        function(){
                            fs.writeFile(identity+'.dat', identityBuff, function(error){
                                if(error) {
                                    callback(error, null)
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
}

function openCSV(path, callback){
    var csv = require('fast-csv');
    path = __dirname + '/' + path;

    fs.exists(path, function(exists) {
        if (exists) {
            csv.fromPath(path)
                .on('data', function(data){callback(null, data);});//TODO: this function is a listener that don't stop even after the callback has returned true, check if there is a way to kill it.
        }else{
            callback(new Error('file' + path + 'not found', 'FILE_NOT_FOUND'), null);
        }
    });
}

function dissectPhone(path, phone, callback) {
    //TODO: make this a database to make queries
    openCSV(path, function openCSVCountries(error, data){
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
}

Sup.codeRequest = function codeRequest(method, phone, callback){
    var constant = new Constants();
    method = method === 'sms' || method === 'voice'? method : 'sms';

    buildIdentity(phone,
        function(error, identity) {
            if (!error) {
                dissectPhone(constant.COUNTRIES, phone,
                    function (error, phoneInfo) {
                        if (!error) {
                            var host = 'https://' + constant.WHATSAPP_REQUEST_HOST + '?';
                            var countryCode = phoneInfo.ISO3166;
                            var language = phoneInfo.ISO639;
                            var token = basicFunc.genReqToken(phoneInfo.phone);

                            if (!countryCode || countryCode === '') {
                                countryCode = 'US';
                            }

                            if (!language || language === '') {
                                language = 'en';
                            }

                            if (phoneInfo.cc === '77' || phoneInfo.cc === '79') {
                                phoneInfo.cc = '7';
                            }

                            host += 'in=' + phoneInfo.phone + '&' +
                            'cc=' + phoneInfo.cc + '&' +
                            'id=' + identity + '&' +
                            'lg=' + language + '&' +
                            'lc=' + countryCode + '&' +
                            'mcc=' + phoneInfo.mcc + '&' +
                            'mnc=' + phoneInfo.mnc + '&' +
                            'sim_mcc=' + phoneInfo.mcc + '&' +
                            'sim_mnc=' + phoneInfo.mnc + '&' +
                            'method=' + method + '&' +
                            'token=' + encodeURIComponent(token) + '&' +
                            'network_radio_type=' + 1;

                            host = url.parse(host);

                            var options = {
                                hostname: host.host,
                                path: host.path,
                                headers: {
                                    'User-Agent': constant.WHATSAPP_USER_AGENT,
                                    Accept: 'text/json'
                                },
                                rejectUnauthorized: false
                            };

                            options.agent = new https.Agent(options);

                            https.get(options,
                                function (response) {
                                    response.on('data',
                                        function (data) {
                                            callback(null, JSON.parse(data));
                                        }
                                    );
                                }
                            ).on('error', function (error) {
                                    if (error) {
                                        callback(error, null);
                                    }
                                });
                        } else {
                            callback(error, null);
                        }
                    }
                );
            } else {
                callback(error, null);
            }
        }
    );
};

Sup.codeRegister = function codeRegister(code, phone, callback){
    var constant = new Constants();

    buildIdentity(phone,
        function(error, identity) {
            if (!error) {
                dissectPhone(constant.COUNTRIES, phone,
                    function (error, phoneInfo) {
                        if (!error) {
                            var host = 'https://' + constant.WHATSAPP_REGISTER_HOST + '?';
                            var countryCode = phoneInfo.ISO3166;
                            var language = phoneInfo.ISO639;

                            if (!countryCode || countryCode === '') {
                                countryCode = 'US';
                            }

                            if (!language || language === '') {
                                language = 'en';
                            }

                            if (phoneInfo.cc === '77' || phoneInfo.cc === '79') {
                                phoneInfo.cc = '7';
                            }

                            host += 'cc=' + phoneInfo.cc + '&' +
                            'in=' + phoneInfo.phone + '&' +
                            'id=' + identity + '&' +
                            'code=' + code + '&' +
                            'lg=' + language + '&' +
                            'lc=' + countryCode + '&' +
                            'network_radio_type=' + 1;

                            host = url.parse(host);

                            var options = {
                                hostname: host.host,
                                path: host.path,
                                headers: {
                                    'User-Agent': constant.WHATSAPP_USER_AGENT,
                                    Accept: 'text/json'
                                },
                                rejectUnauthorized: false
                            };

                            options.agent = new https.Agent(options);

                            https.get(options,
                                function (response) {
                                    response.on('data',
                                        function (data) {
                                            callback(null,JSON.parse(data));
                                        }
                                    );
                                }
                            ).on('error', function (e) {
                                    if (e) {
                                        callback(error, null);
                                    }
                                });
                        } else {
                            callback(error, null);
                        }
                    }
                );
            }else{
                callback(error, null);
            }
        }
    );
};

module.exports = Sup;

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
    EventEmitter.prototype.setMaxListeners.call(this, 20);
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
        _autoReceipt: {
            value: 'read',
            writable: true
        },
        _challengeData: {
            writable: true
        },
        _canSendMsg: {
            value: false,
            writable: true
        },
        _writeMsg:{
            value:
                /**
                 * @param type
                 * @param [info = {}]
                 * @param [key = false]
                 * @param [callback = null]
                 */
                function(type, info, key, callback){
                    key = typeof key === 'boolean'? key : typeof info === 'boolean'? info : false;
                    info = info instanceof Object? info : {};
                    callback = typeof arguments[arguments.length - 1] === 'function'? arguments[arguments.length - 1] : null;
                    if(key){
                      info.key = self._writerKeyIndex;
                    }

                    info.id = info.hasOwnProperty('id')? info.id : self._msgId;
                    info.owner = self.phoneNumber;

                    MessageWriter.prototype.writeNewMsg.call(self._writer, type, info, callback);
                }
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
                self._writeMsg('response', {response: array});

            }else{
                self.emit('error', error);
            }
        }
    );
};

Sup.prototype._onConnected = function onConnectedSuccessEvent(challenge){
    var self = this;

    self.loginStatus = self.CONNECTED_STATUS;

    fs.open(self.CHALLENGE_DATA_FILE_NAME, 'w', function (error, file) {
        if (!error) {
            fs.write(file, challenge, 0, challenge.length, 0);
        } else {
            self.emit('error', error);
        }
    });
    self._writeMsg('presence', {name: self.name}, true, function(){
        self._canSendMsg = true;
    });
};

Sup.prototype.onDecode = function processNodeInfo(index, messageNode){
    var self = this;

    //console.log(messageNode.nodeString('rx  '));
    //console.log('\nReceived');
    //console.log(util.inspect(messageNode, { showHidden: false, depth: null, colors: true }));
    if(messageNode.attributeHash.hasOwnProperty('id')){
        self._msgId = messageNode.id;
    }

    switch(messageNode.tag){
        case 'challenge':
            self.emit('_challenge', messageNode.data);

            break;
        case 'success':
            self.emit('connected', messageNode.data);

            break;
        case 'message':
            switch (messageNode.getAttribute('type')){
                case 'text':
                    messageNode.getChild('body', function(body){
                        if(body){
                            self._writeMsg('receipt', {type: self._autoReceipt, to: messageNode.getAttribute('from'), receivedMsgId: messageNode.getAttribute('id')}, true);

                            var author = messageNode.getAttribute('participant');

                            if(!author){
                                var from = messageNode.getAttribute('from');
                                self.emit('message',
                                    from.slice(0, from.indexOf('@')),
                                    messageNode.getAttribute('id'),
                                    messageNode.getAttribute('type'),
                                    messageNode.getAttribute('t'),
                                    messageNode.getAttribute('notify'),
                                    body.data.toString('utf8')
                                );
                            }else{
                                self.emit('groupMessage',
                                    messageNode.getAttribute('from'),
                                    author,
                                    messageNode.getAttribute('id'),
                                    messageNode.getAttribute('type'),
                                    messageNode.getAttribute('t'),
                                    messageNode.getAttribute('notify'),
                                    body.getData('utf8')
                                );
                            }
                        }
                    });

                    break;
                case 'media':
                    self._writeMsg('receipt', {type: self._autoReceipt, to: messageNode.getAttribute('from'), receivedMsgId: messageNode.getAttribute('id')}, true);
            }

            break;
        case 'presence':
            var from = messageNode.getAttribute('from');

            break;
        case 'ib':
            self.emit('ib');

            break;
        case 'iq':
            if(messageNode.getAttribute('type') === 'get' && messageNode.getAttribute('xmlns') === 'urn:xmpp:ping'){
                self._writeMsg('pong', {receivedMsgId: messageNode.getAttribute('id')}, true);
            }

            break;
        case 'receipt':
            self._writeMsg('ack', {to: messageNode.getAttribute('from'), receivedMsgId: messageNode.getAttribute('id'), type: self._autoReceipt}, true);

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

    async.eachSeries(
        bufferArray,
        function(buff, callback){
            try{
                //console.log('\nSend To Server');
                //console.log(buff[0].toString('hex'));
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

    //console.log('\nSend BUFFER');
    //console.log(index);
    //console.log(id);
    //console.log(buff);

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

    //self.on('end', function onEnd(){
    //    console.log('\nconnection ended by the partner');
    //});
    //self.on('error', function onError(error){
    //    console.log('\nconnection error');
    //    throw error;
    //});
    //self.on('timeout', function onTimeOut(){
    //    //console.log('\nconnection on idle');
    //});
    //self.on('drain', function onWriteBufferEmpty(){
    //    console.log('\nwrite buffer empty');
    //});
    //self.on('close', function onClose(hadError){
    //    if(hadError){
    //        console.log('\nconnection closed');
    //    }else{
    //        console.log('\nconnection closed due to a transmission error.');
    //    }
    //});

    self.on(        '_send',            function (bufferArray)                  {  self._onSend     (bufferArray);                  });     //Send Event Listener that send messages to whatsApp server
    self.on(        '_challenge',       function (challenge)                    {  self._onChallenge(challenge);                    });     //Challenge Event Listener that process the received challenge data
    self.on(        'connected',        function (challenge)                    {  self._onConnected(challenge);                    });     //Connected (a.k.a Success) Event Listener that process future connection challengeData
    self.on(        'newCrededntials',  function (credentials)                  {  self.password = credentials.pw;                  });     //New Credentials Event Listener that process new Credentials
    self._writer.on('pushed',           function (index, id)                    {  self._onPushed   (index, id);                    });     //Writer Pushed Event Listener that add the pushed message index into internal array
    self._writer.on('written',          function (index, id, buffer, callback)  {  self._onWritten  (index, id, buffer, callback);  });     //Writer Written Event Listener that add the written message to outgoing queue
    self._reader.on('decoded',          function (index, messageNode)           {  self.onDecode    (index, messageNode);           });     //Reader decoded Event Listener that process every message received
    self._writer.on('error', function (error){                                                                                              //Bug logging
        if (error){
            var bug = new Buffer(error.toString());
            fs.open('Errors.log', 'w+', function(error, file){
                if (!error){
                    fs.write(file, bug, 0, bug.length, 0);
                }else{
                    console.log('Error saving fail (file access deny).');
                }
            });
        }
    });
    self._reader.on('error', function (error){                                                                                              //Bug logging
        if (error) {
            var bug = new Buffer(error.toString());
            fs.open('Errors.log', 'w+', function (error, file) {
                if (!error) {
                    fs.write(file, bug, 0, bug.length, 0);
                } else {
                    console.log('Error saving fail (file access deny).');
                }
            });
        }
    });
};

Sup.prototype.disconnect = function endSocketConnection(){
    this.end();
    this.destroy();
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
                            var time = parseInt(new Date().getTime() / 1000);
                            var buff = Buffer.concat([new Buffer('\0\0\0\0' + self.phoneNumber), self._challengeData, new Buffer(time + self.WHATSAPP_USER_AGENT + ' MccMnc/' + strPad(phoneInfo.mcc, 3, '0', 'STR_PAD_LEFT') + phoneInfo.mnc)]);
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
        self._writeMsg('start:stream');
        self._writeMsg('stream:features');
        self._writeMsg('auth', {authBlob: authBlob});
    });
};

Sup.prototype.login = function loginToWhatsAppServer(password){
    var self = this;

    buildIdentity(self.phoneNumber,
        function(error, data) {
            if (!error) {
                self.identity = data;

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
            } else {
                self.emit('error', error);
            }
        }
    );
};

Sup.prototype.sendMessage = function sendTextMessage(to, text, callback){
    var self = this;

    if(self._canSendMsg) {
        text = basicFunc.parseMsgEmojis(text);

        self._writeMsg('text', {text: text, to: to}, true, callback);
    }else {
        setImmediate(function () {
            self.sendMessage(to, text, callback);
        });
    }
};

Sup.prototype.configureProps = function getServerPropertiesSendClientConfig(callback){
    var self = this;

    if(self._canSendMsg) {
        self._writeMsg('props', true);
        self.dissectPhone(self.COUNTRIES, self.phoneNumber, function(error, phoneInfo){
            if(!error){
                self._writeMsg('config', {phoneObj: phoneInfo}, true, callback);
            }else {
                self.emit('error', error);
            }
        });
    }else{
        setImmediate(function () {
            self.configureProps(callback);
        });
    }
};

Sup.prototype.syncContacts = function syncContacts(numbers, options, callback){
    numbers = Array.isArray(numbers)? numbers : typeof numbers === 'string'? [numbers] : typeof numbers === 'number'? [numbers.toString()] : null;
    options = options || {};
    options.numbers = numbers;
    options.mode    = options.hasOwnProperty('mode')?    options.mode : 'full';
    options.context = options.hasOwnProperty('context')? options.context : 'registration';
    options.index   = options.hasOwnProperty('index')?   options.index : '0';
    options.last    = options.hasOwnProperty('last')?    options.last : 'true';
    callback = typeof arguments[arguments.length - 1] === 'function'? arguments[arguments.length - 1] : null;

    var self = this;

    if(self._canSendMsg) {
        self._writeMsg('sync', options, true, callback);
    }else{
        setImmediate(function(){
            self.syncContacts(numbers, options, callback);
        });
    }
};

Sup.prototype.userSubscription = function userSubscription(to, mode, callback){
    to = typeof to === 'string'? to : typeof to === 'number'? to.toString() : null;
    mode = mode === 'subscribe' || mode === 'unsubscribe'? mode : 'subscribe';
    callback = typeof arguments[arguments.length - 1] === 'function'? arguments[arguments.length - 1] : null;

    var self = this;

    if(self._canSendMsg) {
        self._writeMsg(mode, {to: to}, true, callback);
    }else{
        setImmediate(function(){
            self.userSubscription(to, mode, callback);
        });
    }
};

Sup.prototype.waitFor = function waitFor(tag, callback){
    this.once(tag, callback);
};
