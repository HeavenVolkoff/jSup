/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';
var fs = require('fs');
var crypto = require('crypto');
var url = require('url');
var async = require('async');
var https = require('https');
var Constants = require('./Constants');

/**
 * Check if it is Node.js environment
 * @returns {boolean}
 */
module.exports.isNode = function isNode(){
	return module !== 'undefined' && module.exports;
};

/**
 * Ensure escaped special character inside a RegExp string
 *
 * @param {string} string
 * @returns {XML|string|void}
 */
var escapeRegExp =  function escapeRegExp(string) {
	return string.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, '\\$1');
};
module.exports.escapeRegExp = escapeRegExp;

/**
 * Convert Hex to Binary
 *
 * @param {string} hex
 *
 * @return {string} bin
 */
module.exports.hexToBin = function hexToBin(hex){
	var bytes = [];

	for(var count = 0; count < hex.length-1; count += 2){
		bytes.push(parseInt(hex.substr(count, 2), 16));
	}

	return String.fromCharCode.apply(String, bytes);
};

module.exports.shiftRight = function shiftRight(int, shift){
	return Number(int) >>> shift;
};

module.exports.shiftLeft = function shiftLeft(int, shift){
	var result = Math.floor(Number(int)) * Math.pow(2, shift);
	return isNaN(result)? 0 : result;
};

/**
 * Return the Emoji object array
 *
 * @returns {{iOS2: string, iOS5: string, iOS7: string, Hex: string}[]}
 */
