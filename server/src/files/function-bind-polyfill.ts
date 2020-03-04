export const functionBindPolyfill = `if (!Function.prototype.bind) {
	Function.prototype.bind = function(context) {
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1);

		if (typeof fn !== 'function') {
			throw new TypeError('Function.prototype.bind - context must be a valid function');
		}

		return function() {
			return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
		}
	}
}
`;
