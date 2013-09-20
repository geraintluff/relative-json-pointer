var RelativeJsonPointer = (function (api) {

	api.encodeComponent = function encodeComponent(part) {
		return part.replace(/~/g, '~0').replace(/\//g, '~1');
	};
	api.decodeComponent: function decodeComponent(part) {
		return part.replace(/~1/g, '/').replace(/~0/g, '~');
	};
	api.resolveAbsolute = function resolveAbsolute(parts, data) {
		if (typeof parts === 'string') {
			parts = parts.split('/');
			if (parts.shift() !== '') {
				throw new Error("Absolute pointer must start with '/' (or be empty)");
			}
		}
		while (parts.length > 0) {
			var key = this.decodeComponent(parts.shift());
			if (!data || typeof data !== 'object') {
				return undefined;
			} else if (Array.isArray(data) && !/^[1-9][0-9]*$/.test(key)) {
				throw new Error("Cannot access object property of array data");
			}
			data = data[key];
		}
		return data;
	};
	api.resolve = function resolve(pointerSequence, data) {
		if (typeof pointerSequence !== 'object') {
			pointerSequence = [pointerSequence];
		}
		var parts = [];
		
		while (pointerSequence.length > 0) {
			var pointer = pointerSequence.shift();
			var leadingDigits = pointer.match(/^[0-9]*/)[0];
			var upSteps = (leadingDigits === '') ? 0 : parseInt(leadingDigits, 10);
			if (upSteps > parts.length) {
				throw new Error("Relative pointer goes up too far: " + pointer);
			}
			parts = parts.slice(0, parts.length - upSteps);
			pointer = pointer.substring(leadingDigits.length);
			
			if (pointer === "#") {
				if (pointerSequence.length > 0) {
					throw new Error("Only the last pointer can be a key/index reference");
				} else if (parts.length === 0) {
					throw new Error("Cannot access key/index of top level data");
				}
				var key = this.decodeComponent(parts.pop());
				var parentData = this.resolveAbsolute(parts, data);
				if (Array.isArray(parentData)) {
					if (!/^[1-9][0-9]*$/.test(key)) {
						throw new Error("Cannot access object property of array data");
					}
					return parseInt(key, 10);
				}
				return key;
			}
			
			var relativeParts = pointer.split('/');
			if (relativeParts.shift() !== '') {
				throw new Error("Pointer must start with '/' (or be empty): " + pointer);
			}
			parts = parts.concat(relativeParts);
		}
		
		return this.resolveAbsolute(parts, data);
	};

	return api;
})((typeof module !== 'undefined' && module.exports) ? exports : {});