function emojiObjectArray(){
    return [{'iOS2': '','iOS5': '😄','iOS7': '','Hex': '1F604'}, {'iOS2': '','iOS5': '😃','iOS7': '','Hex': '1F603'}, {'iOS2': '','iOS5': '😀','iOS7': '','Hex': '1F600'}, {'iOS2': '','iOS5': '😊','iOS7': '','Hex': '1F60A'}, {'iOS2': '','iOS5': '☺','iOS7': '☺️','Hex': '263A'}, {'iOS2': '','iOS5': '😉','iOS7': '','Hex': '1F609'}, {'iOS2': '','iOS5': '😍','iOS7': '','Hex': '1F60D'}, {'iOS2': '','iOS5': '😘','iOS7': '','Hex': '1F618'}, {'iOS2': '','iOS5': '😚','iOS7': '','Hex': '1F61A'}, {'iOS2': '','iOS5': '😗','iOS7': '','Hex': '1F617'}, {'iOS2': '','iOS5': '😙','iOS7': '','Hex': '1F619'}, {'iOS2': '','iOS5': '😜','iOS7': '','Hex': '1F61C'}, {'iOS2': '','iOS5': '😝','iOS7': '','Hex': '1F61D'}, {'iOS2': '','iOS5': '😛','iOS7': '','Hex': '1F61B'}, {'iOS2': '','iOS5': '😳','iOS7': '','Hex': '1F633'}, {'iOS2': '','iOS5': '😁','iOS7': '','Hex': '1F601'}, {'iOS2': '','iOS5': '😔','iOS7': '','Hex': '1F614'}, {'iOS2': '','iOS5': '😌','iOS7': '','Hex': '1F60C'}, {'iOS2': '','iOS5': '😒','iOS7': '','Hex': '1F612'}, {'iOS2': '','iOS5': '😞','iOS7': '','Hex': '1F61E'}, {'iOS2': '','iOS5': '😣','iOS7': '','Hex': '1F623'}, {'iOS2': '','iOS5': '😢','iOS7': '','Hex': '1F622'}, {'iOS2': '','iOS5': '😂','iOS7': '','Hex': '1F602'}, {'iOS2': '','iOS5': '😭','iOS7': '','Hex': '1F62D'}, {'iOS2': '','iOS5': '😪','iOS7': '','Hex': '1F62A'}, {'iOS2': '','iOS5': '😥','iOS7': '','Hex': '1F625'}, {'iOS2': '','iOS5': '😰','iOS7': '','Hex': '1F630'}, {'iOS2': '','iOS5': '😅','iOS7': '','Hex': '1F605'}, {'iOS2': '','iOS5': '😓','iOS7': '','Hex': '1F613'}, {'iOS2': '','iOS5': '😩','iOS7': '','Hex': '1F629'}, {'iOS2': '','iOS5': '😫','iOS7': '','Hex': '1F62B'}, {'iOS2': '','iOS5': '😨','iOS7': '','Hex': '1F628'}, {'iOS2': '','iOS5': '😱','iOS7': '','Hex': '1F631'}, {'iOS2': '','iOS5': '😠','iOS7': '','Hex': '1F620'}, {'iOS2': '','iOS5': '😡','iOS7': '','Hex': '1F621'}, {'iOS2': '','iOS5': '😤','iOS7': '','Hex': '1F624'}, {'iOS2': '','iOS5': '😖','iOS7': '','Hex': '1F616'}, {'iOS2': '','iOS5': '😆','iOS7': '','Hex': '1F606'}, {'iOS2': '','iOS5': '😋','iOS7': '','Hex': '1F60B'}, {'iOS2': '','iOS5': '😷','iOS7': '','Hex': '1F637'}, {'iOS2': '','iOS5': '😎','iOS7': '','Hex': '1F60E'}, {'iOS2': '','iOS5': '😴','iOS7': '','Hex': '1F634'}, {'iOS2': '','iOS5': '😵','iOS7': '','Hex': '1F635'}, {'iOS2': '','iOS5': '😲','iOS7': '','Hex': '1F632'}, {'iOS2': '','iOS5': '😟','iOS7': '','Hex': '1F61F'}, {'iOS2': '','iOS5': '😦','iOS7': '','Hex': '1F626'}, {'iOS2': '','iOS5': '😧','iOS7': '','Hex': '1F627'}, {'iOS2': '','iOS5': '😈','iOS7': '','Hex': '1F608'}, {'iOS2': '','iOS5': '👿','iOS7': '','Hex': '1F47F'}, {'iOS2': '','iOS5': '😮','iOS7': '','Hex': '1F62E'}, {'iOS2': '','iOS5': '😬','iOS7': '','Hex': '1F62C'}, {'iOS2': '','iOS5': '😐','iOS7': '','Hex': '1F610'}, {'iOS2': '','iOS5': '😕','iOS7': '','Hex': '1F615'}, {'iOS2': '','iOS5': '😯','iOS7': '','Hex': '1F62F'}, {'iOS2': '','iOS5': '😶','iOS7': '','Hex': '1F636'}, {'iOS2': '','iOS5': '😇','iOS7': '','Hex': '1F607'}, {'iOS2': '','iOS5': '😏','iOS7': '','Hex': '1F60F'}, {'iOS2': '','iOS5': '😑','iOS7': '','Hex': '1F611'}, {'iOS2': '','iOS5': '👲','iOS7': '','Hex': '1F472'}, {'iOS2': '','iOS5': '👳','iOS7': '','Hex': '1F473'}, {'iOS2': '','iOS5': '👮','iOS7': '','Hex': '1F46E'}, {'iOS2': '','iOS5': '👷','iOS7': '','Hex': '1F477'}, {'iOS2': '','iOS5': '💂','iOS7': '','Hex': '1F482'}, {'iOS2': '','iOS5': '👶','iOS7': '','Hex': '1F476'}, {'iOS2': '','iOS5': '👦','iOS7': '','Hex': '1F466'}, {'iOS2': '','iOS5': '👧','iOS7': '','Hex': '1F467'}, {'iOS2': '','iOS5': '👨','iOS7': '','Hex': '1F468'}, {'iOS2': '','iOS5': '👩','iOS7': '','Hex': '1F469'}, {'iOS2': '','iOS5': '👴','iOS7': '','Hex': '1F474'}, {'iOS2': '','iOS5': '👵','iOS7': '','Hex': '1F475'}, {'iOS2': '','iOS5': '👱','iOS7': '','Hex': '1F471'}, {'iOS2': '','iOS5': '👼','iOS7': '','Hex': '1F47C'}, {'iOS2': '','iOS5': '👸','iOS7': '','Hex': '1F478'}, {'iOS2': '','iOS5': '😺','iOS7': '','Hex': '1F63A'}, {'iOS2': '','iOS5': '😸','iOS7': '','Hex': '1F638'}, {'iOS2': '','iOS5': '😻','iOS7': '','Hex': '1F63B'}, {'iOS2': '','iOS5': '😽','iOS7': '','Hex': '1F63D'}, {'iOS2': '','iOS5': '😼','iOS7': '','Hex': '1F63C'}, {'iOS2': '','iOS5': '🙀','iOS7': '','Hex': '1F640'}, {'iOS2': '','iOS5': '😿','iOS7': '','Hex': '1F63F'}, {'iOS2': '','iOS5': '😹','iOS7': '','Hex': '1F639'}, {'iOS2': '','iOS5': '😾','iOS7': '','Hex': '1F63E'}, {'iOS2': '','iOS5': '👹','iOS7': '','Hex': '1F479'}, {'iOS2': '','iOS5': '👺','iOS7': '','Hex': '1F47A'}, {'iOS2': '','iOS5': '🙈','iOS7': '','Hex': '1F648'}, {'iOS2': '','iOS5': '🙉','iOS7': '','Hex': '1F649'}, {'iOS2': '','iOS5': '🙊','iOS7': '','Hex': '1F64A'}, {'iOS2': '','iOS5': '💀','iOS7': '','Hex': '1F480'}, {'iOS2': '','iOS5': '👽','iOS7': '','Hex': '1F47D'}, {'iOS2': '','iOS5': '💩','iOS7': '','Hex': '1F4A9'}, {'iOS2': '','iOS5': '🔥','iOS7': '','Hex': '1F525'}, {'iOS2': '','iOS5': '✨','iOS7': '','Hex': '2728'}, {'iOS2': '','iOS5': '🌟','iOS7': '','Hex': '1F31F'}, {'iOS2': '','iOS5': '💫','iOS7': '','Hex': '1F4AB'}, {'iOS2': '','iOS5': '💥','iOS7': '','Hex': '1F4A5'}, {'iOS2': '','iOS5': '💢','iOS7': '','Hex': '1F4A2'}, {'iOS2': '','iOS5': '💦','iOS7': '','Hex': '1F4A6'}, {'iOS2': '','iOS5': '💧','iOS7': '','Hex': '1F4A7'}, {'iOS2': '','iOS5': '💤','iOS7': '','Hex': '1F4A4'}, {'iOS2': '','iOS5': '💨','iOS7': '','Hex': '1F4A8'}, {'iOS2': '','iOS5': '👂','iOS7': '','Hex': '1F442'}, {'iOS2': '','iOS5': '👀','iOS7': '','Hex': '1F440'}, {'iOS2': '','iOS5': '👃','iOS7': '','Hex': '1F443'}, {'iOS2': '','iOS5': '👅','iOS7': '','Hex': '1F445'}, {'iOS2': '','iOS5': '👄','iOS7': '','Hex': '1F444'}, {'iOS2': '','iOS5': '👍','iOS7': '','Hex': '1F44D'}, {'iOS2': '','iOS5': '👎','iOS7': '','Hex': '1F44E'}, {'iOS2': '','iOS5': '👌','iOS7': '','Hex': '1F44C'}, {'iOS2': '','iOS5': '👊','iOS7': '','Hex': '1F44A'}, {'iOS2': '','iOS5': '✊','iOS7': '','Hex': '270A'}, {'iOS2': '','iOS5': '✌','iOS7': '✌️','Hex': '270C'}, {'iOS2': '','iOS5': '👋','iOS7': '','Hex': '1F44B'}, {'iOS2': '','iOS5': '✋','iOS7': '','Hex': '270B'}, {'iOS2': '','iOS5': '👐','iOS7': '','Hex': '1F450'}, {'iOS2': '','iOS5': '👆','iOS7': '','Hex': '1F446'}, {'iOS2': '','iOS5': '👇','iOS7': '','Hex': '1F447'}, {'iOS2': '','iOS5': '👉','iOS7': '','Hex': '1F449'}, {'iOS2': '','iOS5': '👈','iOS7': '','Hex': '1F448'}, {'iOS2': '','iOS5': '🙌','iOS7': '','Hex': '1F64C'}, {'iOS2': '','iOS5': '🙏','iOS7': '','Hex': '1F64F'}, {'iOS2': '','iOS5': '☝','iOS7': '☝️','Hex': '261D'}, {'iOS2': '','iOS5': '👏','iOS7': '','Hex': '1F44F'}, {'iOS2': '','iOS5': '💪','iOS7': '','Hex': '1F4AA'}, {'iOS2': '','iOS5': '🚶','iOS7': '','Hex': '1F6B6'}, {'iOS2': '','iOS5': '🏃','iOS7': '','Hex': '1F3C3'}, {'iOS2': '','iOS5': '💃','iOS7': '','Hex': '1F483'}, {'iOS2': '','iOS5': '👫','iOS7': '','Hex': '1F46B'}, {'iOS2': '','iOS5': '👪','iOS7': '','Hex': '1F46A'}, {'iOS2': '','iOS5': '👬','iOS7': '','Hex': '1F46C'}, {'iOS2': '','iOS5': '👭','iOS7': '','Hex': '1F46D'}, {'iOS2': '','iOS5': '💏','iOS7': '','Hex': '1F48F'}, {'iOS2': '','iOS5': '💑','iOS7': '','Hex': '1F491'}, {'iOS2': '','iOS5': '👯','iOS7': '','Hex': '1F46F'}, {'iOS2': '','iOS5': '🙆','iOS7': '','Hex': '1F646'}, {'iOS2': '','iOS5': '🙅','iOS7': '','Hex': '1F645'}, {'iOS2': '','iOS5': '💁','iOS7': '','Hex': '1F481'}, {'iOS2': '','iOS5': '🙋','iOS7': '','Hex': '1F64B'}, {'iOS2': '','iOS5': '💆','iOS7': '','Hex': '1F486'}, {'iOS2': '','iOS5': '💇','iOS7': '','Hex': '1F487'}, {'iOS2': '','iOS5': '💅','iOS7': '','Hex': '1F485'}, {'iOS2': '','iOS5': '👰','iOS7': '','Hex': '1F470'}, {'iOS2': '','iOS5': '🙎','iOS7': '','Hex': '1F64E'}, {'iOS2': '','iOS5': '🙍','iOS7': '','Hex': '1F64D'}, {'iOS2': '','iOS5': '🙇','iOS7': '','Hex': '1F647'}, {'iOS2': '','iOS5': '🎩','iOS7': '','Hex': '1F3A9'}, {'iOS2': '','iOS5': '👑','iOS7': '','Hex': '1F451'}, {'iOS2': '','iOS5': '👒','iOS7': '','Hex': '1F452'}, {'iOS2': '','iOS5': '👟','iOS7': '','Hex': '1F45F'}, {'iOS2': '','iOS5': '👞','iOS7': '','Hex': '1F45E'}, {'iOS2': '','iOS5': '👡','iOS7': '','Hex': '1F461'}, {'iOS2': '','iOS5': '👠','iOS7': '','Hex': '1F460'}, {'iOS2': '','iOS5': '👢','iOS7': '','Hex': '1F462'}, {'iOS2': '','iOS5': '👕','iOS7': '','Hex': '1F455'}, {'iOS2': '','iOS5': '👔','iOS7': '','Hex': '1F454'}, {'iOS2': '','iOS5': '👚','iOS7': '','Hex': '1F45A'}, {'iOS2': '','iOS5': '👗','iOS7': '','Hex': '1F457'}, {'iOS2': '','iOS5': '🎽','iOS7': '','Hex': '1F3BD'}, {'iOS2': '','iOS5': '👖','iOS7': '','Hex': '1F456'}, {'iOS2': '','iOS5': '👘','iOS7': '','Hex': '1F458'}, {'iOS2': '','iOS5': '👙','iOS7': '','Hex': '1F459'}, {'iOS2': '','iOS5': '💼','iOS7': '','Hex': '1F4BC'}, {'iOS2': '','iOS5': '👜','iOS7': '','Hex': '1F45C'}, {'iOS2': '','iOS5': '👝','iOS7': '','Hex': '1F45D'}, {'iOS2': '','iOS5': '👛','iOS7': '','Hex': '1F45B'}, {'iOS2': '','iOS5': '👓','iOS7': '','Hex': '1F453'}, {'iOS2': '','iOS5': '🎀','iOS7': '','Hex': '1F380'}, {'iOS2': '','iOS5': '🌂','iOS7': '','Hex': '1F302'}, {'iOS2': '','iOS5': '💄','iOS7': '','Hex': '1F484'}, {'iOS2': '','iOS5': '💛','iOS7': '','Hex': '1F49B'}, {'iOS2': '','iOS5': '💙','iOS7': '','Hex': '1F499'}, {'iOS2': '','iOS5': '💜','iOS7': '','Hex': '1F49C'}, {'iOS2': '','iOS5': '💚','iOS7': '','Hex': '1F49A'}, {'iOS2': '','iOS5': '❤','iOS7': '❤️','Hex': '2764'}, {'iOS2': '','iOS5': '💔','iOS7': '','Hex': '1F494'}, {'iOS2': '','iOS5': '💗','iOS7': '','Hex': '1F497'}, {'iOS2': '','iOS5': '💓','iOS7': '','Hex': '1F493'}, {'iOS2': '','iOS5': '💕','iOS7': '','Hex': '1F495'}, {'iOS2': '','iOS5': '💖','iOS7': '','Hex': '1F496'}, {'iOS2': '','iOS5': '💞','iOS7': '','Hex': '1F49E'}, {'iOS2': '','iOS5': '💘','iOS7': '','Hex': '1F498'}, {'iOS2': '','iOS5': '💌','iOS7': '','Hex': '1F48C'}, {'iOS2': '','iOS5': '💋','iOS7': '','Hex': '1F48B'}, {'iOS2': '','iOS5': '💍','iOS7': '','Hex': '1F48D'}, {'iOS2': '','iOS5': '💎','iOS7': '','Hex': '1F48E'}, {'iOS2': '','iOS5': '👤','iOS7': '','Hex': '1F464'}, {'iOS2': '','iOS5': '👥','iOS7': '','Hex': '1F465'}, {'iOS2': '','iOS5': '💬','iOS7': '','Hex': '1F4AC'}, {'iOS2': '','iOS5': '👣','iOS7': '','Hex': '1F463'}, {'iOS2': '','iOS5': '💭','iOS7': '','Hex': '1F4AD'}, {'iOS2': '','iOS5': '🏠','iOS7': '','Hex': '1F3E0'}, {'iOS2': '','iOS5': '🏡','iOS7': '','Hex': '1F3E1'}, {'iOS2': '','iOS5': '🏫','iOS7': '','Hex': '1F3EB'}, {'iOS2': '','iOS5': '🏢','iOS7': '','Hex': '1F3E2'}, {'iOS2': '','iOS5': '🏣','iOS7': '','Hex': '1F3E3'}, {'iOS2': '','iOS5': '🏥','iOS7': '','Hex': '1F3E5'}, {'iOS2': '','iOS5': '🏦','iOS7': '','Hex': '1F3E6'}, {'iOS2': '','iOS5': '🏪','iOS7': '','Hex': '1F3EA'}, {'iOS2': '','iOS5': '🏩','iOS7': '','Hex': '1F3E9'}, {'iOS2': '','iOS5': '🏨','iOS7': '','Hex': '1F3E8'}, {'iOS2': '','iOS5': '💒','iOS7': '','Hex': '1F492'}, {'iOS2': '','iOS5': '⛪','iOS7': '⛪️','Hex': '26EA'}, {'iOS2': '','iOS5': '🏬','iOS7': '','Hex': '1F3EC'}, {'iOS2': '','iOS5': '🏤','iOS7': '','Hex': '1F3E4'}, {'iOS2': '','iOS5': '🌇','iOS7': '','Hex': '1F307'}, {'iOS2': '','iOS5': '🌆','iOS7': '','Hex': '1F306'}, {'iOS2': '','iOS5': '🏯','iOS7': '','Hex': '1F3EF'}, {'iOS2': '','iOS5': '🏰','iOS7': '','Hex': '1F3F0'}, {'iOS2': '','iOS5': '⛺','iOS7': '⛺️','Hex': '26FA'}, {'iOS2': '','iOS5': '🏭','iOS7': '','Hex': '1F3ED'}, {'iOS2': '','iOS5': '🗼','iOS7': '','Hex': '1F5FC'}, {'iOS2': '','iOS5': '🗾','iOS7': '','Hex': '1F5FE'}, {'iOS2': '','iOS5': '🗻','iOS7': '','Hex': '1F5FB'}, {'iOS2': '','iOS5': '🌄','iOS7': '','Hex': '1F304'}, {'iOS2': '','iOS5': '🌅','iOS7': '','Hex': '1F305'}, {'iOS2': '','iOS5': '🌃','iOS7': '','Hex': '1F303'}, {'iOS2': '','iOS5': '🗽','iOS7': '','Hex': '1F5FD'}, {'iOS2': '','iOS5': '🌉','iOS7': '','Hex': '1F309'}, {'iOS2': '','iOS5': '🎠','iOS7': '','Hex': '1F3A0'}, {'iOS2': '','iOS5': '🎡','iOS7': '','Hex': '1F3A1'}, {'iOS2': '','iOS5': '⛲','iOS7': '⛲️','Hex': '26F2'}, {'iOS2': '','iOS5': '🎢','iOS7': '','Hex': '1F3A2'}, {'iOS2': '','iOS5': '🚢','iOS7': '','Hex': '1F6A2'}, {'iOS2': '','iOS5': '⛵','iOS7': '⛵️','Hex': '26F5'}, {'iOS2': '','iOS5': '🚤','iOS7': '','Hex': '1F6A4'}, {'iOS2': '','iOS5': '🚣','iOS7': '','Hex': '1F6A3'}, {'iOS2': '','iOS5': '⚓','iOS7': '⚓️','Hex': '2693'}, {'iOS2': '','iOS5': '🚀','iOS7': '','Hex': '1F680'}, {'iOS2': '','iOS5': '✈','iOS7': '✈️','Hex': '2708'}, {'iOS2': '','iOS5': '💺','iOS7': '','Hex': '1F4BA'}, {'iOS2': '','iOS5': '🚁','iOS7': '','Hex': '1F681'}, {'iOS2': '','iOS5': '🚂','iOS7': '','Hex': '1F682'}, {'iOS2': '','iOS5': '🚊','iOS7': '','Hex': '1F68A'}, {'iOS2': '','iOS5': '🚉','iOS7': '','Hex': '1F689'}, {'iOS2': '','iOS5': '🚞','iOS7': '','Hex': '1F69E'}, {'iOS2': '','iOS5': '🚆','iOS7': '','Hex': '1F686'}, {'iOS2': '','iOS5': '🚄','iOS7': '','Hex': '1F684'}, {'iOS2': '','iOS5': '🚅','iOS7': '','Hex': '1F685'}, {'iOS2': '','iOS5': '🚈','iOS7': '','Hex': '1F688'}, {'iOS2': '','iOS5': '🚇','iOS7': '','Hex': '1F687'}, {'iOS2': '','iOS5': '🚝','iOS7': '','Hex': '1F69D'}, {'iOS2': '','iOS5': '🚋','iOS7': '','Hex': '1F68B'}, {'iOS2': '','iOS5': '🚃','iOS7': '','Hex': '1F683'}, {'iOS2': '','iOS5': '🚎','iOS7': '','Hex': '1F68E'}, {'iOS2': '','iOS5': '🚌','iOS7': '','Hex': '1F68C'}, {'iOS2': '','iOS5': '🚍','iOS7': '','Hex': '1F68D'}, {'iOS2': '','iOS5': '🚙','iOS7': '','Hex': '1F699'}, {'iOS2': '','iOS5': '🚘','iOS7': '','Hex': '1F698'}, {'iOS2': '','iOS5': '🚗','iOS7': '','Hex': '1F697'}, {'iOS2': '','iOS5': '🚕','iOS7': '','Hex': '1F695'}, {'iOS2': '','iOS5': '🚖','iOS7': '','Hex': '1F696'}, {'iOS2': '','iOS5': '🚛','iOS7': '','Hex': '1F69B'}, {'iOS2': '','iOS5': '🚚','iOS7': '','Hex': '1F69A'}, {'iOS2': '','iOS5': '🚨','iOS7': '','Hex': '1F6A8'}, {'iOS2': '','iOS5': '🚓','iOS7': '','Hex': '1F693'}, {'iOS2': '','iOS5': '🚔','iOS7': '','Hex': '1F694'}, {'iOS2': '','iOS5': '🚒','iOS7': '','Hex': '1F692'}, {'iOS2': '','iOS5': '🚑','iOS7': '','Hex': '1F691'}, {'iOS2': '','iOS5': '🚐','iOS7': '','Hex': '1F690'}, {'iOS2': '','iOS5': '🚲','iOS7': '','Hex': '1F6B2'}, {'iOS2': '','iOS5': '🚡','iOS7': '','Hex': '1F6A1'}, {'iOS2': '','iOS5': '🚟','iOS7': '','Hex': '1F69F'}, {'iOS2': '','iOS5': '🚠','iOS7': '','Hex': '1F6A0'}, {'iOS2': '','iOS5': '🚜','iOS7': '','Hex': '1F69C'}, {'iOS2': '','iOS5': '💈','iOS7': '','Hex': '1F488'}, {'iOS2': '','iOS5': '🚏','iOS7': '','Hex': '1F68F'}, {'iOS2': '','iOS5': '🎫','iOS7': '','Hex': '1F3AB'}, {'iOS2': '','iOS5': '🚦','iOS7': '','Hex': '1F6A6'}, {'iOS2': '','iOS5': '🚥','iOS7': '','Hex': '1F6A5'}, {'iOS2': '','iOS5': '⚠','iOS7': '⚠️','Hex': '26A0'}, {'iOS2': '','iOS5': '🚧','iOS7': '','Hex': '1F6A7'}, {'iOS2': '','iOS5': '🔰','iOS7': '','Hex': '1F530'}, {'iOS2': '','iOS5': '⛽','iOS7': '⛽️','Hex': '26FD'}, {'iOS2': '','iOS5': '🏮','iOS7': '','Hex': '1F3EE'}, {'iOS2': '','iOS5': '🎰','iOS7': '','Hex': '1F3B0'}, {'iOS2': '','iOS5': '♨','iOS7': '♨️','Hex': '2668'}, {'iOS2': '','iOS5': '🗿','iOS7': '','Hex': '1F5FF'}, {'iOS2': '','iOS5': '🎪','iOS7': '','Hex': '1F3AA'}, {'iOS2': '','iOS5': '🎭','iOS7': '','Hex': '1F3AD'}, {'iOS2': '','iOS5': '📍','iOS7': '','Hex': '1F4CD'}, {'iOS2': '','iOS5': '🚩','iOS7': '','Hex': '1F6A9'}, {'iOS2': '','iOS5': '🇯🇵','iOS7': '','Hex': '1F1EF_1F1F5'}, {'iOS2': '','iOS5': '🇰🇷','iOS7': '','Hex': '1F1F0_1F1F7'}, {'iOS2': '','iOS5': '🇩🇪','iOS7': '','Hex': '1F1E9_1F1EA'}, {'iOS2': '','iOS5': '🇨🇳','iOS7': '','Hex': '1F1E8_1F1F3'}, {'iOS2': '','iOS5': '🇺🇸','iOS7': '','Hex': '1F1FA_1F1F8'}, {'iOS2': '','iOS5': '🇫🇷','iOS7': '','Hex': '1F1EB_1F1F7'}, {'iOS2': '','iOS5': '🇪🇸','iOS7': '','Hex': '1F1EA_1F1F8'}, {'iOS2': '','iOS5': '🇮🇹','iOS7': '','Hex': '1F1EE_1F1F9'}, {'iOS2': '','iOS5': '🇷🇺','iOS7': '','Hex': '1F1F7_1F1FA'}, {'iOS2': '','iOS5': '🇬🇧','iOS7': '','Hex': '1F1EC_1F1E7'}, {'iOS2': '','iOS5': '','iOS7': '','Hex': ''}, {'iOS2': '','iOS5': '🐶','iOS7': '','Hex': '1F436'}, {'iOS2': '','iOS5': '🐺','iOS7': '','Hex': '1F43A'}, {'iOS2': '','iOS5': '🐱','iOS7': '','Hex': '1F431'}, {'iOS2': '','iOS5': '🐭','iOS7': '','Hex': '1F42D'}, {'iOS2': '','iOS5': '🐹','iOS7': '','Hex': '1F439'}, {'iOS2': '','iOS5': '🐰','iOS7': '','Hex': '1F430'}, {'iOS2': '','iOS5': '🐸','iOS7': '','Hex': '1F438'}, {'iOS2': '','iOS5': '🐯','iOS7': '','Hex': '1F42F'}, {'iOS2': '','iOS5': '🐨','iOS7': '','Hex': '1F428'}, {'iOS2': '','iOS5': '🐻','iOS7': '','Hex': '1F43B'}, {'iOS2': '','iOS5': '🐷','iOS7': '','Hex': '1F437'}, {'iOS2': '','iOS5': '🐽','iOS7': '','Hex': '1F43D'}, {'iOS2': '','iOS5': '🐮','iOS7': '','Hex': '1F42E'}, {'iOS2': '','iOS5': '🐗','iOS7': '','Hex': '1F417'}, {'iOS2': '','iOS5': '🐵','iOS7': '','Hex': '1F435'}, {'iOS2': '','iOS5': '🐒','iOS7': '','Hex': '1F412'}, {'iOS2': '','iOS5': '🐴','iOS7': '','Hex': '1F434'}, {'iOS2': '','iOS5': '🐑','iOS7': '','Hex': '1F411'}, {'iOS2': '','iOS5': '🐘','iOS7': '','Hex': '1F418'}, {'iOS2': '','iOS5': '🐼','iOS7': '','Hex': '1F43C'}, {'iOS2': '','iOS5': '🐧','iOS7': '','Hex': '1F427'}, {'iOS2': '','iOS5': '🐦','iOS7': '','Hex': '1F426'}, {'iOS2': '','iOS5': '🐤','iOS7': '','Hex': '1F424'}, {'iOS2': '','iOS5': '🐥','iOS7': '','Hex': '1F425'}, {'iOS2': '','iOS5': '🐣','iOS7': '','Hex': '1F423'}, {'iOS2': '','iOS5': '🐔','iOS7': '','Hex': '1F414'}, {'iOS2': '','iOS5': '🐍','iOS7': '','Hex': '1F40D'}, {'iOS2': '','iOS5': '🐢','iOS7': '','Hex': '1F422'}, {'iOS2': '','iOS5': '🐛','iOS7': '','Hex': '1F41B'}, {'iOS2': '','iOS5': '🐝','iOS7': '','Hex': '1F41D'}, {'iOS2': '','iOS5': '🐜','iOS7': '','Hex': '1F41C'}, {'iOS2': '','iOS5': '🐞','iOS7': '','Hex': '1F41E'}, {'iOS2': '','iOS5': '🐌','iOS7': '','Hex': '1F40C'}, {'iOS2': '','iOS5': '🐙','iOS7': '','Hex': '1F419'}, {'iOS2': '','iOS5': '🐚','iOS7': '','Hex': '1F41A'}, {'iOS2': '','iOS5': '🐠','iOS7': '','Hex': '1F420'}, {'iOS2': '','iOS5': '🐟','iOS7': '','Hex': '1F41F'}, {'iOS2': '','iOS5': '🐬','iOS7': '','Hex': '1F42C'}, {'iOS2': '','iOS5': '🐳','iOS7': '','Hex': '1F433'}, {'iOS2': '','iOS5': '🐋','iOS7': '','Hex': '1F40B'}, {'iOS2': '','iOS5': '🐄','iOS7': '','Hex': '1F404'}, {'iOS2': '','iOS5': '🐏','iOS7': '','Hex': '1F40F'}, {'iOS2': '','iOS5': '🐀','iOS7': '','Hex': '1F400'}, {'iOS2': '','iOS5': '🐃','iOS7': '','Hex': '1F403'}, {'iOS2': '','iOS5': '🐅','iOS7': '','Hex': '1F405'}, {'iOS2': '','iOS5': '🐇','iOS7': '','Hex': '1F407'}, {'iOS2': '','iOS5': '🐉','iOS7': '','Hex': '1F409'}, {'iOS2': '','iOS5': '🐎','iOS7': '','Hex': '1F40E'}, {'iOS2': '','iOS5': '🐐','iOS7': '','Hex': '1F410'}, {'iOS2': '','iOS5': '🐓','iOS7': '','Hex': '1F413'}, {'iOS2': '','iOS5': '🐕','iOS7': '','Hex': '1F415'}, {'iOS2': '','iOS5': '🐖','iOS7': '','Hex': '1F416'}, {'iOS2': '','iOS5': '🐁','iOS7': '','Hex': '1F401'}, {'iOS2': '','iOS5': '🐂','iOS7': '','Hex': '1F402'}, {'iOS2': '','iOS5': '🐲','iOS7': '','Hex': '1F432'}, {'iOS2': '','iOS5': '🐡','iOS7': '','Hex': '1F421'}, {'iOS2': '','iOS5': '🐊','iOS7': '','Hex': '1F40A'}, {'iOS2': '','iOS5': '🐫','iOS7': '','Hex': '1F42B'}, {'iOS2': '','iOS5': '🐪','iOS7': '','Hex': '1F42A'}, {'iOS2': '','iOS5': '🐆','iOS7': '','Hex': '1F406'}, {'iOS2': '','iOS5': '🐈','iOS7': '','Hex': '1F408'}, {'iOS2': '','iOS5': '🐩','iOS7': '','Hex': '1F429'}, {'iOS2': '','iOS5': '🐾','iOS7': '','Hex': '1F43E'}, {'iOS2': '','iOS5': '💐','iOS7': '','Hex': '1F490'}, {'iOS2': '','iOS5': '🌸','iOS7': '','Hex': '1F338'}, {'iOS2': '','iOS5': '🌷','iOS7': '','Hex': '1F337'}, {'iOS2': '','iOS5': '🍀','iOS7': '','Hex': '1F340'}, {'iOS2': '','iOS5': '🌹','iOS7': '','Hex': '1F339'}, {'iOS2': '','iOS5': '🌻','iOS7': '','Hex': '1F33B'}, {'iOS2': '','iOS5': '🌺','iOS7': '','Hex': '1F33A'}, {'iOS2': '','iOS5': '🍁','iOS7': '','Hex': '1F341'}, {'iOS2': '','iOS5': '🍃','iOS7': '','Hex': '1F343'}, {'iOS2': '','iOS5': '🍂','iOS7': '','Hex': '1F342'}, {'iOS2': '','iOS5': '🌿','iOS7': '','Hex': '1F33F'}, {'iOS2': '','iOS5': '🌾','iOS7': '','Hex': '1F33E'}, {'iOS2': '','iOS5': '🍄','iOS7': '','Hex': '1F344'}, {'iOS2': '','iOS5': '🌵','iOS7': '','Hex': '1F335'}, {'iOS2': '','iOS5': '🌴','iOS7': '','Hex': '1F334'}, {'iOS2': '','iOS5': '🌲','iOS7': '','Hex': '1F332'}, {'iOS2': '','iOS5': '🌳','iOS7': '','Hex': '1F333'}, {'iOS2': '','iOS5': '🌰','iOS7': '','Hex': '1F330'}, {'iOS2': '','iOS5': '🌱','iOS7': '','Hex': '1F331'}, {'iOS2': '','iOS5': '🌼','iOS7': '','Hex': '1F33C'}, {'iOS2': '','iOS5': '🌐','iOS7': '','Hex': '1F310'}, {'iOS2': '','iOS5': '🌞','iOS7': '','Hex': '1F31E'}, {'iOS2': '','iOS5': '🌝','iOS7': '','Hex': '1F31D'}, {'iOS2': '','iOS5': '🌚','iOS7': '','Hex': '1F31A'}, {'iOS2': '','iOS5': '🌑','iOS7': '','Hex': '1F311'}, {'iOS2': '','iOS5': '🌒','iOS7': '','Hex': '1F312'}, {'iOS2': '','iOS5': '🌓','iOS7': '','Hex': '1F313'}, {'iOS2': '','iOS5': '🌔','iOS7': '','Hex': '1F314'}, {'iOS2': '','iOS5': '🌕','iOS7': '','Hex': '1F315'}, {'iOS2': '','iOS5': '🌖','iOS7': '','Hex': '1F316'}, {'iOS2': '','iOS5': '🌗','iOS7': '','Hex': '1F317'}, {'iOS2': '','iOS5': '🌘','iOS7': '','Hex': '1F318'}, {'iOS2': '','iOS5': '🌜','iOS7': '','Hex': '1F31C'}, {'iOS2': '','iOS5': '🌛','iOS7': '','Hex': '1F31B'}, {'iOS2': '','iOS5': '🌙','iOS7': '','Hex': '1F319'}, {'iOS2': '','iOS5': '🌍','iOS7': '','Hex': '1F30D'}, {'iOS2': '','iOS5': '🌎','iOS7': '','Hex': '1F30E'}, {'iOS2': '','iOS5': '🌏','iOS7': '','Hex': '1F30F'}, {'iOS2': '','iOS5': '🌋','iOS7': '','Hex': '1F30B'}, {'iOS2': '','iOS5': '🌌','iOS7': '','Hex': '1F30C'}, {'iOS2': '','iOS5': '🌠','iOS7': '','Hex': '1F320'}, {'iOS2': '','iOS5': '⭐','iOS7': '⭐️','Hex': '2B50'}, {'iOS2': '','iOS5': '☀','iOS7': '☀️','Hex': '2600'}, {'iOS2': '','iOS5': '⛅','iOS7': '⛅️','Hex': '26C5'}, {'iOS2': '','iOS5': '☁','iOS7': '☁️','Hex': '2601'}, {'iOS2': '','iOS5': '⚡','iOS7': '⚡️','Hex': '26A1'}, {'iOS2': '','iOS5': '☔','iOS7': '☔️','Hex': '2614'}, {'iOS2': '','iOS5': '❄','iOS7': '❄️','Hex': '2744'}, {'iOS2': '','iOS5': '⛄','iOS7': '⛄️','Hex': '26C4'}, {'iOS2': '','iOS5': '🌀','iOS7': '🌀','Hex': '1F300'}, {'iOS2': '','iOS5': '🌁','iOS7': '','Hex': '1F301'}, {'iOS2': '','iOS5': '🌈','iOS7': '','Hex': '1F308'}, {'iOS2': '','iOS5': '🌊','iOS7': '','Hex': '1F30A'}, {'iOS2': '','iOS5': '🎍','iOS7': '','Hex': '1F38D'}, {'iOS2': '','iOS5': '💝','iOS7': '','Hex': '1F49D'}, {'iOS2': '','iOS5': '🎎','iOS7': '','Hex': '1F38E'}, {'iOS2': '','iOS5': '🎒','iOS7': '','Hex': '1F392'}, {'iOS2': '','iOS5': '🎓','iOS7': '','Hex': '1F393'}, {'iOS2': '','iOS5': '🎏','iOS7': '','Hex': '1F38F'}, {'iOS2': '','iOS5': '🎆','iOS7': '','Hex': '1F386'}, {'iOS2': '','iOS5': '🎇','iOS7': '','Hex': '1F387'}, {'iOS2': '','iOS5': '🎐','iOS7': '','Hex': '1F390'}, {'iOS2': '','iOS5': '🎑','iOS7': '','Hex': '1F391'}, {'iOS2': '','iOS5': '🎃','iOS7': '','Hex': '1F383'}, {'iOS2': '','iOS5': '👻','iOS7': '','Hex': '1F47B'}, {'iOS2': '','iOS5': '🎅','iOS7': '','Hex': '1F385'}, {'iOS2': '','iOS5': '🎄','iOS7': '','Hex': '1F384'}, {'iOS2': '','iOS5': '🎁','iOS7': '','Hex': '1F381'}, {'iOS2': '','iOS5': '🎋','iOS7': '','Hex': '1F38B'}, {'iOS2': '','iOS5': '🎉','iOS7': '','Hex': '1F389'}, {'iOS2': '','iOS5': '🎊','iOS7': '','Hex': '1F38A'}, {'iOS2': '','iOS5': '🎈','iOS7': '','Hex': '1F388'}, {'iOS2': '','iOS5': '🎌','iOS7': '','Hex': '1F38C'}, {'iOS2': '','iOS5': '🔮','iOS7': '','Hex': '1F52E'}, {'iOS2': '','iOS5': '🎥','iOS7': '','Hex': '1F3A5'}, {'iOS2': '','iOS5': '📷','iOS7': '','Hex': '1F4F7'}, {'iOS2': '','iOS5': '📹','iOS7': '','Hex': '1F4F9'}, {'iOS2': '','iOS5': '📼','iOS7': '','Hex': '1F4FC'}, {'iOS2': '','iOS5': '💿','iOS7': '','Hex': '1F4BF'}, {'iOS2': '','iOS5': '📀','iOS7': '','Hex': '1F4C0'}, {'iOS2': '','iOS5': '💽','iOS7': '','Hex': '1F4BD'}, {'iOS2': '','iOS5': '💾','iOS7': '','Hex': '1F4BE'}, {'iOS2': '','iOS5': '💻','iOS7': '','Hex': '1F4BB'}, {'iOS2': '','iOS5': '📱','iOS7': '','Hex': '1F4F1'}, {'iOS2': '','iOS5': '☎','iOS7': '☎️','Hex': '260E'}, {'iOS2': '','iOS5': '📞','iOS7': '','Hex': '1F4DE'}, {'iOS2': '','iOS5': '📟','iOS7': '','Hex': '1F4DF'}, {'iOS2': '','iOS5': '📠','iOS7': '','Hex': '1F4E0'}, {'iOS2': '','iOS5': '📡','iOS7': '','Hex': '1F4E1'}, {'iOS2': '','iOS5': '📺','iOS7': '','Hex': '1F4FA'}, {'iOS2': '','iOS5': '📻','iOS7': '','Hex': '1F4FB'}, {'iOS2': '','iOS5': '🔊','iOS7': '','Hex': '1F50A'}, {'iOS2': '','iOS5': '🔉','iOS7': '','Hex': '1F509'}, {'iOS2': '','iOS5': '🔈','iOS7': '','Hex': '1F508'}, {'iOS2': '','iOS5': '🔇','iOS7': '','Hex': '1F507'}, {'iOS2': '','iOS5': '🔔','iOS7': '','Hex': '1F514'}, {'iOS2': '','iOS5': '🔕','iOS7': '','Hex': '1F515'}, {'iOS2': '','iOS5': '📢','iOS7': '','Hex': '1F4E2'}, {'iOS2': '','iOS5': '📣','iOS7': '','Hex': '1F4E3'}, {'iOS2': '','iOS5': '⏳','iOS7': '','Hex': '23F3'}, {'iOS2': '','iOS5': '⌛','iOS7': '⌛️','Hex': '231B'}, {'iOS2': '','iOS5': '⏰','iOS7': '⏰','Hex': '23F0'}, {'iOS2': '','iOS5': '⌚','iOS7': '⌚️','Hex': '231A'}, {'iOS2': '','iOS5': '🔓','iOS7': '','Hex': '1F513'}, {'iOS2': '','iOS5': '🔒','iOS7': '','Hex': '1F512'}, {'iOS2': '','iOS5': '🔏','iOS7': '','Hex': '1F50F'}, {'iOS2': '','iOS5': '🔐','iOS7': '','Hex': '1F510'}, {'iOS2': '','iOS5': '🔑','iOS7': '','Hex': '1F511'}, {'iOS2': '','iOS5': '🔎','iOS7': '','Hex': '1F50E'}, {'iOS2': '','iOS5': '💡','iOS7': '','Hex': '1F4A1'}, {'iOS2': '','iOS5': '🔦','iOS7': '','Hex': '1F526'}, {'iOS2': '','iOS5': '🔆','iOS7': '','Hex': '1F506'}, {'iOS2': '','iOS5': '🔅','iOS7': '','Hex': '1F505'}, {'iOS2': '','iOS5': '🔌','iOS7': '','Hex': '1F50C'}, {'iOS2': '','iOS5': '🔋','iOS7': '','Hex': '1F50B'}, {'iOS2': '','iOS5': '🔍','iOS7': '','Hex': '1F50D'}, {'iOS2': '','iOS5': '🛁','iOS7': '','Hex': '1F6C1'}, {'iOS2': '','iOS5': '🛀','iOS7': '','Hex': '1F6C0'}, {'iOS2': '','iOS5': '🚿','iOS7': '','Hex': '1F6BF'}, {'iOS2': '','iOS5': '🚽','iOS7': '','Hex': '1F6BD'}, {'iOS2': '','iOS5': '🔧','iOS7': '','Hex': '1F527'}, {'iOS2': '','iOS5': '🔩','iOS7': '','Hex': '1F529'}, {'iOS2': '','iOS5': '🔨','iOS7': '','Hex': '1F528'}, {'iOS2': '','iOS5': '🚪','iOS7': '','Hex': '1F6AA'}, {'iOS2': '','iOS5': '🚬','iOS7': '','Hex': '1F6AC'}, {'iOS2': '','iOS5': '💣','iOS7': '','Hex': '1F4A3'}, {'iOS2': '','iOS5': '🔫','iOS7': '','Hex': '1F52B'}, {'iOS2': '','iOS5': '🔪','iOS7': '','Hex': '1F52A'}, {'iOS2': '','iOS5': '💊','iOS7': '','Hex': '1F48A'}, {'iOS2': '','iOS5': '💉','iOS7': '','Hex': '1F489'}, {'iOS2': '','iOS5': '💰','iOS7': '','Hex': '1F4B0'}, {'iOS2': '','iOS5': '💴','iOS7': '','Hex': '1F4B4'}, {'iOS2': '','iOS5': '💵','iOS7': '','Hex': '1F4B5'}, {'iOS2': '','iOS5': '💷','iOS7': '','Hex': '1F4B7'}, {'iOS2': '','iOS5': '💶','iOS7': '','Hex': '1F4B6'}, {'iOS2': '','iOS5': '💳','iOS7': '','Hex': '1F4B3'}, {'iOS2': '','iOS5': '💸','iOS7': '','Hex': '1F4B8'}, {'iOS2': '','iOS5': '📲','iOS7': '','Hex': '1F4F2'}, {'iOS2': '','iOS5': '📧','iOS7': '','Hex': '1F4E7'}, {'iOS2': '','iOS5': '📥','iOS7': '','Hex': '1F4E5'}, {'iOS2': '','iOS5': '📤','iOS7': '','Hex': '1F4E4'}, {'iOS2': '','iOS5': '✉','iOS7': '✉️','Hex': '2709'}, {'iOS2': '','iOS5': '📩','iOS7': '','Hex': '1F4E9'}, {'iOS2': '','iOS5': '📨','iOS7': '','Hex': '1F4E8'}, {'iOS2': '','iOS5': '📯','iOS7': '','Hex': '1F4EF'}, {'iOS2': '','iOS5': '📫','iOS7': '','Hex': '1F4EB'}, {'iOS2': '','iOS5': '📪','iOS7': '','Hex': '1F4EA'}, {'iOS2': '','iOS5': '📬','iOS7': '','Hex': '1F4EC'}, {'iOS2': '','iOS5': '📭','iOS7': '','Hex': '1F4ED'}, {'iOS2': '','iOS5': '📮','iOS7': '','Hex': '1F4EE'}, {'iOS2': '','iOS5': '📦','iOS7': '','Hex': '1F4E6'}, {'iOS2': '','iOS5': '📝','iOS7': '','Hex': '1F4DD'}, {'iOS2': '','iOS5': '📄','iOS7': '','Hex': '1F4C4'}, {'iOS2': '','iOS5': '📃','iOS7': '','Hex': '1F4C3'}, {'iOS2': '','iOS5': '📑','iOS7': '','Hex': '1F4D1'}, {'iOS2': '','iOS5': '📊','iOS7': '','Hex': '1F4CA'}, {'iOS2': '','iOS5': '📈','iOS7': '','Hex': '1F4C8'}, {'iOS2': '','iOS5': '📉','iOS7': '','Hex': '1F4C9'}, {'iOS2': '','iOS5': '📜','iOS7': '','Hex': '1F4DC'}, {'iOS2': '','iOS5': '📋','iOS7': '','Hex': '1F4CB'}, {'iOS2': '','iOS5': '📅','iOS7': '','Hex': '1F4C5'}, {'iOS2': '','iOS5': '📆','iOS7': '','Hex': '1F4C6'}, {'iOS2': '','iOS5': '📇','iOS7': '','Hex': '1F4C7'}, {'iOS2': '','iOS5': '📁','iOS7': '','Hex': '1F4C1'}, {'iOS2': '','iOS5': '📂','iOS7': '','Hex': '1F4C2'}, {'iOS2': '','iOS5': '✂','iOS7': '✂️','Hex': '2702'}, {'iOS2': '','iOS5': '📌','iOS7': '','Hex': '1F4CC'}, {'iOS2': '','iOS5': '📎','iOS7': '','Hex': '1F4CE'}, {'iOS2': '','iOS5': '✒','iOS7': '✒️','Hex': '2712'}, {'iOS2': '','iOS5': '✏','iOS7': '✏️','Hex': '270F'}, {'iOS2': '','iOS5': '📏','iOS7': '','Hex': '1F4CF'}, {'iOS2': '','iOS5': '📐','iOS7': '','Hex': '1F4D0'}, {'iOS2': '','iOS5': '📕','iOS7': '','Hex': '1F4D5'}, {'iOS2': '','iOS5': '📗','iOS7': '','Hex': '1F4D7'}, {'iOS2': '','iOS5': '📘','iOS7': '','Hex': '1F4D8'}, {'iOS2': '','iOS5': '📙','iOS7': '','Hex': '1F4D9'}, {'iOS2': '','iOS5': '📓','iOS7': '','Hex': '1F4D3'}, {'iOS2': '','iOS5': '📔','iOS7': '','Hex': '1F4D4'}, {'iOS2': '','iOS5': '📒','iOS7': '','Hex': '1F4D2'}, {'iOS2': '','iOS5': '📚','iOS7': '','Hex': '1F4DA'}, {'iOS2': '','iOS5': '📖','iOS7': '','Hex': '1F4D6'}, {'iOS2': '','iOS5': '🔖','iOS7': '','Hex': '1F516'}, {'iOS2': '','iOS5': '📛','iOS7': '','Hex': '1F4DB'}, {'iOS2': '','iOS5': '🔬','iOS7': '','Hex': '1F52C'}, {'iOS2': '','iOS5': '🔭','iOS7': '','Hex': '1F52D'}, {'iOS2': '','iOS5': '📰','iOS7': '','Hex': '1F4F0'}, {'iOS2': '','iOS5': '🎨','iOS7': '','Hex': '1F3A8'}, {'iOS2': '','iOS5': '🎬','iOS7': '','Hex': '1F3AC'}, {'iOS2': '','iOS5': '🎤','iOS7': '','Hex': '1F3A4'}, {'iOS2': '','iOS5': '🎧','iOS7': '','Hex': '1F3A7'}, {'iOS2': '','iOS5': '🎼','iOS7': '','Hex': '1F3BC'}, {'iOS2': '','iOS5': '🎵','iOS7': '','Hex': '1F3B5'}, {'iOS2': '','iOS5': '🎶','iOS7': '','Hex': '1F3B6'}, {'iOS2': '','iOS5': '🎹','iOS7': '','Hex': '1F3B9'}, {'iOS2': '','iOS5': '🎻','iOS7': '','Hex': '1F3BB'}, {'iOS2': '','iOS5': '🎺','iOS7': '','Hex': '1F3BA'}, {'iOS2': '','iOS5': '🎷','iOS7': '','Hex': '1F3B7'}, {'iOS2': '','iOS5': '🎸','iOS7': '','Hex': '1F3B8'}, {'iOS2': '','iOS5': '👾','iOS7': '','Hex': '1F47E'}, {'iOS2': '','iOS5': '🎮','iOS7': '','Hex': '1F3AE'}, {'iOS2': '','iOS5': '🃏','iOS7': '','Hex': '1F0CF'}, {'iOS2': '','iOS5': '🎴','iOS7': '','Hex': '1F3B4'}, {'iOS2': '','iOS5': '🀄','iOS7': '🀄️','Hex': '1F004'}, {'iOS2': '','iOS5': '🎲','iOS7': '','Hex': '1F3B2'}, {'iOS2': '','iOS5': '🎯','iOS7': '','Hex': '1F3AF'}, {'iOS2': '','iOS5': '🏈','iOS7': '','Hex': '1F3C8'}, {'iOS2': '','iOS5': '🏀','iOS7': '','Hex': '1F3C0'}, {'iOS2': '','iOS5': '⚽','iOS7': '⚽️','Hex': '26BD'}, {'iOS2': '','iOS5': '⚾','iOS7': '⚾️','Hex': '26BE'}, {'iOS2': '','iOS5': '🎾','iOS7': '','Hex': '1F3BE'}, {'iOS2': '','iOS5': '🎱','iOS7': '','Hex': '1F3B1'}, {'iOS2': '','iOS5': '🏉','iOS7': '','Hex': '1F3C9'}, {'iOS2': '','iOS5': '🎳','iOS7': '','Hex': '1F3B3'}, {'iOS2': '','iOS5': '⛳','iOS7': '⛳️','Hex': '26F3'}, {'iOS2': '','iOS5': '🚵','iOS7': '','Hex': '1F6B5'}, {'iOS2': '','iOS5': '🚴','iOS7': '','Hex': '1F6B4'}, {'iOS2': '','iOS5': '🏁','iOS7': '','Hex': '1F3C1'}, {'iOS2': '','iOS5': '🏇','iOS7': '','Hex': '1F3C7'}, {'iOS2': '','iOS5': '🏆','iOS7': '','Hex': '1F3C6'}, {'iOS2': '','iOS5': '🎿','iOS7': '','Hex': '1F3BF'}, {'iOS2': '','iOS5': '🏂','iOS7': '','Hex': '1F3C2'}, {'iOS2': '','iOS5': '🏊','iOS7': '','Hex': '1F3CA'}, {'iOS2': '','iOS5': '🏄','iOS7': '','Hex': '1F3C4'}, {'iOS2': '','iOS5': '🎣','iOS7': '','Hex': '1F3A3'}, {'iOS2': '','iOS5': '☕','iOS7': '☕️','Hex': '2615'}, {'iOS2': '','iOS5': '🍵','iOS7': '','Hex': '1F375'}, {'iOS2': '','iOS5': '🍶','iOS7': '','Hex': '1F376'}, {'iOS2': '','iOS5': '🍼','iOS7': '','Hex': '1F37C'}, {'iOS2': '','iOS5': '🍺','iOS7': '','Hex': '1F37A'}, {'iOS2': '','iOS5': '🍻','iOS7': '','Hex': '1F37B'}, {'iOS2': '','iOS5': '🍸','iOS7': '','Hex': '1F378'}, {'iOS2': '','iOS5': '🍹','iOS7': '','Hex': '1F379'}, {'iOS2': '','iOS5': '🍷','iOS7': '','Hex': '1F377'}, {'iOS2': '','iOS5': '🍴','iOS7': '','Hex': '1F374'}, {'iOS2': '','iOS5': '🍕','iOS7': '','Hex': '1F355'}, {'iOS2': '','iOS5': '🍔','iOS7': '','Hex': '1F354'}, {'iOS2': '','iOS5': '🍟','iOS7': '','Hex': '1F35F'}, {'iOS2': '','iOS5': '🍗','iOS7': '','Hex': '1F357'}, {'iOS2': '','iOS5': '🍖','iOS7': '','Hex': '1F356'}, {'iOS2': '','iOS5': '🍝','iOS7': '','Hex': '1F35D'}, {'iOS2': '','iOS5': '🍛','iOS7': '','Hex': '1F35B'}, {'iOS2': '','iOS5': '🍤','iOS7': '','Hex': '1F364'}, {'iOS2': '','iOS5': '🍱','iOS7': '','Hex': '1F371'}, {'iOS2': '','iOS5': '🍣','iOS7': '','Hex': '1F363'}, {'iOS2': '','iOS5': '🍥','iOS7': '','Hex': '1F365'}, {'iOS2': '','iOS5': '🍙','iOS7': '','Hex': '1F359'}, {'iOS2': '','iOS5': '🍘','iOS7': '','Hex': '1F358'}, {'iOS2': '','iOS5': '🍚','iOS7': '','Hex': '1F35A'}, {'iOS2': '','iOS5': '🍜','iOS7': '','Hex': '1F35C'}, {'iOS2': '','iOS5': '🍲','iOS7': '','Hex': '1F372'}, {'iOS2': '','iOS5': '🍢','iOS7': '','Hex': '1F362'}, {'iOS2': '','iOS5': '🍡','iOS7': '','Hex': '1F361'}, {'iOS2': '','iOS5': '🍳','iOS7': '','Hex': '1F373'}, {'iOS2': '','iOS5': '🍞','iOS7': '','Hex': '1F35E'}, {'iOS2': '','iOS5': '🍩','iOS7': '','Hex': '1F369'}, {'iOS2': '','iOS5': '🍮','iOS7': '','Hex': '1F36E'}, {'iOS2': '','iOS5': '🍦','iOS7': '','Hex': '1F366'}, {'iOS2': '','iOS5': '🍨','iOS7': '','Hex': '1F368'}, {'iOS2': '','iOS5': '🍧','iOS7': '','Hex': '1F367'}, {'iOS2': '','iOS5': '🎂','iOS7': '','Hex': '1F382'}, {'iOS2': '','iOS5': '🍰','iOS7': '','Hex': '1F370'}, {'iOS2': '','iOS5': '🍪','iOS7': '','Hex': '1F36A'}, {'iOS2': '','iOS5': '🍫','iOS7': '','Hex': '1F36B'}, {'iOS2': '','iOS5': '🍬','iOS7': '','Hex': '1F36C'}, {'iOS2': '','iOS5': '🍭','iOS7': '','Hex': '1F36D'}, {'iOS2': '','iOS5': '🍯','iOS7': '','Hex': '1F36F'}, {'iOS2': '','iOS5': '🍎','iOS7': '','Hex': '1F34E'}, {'iOS2': '','iOS5': '🍏','iOS7': '','Hex': '1F34F'}, {'iOS2': '','iOS5': '🍊','iOS7': '','Hex': '1F34A'}, {'iOS2': '','iOS5': '🍋','iOS7': '','Hex': '1F34B'}, {'iOS2': '','iOS5': '🍒','iOS7': '','Hex': '1F352'}, {'iOS2': '','iOS5': '🍇','iOS7': '','Hex': '1F347'}, {'iOS2': '','iOS5': '🍉','iOS7': '','Hex': '1F349'}, {'iOS2': '','iOS5': '🍓','iOS7': '','Hex': '1F353'}, {'iOS2': '','iOS5': '🍑','iOS7': '','Hex': '1F351'}, {'iOS2': '','iOS5': '🍈','iOS7': '','Hex': '1F348'}, {'iOS2': '','iOS5': '🍌','iOS7': '','Hex': '1F34C'}, {'iOS2': '','iOS5': '🍐','iOS7': '','Hex': '1F350'}, {'iOS2': '','iOS5': '🍍','iOS7': '','Hex': '1F34D'}, {'iOS2': '','iOS5': '🍠','iOS7': '','Hex': '1F360'}, {'iOS2': '','iOS5': '🍆','iOS7': '','Hex': '1F346'}, {'iOS2': '','iOS5': '🍅','iOS7': '','Hex': '1F345'}, {'iOS2': '','iOS5': '🌽','iOS7': '','Hex': '1F33D'}, {'iOS2': '','iOS5': '1⃣','iOS7': '','Hex': '0031_20E3'}, {'iOS2': '','iOS5': '2⃣','iOS7': '','Hex': '0032_20E3'}, {'iOS2': '','iOS5': '3⃣','iOS7': '','Hex': '0033_20E3'}, {'iOS2': '','iOS5': '4⃣','iOS7': '','Hex': '0034_20E3'}, {'iOS2': '','iOS5': '2⃣','iOS7': '','Hex': '0032_20E3'}, {'iOS2': '','iOS5': '0⃣','iOS7': '','Hex': '0030_20E3'}, {'iOS2': '','iOS5': '5⃣','iOS7': '','Hex': '0035_20E3'}, {'iOS2': '','iOS5': '6⃣','iOS7': '','Hex': '0036_20E3'}, {'iOS2': '','iOS5': '7⃣','iOS7': '','Hex': '0037_20E3'}, {'iOS2': '','iOS5': '8⃣','iOS7': '','Hex': '0038_20E3'}, {'iOS2': '','iOS5': '9⃣','iOS7': '','Hex': '0039_20E3'}, {'iOS2': '','iOS5': '🔟','iOS7': '','Hex': '1F51F'}, {'iOS2': '','iOS5': '🔢','iOS7': '','Hex': '1F522'}, {'iOS2': '','iOS5': '#⃣','iOS7': '','Hex': '0023_20E3'}, {'iOS2': '','iOS5': '🔣','iOS7': '','Hex': '1F523'}, {'iOS2': '','iOS5': '⬆','iOS7': '⬆️','Hex': '2B06'}, {'iOS2': '','iOS5': '⬇','iOS7': '⬇️','Hex': '2B07'}, {'iOS2': '','iOS5': '⬅','iOS7': '⬅️','Hex': '2B05'}, {'iOS2': '','iOS5': '➡','iOS7': '➡️','Hex': '27A1'}, {'iOS2': '','iOS5': '🔠','iOS7': '','Hex': '1F520'}, {'iOS2': '','iOS5': '🔡','iOS7': '','Hex': '1F521'}, {'iOS2': '','iOS5': '🔤','iOS7': '','Hex': '1F524'}, {'iOS2': '','iOS5': '↗','iOS7': '↗️','Hex': '2197'}, {'iOS2': '','iOS5': '↖','iOS7': '↖️','Hex': '2196'}, {'iOS2': '','iOS5': '↘','iOS7': '↘️','Hex': '2198'}, {'iOS2': '','iOS5': '↙','iOS7': '↙️','Hex': '2199'}, {'iOS2': '','iOS5': '↔','iOS7': '↔️','Hex': '2194'}, {'iOS2': '','iOS5': '↕','iOS7': '↕️','Hex': '2195'}, {'iOS2': '','iOS5': '🔄','iOS7': '','Hex': '1F504'}, {'iOS2': '','iOS5': '◀','iOS7': '◀️','Hex': '25C0'}, {'iOS2': '','iOS5': '▶','iOS7': '▶️','Hex': '25B6'}, {'iOS2': '','iOS5': '🔼','iOS7': '','Hex': '1F53C'}, {'iOS2': '','iOS5': '🔽','iOS7': '','Hex': '1F53D'}, {'iOS2': '','iOS5': '↩','iOS7': '↩️','Hex': '21A9'}, {'iOS2': '','iOS5': '↪','iOS7': '↪️','Hex': '21AA'}, {'iOS2': '','iOS5': 'ℹ','iOS7': 'ℹ️','Hex': '2139'}, {'iOS2': '','iOS5': '⏪','iOS7': '','Hex': '23EA'}, {'iOS2': '','iOS5': '⏩','iOS7': '','Hex': '23E9'}, {'iOS2': '','iOS5': '⏫','iOS7': '','Hex': '23EB'}, {'iOS2': '','iOS5': '⏬','iOS7': '','Hex': '23EC'}, {'iOS2': '','iOS5': '⤵','iOS7': '⤵️','Hex': '2935'}, {'iOS2': '','iOS5': '⤴','iOS7': '⤴️','Hex': '2934'}, {'iOS2': '','iOS5': '🆗','iOS7': '','Hex': '1F197'}, {'iOS2': '','iOS5': '🔀','iOS7': '','Hex': '1F500'}, {'iOS2': '','iOS5': '🔁','iOS7': '','Hex': '1F501'}, {'iOS2': '','iOS5': '🔂','iOS7': '','Hex': '1F502'}, {'iOS2': '','iOS5': '🆕','iOS7': '','Hex': '1F195'}, {'iOS2': '','iOS5': '🆙','iOS7': '','Hex': '1F199'}, {'iOS2': '','iOS5': '🆒','iOS7': '','Hex': '1F192'}, {'iOS2': '','iOS5': '🆓','iOS7': '','Hex': '1F193'}, {'iOS2': '','iOS5': '🆖','iOS7': '','Hex': '1F196'}, {'iOS2': '','iOS5': '📶','iOS7': '','Hex': '1F4F6'}, {'iOS2': '','iOS5': '🎦','iOS7': '','Hex': '1F3A6'}, {'iOS2': '','iOS5': '🈁','iOS7': '','Hex': '1F201'}, {'iOS2': '','iOS5': '🈯','iOS7': '🈯️','Hex': '1F22F'}, {'iOS2': '','iOS5': '🈳','iOS7': '','Hex': '1F233'}, {'iOS2': '','iOS5': '🈵','iOS7': '','Hex': '1F235'}, {'iOS2': '','iOS5': '🈴','iOS7': '','Hex': '1F234'}, {'iOS2': '','iOS5': '🈲','iOS7': '','Hex': '1F232'}, {'iOS2': '','iOS5': '🉐','iOS7': '','Hex': '1F250'}, {'iOS2': '','iOS5': '🈹','iOS7': '','Hex': '1F239'}, {'iOS2': '','iOS5': '🈺','iOS7': '','Hex': '1F23A'}, {'iOS2': '','iOS5': '🈶','iOS7': '','Hex': '1F236'}, {'iOS2': '','iOS5': '🈚','iOS7': '🈚️','Hex': '1F21A'}, {'iOS2': '','iOS5': '🚻','iOS7': '','Hex': '1F6BB'}, {'iOS2': '','iOS5': '🚹','iOS7': '','Hex': '1F6B9'}, {'iOS2': '','iOS5': '🚺','iOS7': '','Hex': '1F6BA'}, {'iOS2': '','iOS5': '🚼','iOS7': '','Hex': '1F6BC'}, {'iOS2': '','iOS5': '🚾','iOS7': '','Hex': '1F6BE'}, {'iOS2': '','iOS5': '🚰','iOS7': '','Hex': '1F6B0'}, {'iOS2': '','iOS5': '🚮','iOS7': '','Hex': '1F6AE'}, {'iOS2': '','iOS5': '🅿','iOS7': '🅿️','Hex': '1F17F'}, {'iOS2': '','iOS5': '♿','iOS7': '♿️','Hex': '267F'}, {'iOS2': '','iOS5': '🚭','iOS7': '','Hex': '1F6AD'}, {'iOS2': '','iOS5': '🈷','iOS7': '','Hex': '1F237'}, {'iOS2': '','iOS5': '🈸','iOS7': '','Hex': '1F238'}, {'iOS2': '','iOS5': '🈂','iOS7': '','Hex': '1F202'}, {'iOS2': '','iOS5': 'Ⓜ','iOS7': 'Ⓜ️','Hex': '24C2'}, {'iOS2': '','iOS5': '🛂','iOS7': '','Hex': '1F6C2'}, {'iOS2': '','iOS5': '🛄','iOS7': '','Hex': '1F6C4'}, {'iOS2': '','iOS5': '🛅','iOS7': '','Hex': '1F6C5'}, {'iOS2': '','iOS5': '🛃','iOS7': '','Hex': '1F6C3'}, {'iOS2': '','iOS5': '🉑','iOS7': '','Hex': '1F251'}, {'iOS2': '','iOS5': '㊙','iOS7': '㊙️','Hex': '3299'}, {'iOS2': '','iOS5': '㊗','iOS7': '㊗️','Hex': '3297'}, {'iOS2': '','iOS5': '🆑','iOS7': '','Hex': '1F191'}, {'iOS2': '','iOS5': '🆘','iOS7': '','Hex': '1F198'}, {'iOS2': '','iOS5': '🆔','iOS7': '','Hex': '1F194'}, {'iOS2': '','iOS5': '🚫','iOS7': '','Hex': '1F6AB'}, {'iOS2': '','iOS5': '🔞','iOS7': '','Hex': '1F51E'}, {'iOS2': '','iOS5': '📵','iOS7': '','Hex': '1F4F5'}, {'iOS2': '','iOS5': '🚯','iOS7': '','Hex': '1F6AF'}, {'iOS2': '','iOS5': '🚱','iOS7': '','Hex': '1F6B1'}, {'iOS2': '','iOS5': '🚳','iOS7': '','Hex': '1F6B3'}, {'iOS2': '','iOS5': '🚷','iOS7': '','Hex': '1F6B7'}, {'iOS2': '','iOS5': '🚸','iOS7': '','Hex': '1F6B8'}, {'iOS2': '','iOS5': '⛔','iOS7': '⛔️','Hex': '26D4'}, {'iOS2': '','iOS5': '✳','iOS7': '✳️','Hex': '2733'}, {'iOS2': '','iOS5': '❇','iOS7': '❇️','Hex': '2747'}, {'iOS2': '','iOS5': '❎','iOS7': '','Hex': '274E'}, {'iOS2': '','iOS5': '✅','iOS7': '','Hex': '2705'}, {'iOS2': '','iOS5': '✴','iOS7': '✴️','Hex': '2734'}, {'iOS2': '','iOS5': '💟','iOS7': '','Hex': '1F49F'}, {'iOS2': '','iOS5': '🆚','iOS7': '','Hex': '1F19A'}, {'iOS2': '','iOS5': '📳','iOS7': '','Hex': '1F4F3'}, {'iOS2': '','iOS5': '📴','iOS7': '','Hex': '1F4F4'}, {'iOS2': '','iOS5': '🅰','iOS7': '','Hex': '1F170'}, {'iOS2': '','iOS5': '🅱','iOS7': '','Hex': '1F171'}, {'iOS2': '','iOS5': '🆎','iOS7': '','Hex': '1F18E'}, {'iOS2': '','iOS5': '🅾','iOS7': '','Hex': '1F17E'}, {'iOS2': '','iOS5': '💠','iOS7': '','Hex': '1F4A0'}, {'iOS2': '','iOS5': '➿','iOS7': '','Hex': '27BF'}, {'iOS2': '','iOS5': '♻','iOS7': '♻️','Hex': '267B'}, {'iOS2': '','iOS5': '♈','iOS7': '♈️','Hex': '2648'}, {'iOS2': '','iOS5': '♉','iOS7': '♉️','Hex': '2649'}, {'iOS2': '','iOS5': '♊','iOS7': '♊️','Hex': '264A'}, {'iOS2': '','iOS5': '♋','iOS7': '♋️','Hex': '264B'}, {'iOS2': '','iOS5': '♌','iOS7': '♌️','Hex': '264C'}, {'iOS2': '','iOS5': '♍','iOS7': '♍️','Hex': '264D'}, {'iOS2': '','iOS5': '♎','iOS7': '♎️','Hex': '264E'}, {'iOS2': '','iOS5': '♏','iOS7': '♏️','Hex': '264F'}, {'iOS2': '','iOS5': '♐','iOS7': '♐️','Hex': '2650'}, {'iOS2': '','iOS5': '♑','iOS7': '♑️','Hex': '2651'}, {'iOS2': '','iOS5': '♒','iOS7': '♒️','Hex': '2652'}, {'iOS2': '','iOS5': '♓','iOS7': '♓️','Hex': '2653'}, {'iOS2': '','iOS5': '⛎','iOS7': '','Hex': '26CE'}, {'iOS2': '','iOS5': '🔯','iOS7': '','Hex': '1F52F'}, {'iOS2': '','iOS5': '🏧','iOS7': '','Hex': '1F3E7'}, {'iOS2': '','iOS5': '💹','iOS7': '','Hex': '1F4B9'}, {'iOS2': '','iOS5': '💲','iOS7': '','Hex': '1F4B2'}, {'iOS2': '','iOS5': '💱','iOS7': '','Hex': '1F4B1'}, {'iOS2': '©','iOS5': '©','iOS7': '','Hex': '00A9'}, {'iOS2': '®','iOS5': '®','iOS7': '','Hex': '00AE'}, {'iOS2': '™','iOS5': '™','iOS7': '','Hex': '2122'}, {'iOS2': '','iOS5': '〽','iOS7': '〽️','Hex': '303D'}, {'iOS2': '','iOS5': '〰','iOS7': '','Hex': '3030'}, {'iOS2': '','iOS5': '🔝','iOS7': '','Hex': '1F51D'}, {'iOS2': '','iOS5': '🔚','iOS7': '','Hex': '1F51A'}, {'iOS2': '','iOS5': '🔙','iOS7': '','Hex': '1F519'}, {'iOS2': '','iOS5': '🔛','iOS7': '','Hex': '1F51B'}, {'iOS2': '','iOS5': '🔜','iOS7': '','Hex': '1F51C'}, {'iOS2': '','iOS5': '❌','iOS7': '','Hex': '274C'}, {'iOS2': '','iOS5': '⭕','iOS7': '⭕️','Hex': '2B55'}, {'iOS2': '','iOS5': '❗','iOS7': '❗️','Hex': '2757'}, {'iOS2': '','iOS5': '❓','iOS7': '','Hex': '2753'}, {'iOS2': '','iOS5': '❕','iOS7': '','Hex': '2755'}, {'iOS2': '','iOS5': '❔','iOS7': '','Hex': '2754'}, {'iOS2': '','iOS5': '🔃','iOS7': '','Hex': '1F503'}, {'iOS2': '','iOS5': '🕛','iOS7': '','Hex': '1F55B'}, {'iOS2': '','iOS5': '🕧','iOS7': '','Hex': '1F567'}, {'iOS2': '','iOS5': '🕐','iOS7': '','Hex': '1F550'}, {'iOS2': '','iOS5': '🕜','iOS7': '','Hex': '1F55C'}, {'iOS2': '','iOS5': '🕑','iOS7': '','Hex': '1F551'}, {'iOS2': '','iOS5': '🕝','iOS7': '','Hex': '1F55D'}, {'iOS2': '','iOS5': '🕒','iOS7': '','Hex': '1F552'}, {'iOS2': '','iOS5': '🕞','iOS7': '','Hex': '1F55E'}, {'iOS2': '','iOS5': '🕓','iOS7': '','Hex': '1F553'}, {'iOS2': '','iOS5': '🕟','iOS7': '','Hex': '1F55F'}, {'iOS2': '','iOS5': '🕔','iOS7': '','Hex': '1F554'}, {'iOS2': '','iOS5': '🕠','iOS7': '','Hex': '1F560'}, {'iOS2': '','iOS5': '🕕','iOS7': '','Hex': '1F555'}, {'iOS2': '','iOS5': '🕖','iOS7': '','Hex': '1F556'}, {'iOS2': '','iOS5': '🕗','iOS7': '','Hex': '1F557'}, {'iOS2': '','iOS5': '🕘','iOS7': '','Hex': '1F558'}, {'iOS2': '','iOS5': '🕙','iOS7': '','Hex': '1F559'}, {'iOS2': '','iOS5': '🕚','iOS7': '','Hex': '1F55A'}, {'iOS2': '','iOS5': '🕡','iOS7': '','Hex': '1F561'}, {'iOS2': '','iOS5': '🕢','iOS7': '','Hex': '1F562'}, {'iOS2': '','iOS5': '🕣','iOS7': '','Hex': '1F563'}, {'iOS2': '','iOS5': '🕤','iOS7': '','Hex': '1F564'}, {'iOS2': '','iOS5': '🕥','iOS7': '','Hex': '1F565'}, {'iOS2': '','iOS5': '🕦','iOS7': '','Hex': '1F566'}, {'iOS2': '','iOS5': '✖','iOS7': '✖️','Hex': '2716'}, {'iOS2': '','iOS5': '➕','iOS7': '','Hex': '2795'}, {'iOS2': '','iOS5': '➖','iOS7': '','Hex': '2796'}, {'iOS2': '','iOS5': '➗','iOS7': '','Hex': '2797'}, {'iOS2': '','iOS5': '♠','iOS7': '♠️','Hex': '2660'}, {'iOS2': '','iOS5': '♥','iOS7': '♥️','Hex': '2665'}, {'iOS2': '','iOS5': '♣','iOS7': '♣️','Hex': '2663'}, {'iOS2': '','iOS5': '♦','iOS7': '♦️','Hex': '2666'}, {'iOS2': '','iOS5': '💮','iOS7': '','Hex': '1F4AE'}, {'iOS2': '','iOS5': '💯','iOS7': '','Hex': '1F4AF'}, {'iOS2': '','iOS5': '✔','iOS7': '✔️','Hex': '2714'}, {'iOS2': '','iOS5': '☑','iOS7': '☑️','Hex': '2611'}, {'iOS2': '','iOS5': '🔘','iOS7': '','Hex': '1F518'}, {'iOS2': '','iOS5': '🔗','iOS7': '','Hex': '1F517'}, {'iOS2': '','iOS5': '➰','iOS7': '','Hex': '27B0'}, {'iOS2': '','iOS5': '🔱','iOS7': '','Hex': '1F531'}, {'iOS2': '','iOS5': '🔲','iOS7': '','Hex': '1F532'}, {'iOS2': '','iOS5': '🔳','iOS7': '','Hex': '1F533'}, {'iOS2': '','iOS5': '◼','iOS7': '◼️','Hex': '25FC'}, {'iOS2': '','iOS5': '◻','iOS7': '◻️','Hex': '25FB'}, {'iOS2': '','iOS5': '◾','iOS7': '◾️','Hex': '25FE'}, {'iOS2': '','iOS5': '◽','iOS7': '◽️','Hex': '25FD'}, {'iOS2': '','iOS5': '▪','iOS7': '▪️','Hex': '25AA'}, {'iOS2': '','iOS5': '▫','iOS7': '▫️','Hex': '25AB'}, {'iOS2': '','iOS5': '🔺','iOS7': '','Hex': '1F53A'}, {'iOS2': '','iOS5': '⬜','iOS7': '⬜️','Hex': '2B1C'}, {'iOS2': '','iOS5': '⬛','iOS7': '⬛️','Hex': '2B1B'}, {'iOS2': '','iOS5': '⚫','iOS7': '⚫️','Hex': '26AB'}, {'iOS2': '','iOS5': '⚪','iOS7': '⚪️','Hex': '26AA'}, {'iOS2': '','iOS5': '🔴','iOS7': '','Hex': '1F534'}, {'iOS2': '','iOS5': '🔵','iOS7': '','Hex': '1F535'}, {'iOS2': '','iOS5': '🔻','iOS7': '','Hex': '1F53B'}, {'iOS2': '','iOS5': '🔶','iOS7': '','Hex': '1F536'}, {'iOS2': '','iOS5': '🔷','iOS7': '','Hex': '1F537'}, {'iOS2': '','iOS5': '🔸','iOS7': '','Hex': '1F538'}, {'iOS2': '','iOS5': '🔹','iOS7': '','Hex': '1F539'}, {'iOS2': '','iOS5': '⁉','iOS7': '⁉️','Hex': '2049'}, {'iOS2': '','iOS5': '‼','iOS7': '‼️','Hex': '203C'}];
}

