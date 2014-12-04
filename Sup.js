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
var KeyStream = require('./KeyStream');
var MessageReader = require('./MessageReader');
var MessageWriter = require('./MessageWriter');
var Socket = require('net').Socket;
var url = require('url');
var util = require('util');

module.exports = Sup;
Sup.buildIdentity = basicFunc.buildIdentity;
Sup.dissectPhone = basicFunc.dissectPhone;
Sup.codeRequest = basicFunc.codeRequest;
Sup.codeRegister = basicFunc.codeRegister;

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
                                    body.data.toString('utf8')
                                );
                            }
                        }
                    });

                    break;
                case 'media':
                    var media = messageNode.getChild('media', function(media){
                        self._writeMsg('receipt', {type: self._autoReceipt, to: messageNode.getAttribute('from'), receivedMsgId: messageNode.getAttribute('id')}, true);
                        var from = messageNode.getAttribute('from');
                        switch (media.getAttribute('type')){
                            case 'image':
                                self.emit('imageMessage',
                                    from.slice(0, from.indexOf('@')),
                                    messageNode.getAttribute('id'),
                                    'image',
                                    messageNode.getAttribute('t'),
                                    messageNode.getAttribute('notify'),
                                    media.getAttribute('size'),
                                    media.getAttribute('url'),
                                    media.getAttribute('file'),
                                    media.getAttribute('mimetype'),
                                    media.getAttribute('filehash'),
                                    media.getAttribute('width'),
                                    media.getAttribute('height'),
                                    media.data,
                                    media.getAttribute('caption')
                                );

                                break;

                            case 'video':
                                self.emit('videoMessage',
                                    from.slice(0, from.indexOf('@')),
                                    messageNode.getAttribute('id'),
                                    'video',
                                    messageNode.getAttribute('t'),
                                    messageNode.getAttribute('notify'),
                                    media.getAttribute('size'),
                                    media.getAttribute('url'),
                                    media.getAttribute('file'),
                                    media.getAttribute('mimetype'),
                                    media.getAttribute('filehash'),
                                    media.getAttribute('duration'),
                                    media.getAttribute('vcodec'),
                                    media.getAttribute('acodec'),
                                    media.data,
                                    media.getAttribute('caption')
                                );

                                break;

                            case 'audio':
                                self.emit('audioMessage',
                                    from.slice(0, from.indexOf('@')),
                                    messageNode.getAttribute('id'),
                                    'audio',
                                    messageNode.getAttribute('t'),
                                    messageNode.getAttribute('notify'),
                                    media.getAttribute('size'),
                                    media.getAttribute('url'),
                                    media.getAttribute('file'),
                                    media.getAttribute('mimetype'),
                                    media.getAttribute('filehash'),
                                    media.getAttribute('seconds'),
                                    media.getAttribute('acodec')
                                );

                                break;
                        }
                    });
            }

            break;
        case 'presence':


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
            if(messageNode.getAttribute('type')){
                self.emit('receipt',
                    messageNode.getAttribute('from'),
                    messageNode.getAttribute('id'),
                    messageNode.getAttribute('type'),
                    messageNode.getAttribute('t')
                );
            }

            break;
        case 'ack':
            if(messageNode.getAttribute('class') === 'message'){
                self.emit('ack',
                    messageNode.getAttribute('from'),
                    messageNode.getAttribute('id'),
                    messageNode.getAttribute('class'),
                    messageNode.getAttribute('t')
                );
            }

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
    self._reader.on('null',             function ()                             {  self.emit('close', true);                        });
    self._reader.on('decoded',          function (index, messageNode)           {  self.onDecode    (index, messageNode);           });     //Reader decoded Event Listener that process every message received
    self._writer.on('error', function (error){                                                                                              //Bug logging
        if (error){
            var bug = new Buffer(error.toString());
            bug += error.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                .split('\n');
            fs.open('Errors.log', 'a+', function(error, file){
                if (!error){
                    fs.write(file, bug);
                }else{
                    console.log('Error saving fail (file access deny).');
                }
            });
        }
    });
    self._reader.on('error', function (error){                                                                                              //Bug logging
        if (error) {
            var bug = new Buffer(error.toString());
            bug += error.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                .split('\n');
            fs.open('Errors.log', 'a+', function (error, file) {
                if (!error) {
                    fs.write(file, bug);
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
                            Sup.dissectPhone(self.COUNTRIES, self.phoneNumber, callback);
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

    Sup.buildIdentity(self.phoneNumber,
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
        Sup.dissectPhone(self.COUNTRIES, self.phoneNumber, function(error, phoneInfo){
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

//var teste = new Sup('5521989316579', 'Xing Ling Lee');
//teste.login('eW8hwE74KhuApT3n6VZihPt+oPI=');
//teste.configureProps(function(){
//    teste.syncContacts('5521991567340', function(){
//        teste.userSubscription('5521991567340', function(){
//            teste.sendMessage('5521991567340', 'This is Sup Bitch Yeah!!!!!! WORKING \\o/\\o/');
//            teste.sendMessage('5521999667644', 'This is Sup Bitch Yeah!!!!!! WORKING \\o/\\o/');
//            teste.sendMessage('5521999840775', 'This is Sup Bitch Yeah!!!!!! WORKING \\o/\\o/');
//        });
//    });
//});
//teste.on('message',
//    function(from, id, type, time, notify, text){
//        if(type === 'text') {
//            console.log('\nMensagem De ' + from + '(' + notify + ')');
//            console.log('Texto: '+text);
//            console.log('Em: '+new Date(time * 1000));
//        }
//    }
//);
