JSON with NaN (and Infinity/-Infinity)
======================================

Even though JSON is supported out of the box in modern browsers, none of them supports `NaN`, `Infinity` or `-Infinity` as values in JSON. This is because the JSON spec doesn't allow these values.

However sometimes it is useful to be able to pass all Javascript numbers around, so this project solves the problem by providing the functions `JSON.stringifyWithNaN` and `JSON.parseWithNaN`.

Strings created with `JSON.stringifyWithNaN` should be compatible with [Python's json module](https://docs.python.org/2/library/json.html) with `allow_nan=True` (which is the default).

Usage
-----

```
JSON.stringifyWithNaN(value[, replacer[, space]])
JSON.parseWithNaN(text[, reviver])
```

See the MDN article for [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) and [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) for more information about the parameters.