/**
 * Parse the Message Inbound For Emojis
 *
 * @param {string} txt
 * The received message, where to find the Emojis.
 *
 * @param {boolean} [span = true]
 * If "true", the function will return an html tag
 * Example: <span class="emoji emoji-1F604"></span>
 * this will show the smiling face, require emojisprite.css and emojisprite.png
 *
 * Otherwise, if it is "false", return an id. Example, ##1F604##.
 *
 * @return {string}
 */
module.exports.parseMsgEmojis = function ParseMessageInboundForEmojis(txt, span){
	span = span || true;
	var emojis = emojiObjectArray();

	emojis.forEach(function(emoji)
		{
			txt = txt.replace(new RegExp(escapeRegExp(emoji.iOS2 + '|' + emoji.iOS5 + '|' + emoji.iOS7), 'g'),
								(span === true) ?
									'<span class="emoji emoji-' + emoji.Hex + '">&#35;&#35;' + emoji.Hex + '&#35;&#35;</span>'
										:
									'##' + emoji.Hex + '##'
			);
		}
	);

	return txt;
};

/**
 * This function extracts the phone number.
 *
 * The remitter delivered by WHATSAPP example 1234567890@s.whatsapp.net
 * @param {string} from
 *
 * Returns the number of phone cleanly.
 * @return {string}
 **/
