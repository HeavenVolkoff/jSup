/**
 * Created by HeavenVolkoff on 16/10/14.
 */
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

	var arg = '',
		argc = arguments.length,
		argv = arguments,
		i = 0,
		holder, win = this.window,
		d = win.document,
		ns_xhtml = 'http://www.w3.org/1999/xhtml',
		ns_xul = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'; // If we're in a XUL context
	var stringToDOM = function(str, parent, ns, container) {
		var extraNSs = '';
		if (ns === ns_xul) {
			extraNSs = ' xmlns:html="' + ns_xhtml + '"';
		}
		var stringContainer = '<' + container + ' xmlns="' + ns + '"' + extraNSs + '>' + str + '</' + container + '>';
		var dils = win.DOMImplementationLS,
			dp = win.DOMParser,
			ax = win.ActiveXObject;
		if (dils && dils.createLSInput && dils.createLSParser) {
			// Follows the DOM 3 Load and Save standard, but not
			// implemented in browsers at present; HTML5 is to standardize on innerHTML, but not for XML (though
			// possibly will also standardize with DOMParser); in the meantime, to ensure fullest browser support, could
			// attach http://svn2.assembla.com/svn/brettz9/DOMToString/DOM3.js (see http://svn2.assembla.com/svn/brettz9/DOMToString/DOM3.xhtml for a simple test file)
			var lsInput = dils.createLSInput();
			// If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
			lsInput.stringData = stringContainer;
			var lsParser = dils.createLSParser(1, null); // synchronous, no schema type
			return lsParser.parse(lsInput)
				.firstChild;
		} else if (dp) {
			// If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
			try {
				var fc = new dp()
					.parseFromString(stringContainer, 'text/xml');
				if (fc && fc.documentElement && fc.documentElement.localName !== 'parsererror' && fc.documentElement.namespaceURI !==
					'http://www.mozilla.org/newlayout/xml/parsererror.xml') {
					return fc.documentElement.firstChild;
				}
				// If there's a parsing error, we just continue on
			} catch (e) {
				// If there's a parsing error, we just continue on
			}
		} else if (ax) { // We don't bother with a holder in Explorer as it doesn't support namespaces
			var axo = new ax('MSXML2.DOMDocument');
			axo.loadXML(str);
			return axo.documentElement;
		}
		/*else if (win.XMLHttpRequest) { // Supposed to work in older Safari
		 var req = new win.XMLHttpRequest;
		 req.open('GET', 'data:application/xml;charset=utf-8,'+encodeURIComponent(str), false);
		 if (req.overrideMimeType) {
		 req.overrideMimeType('application/xml');
		 }
		 req.send(null);
		 return req.responseXML;
		 }*/
		// Document fragment did not work with innerHTML, so we create a temporary element holder
		// If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
		//if (d.createElementNS && (d.contentType && d.contentType !== 'text/html')) { // Don't create namespaced elements if we're being served as HTML (currently only Mozilla supports this detection in true XHTML-supporting browsers, but Safari and Opera should work with the above DOMParser anyways, and IE doesn't support createElementNS anyways)
		if (d.createElementNS && // Browser supports the method
			(d.documentElement.namespaceURI || // We can use if the document is using a namespace
				d.documentElement.nodeName.toLowerCase() !== 'html' || // We know it's not HTML4 or less, if the tag is not HTML (even if the root namespace is null)
				(d.contentType && d.contentType !== 'text/html') // We know it's not regular HTML4 or less if this is Mozilla (only browser supporting the attribute) and the content type is something other than text/html; other HTML5 roots (like svg) still have a namespace
				)) { // Don't create namespaced elements if we're being served as HTML (currently only Mozilla supports this detection in true XHTML-supporting browsers, but Safari and Opera should work with the above DOMParser anyways, and IE doesn't support createElementNS anyways); last test is for the sake of being in a pure XML document
			holder = d.createElementNS(ns, container);
		} else {
			holder = d.createElement(container); // Document fragment did not work with innerHTML
		}
		holder.innerHTML = str;
		while (holder.firstChild) {
			parent.appendChild(holder.firstChild);
		}
		return false;
		// throw 'Your browser does not support DOM parsing as required by echo()';
	};

	var ieFix = function(node) {
		if (node.nodeType === 1) {
			var newNode = d.createElement(node.nodeName);
			var i, len;
			if (node.attributes && node.attributes.length > 0) {
				for (i = 0, len = node.attributes.length; i < len; i++) {
					newNode.setAttribute(node.attributes[i].nodeName, node.getAttribute(node.attributes[i].nodeName));
				}
			}
			if (node.childNodes && node.childNodes.length > 0) {
				for (i = 0, len = node.childNodes.length; i < len; i++) {
					newNode.appendChild(ieFix(node.childNodes[i]));
				}
			}
			return newNode;
		} else {
			return d.createTextNode(node.nodeValue);
		}
	};

	var replacer = function(s, m1, m2) {
		// We assume for now that embedded variables do not have dollar sign; to add a dollar sign, you currently must use {$$var} (We might change this, however.)
		// Doesn't cover all cases yet: see http://php.net/manual/en/language.types.string.php#language.types.string.syntax.double
		if (m1 !== '\\') {
			return m1 + eval(m2);
		} else {
			return s;
		}
	};

	this.php_js = this.php_js || {};
	var phpjs = this.php_js,
		ini = phpjs.ini,
		obs = phpjs.obs;
	for (i = 0; i < argc; i++) {
		arg = argv[i];
		if (ini && ini['phpjs.echo_embedded_vars']) {
			arg = arg.replace(/(.?)\{?\$(\w*?\}|\w*)/g, replacer);
		}

		if (!phpjs.flushing && obs && obs.length) { // If flushing we output, but otherwise presence of a buffer means caching output
			obs[obs.length - 1].buffer += arg;
			continue;
		}

		if (d.appendChild) {
			if (d.body) {
				if (win.navigator.appName === 'Microsoft Internet Explorer') { // We unfortunately cannot use feature detection, since this is an IE bug with cloneNode nodes being appended
					d.body.appendChild(stringToDOM(ieFix(arg)));
				} else {
					var unappendedLeft = stringToDOM(arg, d.body, ns_xhtml, 'div')
						.cloneNode(true); // We will not actually append the div tag (just using for providing XHTML namespace by default)
					if (unappendedLeft) {
						d.body.appendChild(unappendedLeft);
					}
				}
			} else {
				d.documentElement.appendChild(stringToDOM(arg, d.documentElement, ns_xul, 'description')); // We will not actually append the description tag (just using for providing XUL namespace by default)
			}
		} else if (d.write) {
			d.write(arg);
		}
		/* else { // This could recurse if we ever add print!
		 print(arg);
		 }*/
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
	var isNode = typeof module !== 'undefined' && module.exports;
	var d = null;

	if(!isNode){
		d = this.window.document;
	}
	getFuncName = function(fn) {
		var name = (/\W*function\s+([\w\$]+)\s*\(/)
			.exec(fn);
		if (!name) {
			return '(Anonymous)';
		}
		return name[1];
	};
	repeat_char = function(len, pad_char) {
		var str = '';
		for (var i = 0; i < len; i++) {
			str += pad_char;
		}
		return str;
	};
	formatArray = function(obj, cur_depth, pad_val, pad_char) {
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
				if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
					str += thick_pad + '[' + key + '] => ' + formatArray(obj[key], cur_depth + 1, pad_val, pad_char);
				} else {
					str += thick_pad + '[' + key + '] => ' + obj[key] + '\n';
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

	output = formatArray(array, 0, pad_val, pad_char);

	if (return_val !== true) {
		if(!d){
			echo(output);
		}else{
			if (d.body) {
				this.echo(output);
			} else {
				try {
					d = XULDocument; // We're in XUL, so appending as plain text won't work; trigger an error out of XUL
					this.echo('<pre xmlns="http://www.w3.org/1999/xhtml" style="white-space:pre;">' + output + '</pre>');
				} catch (e) {
					this.echo(output); // Outputting as plain text may work in some plain XML
				}
			}
		}
		return true;
	}
	return output;
}

function in_array(needle, haystack, argStrict) {
	//  discuss at: http://phpjs.org/functions/in_array/
	// original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// improved by: vlado houba
	// improved by: Jonas Sciangula Street (Joni2Back)
	//    input by: Billy
	// bugfixed by: Brett Zamir (http://brett-zamir.me)
	//   example 1: in_array('van', ['Kevin', 'van', 'Zonneveld']);
	//   returns 1: true
	//   example 2: in_array('vlado', {0: 'Kevin', vlado: 'van', 1: 'Zonneveld'});
	//   returns 2: false
	//   example 3: in_array(1, ['1', '2', '3']);
	//   example 3: in_array(1, ['1', '2', '3'], false);
	//   returns 3: true
	//   returns 3: true
	//   example 4: in_array(1, ['1', '2', '3'], true);
	//   returns 4: false

	var key = '',
		strict = !! argStrict;

	//we prevent the double check (strict && arr[key] === ndl) || (!strict && arr[key] == ndl)
	//in just one for, in order to improve the performance
	//deciding wich type of comparation will do before walk array
	if (strict) {
		for (key in haystack) {
			if (haystack[key] === needle) {
				return true;
			}
		}
	} else {
		for (key in haystack) {
			if (haystack[key] == needle) {
				return true;
			}
		}
	}

	return false;
}

function pack(format) {
	//  discuss at: http://phpjs.org/functions/pack/
	// original by: Tim de Koning (http://www.kingsquare.nl)
	//    parts by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
	// bugfixed by: Tim de Koning (http://www.kingsquare.nl)
	//        note: Float encoding by: Jonas Raoni Soares Silva
	//        note: Home: http://www.kingsquare.nl/blog/12-12-2009/13507444
	//        note: Feedback: phpjs-pack@kingsquare.nl
	//        note: 'machine dependent byte order and size' aren't
	//        note: applicable for JavaScript; pack works as on a 32bit,
	//        note: little endian machine
	//   example 1: pack('nvc*', 0x1234, 0x5678, 65, 66);
	//   returns 1: '4xVAB'

	var formatPointer = 0,
		argumentPointer = 1,
		result = '',
		argument = '',
		i = 0,
		r = [],
		instruction, quantifier, word, precisionBits, exponentBits, extraNullCount;

	// vars used by float encoding
	var bias, minExp, maxExp, minUnnormExp, status, exp, len, bin, signal, n, intPart, floatPart, lastBit, rounded, j,
		k, tmpResult;

	while (formatPointer < format.length) {
		instruction = format.charAt(formatPointer);
		quantifier = '';
		formatPointer++;
		while ((formatPointer < format.length) && (format.charAt(formatPointer)
			.match(/[\d\*]/) !== null)) {
			quantifier += format.charAt(formatPointer);
			formatPointer++;
		}
		if (quantifier === '') {
			quantifier = '1';
		}

		// Now pack variables: 'quantifier' times 'instruction'
		switch (instruction) {
			case 'a':
			// NUL-padded string
			case 'A':
				// SPACE-padded string
				if (typeof arguments[argumentPointer] === 'undefined') {
					throw new Error('Warning:  pack() Type ' + instruction + ': not enough arguments');
				} else {
					argument = String(arguments[argumentPointer]);
				}
				if (quantifier === '*') {
					quantifier = argument.length;
				}
				for (i = 0; i < quantifier; i++) {
					if (typeof argument[i] === 'undefined') {
						if (instruction === 'a') {
							result += String.fromCharCode(0);
						} else {
							result += ' ';
						}
					} else {
						result += argument[i];
					}
				}
				argumentPointer++;
				break;
			case 'h':
			// Hex string, low nibble first
			case 'H':
				// Hex string, high nibble first
				if (typeof arguments[argumentPointer] === 'undefined') {
					throw new Error('Warning: pack() Type ' + instruction + ': not enough arguments');
				} else {
					argument = arguments[argumentPointer];
				}
				if (quantifier === '*') {
					quantifier = argument.length;
				}
				if (quantifier > argument.length) {
					throw new Error('Warning: pack() Type ' + instruction + ': not enough characters in string');
				}
				for (i = 0; i < quantifier; i += 2) {
					// Always get per 2 bytes...
					word = argument[i];
					if (((i + 1) >= quantifier) || typeof argument[i + 1] === 'undefined') {
						word += '0';
					} else {
						word += argument[i + 1];
					}
					// The fastest way to reverse?
					if (instruction === 'h') {
						word = word[1] + word[0];
					}
					result += String.fromCharCode(parseInt(word, 16));
				}
				argumentPointer++;
				break;

			case 'c':
			// signed char
			case 'C':
				// unsigned char
				// c and C is the same in pack
				if (quantifier === '*') {
					quantifier = arguments.length - argumentPointer;
				}
				if (quantifier > (arguments.length - argumentPointer)) {
					throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
				}

				for (i = 0; i < quantifier; i++) {
					result += String.fromCharCode(arguments[argumentPointer]);
					argumentPointer++;
				}
				break;

			case 's':
			// signed short (always 16 bit, machine byte order)
			case 'S':
			// unsigned short (always 16 bit, machine byte order)
			case 'v':
				// s and S is the same in pack
				if (quantifier === '*') {
					quantifier = arguments.length - argumentPointer;
				}
				if (quantifier > (arguments.length - argumentPointer)) {
					throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
				}

				for (i = 0; i < quantifier; i++) {
					result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
					argumentPointer++;
				}
				break;

			case 'n':
				// unsigned short (always 16 bit, big endian byte order)
				if (quantifier === '*') {
					quantifier = arguments.length - argumentPointer;
				}
				if (quantifier > (arguments.length - argumentPointer)) {
					throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
				}

				for (i = 0; i < quantifier; i++) {
					result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
					argumentPointer++;
				}
				break;

			case 'i':
			// signed integer (machine dependent size and byte order)
			case 'I':
			// unsigned integer (machine dependent size and byte order)
			case 'l':
			// signed long (always 32 bit, machine byte order)
			case 'L':
			// unsigned long (always 32 bit, machine byte order)
			case 'V':
				// unsigned long (always 32 bit, little endian byte order)
				if (quantifier === '*') {
					quantifier = arguments.length - argumentPointer;
				}
				if (quantifier > (arguments.length - argumentPointer)) {
					throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
				}

				for (i = 0; i < quantifier; i++) {
					result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF);
					argumentPointer++;
				}

				break;
			case 'N':
				// unsigned long (always 32 bit, big endian byte order)
				if (quantifier === '*') {
					quantifier = arguments.length - argumentPointer;
				}
				if (quantifier > (arguments.length - argumentPointer)) {
					throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
				}

				for (i = 0; i < quantifier; i++) {
					result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
					result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
					argumentPointer++;
				}
				break;

			case 'f':
			// float (machine dependent size and representation)
			case 'd':
				// double (machine dependent size and representation)
				// version original by IEEE754
				precisionBits = 23;
				exponentBits = 8;
				if (instruction === 'd') {
					precisionBits = 52;
					exponentBits = 11;
				}

				if (quantifier === '*') {
					quantifier = arguments.length - argumentPointer;
				}
				if (quantifier > (arguments.length - argumentPointer)) {
					throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
				}
				for (i = 0; i < quantifier; i++) {
					argument = arguments[argumentPointer];
					bias = Math.pow(2, exponentBits - 1) - 1;
					minExp = -bias + 1;
					maxExp = bias;
					minUnnormExp = minExp - precisionBits;
					status = isNaN(n = parseFloat(argument)) || n === -Infinity || n === +Infinity ? n : 0;
					exp = 0;
					len = 2 * bias + 1 + precisionBits + 3;
					bin = new Array(len);
					signal = (n = status !== 0 ? 0 : n) < 0;
					n = Math.abs(n);
					intPart = Math.floor(n);
					floatPart = n - intPart;

					for (k = len; k;) {
						bin[--k] = 0;
					}
					for (k = bias + 2; intPart && k;) {
						bin[--k] = intPart % 2;
						intPart = Math.floor(intPart / 2);
					}
					for (k = bias + 1; floatPart > 0 && k; --floatPart) {
						(bin[++k] = ((floatPart *= 2) >= 1) - 0);
					}
					for (k = -1; ++k < len && !bin[k];) {}

					if (bin[(lastBit = precisionBits - 1 + (k = (exp = bias + 1 - k) >= minExp && exp <= maxExp ? k + 1 :
						bias + 1 - (exp = minExp - 1))) + 1]) {
						if (!(rounded = bin[lastBit])) {
							for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]) {}
						}
						for (j = lastBit + 1; rounded && --j >= 0;
						     (bin[j] = !bin[j] - 0) && (rounded = 0)) {}
					}

					for (k = k - 2 < 0 ? -1 : k - 3; ++k < len && !bin[k];) {}

					if ((exp = bias + 1 - k) >= minExp && exp <= maxExp) {
						++k;
					} else {
						if (exp < minExp) {
							if (exp !== bias + 1 - len && exp < minUnnormExp) { /*"encodeFloat::float underflow" */ }
							k = bias + 1 - (exp = minExp - 1);
						}
					}

					if (intPart || status !== 0) {
						exp = maxExp + 1;
						k = bias + 2;
						if (status === -Infinity) {
							signal = 1;
						} else if (isNaN(status)) {
							bin[k] = 1;
						}
					}

					n = Math.abs(exp + bias);
					tmpResult = '';

					for (j = exponentBits + 1; --j;) {
						tmpResult = (n % 2) + tmpResult;
						n = n >>= 1;
					}

					n = 0;
					j = 0;
					k = (tmpResult = (signal ? '1' : '0') + tmpResult + bin.slice(k, k + precisionBits)
						.join(''))
						.length;
					r = [];

					for (; k;) {
						n += (1 << j) * tmpResult.charAt(--k);
						if (j === 7) {
							r[r.length] = String.fromCharCode(n);
							n = 0;
						}
						j = (j + 1) % 8;
					}

					r[r.length] = n ? String.fromCharCode(n) : '';
					result += r.join('');
					argumentPointer++;
				}
				break;

			case 'x':
				// NUL byte
				if (quantifier === '*') {
					throw new Error('Warning: pack(): Type x: \'*\' ignored');
				}
				for (i = 0; i < quantifier; i++) {
					result += String.fromCharCode(0);
				}
				break;

			case 'X':
				// Back up one byte
				if (quantifier === '*') {
					throw new Error('Warning: pack(): Type X: \'*\' ignored');
				}
				for (i = 0; i < quantifier; i++) {
					if (result.length === 0) {
						throw new Error('Warning: pack(): Type X:' + ' outside of string');
					} else {
						result = result.substring(0, result.length - 1);
					}
				}
				break;

			case '@':
				// NUL-fill to absolute position
				if (quantifier === '*') {
					throw new Error('Warning: pack(): Type X: \'*\' ignored');
				}
				if (quantifier > result.length) {
					extraNullCount = quantifier - result.length;
					for (i = 0; i < extraNullCount; i++) {
						result += String.fromCharCode(0);
					}
				}
				if (quantifier < result.length) {
					result = result.substring(0, quantifier);
				}
				break;

			default:
				throw new Error('Warning:  pack() Type ' + instruction + ': unknown format code');
		}
	}
	if (argumentPointer < arguments.length) {
		throw new Error('Warning: pack(): ' + (arguments.length - argumentPointer) + ' arguments unused');
	}

	return result;
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