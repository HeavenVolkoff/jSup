/**
 * Created by HeavenVolkoff on 16/10/14.
 */
function paramValidation(){
	if(arguments.length % 3 !== 0){
		throw Error('Function paramValidator has not enough parameters');
	} else{
		var length = arguments.length;
		var string = null;

		for(var count = 0; count < length; count++){
			if(typeof arguments[count + 2] !== 'string'){
				if(typeof arguments[count + 2] === 'object' && arguments[count + 2] !== null){
					if(!(arguments[count + 1] instanceof arguments[count + 2])){
						string += 'parameter ' + arguments[count] + ' must be an instance of ' + arguments[count + 2] +
							', received' + arguments[count + 1] + ' instance of: ' instanceof arguments[count + 1] + ' || ';
					}
				}else{
					throw Error('Can\'t check instanceOf ' + arguments[count + 2]);
				}
			}else{
				if(typeof arguments[count + 1] !== arguments[count + 2] || arguments[count + 1] === undefined || arguments[count + 1] === null){
					string += 'parameter ' + arguments[count] + ' must be of type: ' + arguments[count + 2] +
						', received' + arguments[count + 1] + ' of type: ' + typeof arguments[count + 1] + ' || ';
				}
			}

			count += 2;
		}

		if(string){
			return string;
		}else{
			return false;
		}
	}
}