function extractNumber(from){
	return from.replace(new RegExp(escapeRegExp('@s.whatsapp.net | @g.us'), 'g'), '');
}

/**
 * Pre Process Picture File with GraphicsMagick to send as your profile picture
 * @module gm
 * @module fs
 *
 * @param {string} path
 * @returns {boolean}
 */
function preProcessProfilePicture(path){
	var Gm = require('gm');// Node.js bridge between GraphicsMagick to edit images, equivalent to PHP's gd extension
	var fs = require('fs');// Node.js File System module

	var image = new Gm(path);

	image.size(function(error, size){
		if(!error){
			if(size.width !== size.height){
				throw new Error('Profile picture needs to be square (image is' + size.width + 'x' + size.height + ')');
			}
            if(size.width > 640){
				throw new Error('Profile picture maximum size of 640 x 640 (image is' + size.width + 'x' + size.height + ')');
			}

			fs.unlink(path, function(error){
				if(error){
					throw error;
				}

				image.quality(50).stream(function(error, stdout) {
					if(error){
						throw error;
					}

					var writeStream = fs.createWriteStream(path, {
						encoding: 'base64' //TODO: verifies if it isn't binary here
					});

					stdout.pipe(writeStream);

					image.deconstruct();

					return true;
				});
			});
		}else{
			throw error;
		}
	});
}

