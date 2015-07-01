(function() {
    "use strict";
    
    JSON.stringifyWithNaN = function stringifyWithNaN(obj) {
        switch(typeof obj) {
            case 'boolean':
                return obj.toString();
            case 'number':
                if(isFinite(obj)) {
                    return obj.toString();
                } else {
                    return isNaN(obj)? 'NaN': obj === Infinity? 'Infinity': '-Infinity';
                }
            case 'string':
                return encodeString(obj);
            case 'object':
                if(obj === null) {
                    return 'null';
                }
                if(obj instanceof Array) {
                    return '[' + obj.map(stringifyWithNaN).map(x => x === undefined? 'null': x).join(',') + ']';
                }
                if(obj instanceof Date) {
                    return encodeString(obj.toJSON());
                }
                let result = '{';
                let first = true;
                for(let k in obj) {
                    if(obj.hasOwnProperty(k)) {
                        let v = stringifyWithNaN(obj[k]);
                        if(v === undefined) {
                            continue;
                        }
                        if(first) {
                            first = false;
                        } else {
                            result += ',';
                        }
                        result += encodeString(k) + ':' + v;
                    }
                }
                result += '}';
                return result;
            case 'undefined':
            case 'symbol':
            case 'function':
            default:
                return undefined;
        }
        
        function encodeString(str) {
            return '"' + str.replace(/("|\\)/g, '\\$1') + '"';
        }
    };

    const values = [true, false, null, NaN, Infinity, -Infinity];

    const unescapeMap = {
        '"': '"',
        '\\': '\\',
        '/': '/',
        'b': '\b',
        'f': '\f',
        'n': '\n',
        'r': '\r',
        't': '\t'
    };
    
    JSON.parseWithNaN = function (str) {
        let ret = parseWithNaNWrapper(str, 0);
        let i = ret[0];
        let result = ret[1];
        
        i = skipWhiteSpace(str, i);
        if(i !== str.length) {
            assertToken(str, i);
        }
    
        return result;
        
        function assert(p, err) {
            if(!p) {
                throw new SyntaxError(err);
            }
            return true;
        }
        
        function assertNotAtEnd(str, i) {
            assert(i < str.length, 'Unexpected end of input');
            return true;
        }
        
        function assertToken(str, i, token) {
            assertNotAtEnd(str, i);
            assert(str[i] === token, 'Unexpected token: ' + str[i]);
            return true;
        }
        
        function digitFromChar(c, hex) {
            c = c.toLowerCase();
            if('0' <= c && c <= '9') {
                return c.charCodeAt(0) - '0'.charCodeAt(0);
            } else if(hex && 'a' <= c && c <= 'f') {
                return c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
            } else {
                return false;
            }
        }
        
        function parseWithNaNWrapper(str, i) {
            i = skipWhiteSpace(str, i);
            
            assertNotAtEnd(str, i);
            
            let matchedValues = values.filter(x => str.substr(i).indexOf(String(x)) === 0);
            if(matchedValues.length === 1) {
                let val = matchedValues[0];
                return [i + String(val).length, val];
            }
            
            switch(str[i]) {
                case '"':
                    return parseString(str, i);
                case '[':
                    return parseArray(str, i);
                case '{':
                    return parseObject(str, i);
                default: // number or invalid
                    return parseNumber(str, i);
            }
        }
        
        function isWhiteSpace(c) {
            switch(c) {
                case ' ':
                case '\t':
                case '\n':
                case '\v':
                case '\f':
                case '\r':
                    return true;
                default:
                    return false;
            }
        }
        
        function skipWhiteSpace(str, i) {
            for(; i < str.length && isWhiteSpace(str[i]); i++);
            return i;
        }
        
        function parseString(str, i) {
            i = skipWhiteSpace(str, i);
            
            assertToken(str, i, '"');
            
            let result = '';
            for(i++; assertNotAtEnd(str, i); i++) {
                if(str[i] === '"') {
                    i++;
                    break;
                } else if(str[i] === '\\') {
                    i++;
                    assertNotAtEnd(str, i);
                    
                    let v = unescapeMap[str[i]];
                    if(v) {
                        result += v;
                    } else {
                        if(str[i] === 'u') {
                            assertNotAtEnd(str, i + 4);
                            let num = 0;
                            i++;
                            for(let j = 0; j < 4; i++, j++) {
                                num *= 16;
                                
                                let d = digitFromChar(str[i], true);
                                if(d === false) {
                                    assertToken(str, i);
                                }
                                num += d;
                            }
                            result += String.fromCharCode(num);
                        } else {
                            assertToken(str, i);
                        }
                    }
                } else {
                    result += str[i];
                }
            }
            
            return [i, result];
        }

        function parseNumber(str, i) {
            let sign = 1;
            let integerPart = 0;
            let fractionalPart = 0;
            let fractionalDigits = 0;
            let exponentialSign = 1;
            let exponentialPart = 0;

            if(str[i] === '-') {
                sign = -1;
                i++;
            }

            let first = true;
            for(; i < str.length && '0' <= str[i] && str[i] <= '9'; i++) {
                if(first) {
                    first = false;
                    if(str[i] === '0') {
                        i++;
                        break;
                    }
                }
                integerPart *= 10;
                integerPart += digitFromChar(str[i]);
            }

            if(first) {
                assertToken(str, i);
            }

            if(i !== str.length) {
                if(str[i] === '.') {
                    i++;
                    for(; i < str.length && '0' <= str[i] && str[i] <= '9'; i++) {
                        fractionalPart *= 10;
                        fractionalPart += digitFromChar(str[i]);
                        fractionalDigits++;
                    }

                    assert(fractionalDigits > 0, 'Invalid number');
                }

                if(i !== str.length) {
                    if(str[i].toLowerCase() === 'e') {
                        i++;
                        assertNotAtEnd(str, i);
                        if(str[i] === '+') {
                            exponentialSign = 1;
                            i++;
                            assertNotAtEnd(str, i);
                        } else if(str[i] === '-') {
                            exponentialSign = -1;
                            i++;
                            assertNotAtEnd(str, i);
                        }

                        let first = true;
                        for(; i < str.length && '0' <= str[i] && str[i] <= '9'; i++) {
                            if(first) {
                                first = false;
                            }
                            exponentialPart *= 10;
                            exponentialPart += digitFromChar(str[i]);
                        }

                        if(first) {
                            assertToken(str, i);
                        }
                    }
                }
            }

            let num = sign * (integerPart + fractionalPart / Math.pow(10, fractionalDigits)) * Math.pow(10, exponentialSign * exponentialPart);
            return [i, num];
        }

        function parseContainer(str, i, startToken, endToken, data, parseItem) {
            assertToken(str, i, startToken);
            i++;

            let first = true;
            while(true) {
                i = skipWhiteSpace(str, i);
                assertNotAtEnd(str, i);

                if(str[i] === endToken) {
                    i++;
                    break;
                }

                if(first) {
                    first = false;
                } else {
                    assertToken(str, i, ',');
                    i++;
                }

                i = parseItem(str, i, data);
            }

            return [i, data];
        }

        function parseArray(str, i) {
            return parseContainer(str, i, '[', ']', [], function(str, i, data) {
                let ret = parseWithNaNWrapper(str, i);
                i = ret[0];
                let v = ret[1];

                data.push(v);

                return i;
            });
        }

        function parseObject(str, i) {
            return parseContainer(str, i, '{', '}', {}, function(str, i, data) {
                let ret = parseString(str, i);
                i = ret[0];
                let k = ret[1];

                 i = skipWhiteSpace(str, i);

                 assertToken(str, i, ':');
                 i++;

                 ret = parseWithNaNWrapper(str, i);
                 i = ret[0];
                 let v = ret[1];

                 data[k] = v;

                 return i;
            });
        }
    };
})();
