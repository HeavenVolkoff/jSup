/**
 * Created by HeavenVolkoff on 16/10/14.
 */

'use strict';

function echo() {
	//  discuss at: http://phpjs.org/functions/echo/
	//        http: //kevin.vanzonneveld.net
	// original by: Philip Peterson
	// improved by: echo is bad
	// improved by: Nate
	// improved by: Brett Zamir (http://brett-zamir.me)
	// improved by: Brett Zamir (http://brett-zamir.me)
	// improved by: Brett Zamir (http://brett-zamir.me)
	//  revised by: Der Simon (http://innerdom.sourceforge.net/)
	// bugfixed by: Eugene Bulkin (http://doubleaw.com/)
	// bugfixed by: Brett Zamir (http://brett-zamir.me)
	// bugfixed by: Brett Zamir (http://brett-zamir.me)
	// bugfixed by: EdorFaus
	//    input by: JB
	//        note: If browsers start to support DOM Level 3 Load and Save (parsing/serializing),
	//        note: we wouldn't need any such long code (even most of the code below). See
	//        note: link below for a cross-browser implementation in JavaScript. HTML5 might
	//        note: possibly support DOMParser, but that is not presently a standard.
	//        note: Although innerHTML is widely used and may become standard as of HTML5, it is also not ideal for
	//        note: use with a temporary holder before appending to the DOM (as is our last resort below),
	//        note: since it may not work in an XML context
	//        note: Using innerHTML to directly add to the BODY is very dangerous because it will
	//        note: break all pre-existing references to HTMLElements.
	//   example 1: echo('<div><p>abc</p><p>abc</p></div>');
	//   returns 1: undefined

	var isNode = typeof module !== 'undefined' && module.exports;

	if (isNode) {
		var args = Array.prototype.slice.call(arguments);
		return console.log(args.join(' '));
	}
}

function print_r(array, return_val) {
	//  discuss at: http://phpjs.org/functions/print_r/
	//        http: //kevin.vanzonneveld.net
	// original by: Michael White (http://getsprink.com)
	// improved by: Ben Bryan
	// improved by: Brett Zamir (http://brett-zamir.me)
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	//    input by: Brett Zamir (http://brett-zamir.me)
	//  depends on: echo
	//   example 1: print_r(1, true);
	//   returns 1: 1

	var pad_char = ' ';
	var pad_val = 4;

	var getFuncName = function(fn) {
		var name = (/\W*function\s+([\w\$]+)\s*\(/)
			.exec(fn);
		if (!name) {
			return '(Anonymous)';
		}
		return name[1];
	};
	var repeat_char = function(len, pad_char) {
		var str = '';
		for (var i = 0; i < len; i++) {
			str += pad_char;
		}
		return str;
	};
	var formatArray = function(obj, cur_depth, pad_val, pad_char) {
		if (cur_depth > 0) {
			cur_depth++;
		}

		var base_pad = repeat_char(pad_val * cur_depth, pad_char);
		var thick_pad = repeat_char(pad_val * (cur_depth + 1), pad_char);
		var str = '';

		if (typeof obj === 'object' && obj !== null && obj.constructor && getFuncName(obj.constructor) !==
			'PHPJS_Resource') {
			str += 'Array\n' + base_pad + '(\n';
			for (var key in obj) {
				if (Object.prototype.toString.call(obj.key) === '[object Array]') {
					str += thick_pad + '[' + key + '] => ' + formatArray(obj.key, cur_depth + 1, pad_val, pad_char);
				} else {
					str += thick_pad + '[' + key + '] => ' + obj.key + '\n';
				}
			}
			str += base_pad + ')\n';
		} else if (obj === null || obj === undefined) {
			str = '';
		} else { // for our "resource" class
			str = obj.toString();
		}

		return str;
	};

	var output = formatArray(array, 0, pad_val, pad_char);

    echo(output);

	if (return_val !== true) {
		return true;
	}
	return output;
}

function bin2hex(s) {
	//  discuss at: http://phpjs.org/functions/bin2hex/
	// original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// bugfixed by: Onno Marsman
	// bugfixed by: Linuxworld
	// improved by: ntoniazzi (http://phpjs.org/functions/bin2hex:361#comment_177616)
	//   example 1: bin2hex('Kev');
	//   returns 1: '4b6576'
	//   example 2: bin2hex(String.fromCharCode(0x00));
	//   returns 2: '00'

	var i, l, o = '',
		n;

	s += '';

	for (i = 0, l = s.length; i < l; i++) {
		n = s.charCodeAt(i)
			.toString(16);
		o += n.length < 2 ? '0' + n : n;
	}

	return o;
}

function range(low, high, step) {
	//  discuss at: http://phpjs.org/functions/range/
	// original by: Waldo Malqui Silva
	//   example 1: range ( 0, 12 );
	//   returns 1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	//   example 2: range( 0, 100, 10 );
	//   returns 2: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
	//   example 3: range( 'a', 'i' );
	//   returns 3: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
	//   example 4: range( 'c', 'a' );
	//   returns 4: ['c', 'b', 'a']

	var matrix = [];
	var inival, endval, plus;
	var walker = step || 1;
	var chars = false;

	if (!isNaN(low) && !isNaN(high)) {
		inival = low;
		endval = high;
	} else if (isNaN(low) && isNaN(high)) {
		chars = true;
		inival = low.charCodeAt(0);
		endval = high.charCodeAt(0);
	} else {
		inival = (isNaN(low) ? 0 : low);
		endval = (isNaN(high) ? 0 : high);
	}

	plus = ((inival <= endval));
	if (plus) {
		while (inival <= endval) {
			matrix.push(((chars) ? String.fromCharCode(inival) : inival));
			inival += walker;
		}
	} else {
		while (inival >= endval) {
			matrix.push(((chars) ? String.fromCharCode(inival) : inival));
			inival -= walker;
		}
	}

	return matrix;
}