/**
 * Process Image with GraphicsMagick to generate image preview
 * @module gm
 *
 * @param {string} file
 * @param {int} [size = 100]
 * @param {boolean} [raw = false]
 * @returns {string}
 */
function createImagePreview(file, size, raw) {
    size = size || 100;
    raw = raw || false;

    var Gm = require('gm');

    var image = new Gm(file);
    var height = 0;
    var width = 0;
    var buffer = null;

    image.size(function (error, imageSize) {
        if (!error) {
            if (imageSize.width > imageSize.height) {
                //image is landscape
                height = (imageSize.height / imageSize.width) * size;
                width = size;
            } else {
                width = (imageSize.width / imageSize.height) * size;
                height = size;
            }
        } else {
            return null;
        }
    });

    image.resize(width, height, '!').stream(function (error, stdout) {
        if (error) {
            return null;
        }

        stdout.on('data', function (data) {
            buffer = data;
        });
    });

    if (raw) {
        return buffer.toString('ascii');
    }
    return buffer.toString('base64');
}

/**
 * Generate a Thumbnail from a video file using FFmpeg,
 * then return an preview created with createImagePreview() function
 *
 * @module fluent-ffmpeg
 * @module os
 * @module cypto
 *
 * @param {string} file
 * @returns {string}
 */
function createVideoThumbnail(file){
	var os = require('os');
	var Ff = require('fluent-ffmpeg');
	var crypto = require('crypto');
	var md5 = crypto.createHash('md5');
	var output = md5.update(file) + '.png';

	new Ff().input(file).thumbnail({
		timestamps: ['50%'],
		filename: output,
		folder: os.tmpdir()
	});

	return createImagePreview(os.tmpdir() + '/' + output);
}

/**
 * Return the default gift Preview image
 *
 * @returns {string}
 */
function giftThumbnail()
{
	return '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';
}

/**
 * Return the default video thumbnail image
 *
 * @returns {string}
 */
function videoThumbnail()
{
	return '/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABQAAD/4QMpaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MCA2MS4xMzQ3NzcsIDIwMTAvMDIvMTItMTc6MzI6MDAgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgV2luZG93cyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2MTQyRUVCOEI3MDgxMUUyQjNGQkY1OEU5M0U2MDE1MyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo2MTQyRUVCOUI3MDgxMUUyQjNGQkY1OEU5M0U2MDE1MyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYxNDJFRUI2QjcwODExRTJCM0ZCRjU4RTkzRTYwMTUzIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjYxNDJFRUI3QjcwODExRTJCM0ZCRjU4RTkzRTYwMTUzIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+4ADkFkb2JlAGTAAAAAAf/bAIQAAgICAgICAgICAgMCAgIDBAMCAgME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';
}

/**
 * Generate the Request Code to Register a number on Whatsapp
 *
 * @param phone
 * @returns {*}
 */
function generateRequestToken(phone){
		phone = new Buffer(phone);
	var crypto = require('crypto');
	var signature = new Buffer('MIIDMjCCAvCgAwIBAgIETCU2pDALBgcqhkjOOAQDBQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFDASBgNVBAcTC1NhbnRhIENsYXJhMRYwFAYDVQQKEw1XaGF0c0FwcCBJbmMuMRQwEgYDVQQLEwtFbmdpbmVlcmluZzEUMBIGA1UEAxMLQnJpYW4gQWN0b24wHhcNMTAwNjI1MjMwNzE2WhcNNDQwMjE1MjMwNzE2WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEUMBIGA1UEBxMLU2FudGEgQ2xhcmExFjAUBgNVBAoTDVdoYXRzQXBwIEluYy4xFDASBgNVBAsTC0VuZ2luZWVyaW5nMRQwEgYDVQQDEwtCcmlhbiBBY3RvbjCCAbgwggEsBgcqhkjOOAQBMIIBHwKBgQD9f1OBHXUSKVLfSpwu7OTn9hG3UjzvRADDHj+AtlEmaUVdQCJR+1k9jVj6v8X1ujD2y5tVbNeBO4AdNG/yZmC3a5lQpaSfn+gEexAiwk+7qdf+t8Yb+DtX58aophUPBPuD9tPFHsMCNVQTWhaRMvZ1864rYdcq7/IiAxmd0UgBxwIVAJdgUI8VIwvMspK5gqLrhAvwWBz1AoGBAPfhoIXWmz3ey7yrXDa4V7l5lK+7+jrqgvlXTAs9B4JnUVlXjrrUWU/mcQcQgYC0SRZxI+hMKBYTt88JMozIpuE8FnqLVHyNKOCjrh4rs6Z1kW6jfwv6ITVi8ftiegEkO8yk8b6oUZCJqIPf4VrlnwaSi2ZegHtVJWQBTDv+z0kqA4GFAAKBgQDRGYtLgWh7zyRtQainJfCpiaUbzjJuhMgo4fVWZIvXHaSHBU1t5w//S0lDK2hiqkj8KpMWGywVov9eZxZy37V26dEqr/c2m5qZ0E+ynSu7sqUD7kGx/zeIcGT0H+KAVgkGNQCo5Uc0koLRWYHNtYoIvt5R3X6YZylbPftF/8ayWTALBgcqhkjOOAQDBQADLwAwLAIUAKYCp0d6z4QQdyN74JDfQ2WCyi8CFDUM4CaNB+ceVXdKtOrNTQcc0e+t', 'base64');
	var classesMd5 = new Buffer('U8Rv0Yqm6qUsIGkGbBBaZA==' , 'base64'); // 2.11.453
	var key = new Buffer('/UIGKU1FVQa+ATM2A0za7G2KI9S/CwPYjgAbc67v7ep42eO/WeTLx1lb1cHwxpsEgF4+PmYpLd2YpGUdX/A2JQitsHzDwgcdBpUf7psX1BU=', 'base64');
	var data = Buffer.concat([signature, classesMd5, phone], signature.length + classesMd5.length + phone.length);

	var opad = new Buffer(64);
	var ipad = new Buffer(64);
	for(var count = 0; count < 64; count++){
		opad.writeUInt8(0x5c ^ key[count], count);
		ipad.writeUInt8(0x36 ^ key[count], count);
	}

	var hash1 = crypto.createHash('sha1');
	hash1.write(ipad);
	hash1.write(data);
	hash1.end();
	hash1 = hash1.read();

	var hash2 = crypto.createHash('sha1');
	hash2.write(opad);
	hash2.write(hash1);
	hash2.end();

	return hash2.read().toString('base64');
}

var buildIdentity = function buildIdentity(identity, callback){
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
									callback(error, null);
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
module.exports.buildIdentity = buildIdentity;

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

var dissectPhone = function dissectPhone(path, phone, callback) {
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
};
module.exports.dissectPhone = dissectPhone;

module.exports.codeRequest = function codeRequest(method, phone, callback){
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
							var token = generateRequestToken(phoneInfo.phone);

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

module.exports.codeRegister = function codeRegister(code, phone, callback){
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