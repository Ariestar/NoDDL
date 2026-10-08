// ==UserScript==
// @name         NoDDL (Not Only DDL) - 武大一体化平台助手
// @namespace    https://github.com/projectluojia/NoDDL
// @version      1.0.0
// @author       projectluojia
// @description  武汉大学人工智能学院一体化专业课平台 (115.156.107.145) 体验补完：死线警报、代码防丢、样例复制与 AI珞 联动
// @license      MIT
// @match        http://115.156.107.145/*
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  class FetchHttpClient {
    constructor(defaultHeaders = {}) {
      __publicField(this, "defaultHeaders");
      this.defaultHeaders = defaultHeaders;
    }
    async get(url, headers = {}) {
      const res = await fetch(url, {
        method: "GET",
        headers: { ...this.defaultHeaders, ...headers }
      });
      if (!res.ok) {
        throw new Error(`GET ${url} 响应错误: ${res.status}`);
      }
      return res.text();
    }
    async post(url, data, headers = {}) {
      let bodyStr;
      const finalHeaders = { ...this.defaultHeaders, ...headers };
      if (typeof data === "string") {
        bodyStr = data;
        if (!finalHeaders["Content-Type"]) {
          finalHeaders["Content-Type"] = "application/x-www-form-urlencoded";
        }
      } else {
        bodyStr = JSON.stringify(data);
        if (!finalHeaders["Content-Type"]) {
          finalHeaders["Content-Type"] = "application/json";
        }
      }
      const res = await fetch(url, {
        method: "POST",
        headers: finalHeaders,
        body: bodyStr
      });
      if (!res.ok) {
        throw new Error(`POST ${url} 响应错误: ${res.status}`);
      }
      return res.text();
    }
  }
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x2) {
    return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
  }
  function getAugmentedNamespace(n2) {
    if (n2.__esModule) return n2;
    var f2 = n2.default;
    if (typeof f2 == "function") {
      var a2 = function a3() {
        if (this instanceof a3) {
          return Reflect.construct(f2, arguments, this.constructor);
        }
        return f2.apply(this, arguments);
      };
      a2.prototype = f2.prototype;
    } else a2 = {};
    Object.defineProperty(a2, "__esModule", { value: true });
    Object.keys(n2).forEach(function(k2) {
      var d2 = Object.getOwnPropertyDescriptor(n2, k2);
      Object.defineProperty(a2, k2, d2.get ? d2 : {
        enumerable: true,
        get: function() {
          return n2[k2];
        }
      });
    });
    return a2;
  }
  var cryptoJs = { exports: {} };
  function commonjsRequire(path) {
    throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }
  var core = { exports: {} };
  const __viteBrowserExternal = {};
  const __viteBrowserExternal$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: __viteBrowserExternal
  }, Symbol.toStringTag, { value: "Module" }));
  const require$$0 = /* @__PURE__ */ getAugmentedNamespace(__viteBrowserExternal$1);
  var hasRequiredCore;
  function requireCore() {
    if (hasRequiredCore) return core.exports;
    hasRequiredCore = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory();
        }
      })(commonjsGlobal, function() {
        var CryptoJS2 = CryptoJS2 || function(Math2, undefined$1) {
          var crypto;
          if (typeof window !== "undefined" && window.crypto) {
            crypto = window.crypto;
          }
          if (typeof self !== "undefined" && self.crypto) {
            crypto = self.crypto;
          }
          if (typeof globalThis !== "undefined" && globalThis.crypto) {
            crypto = globalThis.crypto;
          }
          if (!crypto && typeof window !== "undefined" && window.msCrypto) {
            crypto = window.msCrypto;
          }
          if (!crypto && typeof commonjsGlobal !== "undefined" && commonjsGlobal.crypto) {
            crypto = commonjsGlobal.crypto;
          }
          if (!crypto && typeof commonjsRequire === "function") {
            try {
              crypto = require$$0;
            } catch (err) {
            }
          }
          var cryptoSecureRandomInt = function() {
            if (crypto) {
              if (typeof crypto.getRandomValues === "function") {
                try {
                  return crypto.getRandomValues(new Uint32Array(1))[0];
                } catch (err) {
                }
              }
              if (typeof crypto.randomBytes === "function") {
                try {
                  return crypto.randomBytes(4).readInt32LE();
                } catch (err) {
                }
              }
            }
            throw new Error("Native crypto module could not be used to get secure random number.");
          };
          var create = Object.create || /* @__PURE__ */ function() {
            function F2() {
            }
            return function(obj) {
              var subtype;
              F2.prototype = obj;
              subtype = new F2();
              F2.prototype = null;
              return subtype;
            };
          }();
          var C2 = {};
          var C_lib = C2.lib = {};
          var Base = C_lib.Base = /* @__PURE__ */ function() {
            return {
              /**
               * Creates a new object that inherits from this object.
               *
               * @param {Object} overrides Properties to copy into the new object.
               *
               * @return {Object} The new object.
               *
               * @static
               *
               * @example
               *
               *     var MyType = CryptoJS.lib.Base.extend({
               *         field: 'value',
               *
               *         method: function () {
               *         }
               *     });
               */
              extend: function(overrides) {
                var subtype = create(this);
                if (overrides) {
                  subtype.mixIn(overrides);
                }
                if (!subtype.hasOwnProperty("init") || this.init === subtype.init) {
                  subtype.init = function() {
                    subtype.$super.init.apply(this, arguments);
                  };
                }
                subtype.init.prototype = subtype;
                subtype.$super = this;
                return subtype;
              },
              /**
               * Extends this object and runs the init method.
               * Arguments to create() will be passed to init().
               *
               * @return {Object} The new object.
               *
               * @static
               *
               * @example
               *
               *     var instance = MyType.create();
               */
              create: function() {
                var instance = this.extend();
                instance.init.apply(instance, arguments);
                return instance;
              },
              /**
               * Initializes a newly created object.
               * Override this method to add some logic when your objects are created.
               *
               * @example
               *
               *     var MyType = CryptoJS.lib.Base.extend({
               *         init: function () {
               *             // ...
               *         }
               *     });
               */
              init: function() {
              },
              /**
               * Copies properties into this object.
               *
               * @param {Object} properties The properties to mix in.
               *
               * @example
               *
               *     MyType.mixIn({
               *         field: 'value'
               *     });
               */
              mixIn: function(properties) {
                for (var propertyName in properties) {
                  if (properties.hasOwnProperty(propertyName)) {
                    this[propertyName] = properties[propertyName];
                  }
                }
                if (properties.hasOwnProperty("toString")) {
                  this.toString = properties.toString;
                }
              },
              /**
               * Creates a copy of this object.
               *
               * @return {Object} The clone.
               *
               * @example
               *
               *     var clone = instance.clone();
               */
              clone: function() {
                return this.init.prototype.extend(this);
              }
            };
          }();
          var WordArray = C_lib.WordArray = Base.extend({
            /**
             * Initializes a newly created word array.
             *
             * @param {Array} words (Optional) An array of 32-bit words.
             * @param {number} sigBytes (Optional) The number of significant bytes in the words.
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.create();
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
             */
            init: function(words, sigBytes) {
              words = this.words = words || [];
              if (sigBytes != undefined$1) {
                this.sigBytes = sigBytes;
              } else {
                this.sigBytes = words.length * 4;
              }
            },
            /**
             * Converts this word array to a string.
             *
             * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
             *
             * @return {string} The stringified word array.
             *
             * @example
             *
             *     var string = wordArray + '';
             *     var string = wordArray.toString();
             *     var string = wordArray.toString(CryptoJS.enc.Utf8);
             */
            toString: function(encoder) {
              return (encoder || Hex).stringify(this);
            },
            /**
             * Concatenates a word array to this word array.
             *
             * @param {WordArray} wordArray The word array to append.
             *
             * @return {WordArray} This word array.
             *
             * @example
             *
             *     wordArray1.concat(wordArray2);
             */
            concat: function(wordArray) {
              var thisWords = this.words;
              var thatWords = wordArray.words;
              var thisSigBytes = this.sigBytes;
              var thatSigBytes = wordArray.sigBytes;
              this.clamp();
              if (thisSigBytes % 4) {
                for (var i2 = 0; i2 < thatSigBytes; i2++) {
                  var thatByte = thatWords[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255;
                  thisWords[thisSigBytes + i2 >>> 2] |= thatByte << 24 - (thisSigBytes + i2) % 4 * 8;
                }
              } else {
                for (var j2 = 0; j2 < thatSigBytes; j2 += 4) {
                  thisWords[thisSigBytes + j2 >>> 2] = thatWords[j2 >>> 2];
                }
              }
              this.sigBytes += thatSigBytes;
              return this;
            },
            /**
             * Removes insignificant bits.
             *
             * @example
             *
             *     wordArray.clamp();
             */
            clamp: function() {
              var words = this.words;
              var sigBytes = this.sigBytes;
              words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
              words.length = Math2.ceil(sigBytes / 4);
            },
            /**
             * Creates a copy of this word array.
             *
             * @return {WordArray} The clone.
             *
             * @example
             *
             *     var clone = wordArray.clone();
             */
            clone: function() {
              var clone = Base.clone.call(this);
              clone.words = this.words.slice(0);
              return clone;
            },
            /**
             * Creates a word array filled with random bytes.
             *
             * @param {number} nBytes The number of random bytes to generate.
             *
             * @return {WordArray} The random word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.random(16);
             */
            random: function(nBytes) {
              var words = [];
              for (var i2 = 0; i2 < nBytes; i2 += 4) {
                words.push(cryptoSecureRandomInt());
              }
              return new WordArray.init(words, nBytes);
            }
          });
          var C_enc = C2.enc = {};
          var Hex = C_enc.Hex = {
            /**
             * Converts a word array to a hex string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The hex string.
             *
             * @static
             *
             * @example
             *
             *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var hexChars = [];
              for (var i2 = 0; i2 < sigBytes; i2++) {
                var bite = words[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 15).toString(16));
              }
              return hexChars.join("");
            },
            /**
             * Converts a hex string to a word array.
             *
             * @param {string} hexStr The hex string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
             */
            parse: function(hexStr) {
              var hexStrLength = hexStr.length;
              var words = [];
              for (var i2 = 0; i2 < hexStrLength; i2 += 2) {
                words[i2 >>> 3] |= parseInt(hexStr.substr(i2, 2), 16) << 24 - i2 % 8 * 4;
              }
              return new WordArray.init(words, hexStrLength / 2);
            }
          };
          var Latin1 = C_enc.Latin1 = {
            /**
             * Converts a word array to a Latin1 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Latin1 string.
             *
             * @static
             *
             * @example
             *
             *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var latin1Chars = [];
              for (var i2 = 0; i2 < sigBytes; i2++) {
                var bite = words[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255;
                latin1Chars.push(String.fromCharCode(bite));
              }
              return latin1Chars.join("");
            },
            /**
             * Converts a Latin1 string to a word array.
             *
             * @param {string} latin1Str The Latin1 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
             */
            parse: function(latin1Str) {
              var latin1StrLength = latin1Str.length;
              var words = [];
              for (var i2 = 0; i2 < latin1StrLength; i2++) {
                words[i2 >>> 2] |= (latin1Str.charCodeAt(i2) & 255) << 24 - i2 % 4 * 8;
              }
              return new WordArray.init(words, latin1StrLength);
            }
          };
          var Utf8 = C_enc.Utf8 = {
            /**
             * Converts a word array to a UTF-8 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-8 string.
             *
             * @static
             *
             * @example
             *
             *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
             */
            stringify: function(wordArray) {
              try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
              } catch (e2) {
                throw new Error("Malformed UTF-8 data");
              }
            },
            /**
             * Converts a UTF-8 string to a word array.
             *
             * @param {string} utf8Str The UTF-8 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
             */
            parse: function(utf8Str) {
              return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
            }
          };
          var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
            /**
             * Resets this block algorithm's data buffer to its initial state.
             *
             * @example
             *
             *     bufferedBlockAlgorithm.reset();
             */
            reset: function() {
              this._data = new WordArray.init();
              this._nDataBytes = 0;
            },
            /**
             * Adds new data to this block algorithm's buffer.
             *
             * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
             *
             * @example
             *
             *     bufferedBlockAlgorithm._append('data');
             *     bufferedBlockAlgorithm._append(wordArray);
             */
            _append: function(data) {
              if (typeof data == "string") {
                data = Utf8.parse(data);
              }
              this._data.concat(data);
              this._nDataBytes += data.sigBytes;
            },
            /**
             * Processes available data blocks.
             *
             * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
             *
             * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
             *
             * @return {WordArray} The processed data.
             *
             * @example
             *
             *     var processedData = bufferedBlockAlgorithm._process();
             *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
             */
            _process: function(doFlush) {
              var processedWords;
              var data = this._data;
              var dataWords = data.words;
              var dataSigBytes = data.sigBytes;
              var blockSize = this.blockSize;
              var blockSizeBytes = blockSize * 4;
              var nBlocksReady = dataSigBytes / blockSizeBytes;
              if (doFlush) {
                nBlocksReady = Math2.ceil(nBlocksReady);
              } else {
                nBlocksReady = Math2.max((nBlocksReady | 0) - this._minBufferSize, 0);
              }
              var nWordsReady = nBlocksReady * blockSize;
              var nBytesReady = Math2.min(nWordsReady * 4, dataSigBytes);
              if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                  this._doProcessBlock(dataWords, offset);
                }
                processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
              }
              return new WordArray.init(processedWords, nBytesReady);
            },
            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = bufferedBlockAlgorithm.clone();
             */
            clone: function() {
              var clone = Base.clone.call(this);
              clone._data = this._data.clone();
              return clone;
            },
            _minBufferSize: 0
          });
          C_lib.Hasher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             */
            cfg: Base.extend(),
            /**
             * Initializes a newly created hasher.
             *
             * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
             *
             * @example
             *
             *     var hasher = CryptoJS.algo.SHA256.create();
             */
            init: function(cfg) {
              this.cfg = this.cfg.extend(cfg);
              this.reset();
            },
            /**
             * Resets this hasher to its initial state.
             *
             * @example
             *
             *     hasher.reset();
             */
            reset: function() {
              BufferedBlockAlgorithm.reset.call(this);
              this._doReset();
            },
            /**
             * Updates this hasher with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {Hasher} This hasher.
             *
             * @example
             *
             *     hasher.update('message');
             *     hasher.update(wordArray);
             */
            update: function(messageUpdate) {
              this._append(messageUpdate);
              this._process();
              return this;
            },
            /**
             * Finalizes the hash computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The hash.
             *
             * @example
             *
             *     var hash = hasher.finalize();
             *     var hash = hasher.finalize('message');
             *     var hash = hasher.finalize(wordArray);
             */
            finalize: function(messageUpdate) {
              if (messageUpdate) {
                this._append(messageUpdate);
              }
              var hash = this._doFinalize();
              return hash;
            },
            blockSize: 512 / 32,
            /**
             * Creates a shortcut function to a hasher's object interface.
             *
             * @param {Hasher} hasher The hasher to create a helper for.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
             */
            _createHelper: function(hasher) {
              return function(message, cfg) {
                return new hasher.init(cfg).finalize(message);
              };
            },
            /**
             * Creates a shortcut function to the HMAC's object interface.
             *
             * @param {Hasher} hasher The hasher to use in this HMAC helper.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
             */
            _createHmacHelper: function(hasher) {
              return function(message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
              };
            }
          });
          var C_algo = C2.algo = {};
          return C2;
        }(Math);
        return CryptoJS2;
      });
    })(core);
    return core.exports;
  }
  var x64Core = { exports: {} };
  var hasRequiredX64Core;
  function requireX64Core() {
    if (hasRequiredX64Core) return x64Core.exports;
    hasRequiredX64Core = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function(undefined$1) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var Base = C_lib.Base;
          var X32WordArray = C_lib.WordArray;
          var C_x64 = C2.x64 = {};
          C_x64.Word = Base.extend({
            /**
             * Initializes a newly created 64-bit word.
             *
             * @param {number} high The high 32 bits.
             * @param {number} low The low 32 bits.
             *
             * @example
             *
             *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
             */
            init: function(high, low) {
              this.high = high;
              this.low = low;
            }
            /**
             * Bitwise NOTs this word.
             *
             * @return {X64Word} A new x64-Word object after negating.
             *
             * @example
             *
             *     var negated = x64Word.not();
             */
            // not: function () {
            // var high = ~this.high;
            // var low = ~this.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Bitwise ANDs this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to AND with this word.
             *
             * @return {X64Word} A new x64-Word object after ANDing.
             *
             * @example
             *
             *     var anded = x64Word.and(anotherX64Word);
             */
            // and: function (word) {
            // var high = this.high & word.high;
            // var low = this.low & word.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Bitwise ORs this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to OR with this word.
             *
             * @return {X64Word} A new x64-Word object after ORing.
             *
             * @example
             *
             *     var ored = x64Word.or(anotherX64Word);
             */
            // or: function (word) {
            // var high = this.high | word.high;
            // var low = this.low | word.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Bitwise XORs this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to XOR with this word.
             *
             * @return {X64Word} A new x64-Word object after XORing.
             *
             * @example
             *
             *     var xored = x64Word.xor(anotherX64Word);
             */
            // xor: function (word) {
            // var high = this.high ^ word.high;
            // var low = this.low ^ word.low;
            // return X64Word.create(high, low);
            // },
            /**
             * Shifts this word n bits to the left.
             *
             * @param {number} n The number of bits to shift.
             *
             * @return {X64Word} A new x64-Word object after shifting.
             *
             * @example
             *
             *     var shifted = x64Word.shiftL(25);
             */
            // shiftL: function (n) {
            // if (n < 32) {
            // var high = (this.high << n) | (this.low >>> (32 - n));
            // var low = this.low << n;
            // } else {
            // var high = this.low << (n - 32);
            // var low = 0;
            // }
            // return X64Word.create(high, low);
            // },
            /**
             * Shifts this word n bits to the right.
             *
             * @param {number} n The number of bits to shift.
             *
             * @return {X64Word} A new x64-Word object after shifting.
             *
             * @example
             *
             *     var shifted = x64Word.shiftR(7);
             */
            // shiftR: function (n) {
            // if (n < 32) {
            // var low = (this.low >>> n) | (this.high << (32 - n));
            // var high = this.high >>> n;
            // } else {
            // var low = this.high >>> (n - 32);
            // var high = 0;
            // }
            // return X64Word.create(high, low);
            // },
            /**
             * Rotates this word n bits to the left.
             *
             * @param {number} n The number of bits to rotate.
             *
             * @return {X64Word} A new x64-Word object after rotating.
             *
             * @example
             *
             *     var rotated = x64Word.rotL(25);
             */
            // rotL: function (n) {
            // return this.shiftL(n).or(this.shiftR(64 - n));
            // },
            /**
             * Rotates this word n bits to the right.
             *
             * @param {number} n The number of bits to rotate.
             *
             * @return {X64Word} A new x64-Word object after rotating.
             *
             * @example
             *
             *     var rotated = x64Word.rotR(7);
             */
            // rotR: function (n) {
            // return this.shiftR(n).or(this.shiftL(64 - n));
            // },
            /**
             * Adds this word with the passed word.
             *
             * @param {X64Word} word The x64-Word to add with this word.
             *
             * @return {X64Word} A new x64-Word object after adding.
             *
             * @example
             *
             *     var added = x64Word.add(anotherX64Word);
             */
            // add: function (word) {
            // var low = (this.low + word.low) | 0;
            // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
            // var high = (this.high + word.high + carry) | 0;
            // return X64Word.create(high, low);
            // }
          });
          C_x64.WordArray = Base.extend({
            /**
             * Initializes a newly created word array.
             *
             * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
             * @param {number} sigBytes (Optional) The number of significant bytes in the words.
             *
             * @example
             *
             *     var wordArray = CryptoJS.x64.WordArray.create();
             *
             *     var wordArray = CryptoJS.x64.WordArray.create([
             *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
             *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
             *     ]);
             *
             *     var wordArray = CryptoJS.x64.WordArray.create([
             *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
             *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
             *     ], 10);
             */
            init: function(words, sigBytes) {
              words = this.words = words || [];
              if (sigBytes != undefined$1) {
                this.sigBytes = sigBytes;
              } else {
                this.sigBytes = words.length * 8;
              }
            },
            /**
             * Converts this 64-bit word array to a 32-bit word array.
             *
             * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
             *
             * @example
             *
             *     var x32WordArray = x64WordArray.toX32();
             */
            toX32: function() {
              var x64Words = this.words;
              var x64WordsLength = x64Words.length;
              var x32Words = [];
              for (var i2 = 0; i2 < x64WordsLength; i2++) {
                var x64Word = x64Words[i2];
                x32Words.push(x64Word.high);
                x32Words.push(x64Word.low);
              }
              return X32WordArray.create(x32Words, this.sigBytes);
            },
            /**
             * Creates a copy of this word array.
             *
             * @return {X64WordArray} The clone.
             *
             * @example
             *
             *     var clone = x64WordArray.clone();
             */
            clone: function() {
              var clone = Base.clone.call(this);
              var words = clone.words = this.words.slice(0);
              var wordsLength = words.length;
              for (var i2 = 0; i2 < wordsLength; i2++) {
                words[i2] = words[i2].clone();
              }
              return clone;
            }
          });
        })();
        return CryptoJS2;
      });
    })(x64Core);
    return x64Core.exports;
  }
  var libTypedarrays = { exports: {} };
  var hasRequiredLibTypedarrays;
  function requireLibTypedarrays() {
    if (hasRequiredLibTypedarrays) return libTypedarrays.exports;
    hasRequiredLibTypedarrays = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          if (typeof ArrayBuffer != "function") {
            return;
          }
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var superInit = WordArray.init;
          var subInit = WordArray.init = function(typedArray) {
            if (typedArray instanceof ArrayBuffer) {
              typedArray = new Uint8Array(typedArray);
            }
            if (typedArray instanceof Int8Array || typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray || typedArray instanceof Int16Array || typedArray instanceof Uint16Array || typedArray instanceof Int32Array || typedArray instanceof Uint32Array || typedArray instanceof Float32Array || typedArray instanceof Float64Array) {
              typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
            }
            if (typedArray instanceof Uint8Array) {
              var typedArrayByteLength = typedArray.byteLength;
              var words = [];
              for (var i2 = 0; i2 < typedArrayByteLength; i2++) {
                words[i2 >>> 2] |= typedArray[i2] << 24 - i2 % 4 * 8;
              }
              superInit.call(this, words, typedArrayByteLength);
            } else {
              superInit.apply(this, arguments);
            }
          };
          subInit.prototype = WordArray;
        })();
        return CryptoJS2.lib.WordArray;
      });
    })(libTypedarrays);
    return libTypedarrays.exports;
  }
  var encUtf16 = { exports: {} };
  var hasRequiredEncUtf16;
  function requireEncUtf16() {
    if (hasRequiredEncUtf16) return encUtf16.exports;
    hasRequiredEncUtf16 = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var C_enc = C2.enc;
          C_enc.Utf16 = C_enc.Utf16BE = {
            /**
             * Converts a word array to a UTF-16 BE string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-16 BE string.
             *
             * @static
             *
             * @example
             *
             *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var utf16Chars = [];
              for (var i2 = 0; i2 < sigBytes; i2 += 2) {
                var codePoint = words[i2 >>> 2] >>> 16 - i2 % 4 * 8 & 65535;
                utf16Chars.push(String.fromCharCode(codePoint));
              }
              return utf16Chars.join("");
            },
            /**
             * Converts a UTF-16 BE string to a word array.
             *
             * @param {string} utf16Str The UTF-16 BE string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
             */
            parse: function(utf16Str) {
              var utf16StrLength = utf16Str.length;
              var words = [];
              for (var i2 = 0; i2 < utf16StrLength; i2++) {
                words[i2 >>> 1] |= utf16Str.charCodeAt(i2) << 16 - i2 % 2 * 16;
              }
              return WordArray.create(words, utf16StrLength * 2);
            }
          };
          C_enc.Utf16LE = {
            /**
             * Converts a word array to a UTF-16 LE string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-16 LE string.
             *
             * @static
             *
             * @example
             *
             *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var utf16Chars = [];
              for (var i2 = 0; i2 < sigBytes; i2 += 2) {
                var codePoint = swapEndian(words[i2 >>> 2] >>> 16 - i2 % 4 * 8 & 65535);
                utf16Chars.push(String.fromCharCode(codePoint));
              }
              return utf16Chars.join("");
            },
            /**
             * Converts a UTF-16 LE string to a word array.
             *
             * @param {string} utf16Str The UTF-16 LE string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
             */
            parse: function(utf16Str) {
              var utf16StrLength = utf16Str.length;
              var words = [];
              for (var i2 = 0; i2 < utf16StrLength; i2++) {
                words[i2 >>> 1] |= swapEndian(utf16Str.charCodeAt(i2) << 16 - i2 % 2 * 16);
              }
              return WordArray.create(words, utf16StrLength * 2);
            }
          };
          function swapEndian(word) {
            return word << 8 & 4278255360 | word >>> 8 & 16711935;
          }
        })();
        return CryptoJS2.enc.Utf16;
      });
    })(encUtf16);
    return encUtf16.exports;
  }
  var encBase64 = { exports: {} };
  var hasRequiredEncBase64;
  function requireEncBase64() {
    if (hasRequiredEncBase64) return encBase64.exports;
    hasRequiredEncBase64 = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var C_enc = C2.enc;
          C_enc.Base64 = {
            /**
             * Converts a word array to a Base64 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Base64 string.
             *
             * @static
             *
             * @example
             *
             *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
             */
            stringify: function(wordArray) {
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var map = this._map;
              wordArray.clamp();
              var base64Chars = [];
              for (var i2 = 0; i2 < sigBytes; i2 += 3) {
                var byte1 = words[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255;
                var byte2 = words[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255;
                var byte3 = words[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255;
                var triplet = byte1 << 16 | byte2 << 8 | byte3;
                for (var j2 = 0; j2 < 4 && i2 + j2 * 0.75 < sigBytes; j2++) {
                  base64Chars.push(map.charAt(triplet >>> 6 * (3 - j2) & 63));
                }
              }
              var paddingChar = map.charAt(64);
              if (paddingChar) {
                while (base64Chars.length % 4) {
                  base64Chars.push(paddingChar);
                }
              }
              return base64Chars.join("");
            },
            /**
             * Converts a Base64 string to a word array.
             *
             * @param {string} base64Str The Base64 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
             */
            parse: function(base64Str) {
              var base64StrLength = base64Str.length;
              var map = this._map;
              var reverseMap = this._reverseMap;
              if (!reverseMap) {
                reverseMap = this._reverseMap = [];
                for (var j2 = 0; j2 < map.length; j2++) {
                  reverseMap[map.charCodeAt(j2)] = j2;
                }
              }
              var paddingChar = map.charAt(64);
              if (paddingChar) {
                var paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex !== -1) {
                  base64StrLength = paddingIndex;
                }
              }
              return parseLoop(base64Str, base64StrLength, reverseMap);
            },
            _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
          };
          function parseLoop(base64Str, base64StrLength, reverseMap) {
            var words = [];
            var nBytes = 0;
            for (var i2 = 0; i2 < base64StrLength; i2++) {
              if (i2 % 4) {
                var bits1 = reverseMap[base64Str.charCodeAt(i2 - 1)] << i2 % 4 * 2;
                var bits2 = reverseMap[base64Str.charCodeAt(i2)] >>> 6 - i2 % 4 * 2;
                var bitsCombined = bits1 | bits2;
                words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
                nBytes++;
              }
            }
            return WordArray.create(words, nBytes);
          }
        })();
        return CryptoJS2.enc.Base64;
      });
    })(encBase64);
    return encBase64.exports;
  }
  var encBase64url = { exports: {} };
  var hasRequiredEncBase64url;
  function requireEncBase64url() {
    if (hasRequiredEncBase64url) return encBase64url.exports;
    hasRequiredEncBase64url = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var C_enc = C2.enc;
          C_enc.Base64url = {
            /**
             * Converts a word array to a Base64url string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @param {boolean} urlSafe Whether to use url safe
             *
             * @return {string} The Base64url string.
             *
             * @static
             *
             * @example
             *
             *     var base64String = CryptoJS.enc.Base64url.stringify(wordArray);
             */
            stringify: function(wordArray, urlSafe) {
              if (urlSafe === void 0) {
                urlSafe = true;
              }
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;
              var map = urlSafe ? this._safe_map : this._map;
              wordArray.clamp();
              var base64Chars = [];
              for (var i2 = 0; i2 < sigBytes; i2 += 3) {
                var byte1 = words[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255;
                var byte2 = words[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255;
                var byte3 = words[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255;
                var triplet = byte1 << 16 | byte2 << 8 | byte3;
                for (var j2 = 0; j2 < 4 && i2 + j2 * 0.75 < sigBytes; j2++) {
                  base64Chars.push(map.charAt(triplet >>> 6 * (3 - j2) & 63));
                }
              }
              var paddingChar = map.charAt(64);
              if (paddingChar) {
                while (base64Chars.length % 4) {
                  base64Chars.push(paddingChar);
                }
              }
              return base64Chars.join("");
            },
            /**
             * Converts a Base64url string to a word array.
             *
             * @param {string} base64Str The Base64url string.
             *
             * @param {boolean} urlSafe Whether to use url safe
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Base64url.parse(base64String);
             */
            parse: function(base64Str, urlSafe) {
              if (urlSafe === void 0) {
                urlSafe = true;
              }
              var base64StrLength = base64Str.length;
              var map = urlSafe ? this._safe_map : this._map;
              var reverseMap = this._reverseMap;
              if (!reverseMap) {
                reverseMap = this._reverseMap = [];
                for (var j2 = 0; j2 < map.length; j2++) {
                  reverseMap[map.charCodeAt(j2)] = j2;
                }
              }
              var paddingChar = map.charAt(64);
              if (paddingChar) {
                var paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex !== -1) {
                  base64StrLength = paddingIndex;
                }
              }
              return parseLoop(base64Str, base64StrLength, reverseMap);
            },
            _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            _safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
          };
          function parseLoop(base64Str, base64StrLength, reverseMap) {
            var words = [];
            var nBytes = 0;
            for (var i2 = 0; i2 < base64StrLength; i2++) {
              if (i2 % 4) {
                var bits1 = reverseMap[base64Str.charCodeAt(i2 - 1)] << i2 % 4 * 2;
                var bits2 = reverseMap[base64Str.charCodeAt(i2)] >>> 6 - i2 % 4 * 2;
                var bitsCombined = bits1 | bits2;
                words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
                nBytes++;
              }
            }
            return WordArray.create(words, nBytes);
          }
        })();
        return CryptoJS2.enc.Base64url;
      });
    })(encBase64url);
    return encBase64url.exports;
  }
  var md5 = { exports: {} };
  var hasRequiredMd5;
  function requireMd5() {
    if (hasRequiredMd5) return md5.exports;
    hasRequiredMd5 = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function(Math2) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C2.algo;
          var T2 = [];
          (function() {
            for (var i2 = 0; i2 < 64; i2++) {
              T2[i2] = Math2.abs(Math2.sin(i2 + 1)) * 4294967296 | 0;
            }
          })();
          var MD5 = C_algo.MD5 = Hasher.extend({
            _doReset: function() {
              this._hash = new WordArray.init([
                1732584193,
                4023233417,
                2562383102,
                271733878
              ]);
            },
            _doProcessBlock: function(M2, offset) {
              for (var i2 = 0; i2 < 16; i2++) {
                var offset_i = offset + i2;
                var M_offset_i = M2[offset_i];
                M2[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
              }
              var H2 = this._hash.words;
              var M_offset_0 = M2[offset + 0];
              var M_offset_1 = M2[offset + 1];
              var M_offset_2 = M2[offset + 2];
              var M_offset_3 = M2[offset + 3];
              var M_offset_4 = M2[offset + 4];
              var M_offset_5 = M2[offset + 5];
              var M_offset_6 = M2[offset + 6];
              var M_offset_7 = M2[offset + 7];
              var M_offset_8 = M2[offset + 8];
              var M_offset_9 = M2[offset + 9];
              var M_offset_10 = M2[offset + 10];
              var M_offset_11 = M2[offset + 11];
              var M_offset_12 = M2[offset + 12];
              var M_offset_13 = M2[offset + 13];
              var M_offset_14 = M2[offset + 14];
              var M_offset_15 = M2[offset + 15];
              var a2 = H2[0];
              var b2 = H2[1];
              var c2 = H2[2];
              var d2 = H2[3];
              a2 = FF(a2, b2, c2, d2, M_offset_0, 7, T2[0]);
              d2 = FF(d2, a2, b2, c2, M_offset_1, 12, T2[1]);
              c2 = FF(c2, d2, a2, b2, M_offset_2, 17, T2[2]);
              b2 = FF(b2, c2, d2, a2, M_offset_3, 22, T2[3]);
              a2 = FF(a2, b2, c2, d2, M_offset_4, 7, T2[4]);
              d2 = FF(d2, a2, b2, c2, M_offset_5, 12, T2[5]);
              c2 = FF(c2, d2, a2, b2, M_offset_6, 17, T2[6]);
              b2 = FF(b2, c2, d2, a2, M_offset_7, 22, T2[7]);
              a2 = FF(a2, b2, c2, d2, M_offset_8, 7, T2[8]);
              d2 = FF(d2, a2, b2, c2, M_offset_9, 12, T2[9]);
              c2 = FF(c2, d2, a2, b2, M_offset_10, 17, T2[10]);
              b2 = FF(b2, c2, d2, a2, M_offset_11, 22, T2[11]);
              a2 = FF(a2, b2, c2, d2, M_offset_12, 7, T2[12]);
              d2 = FF(d2, a2, b2, c2, M_offset_13, 12, T2[13]);
              c2 = FF(c2, d2, a2, b2, M_offset_14, 17, T2[14]);
              b2 = FF(b2, c2, d2, a2, M_offset_15, 22, T2[15]);
              a2 = GG(a2, b2, c2, d2, M_offset_1, 5, T2[16]);
              d2 = GG(d2, a2, b2, c2, M_offset_6, 9, T2[17]);
              c2 = GG(c2, d2, a2, b2, M_offset_11, 14, T2[18]);
              b2 = GG(b2, c2, d2, a2, M_offset_0, 20, T2[19]);
              a2 = GG(a2, b2, c2, d2, M_offset_5, 5, T2[20]);
              d2 = GG(d2, a2, b2, c2, M_offset_10, 9, T2[21]);
              c2 = GG(c2, d2, a2, b2, M_offset_15, 14, T2[22]);
              b2 = GG(b2, c2, d2, a2, M_offset_4, 20, T2[23]);
              a2 = GG(a2, b2, c2, d2, M_offset_9, 5, T2[24]);
              d2 = GG(d2, a2, b2, c2, M_offset_14, 9, T2[25]);
              c2 = GG(c2, d2, a2, b2, M_offset_3, 14, T2[26]);
              b2 = GG(b2, c2, d2, a2, M_offset_8, 20, T2[27]);
              a2 = GG(a2, b2, c2, d2, M_offset_13, 5, T2[28]);
              d2 = GG(d2, a2, b2, c2, M_offset_2, 9, T2[29]);
              c2 = GG(c2, d2, a2, b2, M_offset_7, 14, T2[30]);
              b2 = GG(b2, c2, d2, a2, M_offset_12, 20, T2[31]);
              a2 = HH(a2, b2, c2, d2, M_offset_5, 4, T2[32]);
              d2 = HH(d2, a2, b2, c2, M_offset_8, 11, T2[33]);
              c2 = HH(c2, d2, a2, b2, M_offset_11, 16, T2[34]);
              b2 = HH(b2, c2, d2, a2, M_offset_14, 23, T2[35]);
              a2 = HH(a2, b2, c2, d2, M_offset_1, 4, T2[36]);
              d2 = HH(d2, a2, b2, c2, M_offset_4, 11, T2[37]);
              c2 = HH(c2, d2, a2, b2, M_offset_7, 16, T2[38]);
              b2 = HH(b2, c2, d2, a2, M_offset_10, 23, T2[39]);
              a2 = HH(a2, b2, c2, d2, M_offset_13, 4, T2[40]);
              d2 = HH(d2, a2, b2, c2, M_offset_0, 11, T2[41]);
              c2 = HH(c2, d2, a2, b2, M_offset_3, 16, T2[42]);
              b2 = HH(b2, c2, d2, a2, M_offset_6, 23, T2[43]);
              a2 = HH(a2, b2, c2, d2, M_offset_9, 4, T2[44]);
              d2 = HH(d2, a2, b2, c2, M_offset_12, 11, T2[45]);
              c2 = HH(c2, d2, a2, b2, M_offset_15, 16, T2[46]);
              b2 = HH(b2, c2, d2, a2, M_offset_2, 23, T2[47]);
              a2 = II(a2, b2, c2, d2, M_offset_0, 6, T2[48]);
              d2 = II(d2, a2, b2, c2, M_offset_7, 10, T2[49]);
              c2 = II(c2, d2, a2, b2, M_offset_14, 15, T2[50]);
              b2 = II(b2, c2, d2, a2, M_offset_5, 21, T2[51]);
              a2 = II(a2, b2, c2, d2, M_offset_12, 6, T2[52]);
              d2 = II(d2, a2, b2, c2, M_offset_3, 10, T2[53]);
              c2 = II(c2, d2, a2, b2, M_offset_10, 15, T2[54]);
              b2 = II(b2, c2, d2, a2, M_offset_1, 21, T2[55]);
              a2 = II(a2, b2, c2, d2, M_offset_8, 6, T2[56]);
              d2 = II(d2, a2, b2, c2, M_offset_15, 10, T2[57]);
              c2 = II(c2, d2, a2, b2, M_offset_6, 15, T2[58]);
              b2 = II(b2, c2, d2, a2, M_offset_13, 21, T2[59]);
              a2 = II(a2, b2, c2, d2, M_offset_4, 6, T2[60]);
              d2 = II(d2, a2, b2, c2, M_offset_11, 10, T2[61]);
              c2 = II(c2, d2, a2, b2, M_offset_2, 15, T2[62]);
              b2 = II(b2, c2, d2, a2, M_offset_9, 21, T2[63]);
              H2[0] = H2[0] + a2 | 0;
              H2[1] = H2[1] + b2 | 0;
              H2[2] = H2[2] + c2 | 0;
              H2[3] = H2[3] + d2 | 0;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              var nBitsTotalH = Math2.floor(nBitsTotal / 4294967296);
              var nBitsTotalL = nBitsTotal;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = (nBitsTotalH << 8 | nBitsTotalH >>> 24) & 16711935 | (nBitsTotalH << 24 | nBitsTotalH >>> 8) & 4278255360;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotalL << 8 | nBitsTotalL >>> 24) & 16711935 | (nBitsTotalL << 24 | nBitsTotalL >>> 8) & 4278255360;
              data.sigBytes = (dataWords.length + 1) * 4;
              this._process();
              var hash = this._hash;
              var H2 = hash.words;
              for (var i2 = 0; i2 < 4; i2++) {
                var H_i = H2[i2];
                H2[i2] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
              }
              return hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          function FF(a2, b2, c2, d2, x2, s2, t2) {
            var n2 = a2 + (b2 & c2 | ~b2 & d2) + x2 + t2;
            return (n2 << s2 | n2 >>> 32 - s2) + b2;
          }
          function GG(a2, b2, c2, d2, x2, s2, t2) {
            var n2 = a2 + (b2 & d2 | c2 & ~d2) + x2 + t2;
            return (n2 << s2 | n2 >>> 32 - s2) + b2;
          }
          function HH(a2, b2, c2, d2, x2, s2, t2) {
            var n2 = a2 + (b2 ^ c2 ^ d2) + x2 + t2;
            return (n2 << s2 | n2 >>> 32 - s2) + b2;
          }
          function II(a2, b2, c2, d2, x2, s2, t2) {
            var n2 = a2 + (c2 ^ (b2 | ~d2)) + x2 + t2;
            return (n2 << s2 | n2 >>> 32 - s2) + b2;
          }
          C2.MD5 = Hasher._createHelper(MD5);
          C2.HmacMD5 = Hasher._createHmacHelper(MD5);
        })(Math);
        return CryptoJS2.MD5;
      });
    })(md5);
    return md5.exports;
  }
  var sha1 = { exports: {} };
  var hasRequiredSha1;
  function requireSha1() {
    if (hasRequiredSha1) return sha1.exports;
    hasRequiredSha1 = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C2.algo;
          var W = [];
          var SHA1 = C_algo.SHA1 = Hasher.extend({
            _doReset: function() {
              this._hash = new WordArray.init([
                1732584193,
                4023233417,
                2562383102,
                271733878,
                3285377520
              ]);
            },
            _doProcessBlock: function(M2, offset) {
              var H2 = this._hash.words;
              var a2 = H2[0];
              var b2 = H2[1];
              var c2 = H2[2];
              var d2 = H2[3];
              var e2 = H2[4];
              for (var i2 = 0; i2 < 80; i2++) {
                if (i2 < 16) {
                  W[i2] = M2[offset + i2] | 0;
                } else {
                  var n2 = W[i2 - 3] ^ W[i2 - 8] ^ W[i2 - 14] ^ W[i2 - 16];
                  W[i2] = n2 << 1 | n2 >>> 31;
                }
                var t2 = (a2 << 5 | a2 >>> 27) + e2 + W[i2];
                if (i2 < 20) {
                  t2 += (b2 & c2 | ~b2 & d2) + 1518500249;
                } else if (i2 < 40) {
                  t2 += (b2 ^ c2 ^ d2) + 1859775393;
                } else if (i2 < 60) {
                  t2 += (b2 & c2 | b2 & d2 | c2 & d2) - 1894007588;
                } else {
                  t2 += (b2 ^ c2 ^ d2) - 899497514;
                }
                e2 = d2;
                d2 = c2;
                c2 = b2 << 30 | b2 >>> 2;
                b2 = a2;
                a2 = t2;
              }
              H2[0] = H2[0] + a2 | 0;
              H2[1] = H2[1] + b2 | 0;
              H2[2] = H2[2] + c2 | 0;
              H2[3] = H2[3] + d2 | 0;
              H2[4] = H2[4] + e2 | 0;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
              data.sigBytes = dataWords.length * 4;
              this._process();
              return this._hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          C2.SHA1 = Hasher._createHelper(SHA1);
          C2.HmacSHA1 = Hasher._createHmacHelper(SHA1);
        })();
        return CryptoJS2.SHA1;
      });
    })(sha1);
    return sha1.exports;
  }
  var sha256 = { exports: {} };
  var hasRequiredSha256;
  function requireSha256() {
    if (hasRequiredSha256) return sha256.exports;
    hasRequiredSha256 = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function(Math2) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C2.algo;
          var H2 = [];
          var K = [];
          (function() {
            function isPrime(n3) {
              var sqrtN = Math2.sqrt(n3);
              for (var factor = 2; factor <= sqrtN; factor++) {
                if (!(n3 % factor)) {
                  return false;
                }
              }
              return true;
            }
            function getFractionalBits(n3) {
              return (n3 - (n3 | 0)) * 4294967296 | 0;
            }
            var n2 = 2;
            var nPrime = 0;
            while (nPrime < 64) {
              if (isPrime(n2)) {
                if (nPrime < 8) {
                  H2[nPrime] = getFractionalBits(Math2.pow(n2, 1 / 2));
                }
                K[nPrime] = getFractionalBits(Math2.pow(n2, 1 / 3));
                nPrime++;
              }
              n2++;
            }
          })();
          var W = [];
          var SHA256 = C_algo.SHA256 = Hasher.extend({
            _doReset: function() {
              this._hash = new WordArray.init(H2.slice(0));
            },
            _doProcessBlock: function(M2, offset) {
              var H3 = this._hash.words;
              var a2 = H3[0];
              var b2 = H3[1];
              var c2 = H3[2];
              var d2 = H3[3];
              var e2 = H3[4];
              var f2 = H3[5];
              var g2 = H3[6];
              var h2 = H3[7];
              for (var i2 = 0; i2 < 64; i2++) {
                if (i2 < 16) {
                  W[i2] = M2[offset + i2] | 0;
                } else {
                  var gamma0x = W[i2 - 15];
                  var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
                  var gamma1x = W[i2 - 2];
                  var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
                  W[i2] = gamma0 + W[i2 - 7] + gamma1 + W[i2 - 16];
                }
                var ch = e2 & f2 ^ ~e2 & g2;
                var maj = a2 & b2 ^ a2 & c2 ^ b2 & c2;
                var sigma0 = (a2 << 30 | a2 >>> 2) ^ (a2 << 19 | a2 >>> 13) ^ (a2 << 10 | a2 >>> 22);
                var sigma1 = (e2 << 26 | e2 >>> 6) ^ (e2 << 21 | e2 >>> 11) ^ (e2 << 7 | e2 >>> 25);
                var t1 = h2 + sigma1 + ch + K[i2] + W[i2];
                var t2 = sigma0 + maj;
                h2 = g2;
                g2 = f2;
                f2 = e2;
                e2 = d2 + t1 | 0;
                d2 = c2;
                c2 = b2;
                b2 = a2;
                a2 = t1 + t2 | 0;
              }
              H3[0] = H3[0] + a2 | 0;
              H3[1] = H3[1] + b2 | 0;
              H3[2] = H3[2] + c2 | 0;
              H3[3] = H3[3] + d2 | 0;
              H3[4] = H3[4] + e2 | 0;
              H3[5] = H3[5] + f2 | 0;
              H3[6] = H3[6] + g2 | 0;
              H3[7] = H3[7] + h2 | 0;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math2.floor(nBitsTotal / 4294967296);
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
              data.sigBytes = dataWords.length * 4;
              this._process();
              return this._hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          C2.SHA256 = Hasher._createHelper(SHA256);
          C2.HmacSHA256 = Hasher._createHmacHelper(SHA256);
        })(Math);
        return CryptoJS2.SHA256;
      });
    })(sha256);
    return sha256.exports;
  }
  var sha224 = { exports: {} };
  var hasRequiredSha224;
  function requireSha224() {
    if (hasRequiredSha224) return sha224.exports;
    hasRequiredSha224 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireSha256());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var C_algo = C2.algo;
          var SHA256 = C_algo.SHA256;
          var SHA224 = C_algo.SHA224 = SHA256.extend({
            _doReset: function() {
              this._hash = new WordArray.init([
                3238371032,
                914150663,
                812702999,
                4144912697,
                4290775857,
                1750603025,
                1694076839,
                3204075428
              ]);
            },
            _doFinalize: function() {
              var hash = SHA256._doFinalize.call(this);
              hash.sigBytes -= 4;
              return hash;
            }
          });
          C2.SHA224 = SHA256._createHelper(SHA224);
          C2.HmacSHA224 = SHA256._createHmacHelper(SHA224);
        })();
        return CryptoJS2.SHA224;
      });
    })(sha224);
    return sha224.exports;
  }
  var sha512 = { exports: {} };
  var hasRequiredSha512;
  function requireSha512() {
    if (hasRequiredSha512) return sha512.exports;
    hasRequiredSha512 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireX64Core());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var Hasher = C_lib.Hasher;
          var C_x64 = C2.x64;
          var X64Word = C_x64.Word;
          var X64WordArray = C_x64.WordArray;
          var C_algo = C2.algo;
          function X64Word_create() {
            return X64Word.create.apply(X64Word, arguments);
          }
          var K = [
            X64Word_create(1116352408, 3609767458),
            X64Word_create(1899447441, 602891725),
            X64Word_create(3049323471, 3964484399),
            X64Word_create(3921009573, 2173295548),
            X64Word_create(961987163, 4081628472),
            X64Word_create(1508970993, 3053834265),
            X64Word_create(2453635748, 2937671579),
            X64Word_create(2870763221, 3664609560),
            X64Word_create(3624381080, 2734883394),
            X64Word_create(310598401, 1164996542),
            X64Word_create(607225278, 1323610764),
            X64Word_create(1426881987, 3590304994),
            X64Word_create(1925078388, 4068182383),
            X64Word_create(2162078206, 991336113),
            X64Word_create(2614888103, 633803317),
            X64Word_create(3248222580, 3479774868),
            X64Word_create(3835390401, 2666613458),
            X64Word_create(4022224774, 944711139),
            X64Word_create(264347078, 2341262773),
            X64Word_create(604807628, 2007800933),
            X64Word_create(770255983, 1495990901),
            X64Word_create(1249150122, 1856431235),
            X64Word_create(1555081692, 3175218132),
            X64Word_create(1996064986, 2198950837),
            X64Word_create(2554220882, 3999719339),
            X64Word_create(2821834349, 766784016),
            X64Word_create(2952996808, 2566594879),
            X64Word_create(3210313671, 3203337956),
            X64Word_create(3336571891, 1034457026),
            X64Word_create(3584528711, 2466948901),
            X64Word_create(113926993, 3758326383),
            X64Word_create(338241895, 168717936),
            X64Word_create(666307205, 1188179964),
            X64Word_create(773529912, 1546045734),
            X64Word_create(1294757372, 1522805485),
            X64Word_create(1396182291, 2643833823),
            X64Word_create(1695183700, 2343527390),
            X64Word_create(1986661051, 1014477480),
            X64Word_create(2177026350, 1206759142),
            X64Word_create(2456956037, 344077627),
            X64Word_create(2730485921, 1290863460),
            X64Word_create(2820302411, 3158454273),
            X64Word_create(3259730800, 3505952657),
            X64Word_create(3345764771, 106217008),
            X64Word_create(3516065817, 3606008344),
            X64Word_create(3600352804, 1432725776),
            X64Word_create(4094571909, 1467031594),
            X64Word_create(275423344, 851169720),
            X64Word_create(430227734, 3100823752),
            X64Word_create(506948616, 1363258195),
            X64Word_create(659060556, 3750685593),
            X64Word_create(883997877, 3785050280),
            X64Word_create(958139571, 3318307427),
            X64Word_create(1322822218, 3812723403),
            X64Word_create(1537002063, 2003034995),
            X64Word_create(1747873779, 3602036899),
            X64Word_create(1955562222, 1575990012),
            X64Word_create(2024104815, 1125592928),
            X64Word_create(2227730452, 2716904306),
            X64Word_create(2361852424, 442776044),
            X64Word_create(2428436474, 593698344),
            X64Word_create(2756734187, 3733110249),
            X64Word_create(3204031479, 2999351573),
            X64Word_create(3329325298, 3815920427),
            X64Word_create(3391569614, 3928383900),
            X64Word_create(3515267271, 566280711),
            X64Word_create(3940187606, 3454069534),
            X64Word_create(4118630271, 4000239992),
            X64Word_create(116418474, 1914138554),
            X64Word_create(174292421, 2731055270),
            X64Word_create(289380356, 3203993006),
            X64Word_create(460393269, 320620315),
            X64Word_create(685471733, 587496836),
            X64Word_create(852142971, 1086792851),
            X64Word_create(1017036298, 365543100),
            X64Word_create(1126000580, 2618297676),
            X64Word_create(1288033470, 3409855158),
            X64Word_create(1501505948, 4234509866),
            X64Word_create(1607167915, 987167468),
            X64Word_create(1816402316, 1246189591)
          ];
          var W = [];
          (function() {
            for (var i2 = 0; i2 < 80; i2++) {
              W[i2] = X64Word_create();
            }
          })();
          var SHA512 = C_algo.SHA512 = Hasher.extend({
            _doReset: function() {
              this._hash = new X64WordArray.init([
                new X64Word.init(1779033703, 4089235720),
                new X64Word.init(3144134277, 2227873595),
                new X64Word.init(1013904242, 4271175723),
                new X64Word.init(2773480762, 1595750129),
                new X64Word.init(1359893119, 2917565137),
                new X64Word.init(2600822924, 725511199),
                new X64Word.init(528734635, 4215389547),
                new X64Word.init(1541459225, 327033209)
              ]);
            },
            _doProcessBlock: function(M2, offset) {
              var H2 = this._hash.words;
              var H0 = H2[0];
              var H1 = H2[1];
              var H22 = H2[2];
              var H3 = H2[3];
              var H4 = H2[4];
              var H5 = H2[5];
              var H6 = H2[6];
              var H7 = H2[7];
              var H0h = H0.high;
              var H0l = H0.low;
              var H1h = H1.high;
              var H1l = H1.low;
              var H2h = H22.high;
              var H2l = H22.low;
              var H3h = H3.high;
              var H3l = H3.low;
              var H4h = H4.high;
              var H4l = H4.low;
              var H5h = H5.high;
              var H5l = H5.low;
              var H6h = H6.high;
              var H6l = H6.low;
              var H7h = H7.high;
              var H7l = H7.low;
              var ah = H0h;
              var al = H0l;
              var bh = H1h;
              var bl = H1l;
              var ch = H2h;
              var cl = H2l;
              var dh = H3h;
              var dl = H3l;
              var eh = H4h;
              var el = H4l;
              var fh = H5h;
              var fl = H5l;
              var gh = H6h;
              var gl = H6l;
              var hh = H7h;
              var hl = H7l;
              for (var i2 = 0; i2 < 80; i2++) {
                var Wil;
                var Wih;
                var Wi = W[i2];
                if (i2 < 16) {
                  Wih = Wi.high = M2[offset + i2 * 2] | 0;
                  Wil = Wi.low = M2[offset + i2 * 2 + 1] | 0;
                } else {
                  var gamma0x = W[i2 - 15];
                  var gamma0xh = gamma0x.high;
                  var gamma0xl = gamma0x.low;
                  var gamma0h = (gamma0xh >>> 1 | gamma0xl << 31) ^ (gamma0xh >>> 8 | gamma0xl << 24) ^ gamma0xh >>> 7;
                  var gamma0l = (gamma0xl >>> 1 | gamma0xh << 31) ^ (gamma0xl >>> 8 | gamma0xh << 24) ^ (gamma0xl >>> 7 | gamma0xh << 25);
                  var gamma1x = W[i2 - 2];
                  var gamma1xh = gamma1x.high;
                  var gamma1xl = gamma1x.low;
                  var gamma1h = (gamma1xh >>> 19 | gamma1xl << 13) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
                  var gamma1l = (gamma1xl >>> 19 | gamma1xh << 13) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xl >>> 6 | gamma1xh << 26);
                  var Wi7 = W[i2 - 7];
                  var Wi7h = Wi7.high;
                  var Wi7l = Wi7.low;
                  var Wi16 = W[i2 - 16];
                  var Wi16h = Wi16.high;
                  var Wi16l = Wi16.low;
                  Wil = gamma0l + Wi7l;
                  Wih = gamma0h + Wi7h + (Wil >>> 0 < gamma0l >>> 0 ? 1 : 0);
                  Wil = Wil + gamma1l;
                  Wih = Wih + gamma1h + (Wil >>> 0 < gamma1l >>> 0 ? 1 : 0);
                  Wil = Wil + Wi16l;
                  Wih = Wih + Wi16h + (Wil >>> 0 < Wi16l >>> 0 ? 1 : 0);
                  Wi.high = Wih;
                  Wi.low = Wil;
                }
                var chh = eh & fh ^ ~eh & gh;
                var chl = el & fl ^ ~el & gl;
                var majh = ah & bh ^ ah & ch ^ bh & ch;
                var majl = al & bl ^ al & cl ^ bl & cl;
                var sigma0h = (ah >>> 28 | al << 4) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
                var sigma0l = (al >>> 28 | ah << 4) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
                var sigma1h = (eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9);
                var sigma1l = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9);
                var Ki = K[i2];
                var Kih = Ki.high;
                var Kil = Ki.low;
                var t1l = hl + sigma1l;
                var t1h = hh + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
                var t1l = t1l + chl;
                var t1h = t1h + chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
                var t1l = t1l + Kil;
                var t1h = t1h + Kih + (t1l >>> 0 < Kil >>> 0 ? 1 : 0);
                var t1l = t1l + Wil;
                var t1h = t1h + Wih + (t1l >>> 0 < Wil >>> 0 ? 1 : 0);
                var t2l = sigma0l + majl;
                var t2h = sigma0h + majh + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
                hh = gh;
                hl = gl;
                gh = fh;
                gl = fl;
                fh = eh;
                fl = el;
                el = dl + t1l | 0;
                eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
                dh = ch;
                dl = cl;
                ch = bh;
                cl = bl;
                bh = ah;
                bl = al;
                al = t1l + t2l | 0;
                ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
              }
              H0l = H0.low = H0l + al;
              H0.high = H0h + ah + (H0l >>> 0 < al >>> 0 ? 1 : 0);
              H1l = H1.low = H1l + bl;
              H1.high = H1h + bh + (H1l >>> 0 < bl >>> 0 ? 1 : 0);
              H2l = H22.low = H2l + cl;
              H22.high = H2h + ch + (H2l >>> 0 < cl >>> 0 ? 1 : 0);
              H3l = H3.low = H3l + dl;
              H3.high = H3h + dh + (H3l >>> 0 < dl >>> 0 ? 1 : 0);
              H4l = H4.low = H4l + el;
              H4.high = H4h + eh + (H4l >>> 0 < el >>> 0 ? 1 : 0);
              H5l = H5.low = H5l + fl;
              H5.high = H5h + fh + (H5l >>> 0 < fl >>> 0 ? 1 : 0);
              H6l = H6.low = H6l + gl;
              H6.high = H6h + gh + (H6l >>> 0 < gl >>> 0 ? 1 : 0);
              H7l = H7.low = H7l + hl;
              H7.high = H7h + hh + (H7l >>> 0 < hl >>> 0 ? 1 : 0);
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 128 >>> 10 << 5) + 30] = Math.floor(nBitsTotal / 4294967296);
              dataWords[(nBitsLeft + 128 >>> 10 << 5) + 31] = nBitsTotal;
              data.sigBytes = dataWords.length * 4;
              this._process();
              var hash = this._hash.toX32();
              return hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            },
            blockSize: 1024 / 32
          });
          C2.SHA512 = Hasher._createHelper(SHA512);
          C2.HmacSHA512 = Hasher._createHmacHelper(SHA512);
        })();
        return CryptoJS2.SHA512;
      });
    })(sha512);
    return sha512.exports;
  }
  var sha384 = { exports: {} };
  var hasRequiredSha384;
  function requireSha384() {
    if (hasRequiredSha384) return sha384.exports;
    hasRequiredSha384 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireX64Core(), requireSha512());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_x64 = C2.x64;
          var X64Word = C_x64.Word;
          var X64WordArray = C_x64.WordArray;
          var C_algo = C2.algo;
          var SHA512 = C_algo.SHA512;
          var SHA384 = C_algo.SHA384 = SHA512.extend({
            _doReset: function() {
              this._hash = new X64WordArray.init([
                new X64Word.init(3418070365, 3238371032),
                new X64Word.init(1654270250, 914150663),
                new X64Word.init(2438529370, 812702999),
                new X64Word.init(355462360, 4144912697),
                new X64Word.init(1731405415, 4290775857),
                new X64Word.init(2394180231, 1750603025),
                new X64Word.init(3675008525, 1694076839),
                new X64Word.init(1203062813, 3204075428)
              ]);
            },
            _doFinalize: function() {
              var hash = SHA512._doFinalize.call(this);
              hash.sigBytes -= 16;
              return hash;
            }
          });
          C2.SHA384 = SHA512._createHelper(SHA384);
          C2.HmacSHA384 = SHA512._createHmacHelper(SHA384);
        })();
        return CryptoJS2.SHA384;
      });
    })(sha384);
    return sha384.exports;
  }
  var sha3 = { exports: {} };
  var hasRequiredSha3;
  function requireSha3() {
    if (hasRequiredSha3) return sha3.exports;
    hasRequiredSha3 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireX64Core());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function(Math2) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_x64 = C2.x64;
          var X64Word = C_x64.Word;
          var C_algo = C2.algo;
          var RHO_OFFSETS = [];
          var PI_INDEXES = [];
          var ROUND_CONSTANTS = [];
          (function() {
            var x2 = 1, y2 = 0;
            for (var t2 = 0; t2 < 24; t2++) {
              RHO_OFFSETS[x2 + 5 * y2] = (t2 + 1) * (t2 + 2) / 2 % 64;
              var newX = y2 % 5;
              var newY = (2 * x2 + 3 * y2) % 5;
              x2 = newX;
              y2 = newY;
            }
            for (var x2 = 0; x2 < 5; x2++) {
              for (var y2 = 0; y2 < 5; y2++) {
                PI_INDEXES[x2 + 5 * y2] = y2 + (2 * x2 + 3 * y2) % 5 * 5;
              }
            }
            var LFSR = 1;
            for (var i2 = 0; i2 < 24; i2++) {
              var roundConstantMsw = 0;
              var roundConstantLsw = 0;
              for (var j2 = 0; j2 < 7; j2++) {
                if (LFSR & 1) {
                  var bitPosition = (1 << j2) - 1;
                  if (bitPosition < 32) {
                    roundConstantLsw ^= 1 << bitPosition;
                  } else {
                    roundConstantMsw ^= 1 << bitPosition - 32;
                  }
                }
                if (LFSR & 128) {
                  LFSR = LFSR << 1 ^ 113;
                } else {
                  LFSR <<= 1;
                }
              }
              ROUND_CONSTANTS[i2] = X64Word.create(roundConstantMsw, roundConstantLsw);
            }
          })();
          var T2 = [];
          (function() {
            for (var i2 = 0; i2 < 25; i2++) {
              T2[i2] = X64Word.create();
            }
          })();
          var SHA3 = C_algo.SHA3 = Hasher.extend({
            /**
             * Configuration options.
             *
             * @property {number} outputLength
             *   The desired number of bits in the output hash.
             *   Only values permitted are: 224, 256, 384, 512.
             *   Default: 512
             */
            cfg: Hasher.cfg.extend({
              outputLength: 512
            }),
            _doReset: function() {
              var state = this._state = [];
              for (var i2 = 0; i2 < 25; i2++) {
                state[i2] = new X64Word.init();
              }
              this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
            },
            _doProcessBlock: function(M2, offset) {
              var state = this._state;
              var nBlockSizeLanes = this.blockSize / 2;
              for (var i2 = 0; i2 < nBlockSizeLanes; i2++) {
                var M2i = M2[offset + 2 * i2];
                var M2i1 = M2[offset + 2 * i2 + 1];
                M2i = (M2i << 8 | M2i >>> 24) & 16711935 | (M2i << 24 | M2i >>> 8) & 4278255360;
                M2i1 = (M2i1 << 8 | M2i1 >>> 24) & 16711935 | (M2i1 << 24 | M2i1 >>> 8) & 4278255360;
                var lane = state[i2];
                lane.high ^= M2i1;
                lane.low ^= M2i;
              }
              for (var round = 0; round < 24; round++) {
                for (var x2 = 0; x2 < 5; x2++) {
                  var tMsw = 0, tLsw = 0;
                  for (var y2 = 0; y2 < 5; y2++) {
                    var lane = state[x2 + 5 * y2];
                    tMsw ^= lane.high;
                    tLsw ^= lane.low;
                  }
                  var Tx = T2[x2];
                  Tx.high = tMsw;
                  Tx.low = tLsw;
                }
                for (var x2 = 0; x2 < 5; x2++) {
                  var Tx4 = T2[(x2 + 4) % 5];
                  var Tx1 = T2[(x2 + 1) % 5];
                  var Tx1Msw = Tx1.high;
                  var Tx1Lsw = Tx1.low;
                  var tMsw = Tx4.high ^ (Tx1Msw << 1 | Tx1Lsw >>> 31);
                  var tLsw = Tx4.low ^ (Tx1Lsw << 1 | Tx1Msw >>> 31);
                  for (var y2 = 0; y2 < 5; y2++) {
                    var lane = state[x2 + 5 * y2];
                    lane.high ^= tMsw;
                    lane.low ^= tLsw;
                  }
                }
                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
                  var tMsw;
                  var tLsw;
                  var lane = state[laneIndex];
                  var laneMsw = lane.high;
                  var laneLsw = lane.low;
                  var rhoOffset = RHO_OFFSETS[laneIndex];
                  if (rhoOffset < 32) {
                    tMsw = laneMsw << rhoOffset | laneLsw >>> 32 - rhoOffset;
                    tLsw = laneLsw << rhoOffset | laneMsw >>> 32 - rhoOffset;
                  } else {
                    tMsw = laneLsw << rhoOffset - 32 | laneMsw >>> 64 - rhoOffset;
                    tLsw = laneMsw << rhoOffset - 32 | laneLsw >>> 64 - rhoOffset;
                  }
                  var TPiLane = T2[PI_INDEXES[laneIndex]];
                  TPiLane.high = tMsw;
                  TPiLane.low = tLsw;
                }
                var T0 = T2[0];
                var state0 = state[0];
                T0.high = state0.high;
                T0.low = state0.low;
                for (var x2 = 0; x2 < 5; x2++) {
                  for (var y2 = 0; y2 < 5; y2++) {
                    var laneIndex = x2 + 5 * y2;
                    var lane = state[laneIndex];
                    var TLane = T2[laneIndex];
                    var Tx1Lane = T2[(x2 + 1) % 5 + 5 * y2];
                    var Tx2Lane = T2[(x2 + 2) % 5 + 5 * y2];
                    lane.high = TLane.high ^ ~Tx1Lane.high & Tx2Lane.high;
                    lane.low = TLane.low ^ ~Tx1Lane.low & Tx2Lane.low;
                  }
                }
                var lane = state[0];
                var roundConstant = ROUND_CONSTANTS[round];
                lane.high ^= roundConstant.high;
                lane.low ^= roundConstant.low;
              }
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              var blockSizeBits = this.blockSize * 32;
              dataWords[nBitsLeft >>> 5] |= 1 << 24 - nBitsLeft % 32;
              dataWords[(Math2.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits >>> 5) - 1] |= 128;
              data.sigBytes = dataWords.length * 4;
              this._process();
              var state = this._state;
              var outputLengthBytes = this.cfg.outputLength / 8;
              var outputLengthLanes = outputLengthBytes / 8;
              var hashWords = [];
              for (var i2 = 0; i2 < outputLengthLanes; i2++) {
                var lane = state[i2];
                var laneMsw = lane.high;
                var laneLsw = lane.low;
                laneMsw = (laneMsw << 8 | laneMsw >>> 24) & 16711935 | (laneMsw << 24 | laneMsw >>> 8) & 4278255360;
                laneLsw = (laneLsw << 8 | laneLsw >>> 24) & 16711935 | (laneLsw << 24 | laneLsw >>> 8) & 4278255360;
                hashWords.push(laneLsw);
                hashWords.push(laneMsw);
              }
              return new WordArray.init(hashWords, outputLengthBytes);
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              var state = clone._state = this._state.slice(0);
              for (var i2 = 0; i2 < 25; i2++) {
                state[i2] = state[i2].clone();
              }
              return clone;
            }
          });
          C2.SHA3 = Hasher._createHelper(SHA3);
          C2.HmacSHA3 = Hasher._createHmacHelper(SHA3);
        })(Math);
        return CryptoJS2.SHA3;
      });
    })(sha3);
    return sha3.exports;
  }
  var ripemd160 = { exports: {} };
  var hasRequiredRipemd160;
  function requireRipemd160() {
    if (hasRequiredRipemd160) return ripemd160.exports;
    hasRequiredRipemd160 = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        /** @preserve
        			(c) 2012 by Cédric Mesnil. All rights reserved.
        
        			Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
        
        			    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
        			    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
        
        			THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        			*/
        (function(Math2) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var Hasher = C_lib.Hasher;
          var C_algo = C2.algo;
          var _zl = WordArray.create([
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            7,
            4,
            13,
            1,
            10,
            6,
            15,
            3,
            12,
            0,
            9,
            5,
            2,
            14,
            11,
            8,
            3,
            10,
            14,
            4,
            9,
            15,
            8,
            1,
            2,
            7,
            0,
            6,
            13,
            11,
            5,
            12,
            1,
            9,
            11,
            10,
            0,
            8,
            12,
            4,
            13,
            3,
            7,
            15,
            14,
            5,
            6,
            2,
            4,
            0,
            5,
            9,
            7,
            12,
            2,
            10,
            14,
            1,
            3,
            8,
            11,
            6,
            15,
            13
          ]);
          var _zr = WordArray.create([
            5,
            14,
            7,
            0,
            9,
            2,
            11,
            4,
            13,
            6,
            15,
            8,
            1,
            10,
            3,
            12,
            6,
            11,
            3,
            7,
            0,
            13,
            5,
            10,
            14,
            15,
            8,
            12,
            4,
            9,
            1,
            2,
            15,
            5,
            1,
            3,
            7,
            14,
            6,
            9,
            11,
            8,
            12,
            2,
            10,
            0,
            4,
            13,
            8,
            6,
            4,
            1,
            3,
            11,
            15,
            0,
            5,
            12,
            2,
            13,
            9,
            7,
            10,
            14,
            12,
            15,
            10,
            4,
            1,
            5,
            8,
            7,
            6,
            2,
            13,
            14,
            0,
            3,
            9,
            11
          ]);
          var _sl = WordArray.create([
            11,
            14,
            15,
            12,
            5,
            8,
            7,
            9,
            11,
            13,
            14,
            15,
            6,
            7,
            9,
            8,
            7,
            6,
            8,
            13,
            11,
            9,
            7,
            15,
            7,
            12,
            15,
            9,
            11,
            7,
            13,
            12,
            11,
            13,
            6,
            7,
            14,
            9,
            13,
            15,
            14,
            8,
            13,
            6,
            5,
            12,
            7,
            5,
            11,
            12,
            14,
            15,
            14,
            15,
            9,
            8,
            9,
            14,
            5,
            6,
            8,
            6,
            5,
            12,
            9,
            15,
            5,
            11,
            6,
            8,
            13,
            12,
            5,
            12,
            13,
            14,
            11,
            8,
            5,
            6
          ]);
          var _sr = WordArray.create([
            8,
            9,
            9,
            11,
            13,
            15,
            15,
            5,
            7,
            7,
            8,
            11,
            14,
            14,
            12,
            6,
            9,
            13,
            15,
            7,
            12,
            8,
            9,
            11,
            7,
            7,
            12,
            7,
            6,
            15,
            13,
            11,
            9,
            7,
            15,
            11,
            8,
            6,
            6,
            14,
            12,
            13,
            5,
            14,
            13,
            13,
            7,
            5,
            15,
            5,
            8,
            11,
            14,
            14,
            6,
            14,
            6,
            9,
            12,
            9,
            12,
            5,
            15,
            8,
            8,
            5,
            12,
            9,
            12,
            5,
            14,
            6,
            8,
            13,
            6,
            5,
            15,
            13,
            11,
            11
          ]);
          var _hl = WordArray.create([0, 1518500249, 1859775393, 2400959708, 2840853838]);
          var _hr = WordArray.create([1352829926, 1548603684, 1836072691, 2053994217, 0]);
          var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
            _doReset: function() {
              this._hash = WordArray.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
            },
            _doProcessBlock: function(M2, offset) {
              for (var i2 = 0; i2 < 16; i2++) {
                var offset_i = offset + i2;
                var M_offset_i = M2[offset_i];
                M2[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
              }
              var H2 = this._hash.words;
              var hl = _hl.words;
              var hr = _hr.words;
              var zl = _zl.words;
              var zr = _zr.words;
              var sl = _sl.words;
              var sr = _sr.words;
              var al, bl, cl, dl, el;
              var ar, br, cr, dr, er;
              ar = al = H2[0];
              br = bl = H2[1];
              cr = cl = H2[2];
              dr = dl = H2[3];
              er = el = H2[4];
              var t2;
              for (var i2 = 0; i2 < 80; i2 += 1) {
                t2 = al + M2[offset + zl[i2]] | 0;
                if (i2 < 16) {
                  t2 += f1(bl, cl, dl) + hl[0];
                } else if (i2 < 32) {
                  t2 += f2(bl, cl, dl) + hl[1];
                } else if (i2 < 48) {
                  t2 += f3(bl, cl, dl) + hl[2];
                } else if (i2 < 64) {
                  t2 += f4(bl, cl, dl) + hl[3];
                } else {
                  t2 += f5(bl, cl, dl) + hl[4];
                }
                t2 = t2 | 0;
                t2 = rotl(t2, sl[i2]);
                t2 = t2 + el | 0;
                al = el;
                el = dl;
                dl = rotl(cl, 10);
                cl = bl;
                bl = t2;
                t2 = ar + M2[offset + zr[i2]] | 0;
                if (i2 < 16) {
                  t2 += f5(br, cr, dr) + hr[0];
                } else if (i2 < 32) {
                  t2 += f4(br, cr, dr) + hr[1];
                } else if (i2 < 48) {
                  t2 += f3(br, cr, dr) + hr[2];
                } else if (i2 < 64) {
                  t2 += f2(br, cr, dr) + hr[3];
                } else {
                  t2 += f1(br, cr, dr) + hr[4];
                }
                t2 = t2 | 0;
                t2 = rotl(t2, sr[i2]);
                t2 = t2 + er | 0;
                ar = er;
                er = dr;
                dr = rotl(cr, 10);
                cr = br;
                br = t2;
              }
              t2 = H2[1] + cl + dr | 0;
              H2[1] = H2[2] + dl + er | 0;
              H2[2] = H2[3] + el + ar | 0;
              H2[3] = H2[4] + al + br | 0;
              H2[4] = H2[0] + bl + cr | 0;
              H2[0] = t2;
            },
            _doFinalize: function() {
              var data = this._data;
              var dataWords = data.words;
              var nBitsTotal = this._nDataBytes * 8;
              var nBitsLeft = data.sigBytes * 8;
              dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
              dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotal << 8 | nBitsTotal >>> 24) & 16711935 | (nBitsTotal << 24 | nBitsTotal >>> 8) & 4278255360;
              data.sigBytes = (dataWords.length + 1) * 4;
              this._process();
              var hash = this._hash;
              var H2 = hash.words;
              for (var i2 = 0; i2 < 5; i2++) {
                var H_i = H2[i2];
                H2[i2] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
              }
              return hash;
            },
            clone: function() {
              var clone = Hasher.clone.call(this);
              clone._hash = this._hash.clone();
              return clone;
            }
          });
          function f1(x2, y2, z2) {
            return x2 ^ y2 ^ z2;
          }
          function f2(x2, y2, z2) {
            return x2 & y2 | ~x2 & z2;
          }
          function f3(x2, y2, z2) {
            return (x2 | ~y2) ^ z2;
          }
          function f4(x2, y2, z2) {
            return x2 & z2 | y2 & ~z2;
          }
          function f5(x2, y2, z2) {
            return x2 ^ (y2 | ~z2);
          }
          function rotl(x2, n2) {
            return x2 << n2 | x2 >>> 32 - n2;
          }
          C2.RIPEMD160 = Hasher._createHelper(RIPEMD160);
          C2.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
        })();
        return CryptoJS2.RIPEMD160;
      });
    })(ripemd160);
    return ripemd160.exports;
  }
  var hmac = { exports: {} };
  var hasRequiredHmac;
  function requireHmac() {
    if (hasRequiredHmac) return hmac.exports;
    hasRequiredHmac = 1;
    (function(module, exports) {
      (function(root, factory) {
        {
          module.exports = factory(requireCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var Base = C_lib.Base;
          var C_enc = C2.enc;
          var Utf8 = C_enc.Utf8;
          var C_algo = C2.algo;
          C_algo.HMAC = Base.extend({
            /**
             * Initializes a newly created HMAC.
             *
             * @param {Hasher} hasher The hash algorithm to use.
             * @param {WordArray|string} key The secret key.
             *
             * @example
             *
             *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
             */
            init: function(hasher, key) {
              hasher = this._hasher = new hasher.init();
              if (typeof key == "string") {
                key = Utf8.parse(key);
              }
              var hasherBlockSize = hasher.blockSize;
              var hasherBlockSizeBytes = hasherBlockSize * 4;
              if (key.sigBytes > hasherBlockSizeBytes) {
                key = hasher.finalize(key);
              }
              key.clamp();
              var oKey = this._oKey = key.clone();
              var iKey = this._iKey = key.clone();
              var oKeyWords = oKey.words;
              var iKeyWords = iKey.words;
              for (var i2 = 0; i2 < hasherBlockSize; i2++) {
                oKeyWords[i2] ^= 1549556828;
                iKeyWords[i2] ^= 909522486;
              }
              oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
              this.reset();
            },
            /**
             * Resets this HMAC to its initial state.
             *
             * @example
             *
             *     hmacHasher.reset();
             */
            reset: function() {
              var hasher = this._hasher;
              hasher.reset();
              hasher.update(this._iKey);
            },
            /**
             * Updates this HMAC with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {HMAC} This HMAC instance.
             *
             * @example
             *
             *     hmacHasher.update('message');
             *     hmacHasher.update(wordArray);
             */
            update: function(messageUpdate) {
              this._hasher.update(messageUpdate);
              return this;
            },
            /**
             * Finalizes the HMAC computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The HMAC.
             *
             * @example
             *
             *     var hmac = hmacHasher.finalize();
             *     var hmac = hmacHasher.finalize('message');
             *     var hmac = hmacHasher.finalize(wordArray);
             */
            finalize: function(messageUpdate) {
              var hasher = this._hasher;
              var innerHash = hasher.finalize(messageUpdate);
              hasher.reset();
              var hmac2 = hasher.finalize(this._oKey.clone().concat(innerHash));
              return hmac2;
            }
          });
        })();
      });
    })(hmac);
    return hmac.exports;
  }
  var pbkdf2 = { exports: {} };
  var hasRequiredPbkdf2;
  function requirePbkdf2() {
    if (hasRequiredPbkdf2) return pbkdf2.exports;
    hasRequiredPbkdf2 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireSha256(), requireHmac());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var Base = C_lib.Base;
          var WordArray = C_lib.WordArray;
          var C_algo = C2.algo;
          var SHA256 = C_algo.SHA256;
          var HMAC = C_algo.HMAC;
          var PBKDF2 = C_algo.PBKDF2 = Base.extend({
            /**
             * Configuration options.
             *
             * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
             * @property {Hasher} hasher The hasher to use. Default: SHA256
             * @property {number} iterations The number of iterations to perform. Default: 250000
             */
            cfg: Base.extend({
              keySize: 128 / 32,
              hasher: SHA256,
              iterations: 25e4
            }),
            /**
             * Initializes a newly created key derivation function.
             *
             * @param {Object} cfg (Optional) The configuration options to use for the derivation.
             *
             * @example
             *
             *     var kdf = CryptoJS.algo.PBKDF2.create();
             *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
             *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
             */
            init: function(cfg) {
              this.cfg = this.cfg.extend(cfg);
            },
            /**
             * Computes the Password-Based Key Derivation Function 2.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             *
             * @return {WordArray} The derived key.
             *
             * @example
             *
             *     var key = kdf.compute(password, salt);
             */
            compute: function(password, salt) {
              var cfg = this.cfg;
              var hmac2 = HMAC.create(cfg.hasher, password);
              var derivedKey = WordArray.create();
              var blockIndex = WordArray.create([1]);
              var derivedKeyWords = derivedKey.words;
              var blockIndexWords = blockIndex.words;
              var keySize = cfg.keySize;
              var iterations = cfg.iterations;
              while (derivedKeyWords.length < keySize) {
                var block = hmac2.update(salt).finalize(blockIndex);
                hmac2.reset();
                var blockWords = block.words;
                var blockWordsLength = blockWords.length;
                var intermediate = block;
                for (var i2 = 1; i2 < iterations; i2++) {
                  intermediate = hmac2.finalize(intermediate);
                  hmac2.reset();
                  var intermediateWords = intermediate.words;
                  for (var j2 = 0; j2 < blockWordsLength; j2++) {
                    blockWords[j2] ^= intermediateWords[j2];
                  }
                }
                derivedKey.concat(block);
                blockIndexWords[0]++;
              }
              derivedKey.sigBytes = keySize * 4;
              return derivedKey;
            }
          });
          C2.PBKDF2 = function(password, salt, cfg) {
            return PBKDF2.create(cfg).compute(password, salt);
          };
        })();
        return CryptoJS2.PBKDF2;
      });
    })(pbkdf2);
    return pbkdf2.exports;
  }
  var evpkdf = { exports: {} };
  var hasRequiredEvpkdf;
  function requireEvpkdf() {
    if (hasRequiredEvpkdf) return evpkdf.exports;
    hasRequiredEvpkdf = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireSha1(), requireHmac());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var Base = C_lib.Base;
          var WordArray = C_lib.WordArray;
          var C_algo = C2.algo;
          var MD5 = C_algo.MD5;
          var EvpKDF = C_algo.EvpKDF = Base.extend({
            /**
             * Configuration options.
             *
             * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
             * @property {Hasher} hasher The hash algorithm to use. Default: MD5
             * @property {number} iterations The number of iterations to perform. Default: 1
             */
            cfg: Base.extend({
              keySize: 128 / 32,
              hasher: MD5,
              iterations: 1
            }),
            /**
             * Initializes a newly created key derivation function.
             *
             * @param {Object} cfg (Optional) The configuration options to use for the derivation.
             *
             * @example
             *
             *     var kdf = CryptoJS.algo.EvpKDF.create();
             *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
             *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
             */
            init: function(cfg) {
              this.cfg = this.cfg.extend(cfg);
            },
            /**
             * Derives a key from a password.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             *
             * @return {WordArray} The derived key.
             *
             * @example
             *
             *     var key = kdf.compute(password, salt);
             */
            compute: function(password, salt) {
              var block;
              var cfg = this.cfg;
              var hasher = cfg.hasher.create();
              var derivedKey = WordArray.create();
              var derivedKeyWords = derivedKey.words;
              var keySize = cfg.keySize;
              var iterations = cfg.iterations;
              while (derivedKeyWords.length < keySize) {
                if (block) {
                  hasher.update(block);
                }
                block = hasher.update(password).finalize(salt);
                hasher.reset();
                for (var i2 = 1; i2 < iterations; i2++) {
                  block = hasher.finalize(block);
                  hasher.reset();
                }
                derivedKey.concat(block);
              }
              derivedKey.sigBytes = keySize * 4;
              return derivedKey;
            }
          });
          C2.EvpKDF = function(password, salt, cfg) {
            return EvpKDF.create(cfg).compute(password, salt);
          };
        })();
        return CryptoJS2.EvpKDF;
      });
    })(evpkdf);
    return evpkdf.exports;
  }
  var cipherCore = { exports: {} };
  var hasRequiredCipherCore;
  function requireCipherCore() {
    if (hasRequiredCipherCore) return cipherCore.exports;
    hasRequiredCipherCore = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEvpkdf());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.lib.Cipher || function(undefined$1) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var Base = C_lib.Base;
          var WordArray = C_lib.WordArray;
          var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
          var C_enc = C2.enc;
          C_enc.Utf8;
          var Base64 = C_enc.Base64;
          var C_algo = C2.algo;
          var EvpKDF = C_algo.EvpKDF;
          var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             *
             * @property {WordArray} iv The IV to use for this operation.
             */
            cfg: Base.extend(),
            /**
             * Creates this cipher in encryption mode.
             *
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {Cipher} A cipher instance.
             *
             * @static
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
             */
            createEncryptor: function(key, cfg) {
              return this.create(this._ENC_XFORM_MODE, key, cfg);
            },
            /**
             * Creates this cipher in decryption mode.
             *
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {Cipher} A cipher instance.
             *
             * @static
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
             */
            createDecryptor: function(key, cfg) {
              return this.create(this._DEC_XFORM_MODE, key, cfg);
            },
            /**
             * Initializes a newly created cipher.
             *
             * @param {number} xformMode Either the encryption or decryption transormation mode constant.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
             */
            init: function(xformMode, key, cfg) {
              this.cfg = this.cfg.extend(cfg);
              this._xformMode = xformMode;
              this._key = key;
              this.reset();
            },
            /**
             * Resets this cipher to its initial state.
             *
             * @example
             *
             *     cipher.reset();
             */
            reset: function() {
              BufferedBlockAlgorithm.reset.call(this);
              this._doReset();
            },
            /**
             * Adds data to be encrypted or decrypted.
             *
             * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
             *
             * @return {WordArray} The data after processing.
             *
             * @example
             *
             *     var encrypted = cipher.process('data');
             *     var encrypted = cipher.process(wordArray);
             */
            process: function(dataUpdate) {
              this._append(dataUpdate);
              return this._process();
            },
            /**
             * Finalizes the encryption or decryption process.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
             *
             * @return {WordArray} The data after final processing.
             *
             * @example
             *
             *     var encrypted = cipher.finalize();
             *     var encrypted = cipher.finalize('data');
             *     var encrypted = cipher.finalize(wordArray);
             */
            finalize: function(dataUpdate) {
              if (dataUpdate) {
                this._append(dataUpdate);
              }
              var finalProcessedData = this._doFinalize();
              return finalProcessedData;
            },
            keySize: 128 / 32,
            ivSize: 128 / 32,
            _ENC_XFORM_MODE: 1,
            _DEC_XFORM_MODE: 2,
            /**
             * Creates shortcut functions to a cipher's object interface.
             *
             * @param {Cipher} cipher The cipher to create a helper for.
             *
             * @return {Object} An object with encrypt and decrypt shortcut functions.
             *
             * @static
             *
             * @example
             *
             *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
             */
            _createHelper: /* @__PURE__ */ function() {
              function selectCipherStrategy(key) {
                if (typeof key == "string") {
                  return PasswordBasedCipher;
                } else {
                  return SerializableCipher;
                }
              }
              return function(cipher) {
                return {
                  encrypt: function(message, key, cfg) {
                    return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                  },
                  decrypt: function(ciphertext, key, cfg) {
                    return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                  }
                };
              };
            }()
          });
          C_lib.StreamCipher = Cipher.extend({
            _doFinalize: function() {
              var finalProcessedBlocks = this._process(true);
              return finalProcessedBlocks;
            },
            blockSize: 1
          });
          var C_mode = C2.mode = {};
          var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
            /**
             * Creates this mode for encryption.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @static
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
             */
            createEncryptor: function(cipher, iv) {
              return this.Encryptor.create(cipher, iv);
            },
            /**
             * Creates this mode for decryption.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @static
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
             */
            createDecryptor: function(cipher, iv) {
              return this.Decryptor.create(cipher, iv);
            },
            /**
             * Initializes a newly created mode.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
             */
            init: function(cipher, iv) {
              this._cipher = cipher;
              this._iv = iv;
            }
          });
          var CBC = C_mode.CBC = function() {
            var CBC2 = BlockCipherMode.extend();
            CBC2.Encryptor = CBC2.extend({
              /**
               * Processes the data block at offset.
               *
               * @param {Array} words The data words to operate on.
               * @param {number} offset The offset where the block starts.
               *
               * @example
               *
               *     mode.processBlock(data.words, offset);
               */
              processBlock: function(words, offset) {
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;
                xorBlock.call(this, words, offset, blockSize);
                cipher.encryptBlock(words, offset);
                this._prevBlock = words.slice(offset, offset + blockSize);
              }
            });
            CBC2.Decryptor = CBC2.extend({
              /**
               * Processes the data block at offset.
               *
               * @param {Array} words The data words to operate on.
               * @param {number} offset The offset where the block starts.
               *
               * @example
               *
               *     mode.processBlock(data.words, offset);
               */
              processBlock: function(words, offset) {
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;
                var thisBlock = words.slice(offset, offset + blockSize);
                cipher.decryptBlock(words, offset);
                xorBlock.call(this, words, offset, blockSize);
                this._prevBlock = thisBlock;
              }
            });
            function xorBlock(words, offset, blockSize) {
              var block;
              var iv = this._iv;
              if (iv) {
                block = iv;
                this._iv = undefined$1;
              } else {
                block = this._prevBlock;
              }
              for (var i2 = 0; i2 < blockSize; i2++) {
                words[offset + i2] ^= block[i2];
              }
            }
            return CBC2;
          }();
          var C_pad = C2.pad = {};
          var Pkcs7 = C_pad.Pkcs7 = {
            /**
             * Pads data using the algorithm defined in PKCS #5/7.
             *
             * @param {WordArray} data The data to pad.
             * @param {number} blockSize The multiple that the data should be padded to.
             *
             * @static
             *
             * @example
             *
             *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
             */
            pad: function(data, blockSize) {
              var blockSizeBytes = blockSize * 4;
              var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
              var paddingWord = nPaddingBytes << 24 | nPaddingBytes << 16 | nPaddingBytes << 8 | nPaddingBytes;
              var paddingWords = [];
              for (var i2 = 0; i2 < nPaddingBytes; i2 += 4) {
                paddingWords.push(paddingWord);
              }
              var padding = WordArray.create(paddingWords, nPaddingBytes);
              data.concat(padding);
            },
            /**
             * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
             *
             * @param {WordArray} data The data to unpad.
             *
             * @static
             *
             * @example
             *
             *     CryptoJS.pad.Pkcs7.unpad(wordArray);
             */
            unpad: function(data) {
              var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
              data.sigBytes -= nPaddingBytes;
            }
          };
          C_lib.BlockCipher = Cipher.extend({
            /**
             * Configuration options.
             *
             * @property {Mode} mode The block mode to use. Default: CBC
             * @property {Padding} padding The padding strategy to use. Default: Pkcs7
             */
            cfg: Cipher.cfg.extend({
              mode: CBC,
              padding: Pkcs7
            }),
            reset: function() {
              var modeCreator;
              Cipher.reset.call(this);
              var cfg = this.cfg;
              var iv = cfg.iv;
              var mode = cfg.mode;
              if (this._xformMode == this._ENC_XFORM_MODE) {
                modeCreator = mode.createEncryptor;
              } else {
                modeCreator = mode.createDecryptor;
                this._minBufferSize = 1;
              }
              if (this._mode && this._mode.__creator == modeCreator) {
                this._mode.init(this, iv && iv.words);
              } else {
                this._mode = modeCreator.call(mode, this, iv && iv.words);
                this._mode.__creator = modeCreator;
              }
            },
            _doProcessBlock: function(words, offset) {
              this._mode.processBlock(words, offset);
            },
            _doFinalize: function() {
              var finalProcessedBlocks;
              var padding = this.cfg.padding;
              if (this._xformMode == this._ENC_XFORM_MODE) {
                padding.pad(this._data, this.blockSize);
                finalProcessedBlocks = this._process(true);
              } else {
                finalProcessedBlocks = this._process(true);
                padding.unpad(finalProcessedBlocks);
              }
              return finalProcessedBlocks;
            },
            blockSize: 128 / 32
          });
          var CipherParams = C_lib.CipherParams = Base.extend({
            /**
             * Initializes a newly created cipher params object.
             *
             * @param {Object} cipherParams An object with any of the possible cipher parameters.
             *
             * @example
             *
             *     var cipherParams = CryptoJS.lib.CipherParams.create({
             *         ciphertext: ciphertextWordArray,
             *         key: keyWordArray,
             *         iv: ivWordArray,
             *         salt: saltWordArray,
             *         algorithm: CryptoJS.algo.AES,
             *         mode: CryptoJS.mode.CBC,
             *         padding: CryptoJS.pad.PKCS7,
             *         blockSize: 4,
             *         formatter: CryptoJS.format.OpenSSL
             *     });
             */
            init: function(cipherParams) {
              this.mixIn(cipherParams);
            },
            /**
             * Converts this cipher params object to a string.
             *
             * @param {Format} formatter (Optional) The formatting strategy to use.
             *
             * @return {string} The stringified cipher params.
             *
             * @throws Error If neither the formatter nor the default formatter is set.
             *
             * @example
             *
             *     var string = cipherParams + '';
             *     var string = cipherParams.toString();
             *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
             */
            toString: function(formatter) {
              return (formatter || this.formatter).stringify(this);
            }
          });
          var C_format = C2.format = {};
          var OpenSSLFormatter = C_format.OpenSSL = {
            /**
             * Converts a cipher params object to an OpenSSL-compatible string.
             *
             * @param {CipherParams} cipherParams The cipher params object.
             *
             * @return {string} The OpenSSL-compatible string.
             *
             * @static
             *
             * @example
             *
             *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
             */
            stringify: function(cipherParams) {
              var wordArray;
              var ciphertext = cipherParams.ciphertext;
              var salt = cipherParams.salt;
              if (salt) {
                wordArray = WordArray.create([1398893684, 1701076831]).concat(salt).concat(ciphertext);
              } else {
                wordArray = ciphertext;
              }
              return wordArray.toString(Base64);
            },
            /**
             * Converts an OpenSSL-compatible string to a cipher params object.
             *
             * @param {string} openSSLStr The OpenSSL-compatible string.
             *
             * @return {CipherParams} The cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
             */
            parse: function(openSSLStr) {
              var salt;
              var ciphertext = Base64.parse(openSSLStr);
              var ciphertextWords = ciphertext.words;
              if (ciphertextWords[0] == 1398893684 && ciphertextWords[1] == 1701076831) {
                salt = WordArray.create(ciphertextWords.slice(2, 4));
                ciphertextWords.splice(0, 4);
                ciphertext.sigBytes -= 16;
              }
              return CipherParams.create({ ciphertext, salt });
            }
          };
          var SerializableCipher = C_lib.SerializableCipher = Base.extend({
            /**
             * Configuration options.
             *
             * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
             */
            cfg: Base.extend({
              format: OpenSSLFormatter
            }),
            /**
             * Encrypts a message.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {WordArray|string} message The message to encrypt.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {CipherParams} A cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             */
            encrypt: function(cipher, message, key, cfg) {
              cfg = this.cfg.extend(cfg);
              var encryptor = cipher.createEncryptor(key, cfg);
              var ciphertext = encryptor.finalize(message);
              var cipherCfg = encryptor.cfg;
              return CipherParams.create({
                ciphertext,
                key,
                iv: cipherCfg.iv,
                algorithm: cipher,
                mode: cipherCfg.mode,
                padding: cipherCfg.padding,
                blockSize: cipher.blockSize,
                formatter: cfg.format
              });
            },
            /**
             * Decrypts serialized ciphertext.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {WordArray} The plaintext.
             *
             * @static
             *
             * @example
             *
             *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             */
            decrypt: function(cipher, ciphertext, key, cfg) {
              cfg = this.cfg.extend(cfg);
              ciphertext = this._parse(ciphertext, cfg.format);
              var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
              return plaintext;
            },
            /**
             * Converts serialized ciphertext to CipherParams,
             * else assumed CipherParams already and returns ciphertext unchanged.
             *
             * @param {CipherParams|string} ciphertext The ciphertext.
             * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
             *
             * @return {CipherParams} The unserialized ciphertext.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
             */
            _parse: function(ciphertext, format) {
              if (typeof ciphertext == "string") {
                return format.parse(ciphertext, this);
              } else {
                return ciphertext;
              }
            }
          });
          var C_kdf = C2.kdf = {};
          var OpenSSLKdf = C_kdf.OpenSSL = {
            /**
             * Derives a key and IV from a password.
             *
             * @param {string} password The password to derive from.
             * @param {number} keySize The size in words of the key to generate.
             * @param {number} ivSize The size in words of the IV to generate.
             * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
             *
             * @return {CipherParams} A cipher params object with the key, IV, and salt.
             *
             * @static
             *
             * @example
             *
             *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
             *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
             */
            execute: function(password, keySize, ivSize, salt, hasher) {
              if (!salt) {
                salt = WordArray.random(64 / 8);
              }
              if (!hasher) {
                var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
              } else {
                var key = EvpKDF.create({ keySize: keySize + ivSize, hasher }).compute(password, salt);
              }
              var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
              key.sigBytes = keySize * 4;
              return CipherParams.create({ key, iv, salt });
            }
          };
          var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
            /**
             * Configuration options.
             *
             * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
             */
            cfg: SerializableCipher.cfg.extend({
              kdf: OpenSSLKdf
            }),
            /**
             * Encrypts a message using a password.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {WordArray|string} message The message to encrypt.
             * @param {string} password The password.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {CipherParams} A cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
             *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
             */
            encrypt: function(cipher, message, password, cfg) {
              cfg = this.cfg.extend(cfg);
              var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, cfg.salt, cfg.hasher);
              cfg.iv = derivedParams.iv;
              var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);
              ciphertext.mixIn(derivedParams);
              return ciphertext;
            },
            /**
             * Decrypts serialized ciphertext using a password.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
             * @param {string} password The password.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {WordArray} The plaintext.
             *
             * @static
             *
             * @example
             *
             *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
             *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
             */
            decrypt: function(cipher, ciphertext, password, cfg) {
              cfg = this.cfg.extend(cfg);
              ciphertext = this._parse(ciphertext, cfg.format);
              var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt, cfg.hasher);
              cfg.iv = derivedParams.iv;
              var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);
              return plaintext;
            }
          });
        }();
      });
    })(cipherCore);
    return cipherCore.exports;
  }
  var modeCfb = { exports: {} };
  var hasRequiredModeCfb;
  function requireModeCfb() {
    if (hasRequiredModeCfb) return modeCfb.exports;
    hasRequiredModeCfb = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.mode.CFB = function() {
          var CFB = CryptoJS2.lib.BlockCipherMode.extend();
          CFB.Encryptor = CFB.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
              this._prevBlock = words.slice(offset, offset + blockSize);
            }
          });
          CFB.Decryptor = CFB.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var thisBlock = words.slice(offset, offset + blockSize);
              generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
              this._prevBlock = thisBlock;
            }
          });
          function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
            var keystream;
            var iv = this._iv;
            if (iv) {
              keystream = iv.slice(0);
              this._iv = void 0;
            } else {
              keystream = this._prevBlock;
            }
            cipher.encryptBlock(keystream, 0);
            for (var i2 = 0; i2 < blockSize; i2++) {
              words[offset + i2] ^= keystream[i2];
            }
          }
          return CFB;
        }();
        return CryptoJS2.mode.CFB;
      });
    })(modeCfb);
    return modeCfb.exports;
  }
  var modeCtr = { exports: {} };
  var hasRequiredModeCtr;
  function requireModeCtr() {
    if (hasRequiredModeCtr) return modeCtr.exports;
    hasRequiredModeCtr = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.mode.CTR = function() {
          var CTR = CryptoJS2.lib.BlockCipherMode.extend();
          var Encryptor = CTR.Encryptor = CTR.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var counter = this._counter;
              if (iv) {
                counter = this._counter = iv.slice(0);
                this._iv = void 0;
              }
              var keystream = counter.slice(0);
              cipher.encryptBlock(keystream, 0);
              counter[blockSize - 1] = counter[blockSize - 1] + 1 | 0;
              for (var i2 = 0; i2 < blockSize; i2++) {
                words[offset + i2] ^= keystream[i2];
              }
            }
          });
          CTR.Decryptor = Encryptor;
          return CTR;
        }();
        return CryptoJS2.mode.CTR;
      });
    })(modeCtr);
    return modeCtr.exports;
  }
  var modeCtrGladman = { exports: {} };
  var hasRequiredModeCtrGladman;
  function requireModeCtrGladman() {
    if (hasRequiredModeCtrGladman) return modeCtrGladman.exports;
    hasRequiredModeCtrGladman = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        /** @preserve
         * Counter block mode compatible with  Dr Brian Gladman fileenc.c
         * derived from CryptoJS.mode.CTR
         * Jan Hruby jhruby.web@gmail.com
         */
        CryptoJS2.mode.CTRGladman = function() {
          var CTRGladman = CryptoJS2.lib.BlockCipherMode.extend();
          function incWord(word) {
            if ((word >> 24 & 255) === 255) {
              var b1 = word >> 16 & 255;
              var b2 = word >> 8 & 255;
              var b3 = word & 255;
              if (b1 === 255) {
                b1 = 0;
                if (b2 === 255) {
                  b2 = 0;
                  if (b3 === 255) {
                    b3 = 0;
                  } else {
                    ++b3;
                  }
                } else {
                  ++b2;
                }
              } else {
                ++b1;
              }
              word = 0;
              word += b1 << 16;
              word += b2 << 8;
              word += b3;
            } else {
              word += 1 << 24;
            }
            return word;
          }
          function incCounter(counter) {
            if ((counter[0] = incWord(counter[0])) === 0) {
              counter[1] = incWord(counter[1]);
            }
            return counter;
          }
          var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var counter = this._counter;
              if (iv) {
                counter = this._counter = iv.slice(0);
                this._iv = void 0;
              }
              incCounter(counter);
              var keystream = counter.slice(0);
              cipher.encryptBlock(keystream, 0);
              for (var i2 = 0; i2 < blockSize; i2++) {
                words[offset + i2] ^= keystream[i2];
              }
            }
          });
          CTRGladman.Decryptor = Encryptor;
          return CTRGladman;
        }();
        return CryptoJS2.mode.CTRGladman;
      });
    })(modeCtrGladman);
    return modeCtrGladman.exports;
  }
  var modeOfb = { exports: {} };
  var hasRequiredModeOfb;
  function requireModeOfb() {
    if (hasRequiredModeOfb) return modeOfb.exports;
    hasRequiredModeOfb = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.mode.OFB = function() {
          var OFB = CryptoJS2.lib.BlockCipherMode.extend();
          var Encryptor = OFB.Encryptor = OFB.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var keystream = this._keystream;
              if (iv) {
                keystream = this._keystream = iv.slice(0);
                this._iv = void 0;
              }
              cipher.encryptBlock(keystream, 0);
              for (var i2 = 0; i2 < blockSize; i2++) {
                words[offset + i2] ^= keystream[i2];
              }
            }
          });
          OFB.Decryptor = Encryptor;
          return OFB;
        }();
        return CryptoJS2.mode.OFB;
      });
    })(modeOfb);
    return modeOfb.exports;
  }
  var modeEcb = { exports: {} };
  var hasRequiredModeEcb;
  function requireModeEcb() {
    if (hasRequiredModeEcb) return modeEcb.exports;
    hasRequiredModeEcb = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.mode.ECB = function() {
          var ECB = CryptoJS2.lib.BlockCipherMode.extend();
          ECB.Encryptor = ECB.extend({
            processBlock: function(words, offset) {
              this._cipher.encryptBlock(words, offset);
            }
          });
          ECB.Decryptor = ECB.extend({
            processBlock: function(words, offset) {
              this._cipher.decryptBlock(words, offset);
            }
          });
          return ECB;
        }();
        return CryptoJS2.mode.ECB;
      });
    })(modeEcb);
    return modeEcb.exports;
  }
  var padAnsix923 = { exports: {} };
  var hasRequiredPadAnsix923;
  function requirePadAnsix923() {
    if (hasRequiredPadAnsix923) return padAnsix923.exports;
    hasRequiredPadAnsix923 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.pad.AnsiX923 = {
          pad: function(data, blockSize) {
            var dataSigBytes = data.sigBytes;
            var blockSizeBytes = blockSize * 4;
            var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;
            var lastBytePos = dataSigBytes + nPaddingBytes - 1;
            data.clamp();
            data.words[lastBytePos >>> 2] |= nPaddingBytes << 24 - lastBytePos % 4 * 8;
            data.sigBytes += nPaddingBytes;
          },
          unpad: function(data) {
            var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
            data.sigBytes -= nPaddingBytes;
          }
        };
        return CryptoJS2.pad.Ansix923;
      });
    })(padAnsix923);
    return padAnsix923.exports;
  }
  var padIso10126 = { exports: {} };
  var hasRequiredPadIso10126;
  function requirePadIso10126() {
    if (hasRequiredPadIso10126) return padIso10126.exports;
    hasRequiredPadIso10126 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.pad.Iso10126 = {
          pad: function(data, blockSize) {
            var blockSizeBytes = blockSize * 4;
            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
            data.concat(CryptoJS2.lib.WordArray.random(nPaddingBytes - 1)).concat(CryptoJS2.lib.WordArray.create([nPaddingBytes << 24], 1));
          },
          unpad: function(data) {
            var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
            data.sigBytes -= nPaddingBytes;
          }
        };
        return CryptoJS2.pad.Iso10126;
      });
    })(padIso10126);
    return padIso10126.exports;
  }
  var padIso97971 = { exports: {} };
  var hasRequiredPadIso97971;
  function requirePadIso97971() {
    if (hasRequiredPadIso97971) return padIso97971.exports;
    hasRequiredPadIso97971 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.pad.Iso97971 = {
          pad: function(data, blockSize) {
            data.concat(CryptoJS2.lib.WordArray.create([2147483648], 1));
            CryptoJS2.pad.ZeroPadding.pad(data, blockSize);
          },
          unpad: function(data) {
            CryptoJS2.pad.ZeroPadding.unpad(data);
            data.sigBytes--;
          }
        };
        return CryptoJS2.pad.Iso97971;
      });
    })(padIso97971);
    return padIso97971.exports;
  }
  var padZeropadding = { exports: {} };
  var hasRequiredPadZeropadding;
  function requirePadZeropadding() {
    if (hasRequiredPadZeropadding) return padZeropadding.exports;
    hasRequiredPadZeropadding = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.pad.ZeroPadding = {
          pad: function(data, blockSize) {
            var blockSizeBytes = blockSize * 4;
            data.clamp();
            data.sigBytes += blockSizeBytes - (data.sigBytes % blockSizeBytes || blockSizeBytes);
          },
          unpad: function(data) {
            var dataWords = data.words;
            var i2 = data.sigBytes - 1;
            for (var i2 = data.sigBytes - 1; i2 >= 0; i2--) {
              if (dataWords[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255) {
                data.sigBytes = i2 + 1;
                break;
              }
            }
          }
        };
        return CryptoJS2.pad.ZeroPadding;
      });
    })(padZeropadding);
    return padZeropadding.exports;
  }
  var padNopadding = { exports: {} };
  var hasRequiredPadNopadding;
  function requirePadNopadding() {
    if (hasRequiredPadNopadding) return padNopadding.exports;
    hasRequiredPadNopadding = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        CryptoJS2.pad.NoPadding = {
          pad: function() {
          },
          unpad: function() {
          }
        };
        return CryptoJS2.pad.NoPadding;
      });
    })(padNopadding);
    return padNopadding.exports;
  }
  var formatHex = { exports: {} };
  var hasRequiredFormatHex;
  function requireFormatHex() {
    if (hasRequiredFormatHex) return formatHex.exports;
    hasRequiredFormatHex = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function(undefined$1) {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var CipherParams = C_lib.CipherParams;
          var C_enc = C2.enc;
          var Hex = C_enc.Hex;
          var C_format = C2.format;
          C_format.Hex = {
            /**
             * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
             *
             * @param {CipherParams} cipherParams The cipher params object.
             *
             * @return {string} The hexadecimally encoded string.
             *
             * @static
             *
             * @example
             *
             *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
             */
            stringify: function(cipherParams) {
              return cipherParams.ciphertext.toString(Hex);
            },
            /**
             * Converts a hexadecimally encoded ciphertext string to a cipher params object.
             *
             * @param {string} input The hexadecimally encoded string.
             *
             * @return {CipherParams} The cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
             */
            parse: function(input) {
              var ciphertext = Hex.parse(input);
              return CipherParams.create({ ciphertext });
            }
          };
        })();
        return CryptoJS2.format.Hex;
      });
    })(formatHex);
    return formatHex.exports;
  }
  var aes = { exports: {} };
  var hasRequiredAes;
  function requireAes() {
    if (hasRequiredAes) return aes.exports;
    hasRequiredAes = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var BlockCipher = C_lib.BlockCipher;
          var C_algo = C2.algo;
          var SBOX = [];
          var INV_SBOX = [];
          var SUB_MIX_0 = [];
          var SUB_MIX_1 = [];
          var SUB_MIX_2 = [];
          var SUB_MIX_3 = [];
          var INV_SUB_MIX_0 = [];
          var INV_SUB_MIX_1 = [];
          var INV_SUB_MIX_2 = [];
          var INV_SUB_MIX_3 = [];
          (function() {
            var d2 = [];
            for (var i2 = 0; i2 < 256; i2++) {
              if (i2 < 128) {
                d2[i2] = i2 << 1;
              } else {
                d2[i2] = i2 << 1 ^ 283;
              }
            }
            var x2 = 0;
            var xi = 0;
            for (var i2 = 0; i2 < 256; i2++) {
              var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
              sx = sx >>> 8 ^ sx & 255 ^ 99;
              SBOX[x2] = sx;
              INV_SBOX[sx] = x2;
              var x22 = d2[x2];
              var x4 = d2[x22];
              var x8 = d2[x4];
              var t2 = d2[sx] * 257 ^ sx * 16843008;
              SUB_MIX_0[x2] = t2 << 24 | t2 >>> 8;
              SUB_MIX_1[x2] = t2 << 16 | t2 >>> 16;
              SUB_MIX_2[x2] = t2 << 8 | t2 >>> 24;
              SUB_MIX_3[x2] = t2;
              var t2 = x8 * 16843009 ^ x4 * 65537 ^ x22 * 257 ^ x2 * 16843008;
              INV_SUB_MIX_0[sx] = t2 << 24 | t2 >>> 8;
              INV_SUB_MIX_1[sx] = t2 << 16 | t2 >>> 16;
              INV_SUB_MIX_2[sx] = t2 << 8 | t2 >>> 24;
              INV_SUB_MIX_3[sx] = t2;
              if (!x2) {
                x2 = xi = 1;
              } else {
                x2 = x22 ^ d2[d2[d2[x8 ^ x22]]];
                xi ^= d2[d2[xi]];
              }
            }
          })();
          var RCON = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
          var AES = C_algo.AES = BlockCipher.extend({
            _doReset: function() {
              var t2;
              if (this._nRounds && this._keyPriorReset === this._key) {
                return;
              }
              var key = this._keyPriorReset = this._key;
              var keyWords = key.words;
              var keySize = key.sigBytes / 4;
              var nRounds = this._nRounds = keySize + 6;
              var ksRows = (nRounds + 1) * 4;
              var keySchedule = this._keySchedule = [];
              for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                if (ksRow < keySize) {
                  keySchedule[ksRow] = keyWords[ksRow];
                } else {
                  t2 = keySchedule[ksRow - 1];
                  if (!(ksRow % keySize)) {
                    t2 = t2 << 8 | t2 >>> 24;
                    t2 = SBOX[t2 >>> 24] << 24 | SBOX[t2 >>> 16 & 255] << 16 | SBOX[t2 >>> 8 & 255] << 8 | SBOX[t2 & 255];
                    t2 ^= RCON[ksRow / keySize | 0] << 24;
                  } else if (keySize > 6 && ksRow % keySize == 4) {
                    t2 = SBOX[t2 >>> 24] << 24 | SBOX[t2 >>> 16 & 255] << 16 | SBOX[t2 >>> 8 & 255] << 8 | SBOX[t2 & 255];
                  }
                  keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t2;
                }
              }
              var invKeySchedule = this._invKeySchedule = [];
              for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                var ksRow = ksRows - invKsRow;
                if (invKsRow % 4) {
                  var t2 = keySchedule[ksRow];
                } else {
                  var t2 = keySchedule[ksRow - 4];
                }
                if (invKsRow < 4 || ksRow <= 4) {
                  invKeySchedule[invKsRow] = t2;
                } else {
                  invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t2 >>> 24]] ^ INV_SUB_MIX_1[SBOX[t2 >>> 16 & 255]] ^ INV_SUB_MIX_2[SBOX[t2 >>> 8 & 255]] ^ INV_SUB_MIX_3[SBOX[t2 & 255]];
                }
              }
            },
            encryptBlock: function(M2, offset) {
              this._doCryptBlock(M2, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
            },
            decryptBlock: function(M2, offset) {
              var t2 = M2[offset + 1];
              M2[offset + 1] = M2[offset + 3];
              M2[offset + 3] = t2;
              this._doCryptBlock(M2, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
              var t2 = M2[offset + 1];
              M2[offset + 1] = M2[offset + 3];
              M2[offset + 3] = t2;
            },
            _doCryptBlock: function(M2, offset, keySchedule, SUB_MIX_02, SUB_MIX_12, SUB_MIX_22, SUB_MIX_32, SBOX2) {
              var nRounds = this._nRounds;
              var s0 = M2[offset] ^ keySchedule[0];
              var s1 = M2[offset + 1] ^ keySchedule[1];
              var s2 = M2[offset + 2] ^ keySchedule[2];
              var s3 = M2[offset + 3] ^ keySchedule[3];
              var ksRow = 4;
              for (var round = 1; round < nRounds; round++) {
                var t0 = SUB_MIX_02[s0 >>> 24] ^ SUB_MIX_12[s1 >>> 16 & 255] ^ SUB_MIX_22[s2 >>> 8 & 255] ^ SUB_MIX_32[s3 & 255] ^ keySchedule[ksRow++];
                var t1 = SUB_MIX_02[s1 >>> 24] ^ SUB_MIX_12[s2 >>> 16 & 255] ^ SUB_MIX_22[s3 >>> 8 & 255] ^ SUB_MIX_32[s0 & 255] ^ keySchedule[ksRow++];
                var t2 = SUB_MIX_02[s2 >>> 24] ^ SUB_MIX_12[s3 >>> 16 & 255] ^ SUB_MIX_22[s0 >>> 8 & 255] ^ SUB_MIX_32[s1 & 255] ^ keySchedule[ksRow++];
                var t3 = SUB_MIX_02[s3 >>> 24] ^ SUB_MIX_12[s0 >>> 16 & 255] ^ SUB_MIX_22[s1 >>> 8 & 255] ^ SUB_MIX_32[s2 & 255] ^ keySchedule[ksRow++];
                s0 = t0;
                s1 = t1;
                s2 = t2;
                s3 = t3;
              }
              var t0 = (SBOX2[s0 >>> 24] << 24 | SBOX2[s1 >>> 16 & 255] << 16 | SBOX2[s2 >>> 8 & 255] << 8 | SBOX2[s3 & 255]) ^ keySchedule[ksRow++];
              var t1 = (SBOX2[s1 >>> 24] << 24 | SBOX2[s2 >>> 16 & 255] << 16 | SBOX2[s3 >>> 8 & 255] << 8 | SBOX2[s0 & 255]) ^ keySchedule[ksRow++];
              var t2 = (SBOX2[s2 >>> 24] << 24 | SBOX2[s3 >>> 16 & 255] << 16 | SBOX2[s0 >>> 8 & 255] << 8 | SBOX2[s1 & 255]) ^ keySchedule[ksRow++];
              var t3 = (SBOX2[s3 >>> 24] << 24 | SBOX2[s0 >>> 16 & 255] << 16 | SBOX2[s1 >>> 8 & 255] << 8 | SBOX2[s2 & 255]) ^ keySchedule[ksRow++];
              M2[offset] = t0;
              M2[offset + 1] = t1;
              M2[offset + 2] = t2;
              M2[offset + 3] = t3;
            },
            keySize: 256 / 32
          });
          C2.AES = BlockCipher._createHelper(AES);
        })();
        return CryptoJS2.AES;
      });
    })(aes);
    return aes.exports;
  }
  var tripledes = { exports: {} };
  var hasRequiredTripledes;
  function requireTripledes() {
    if (hasRequiredTripledes) return tripledes.exports;
    hasRequiredTripledes = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var WordArray = C_lib.WordArray;
          var BlockCipher = C_lib.BlockCipher;
          var C_algo = C2.algo;
          var PC1 = [
            57,
            49,
            41,
            33,
            25,
            17,
            9,
            1,
            58,
            50,
            42,
            34,
            26,
            18,
            10,
            2,
            59,
            51,
            43,
            35,
            27,
            19,
            11,
            3,
            60,
            52,
            44,
            36,
            63,
            55,
            47,
            39,
            31,
            23,
            15,
            7,
            62,
            54,
            46,
            38,
            30,
            22,
            14,
            6,
            61,
            53,
            45,
            37,
            29,
            21,
            13,
            5,
            28,
            20,
            12,
            4
          ];
          var PC2 = [
            14,
            17,
            11,
            24,
            1,
            5,
            3,
            28,
            15,
            6,
            21,
            10,
            23,
            19,
            12,
            4,
            26,
            8,
            16,
            7,
            27,
            20,
            13,
            2,
            41,
            52,
            31,
            37,
            47,
            55,
            30,
            40,
            51,
            45,
            33,
            48,
            44,
            49,
            39,
            56,
            34,
            53,
            46,
            42,
            50,
            36,
            29,
            32
          ];
          var BIT_SHIFTS = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];
          var SBOX_P = [
            {
              0: 8421888,
              268435456: 32768,
              536870912: 8421378,
              805306368: 2,
              1073741824: 512,
              1342177280: 8421890,
              1610612736: 8389122,
              1879048192: 8388608,
              2147483648: 514,
              2415919104: 8389120,
              2684354560: 33280,
              2952790016: 8421376,
              3221225472: 32770,
              3489660928: 8388610,
              3758096384: 0,
              4026531840: 33282,
              134217728: 0,
              402653184: 8421890,
              671088640: 33282,
              939524096: 32768,
              1207959552: 8421888,
              1476395008: 512,
              1744830464: 8421378,
              2013265920: 2,
              2281701376: 8389120,
              2550136832: 33280,
              2818572288: 8421376,
              3087007744: 8389122,
              3355443200: 8388610,
              3623878656: 32770,
              3892314112: 514,
              4160749568: 8388608,
              1: 32768,
              268435457: 2,
              536870913: 8421888,
              805306369: 8388608,
              1073741825: 8421378,
              1342177281: 33280,
              1610612737: 512,
              1879048193: 8389122,
              2147483649: 8421890,
              2415919105: 8421376,
              2684354561: 8388610,
              2952790017: 33282,
              3221225473: 514,
              3489660929: 8389120,
              3758096385: 32770,
              4026531841: 0,
              134217729: 8421890,
              402653185: 8421376,
              671088641: 8388608,
              939524097: 512,
              1207959553: 32768,
              1476395009: 8388610,
              1744830465: 2,
              2013265921: 33282,
              2281701377: 32770,
              2550136833: 8389122,
              2818572289: 514,
              3087007745: 8421888,
              3355443201: 8389120,
              3623878657: 0,
              3892314113: 33280,
              4160749569: 8421378
            },
            {
              0: 1074282512,
              16777216: 16384,
              33554432: 524288,
              50331648: 1074266128,
              67108864: 1073741840,
              83886080: 1074282496,
              100663296: 1073758208,
              117440512: 16,
              134217728: 540672,
              150994944: 1073758224,
              167772160: 1073741824,
              184549376: 540688,
              201326592: 524304,
              218103808: 0,
              234881024: 16400,
              251658240: 1074266112,
              8388608: 1073758208,
              25165824: 540688,
              41943040: 16,
              58720256: 1073758224,
              75497472: 1074282512,
              92274688: 1073741824,
              109051904: 524288,
              125829120: 1074266128,
              142606336: 524304,
              159383552: 0,
              176160768: 16384,
              192937984: 1074266112,
              209715200: 1073741840,
              226492416: 540672,
              243269632: 1074282496,
              260046848: 16400,
              268435456: 0,
              285212672: 1074266128,
              301989888: 1073758224,
              318767104: 1074282496,
              335544320: 1074266112,
              352321536: 16,
              369098752: 540688,
              385875968: 16384,
              402653184: 16400,
              419430400: 524288,
              436207616: 524304,
              452984832: 1073741840,
              469762048: 540672,
              486539264: 1073758208,
              503316480: 1073741824,
              520093696: 1074282512,
              276824064: 540688,
              293601280: 524288,
              310378496: 1074266112,
              327155712: 16384,
              343932928: 1073758208,
              360710144: 1074282512,
              377487360: 16,
              394264576: 1073741824,
              411041792: 1074282496,
              427819008: 1073741840,
              444596224: 1073758224,
              461373440: 524304,
              478150656: 0,
              494927872: 16400,
              511705088: 1074266128,
              528482304: 540672
            },
            {
              0: 260,
              1048576: 0,
              2097152: 67109120,
              3145728: 65796,
              4194304: 65540,
              5242880: 67108868,
              6291456: 67174660,
              7340032: 67174400,
              8388608: 67108864,
              9437184: 67174656,
              10485760: 65792,
              11534336: 67174404,
              12582912: 67109124,
              13631488: 65536,
              14680064: 4,
              15728640: 256,
              524288: 67174656,
              1572864: 67174404,
              2621440: 0,
              3670016: 67109120,
              4718592: 67108868,
              5767168: 65536,
              6815744: 65540,
              7864320: 260,
              8912896: 4,
              9961472: 256,
              11010048: 67174400,
              12058624: 65796,
              13107200: 65792,
              14155776: 67109124,
              15204352: 67174660,
              16252928: 67108864,
              16777216: 67174656,
              17825792: 65540,
              18874368: 65536,
              19922944: 67109120,
              20971520: 256,
              22020096: 67174660,
              23068672: 67108868,
              24117248: 0,
              25165824: 67109124,
              26214400: 67108864,
              27262976: 4,
              28311552: 65792,
              29360128: 67174400,
              30408704: 260,
              31457280: 65796,
              32505856: 67174404,
              17301504: 67108864,
              18350080: 260,
              19398656: 67174656,
              20447232: 0,
              21495808: 65540,
              22544384: 67109120,
              23592960: 256,
              24641536: 67174404,
              25690112: 65536,
              26738688: 67174660,
              27787264: 65796,
              28835840: 67108868,
              29884416: 67109124,
              30932992: 67174400,
              31981568: 4,
              33030144: 65792
            },
            {
              0: 2151682048,
              65536: 2147487808,
              131072: 4198464,
              196608: 2151677952,
              262144: 0,
              327680: 4198400,
              393216: 2147483712,
              458752: 4194368,
              524288: 2147483648,
              589824: 4194304,
              655360: 64,
              720896: 2147487744,
              786432: 2151678016,
              851968: 4160,
              917504: 4096,
              983040: 2151682112,
              32768: 2147487808,
              98304: 64,
              163840: 2151678016,
              229376: 2147487744,
              294912: 4198400,
              360448: 2151682112,
              425984: 0,
              491520: 2151677952,
              557056: 4096,
              622592: 2151682048,
              688128: 4194304,
              753664: 4160,
              819200: 2147483648,
              884736: 4194368,
              950272: 4198464,
              1015808: 2147483712,
              1048576: 4194368,
              1114112: 4198400,
              1179648: 2147483712,
              1245184: 0,
              1310720: 4160,
              1376256: 2151678016,
              1441792: 2151682048,
              1507328: 2147487808,
              1572864: 2151682112,
              1638400: 2147483648,
              1703936: 2151677952,
              1769472: 4198464,
              1835008: 2147487744,
              1900544: 4194304,
              1966080: 64,
              2031616: 4096,
              1081344: 2151677952,
              1146880: 2151682112,
              1212416: 0,
              1277952: 4198400,
              1343488: 4194368,
              1409024: 2147483648,
              1474560: 2147487808,
              1540096: 64,
              1605632: 2147483712,
              1671168: 4096,
              1736704: 2147487744,
              1802240: 2151678016,
              1867776: 4160,
              1933312: 2151682048,
              1998848: 4194304,
              2064384: 4198464
            },
            {
              0: 128,
              4096: 17039360,
              8192: 262144,
              12288: 536870912,
              16384: 537133184,
              20480: 16777344,
              24576: 553648256,
              28672: 262272,
              32768: 16777216,
              36864: 537133056,
              40960: 536871040,
              45056: 553910400,
              49152: 553910272,
              53248: 0,
              57344: 17039488,
              61440: 553648128,
              2048: 17039488,
              6144: 553648256,
              10240: 128,
              14336: 17039360,
              18432: 262144,
              22528: 537133184,
              26624: 553910272,
              30720: 536870912,
              34816: 537133056,
              38912: 0,
              43008: 553910400,
              47104: 16777344,
              51200: 536871040,
              55296: 553648128,
              59392: 16777216,
              63488: 262272,
              65536: 262144,
              69632: 128,
              73728: 536870912,
              77824: 553648256,
              81920: 16777344,
              86016: 553910272,
              90112: 537133184,
              94208: 16777216,
              98304: 553910400,
              102400: 553648128,
              106496: 17039360,
              110592: 537133056,
              114688: 262272,
              118784: 536871040,
              122880: 0,
              126976: 17039488,
              67584: 553648256,
              71680: 16777216,
              75776: 17039360,
              79872: 537133184,
              83968: 536870912,
              88064: 17039488,
              92160: 128,
              96256: 553910272,
              100352: 262272,
              104448: 553910400,
              108544: 0,
              112640: 553648128,
              116736: 16777344,
              120832: 262144,
              124928: 537133056,
              129024: 536871040
            },
            {
              0: 268435464,
              256: 8192,
              512: 270532608,
              768: 270540808,
              1024: 268443648,
              1280: 2097152,
              1536: 2097160,
              1792: 268435456,
              2048: 0,
              2304: 268443656,
              2560: 2105344,
              2816: 8,
              3072: 270532616,
              3328: 2105352,
              3584: 8200,
              3840: 270540800,
              128: 270532608,
              384: 270540808,
              640: 8,
              896: 2097152,
              1152: 2105352,
              1408: 268435464,
              1664: 268443648,
              1920: 8200,
              2176: 2097160,
              2432: 8192,
              2688: 268443656,
              2944: 270532616,
              3200: 0,
              3456: 270540800,
              3712: 2105344,
              3968: 268435456,
              4096: 268443648,
              4352: 270532616,
              4608: 270540808,
              4864: 8200,
              5120: 2097152,
              5376: 268435456,
              5632: 268435464,
              5888: 2105344,
              6144: 2105352,
              6400: 0,
              6656: 8,
              6912: 270532608,
              7168: 8192,
              7424: 268443656,
              7680: 270540800,
              7936: 2097160,
              4224: 8,
              4480: 2105344,
              4736: 2097152,
              4992: 268435464,
              5248: 268443648,
              5504: 8200,
              5760: 270540808,
              6016: 270532608,
              6272: 270540800,
              6528: 270532616,
              6784: 8192,
              7040: 2105352,
              7296: 2097160,
              7552: 0,
              7808: 268435456,
              8064: 268443656
            },
            {
              0: 1048576,
              16: 33555457,
              32: 1024,
              48: 1049601,
              64: 34604033,
              80: 0,
              96: 1,
              112: 34603009,
              128: 33555456,
              144: 1048577,
              160: 33554433,
              176: 34604032,
              192: 34603008,
              208: 1025,
              224: 1049600,
              240: 33554432,
              8: 34603009,
              24: 0,
              40: 33555457,
              56: 34604032,
              72: 1048576,
              88: 33554433,
              104: 33554432,
              120: 1025,
              136: 1049601,
              152: 33555456,
              168: 34603008,
              184: 1048577,
              200: 1024,
              216: 34604033,
              232: 1,
              248: 1049600,
              256: 33554432,
              272: 1048576,
              288: 33555457,
              304: 34603009,
              320: 1048577,
              336: 33555456,
              352: 34604032,
              368: 1049601,
              384: 1025,
              400: 34604033,
              416: 1049600,
              432: 1,
              448: 0,
              464: 34603008,
              480: 33554433,
              496: 1024,
              264: 1049600,
              280: 33555457,
              296: 34603009,
              312: 1,
              328: 33554432,
              344: 1048576,
              360: 1025,
              376: 34604032,
              392: 33554433,
              408: 34603008,
              424: 0,
              440: 34604033,
              456: 1049601,
              472: 1024,
              488: 33555456,
              504: 1048577
            },
            {
              0: 134219808,
              1: 131072,
              2: 134217728,
              3: 32,
              4: 131104,
              5: 134350880,
              6: 134350848,
              7: 2048,
              8: 134348800,
              9: 134219776,
              10: 133120,
              11: 134348832,
              12: 2080,
              13: 0,
              14: 134217760,
              15: 133152,
              2147483648: 2048,
              2147483649: 134350880,
              2147483650: 134219808,
              2147483651: 134217728,
              2147483652: 134348800,
              2147483653: 133120,
              2147483654: 133152,
              2147483655: 32,
              2147483656: 134217760,
              2147483657: 2080,
              2147483658: 131104,
              2147483659: 134350848,
              2147483660: 0,
              2147483661: 134348832,
              2147483662: 134219776,
              2147483663: 131072,
              16: 133152,
              17: 134350848,
              18: 32,
              19: 2048,
              20: 134219776,
              21: 134217760,
              22: 134348832,
              23: 131072,
              24: 0,
              25: 131104,
              26: 134348800,
              27: 134219808,
              28: 134350880,
              29: 133120,
              30: 2080,
              31: 134217728,
              2147483664: 131072,
              2147483665: 2048,
              2147483666: 134348832,
              2147483667: 133152,
              2147483668: 32,
              2147483669: 134348800,
              2147483670: 134217728,
              2147483671: 134219808,
              2147483672: 134350880,
              2147483673: 134217760,
              2147483674: 134219776,
              2147483675: 0,
              2147483676: 133120,
              2147483677: 2080,
              2147483678: 131104,
              2147483679: 134350848
            }
          ];
          var SBOX_MASK = [
            4160749569,
            528482304,
            33030144,
            2064384,
            129024,
            8064,
            504,
            2147483679
          ];
          var DES = C_algo.DES = BlockCipher.extend({
            _doReset: function() {
              var key = this._key;
              var keyWords = key.words;
              var keyBits = [];
              for (var i2 = 0; i2 < 56; i2++) {
                var keyBitPos = PC1[i2] - 1;
                keyBits[i2] = keyWords[keyBitPos >>> 5] >>> 31 - keyBitPos % 32 & 1;
              }
              var subKeys = this._subKeys = [];
              for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
                var subKey = subKeys[nSubKey] = [];
                var bitShift = BIT_SHIFTS[nSubKey];
                for (var i2 = 0; i2 < 24; i2++) {
                  subKey[i2 / 6 | 0] |= keyBits[(PC2[i2] - 1 + bitShift) % 28] << 31 - i2 % 6;
                  subKey[4 + (i2 / 6 | 0)] |= keyBits[28 + (PC2[i2 + 24] - 1 + bitShift) % 28] << 31 - i2 % 6;
                }
                subKey[0] = subKey[0] << 1 | subKey[0] >>> 31;
                for (var i2 = 1; i2 < 7; i2++) {
                  subKey[i2] = subKey[i2] >>> (i2 - 1) * 4 + 3;
                }
                subKey[7] = subKey[7] << 5 | subKey[7] >>> 27;
              }
              var invSubKeys = this._invSubKeys = [];
              for (var i2 = 0; i2 < 16; i2++) {
                invSubKeys[i2] = subKeys[15 - i2];
              }
            },
            encryptBlock: function(M2, offset) {
              this._doCryptBlock(M2, offset, this._subKeys);
            },
            decryptBlock: function(M2, offset) {
              this._doCryptBlock(M2, offset, this._invSubKeys);
            },
            _doCryptBlock: function(M2, offset, subKeys) {
              this._lBlock = M2[offset];
              this._rBlock = M2[offset + 1];
              exchangeLR.call(this, 4, 252645135);
              exchangeLR.call(this, 16, 65535);
              exchangeRL.call(this, 2, 858993459);
              exchangeRL.call(this, 8, 16711935);
              exchangeLR.call(this, 1, 1431655765);
              for (var round = 0; round < 16; round++) {
                var subKey = subKeys[round];
                var lBlock = this._lBlock;
                var rBlock = this._rBlock;
                var f2 = 0;
                for (var i2 = 0; i2 < 8; i2++) {
                  f2 |= SBOX_P[i2][((rBlock ^ subKey[i2]) & SBOX_MASK[i2]) >>> 0];
                }
                this._lBlock = rBlock;
                this._rBlock = lBlock ^ f2;
              }
              var t2 = this._lBlock;
              this._lBlock = this._rBlock;
              this._rBlock = t2;
              exchangeLR.call(this, 1, 1431655765);
              exchangeRL.call(this, 8, 16711935);
              exchangeRL.call(this, 2, 858993459);
              exchangeLR.call(this, 16, 65535);
              exchangeLR.call(this, 4, 252645135);
              M2[offset] = this._lBlock;
              M2[offset + 1] = this._rBlock;
            },
            keySize: 64 / 32,
            ivSize: 64 / 32,
            blockSize: 64 / 32
          });
          function exchangeLR(offset, mask) {
            var t2 = (this._lBlock >>> offset ^ this._rBlock) & mask;
            this._rBlock ^= t2;
            this._lBlock ^= t2 << offset;
          }
          function exchangeRL(offset, mask) {
            var t2 = (this._rBlock >>> offset ^ this._lBlock) & mask;
            this._lBlock ^= t2;
            this._rBlock ^= t2 << offset;
          }
          C2.DES = BlockCipher._createHelper(DES);
          var TripleDES = C_algo.TripleDES = BlockCipher.extend({
            _doReset: function() {
              var key = this._key;
              var keyWords = key.words;
              if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
                throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");
              }
              var key1 = keyWords.slice(0, 2);
              var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
              var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);
              this._des1 = DES.createEncryptor(WordArray.create(key1));
              this._des2 = DES.createEncryptor(WordArray.create(key2));
              this._des3 = DES.createEncryptor(WordArray.create(key3));
            },
            encryptBlock: function(M2, offset) {
              this._des1.encryptBlock(M2, offset);
              this._des2.decryptBlock(M2, offset);
              this._des3.encryptBlock(M2, offset);
            },
            decryptBlock: function(M2, offset) {
              this._des3.decryptBlock(M2, offset);
              this._des2.encryptBlock(M2, offset);
              this._des1.decryptBlock(M2, offset);
            },
            keySize: 192 / 32,
            ivSize: 64 / 32,
            blockSize: 64 / 32
          });
          C2.TripleDES = BlockCipher._createHelper(TripleDES);
        })();
        return CryptoJS2.TripleDES;
      });
    })(tripledes);
    return tripledes.exports;
  }
  var rc4 = { exports: {} };
  var hasRequiredRc4;
  function requireRc4() {
    if (hasRequiredRc4) return rc4.exports;
    hasRequiredRc4 = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var StreamCipher = C_lib.StreamCipher;
          var C_algo = C2.algo;
          var RC4 = C_algo.RC4 = StreamCipher.extend({
            _doReset: function() {
              var key = this._key;
              var keyWords = key.words;
              var keySigBytes = key.sigBytes;
              var S2 = this._S = [];
              for (var i2 = 0; i2 < 256; i2++) {
                S2[i2] = i2;
              }
              for (var i2 = 0, j2 = 0; i2 < 256; i2++) {
                var keyByteIndex = i2 % keySigBytes;
                var keyByte = keyWords[keyByteIndex >>> 2] >>> 24 - keyByteIndex % 4 * 8 & 255;
                j2 = (j2 + S2[i2] + keyByte) % 256;
                var t2 = S2[i2];
                S2[i2] = S2[j2];
                S2[j2] = t2;
              }
              this._i = this._j = 0;
            },
            _doProcessBlock: function(M2, offset) {
              M2[offset] ^= generateKeystreamWord.call(this);
            },
            keySize: 256 / 32,
            ivSize: 0
          });
          function generateKeystreamWord() {
            var S2 = this._S;
            var i2 = this._i;
            var j2 = this._j;
            var keystreamWord = 0;
            for (var n2 = 0; n2 < 4; n2++) {
              i2 = (i2 + 1) % 256;
              j2 = (j2 + S2[i2]) % 256;
              var t2 = S2[i2];
              S2[i2] = S2[j2];
              S2[j2] = t2;
              keystreamWord |= S2[(S2[i2] + S2[j2]) % 256] << 24 - n2 * 8;
            }
            this._i = i2;
            this._j = j2;
            return keystreamWord;
          }
          C2.RC4 = StreamCipher._createHelper(RC4);
          var RC4Drop = C_algo.RC4Drop = RC4.extend({
            /**
             * Configuration options.
             *
             * @property {number} drop The number of keystream words to drop. Default 192
             */
            cfg: RC4.cfg.extend({
              drop: 192
            }),
            _doReset: function() {
              RC4._doReset.call(this);
              for (var i2 = this.cfg.drop; i2 > 0; i2--) {
                generateKeystreamWord.call(this);
              }
            }
          });
          C2.RC4Drop = StreamCipher._createHelper(RC4Drop);
        })();
        return CryptoJS2.RC4;
      });
    })(rc4);
    return rc4.exports;
  }
  var rabbit = { exports: {} };
  var hasRequiredRabbit;
  function requireRabbit() {
    if (hasRequiredRabbit) return rabbit.exports;
    hasRequiredRabbit = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var StreamCipher = C_lib.StreamCipher;
          var C_algo = C2.algo;
          var S2 = [];
          var C_ = [];
          var G2 = [];
          var Rabbit = C_algo.Rabbit = StreamCipher.extend({
            _doReset: function() {
              var K = this._key.words;
              var iv = this.cfg.iv;
              for (var i2 = 0; i2 < 4; i2++) {
                K[i2] = (K[i2] << 8 | K[i2] >>> 24) & 16711935 | (K[i2] << 24 | K[i2] >>> 8) & 4278255360;
              }
              var X = this._X = [
                K[0],
                K[3] << 16 | K[2] >>> 16,
                K[1],
                K[0] << 16 | K[3] >>> 16,
                K[2],
                K[1] << 16 | K[0] >>> 16,
                K[3],
                K[2] << 16 | K[1] >>> 16
              ];
              var C3 = this._C = [
                K[2] << 16 | K[2] >>> 16,
                K[0] & 4294901760 | K[1] & 65535,
                K[3] << 16 | K[3] >>> 16,
                K[1] & 4294901760 | K[2] & 65535,
                K[0] << 16 | K[0] >>> 16,
                K[2] & 4294901760 | K[3] & 65535,
                K[1] << 16 | K[1] >>> 16,
                K[3] & 4294901760 | K[0] & 65535
              ];
              this._b = 0;
              for (var i2 = 0; i2 < 4; i2++) {
                nextState.call(this);
              }
              for (var i2 = 0; i2 < 8; i2++) {
                C3[i2] ^= X[i2 + 4 & 7];
              }
              if (iv) {
                var IV = iv.words;
                var IV_0 = IV[0];
                var IV_1 = IV[1];
                var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
                var i22 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
                var i1 = i0 >>> 16 | i22 & 4294901760;
                var i3 = i22 << 16 | i0 & 65535;
                C3[0] ^= i0;
                C3[1] ^= i1;
                C3[2] ^= i22;
                C3[3] ^= i3;
                C3[4] ^= i0;
                C3[5] ^= i1;
                C3[6] ^= i22;
                C3[7] ^= i3;
                for (var i2 = 0; i2 < 4; i2++) {
                  nextState.call(this);
                }
              }
            },
            _doProcessBlock: function(M2, offset) {
              var X = this._X;
              nextState.call(this);
              S2[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
              S2[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
              S2[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
              S2[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
              for (var i2 = 0; i2 < 4; i2++) {
                S2[i2] = (S2[i2] << 8 | S2[i2] >>> 24) & 16711935 | (S2[i2] << 24 | S2[i2] >>> 8) & 4278255360;
                M2[offset + i2] ^= S2[i2];
              }
            },
            blockSize: 128 / 32,
            ivSize: 64 / 32
          });
          function nextState() {
            var X = this._X;
            var C3 = this._C;
            for (var i2 = 0; i2 < 8; i2++) {
              C_[i2] = C3[i2];
            }
            C3[0] = C3[0] + 1295307597 + this._b | 0;
            C3[1] = C3[1] + 3545052371 + (C3[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
            C3[2] = C3[2] + 886263092 + (C3[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
            C3[3] = C3[3] + 1295307597 + (C3[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
            C3[4] = C3[4] + 3545052371 + (C3[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
            C3[5] = C3[5] + 886263092 + (C3[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
            C3[6] = C3[6] + 1295307597 + (C3[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
            C3[7] = C3[7] + 3545052371 + (C3[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
            this._b = C3[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
            for (var i2 = 0; i2 < 8; i2++) {
              var gx = X[i2] + C3[i2];
              var ga = gx & 65535;
              var gb = gx >>> 16;
              var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
              var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
              G2[i2] = gh ^ gl;
            }
            X[0] = G2[0] + (G2[7] << 16 | G2[7] >>> 16) + (G2[6] << 16 | G2[6] >>> 16) | 0;
            X[1] = G2[1] + (G2[0] << 8 | G2[0] >>> 24) + G2[7] | 0;
            X[2] = G2[2] + (G2[1] << 16 | G2[1] >>> 16) + (G2[0] << 16 | G2[0] >>> 16) | 0;
            X[3] = G2[3] + (G2[2] << 8 | G2[2] >>> 24) + G2[1] | 0;
            X[4] = G2[4] + (G2[3] << 16 | G2[3] >>> 16) + (G2[2] << 16 | G2[2] >>> 16) | 0;
            X[5] = G2[5] + (G2[4] << 8 | G2[4] >>> 24) + G2[3] | 0;
            X[6] = G2[6] + (G2[5] << 16 | G2[5] >>> 16) + (G2[4] << 16 | G2[4] >>> 16) | 0;
            X[7] = G2[7] + (G2[6] << 8 | G2[6] >>> 24) + G2[5] | 0;
          }
          C2.Rabbit = StreamCipher._createHelper(Rabbit);
        })();
        return CryptoJS2.Rabbit;
      });
    })(rabbit);
    return rabbit.exports;
  }
  var rabbitLegacy = { exports: {} };
  var hasRequiredRabbitLegacy;
  function requireRabbitLegacy() {
    if (hasRequiredRabbitLegacy) return rabbitLegacy.exports;
    hasRequiredRabbitLegacy = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var StreamCipher = C_lib.StreamCipher;
          var C_algo = C2.algo;
          var S2 = [];
          var C_ = [];
          var G2 = [];
          var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
            _doReset: function() {
              var K = this._key.words;
              var iv = this.cfg.iv;
              var X = this._X = [
                K[0],
                K[3] << 16 | K[2] >>> 16,
                K[1],
                K[0] << 16 | K[3] >>> 16,
                K[2],
                K[1] << 16 | K[0] >>> 16,
                K[3],
                K[2] << 16 | K[1] >>> 16
              ];
              var C3 = this._C = [
                K[2] << 16 | K[2] >>> 16,
                K[0] & 4294901760 | K[1] & 65535,
                K[3] << 16 | K[3] >>> 16,
                K[1] & 4294901760 | K[2] & 65535,
                K[0] << 16 | K[0] >>> 16,
                K[2] & 4294901760 | K[3] & 65535,
                K[1] << 16 | K[1] >>> 16,
                K[3] & 4294901760 | K[0] & 65535
              ];
              this._b = 0;
              for (var i2 = 0; i2 < 4; i2++) {
                nextState.call(this);
              }
              for (var i2 = 0; i2 < 8; i2++) {
                C3[i2] ^= X[i2 + 4 & 7];
              }
              if (iv) {
                var IV = iv.words;
                var IV_0 = IV[0];
                var IV_1 = IV[1];
                var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
                var i22 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
                var i1 = i0 >>> 16 | i22 & 4294901760;
                var i3 = i22 << 16 | i0 & 65535;
                C3[0] ^= i0;
                C3[1] ^= i1;
                C3[2] ^= i22;
                C3[3] ^= i3;
                C3[4] ^= i0;
                C3[5] ^= i1;
                C3[6] ^= i22;
                C3[7] ^= i3;
                for (var i2 = 0; i2 < 4; i2++) {
                  nextState.call(this);
                }
              }
            },
            _doProcessBlock: function(M2, offset) {
              var X = this._X;
              nextState.call(this);
              S2[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
              S2[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
              S2[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
              S2[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
              for (var i2 = 0; i2 < 4; i2++) {
                S2[i2] = (S2[i2] << 8 | S2[i2] >>> 24) & 16711935 | (S2[i2] << 24 | S2[i2] >>> 8) & 4278255360;
                M2[offset + i2] ^= S2[i2];
              }
            },
            blockSize: 128 / 32,
            ivSize: 64 / 32
          });
          function nextState() {
            var X = this._X;
            var C3 = this._C;
            for (var i2 = 0; i2 < 8; i2++) {
              C_[i2] = C3[i2];
            }
            C3[0] = C3[0] + 1295307597 + this._b | 0;
            C3[1] = C3[1] + 3545052371 + (C3[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
            C3[2] = C3[2] + 886263092 + (C3[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
            C3[3] = C3[3] + 1295307597 + (C3[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
            C3[4] = C3[4] + 3545052371 + (C3[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
            C3[5] = C3[5] + 886263092 + (C3[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
            C3[6] = C3[6] + 1295307597 + (C3[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
            C3[7] = C3[7] + 3545052371 + (C3[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
            this._b = C3[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
            for (var i2 = 0; i2 < 8; i2++) {
              var gx = X[i2] + C3[i2];
              var ga = gx & 65535;
              var gb = gx >>> 16;
              var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
              var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
              G2[i2] = gh ^ gl;
            }
            X[0] = G2[0] + (G2[7] << 16 | G2[7] >>> 16) + (G2[6] << 16 | G2[6] >>> 16) | 0;
            X[1] = G2[1] + (G2[0] << 8 | G2[0] >>> 24) + G2[7] | 0;
            X[2] = G2[2] + (G2[1] << 16 | G2[1] >>> 16) + (G2[0] << 16 | G2[0] >>> 16) | 0;
            X[3] = G2[3] + (G2[2] << 8 | G2[2] >>> 24) + G2[1] | 0;
            X[4] = G2[4] + (G2[3] << 16 | G2[3] >>> 16) + (G2[2] << 16 | G2[2] >>> 16) | 0;
            X[5] = G2[5] + (G2[4] << 8 | G2[4] >>> 24) + G2[3] | 0;
            X[6] = G2[6] + (G2[5] << 16 | G2[5] >>> 16) + (G2[4] << 16 | G2[4] >>> 16) | 0;
            X[7] = G2[7] + (G2[6] << 8 | G2[6] >>> 24) + G2[5] | 0;
          }
          C2.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
        })();
        return CryptoJS2.RabbitLegacy;
      });
    })(rabbitLegacy);
    return rabbitLegacy.exports;
  }
  var blowfish = { exports: {} };
  var hasRequiredBlowfish;
  function requireBlowfish() {
    if (hasRequiredBlowfish) return blowfish.exports;
    hasRequiredBlowfish = 1;
    (function(module, exports) {
      (function(root, factory, undef) {
        {
          module.exports = factory(requireCore(), requireEncBase64(), requireMd5(), requireEvpkdf(), requireCipherCore());
        }
      })(commonjsGlobal, function(CryptoJS2) {
        (function() {
          var C2 = CryptoJS2;
          var C_lib = C2.lib;
          var BlockCipher = C_lib.BlockCipher;
          var C_algo = C2.algo;
          const N2 = 16;
          const ORIG_P = [
            608135816,
            2242054355,
            320440878,
            57701188,
            2752067618,
            698298832,
            137296536,
            3964562569,
            1160258022,
            953160567,
            3193202383,
            887688300,
            3232508343,
            3380367581,
            1065670069,
            3041331479,
            2450970073,
            2306472731
          ];
          const ORIG_S = [
            [
              3509652390,
              2564797868,
              805139163,
              3491422135,
              3101798381,
              1780907670,
              3128725573,
              4046225305,
              614570311,
              3012652279,
              134345442,
              2240740374,
              1667834072,
              1901547113,
              2757295779,
              4103290238,
              227898511,
              1921955416,
              1904987480,
              2182433518,
              2069144605,
              3260701109,
              2620446009,
              720527379,
              3318853667,
              677414384,
              3393288472,
              3101374703,
              2390351024,
              1614419982,
              1822297739,
              2954791486,
              3608508353,
              3174124327,
              2024746970,
              1432378464,
              3864339955,
              2857741204,
              1464375394,
              1676153920,
              1439316330,
              715854006,
              3033291828,
              289532110,
              2706671279,
              2087905683,
              3018724369,
              1668267050,
              732546397,
              1947742710,
              3462151702,
              2609353502,
              2950085171,
              1814351708,
              2050118529,
              680887927,
              999245976,
              1800124847,
              3300911131,
              1713906067,
              1641548236,
              4213287313,
              1216130144,
              1575780402,
              4018429277,
              3917837745,
              3693486850,
              3949271944,
              596196993,
              3549867205,
              258830323,
              2213823033,
              772490370,
              2760122372,
              1774776394,
              2652871518,
              566650946,
              4142492826,
              1728879713,
              2882767088,
              1783734482,
              3629395816,
              2517608232,
              2874225571,
              1861159788,
              326777828,
              3124490320,
              2130389656,
              2716951837,
              967770486,
              1724537150,
              2185432712,
              2364442137,
              1164943284,
              2105845187,
              998989502,
              3765401048,
              2244026483,
              1075463327,
              1455516326,
              1322494562,
              910128902,
              469688178,
              1117454909,
              936433444,
              3490320968,
              3675253459,
              1240580251,
              122909385,
              2157517691,
              634681816,
              4142456567,
              3825094682,
              3061402683,
              2540495037,
              79693498,
              3249098678,
              1084186820,
              1583128258,
              426386531,
              1761308591,
              1047286709,
              322548459,
              995290223,
              1845252383,
              2603652396,
              3431023940,
              2942221577,
              3202600964,
              3727903485,
              1712269319,
              422464435,
              3234572375,
              1170764815,
              3523960633,
              3117677531,
              1434042557,
              442511882,
              3600875718,
              1076654713,
              1738483198,
              4213154764,
              2393238008,
              3677496056,
              1014306527,
              4251020053,
              793779912,
              2902807211,
              842905082,
              4246964064,
              1395751752,
              1040244610,
              2656851899,
              3396308128,
              445077038,
              3742853595,
              3577915638,
              679411651,
              2892444358,
              2354009459,
              1767581616,
              3150600392,
              3791627101,
              3102740896,
              284835224,
              4246832056,
              1258075500,
              768725851,
              2589189241,
              3069724005,
              3532540348,
              1274779536,
              3789419226,
              2764799539,
              1660621633,
              3471099624,
              4011903706,
              913787905,
              3497959166,
              737222580,
              2514213453,
              2928710040,
              3937242737,
              1804850592,
              3499020752,
              2949064160,
              2386320175,
              2390070455,
              2415321851,
              4061277028,
              2290661394,
              2416832540,
              1336762016,
              1754252060,
              3520065937,
              3014181293,
              791618072,
              3188594551,
              3933548030,
              2332172193,
              3852520463,
              3043980520,
              413987798,
              3465142937,
              3030929376,
              4245938359,
              2093235073,
              3534596313,
              375366246,
              2157278981,
              2479649556,
              555357303,
              3870105701,
              2008414854,
              3344188149,
              4221384143,
              3956125452,
              2067696032,
              3594591187,
              2921233993,
              2428461,
              544322398,
              577241275,
              1471733935,
              610547355,
              4027169054,
              1432588573,
              1507829418,
              2025931657,
              3646575487,
              545086370,
              48609733,
              2200306550,
              1653985193,
              298326376,
              1316178497,
              3007786442,
              2064951626,
              458293330,
              2589141269,
              3591329599,
              3164325604,
              727753846,
              2179363840,
              146436021,
              1461446943,
              4069977195,
              705550613,
              3059967265,
              3887724982,
              4281599278,
              3313849956,
              1404054877,
              2845806497,
              146425753,
              1854211946
            ],
            [
              1266315497,
              3048417604,
              3681880366,
              3289982499,
              290971e4,
              1235738493,
              2632868024,
              2414719590,
              3970600049,
              1771706367,
              1449415276,
              3266420449,
              422970021,
              1963543593,
              2690192192,
              3826793022,
              1062508698,
              1531092325,
              1804592342,
              2583117782,
              2714934279,
              4024971509,
              1294809318,
              4028980673,
              1289560198,
              2221992742,
              1669523910,
              35572830,
              157838143,
              1052438473,
              1016535060,
              1802137761,
              1753167236,
              1386275462,
              3080475397,
              2857371447,
              1040679964,
              2145300060,
              2390574316,
              1461121720,
              2956646967,
              4031777805,
              4028374788,
              33600511,
              2920084762,
              1018524850,
              629373528,
              3691585981,
              3515945977,
              2091462646,
              2486323059,
              586499841,
              988145025,
              935516892,
              3367335476,
              2599673255,
              2839830854,
              265290510,
              3972581182,
              2759138881,
              3795373465,
              1005194799,
              847297441,
              406762289,
              1314163512,
              1332590856,
              1866599683,
              4127851711,
              750260880,
              613907577,
              1450815602,
              3165620655,
              3734664991,
              3650291728,
              3012275730,
              3704569646,
              1427272223,
              778793252,
              1343938022,
              2676280711,
              2052605720,
              1946737175,
              3164576444,
              3914038668,
              3967478842,
              3682934266,
              1661551462,
              3294938066,
              4011595847,
              840292616,
              3712170807,
              616741398,
              312560963,
              711312465,
              1351876610,
              322626781,
              1910503582,
              271666773,
              2175563734,
              1594956187,
              70604529,
              3617834859,
              1007753275,
              1495573769,
              4069517037,
              2549218298,
              2663038764,
              504708206,
              2263041392,
              3941167025,
              2249088522,
              1514023603,
              1998579484,
              1312622330,
              694541497,
              2582060303,
              2151582166,
              1382467621,
              776784248,
              2618340202,
              3323268794,
              2497899128,
              2784771155,
              503983604,
              4076293799,
              907881277,
              423175695,
              432175456,
              1378068232,
              4145222326,
              3954048622,
              3938656102,
              3820766613,
              2793130115,
              2977904593,
              26017576,
              3274890735,
              3194772133,
              1700274565,
              1756076034,
              4006520079,
              3677328699,
              720338349,
              1533947780,
              354530856,
              688349552,
              3973924725,
              1637815568,
              332179504,
              3949051286,
              53804574,
              2852348879,
              3044236432,
              1282449977,
              3583942155,
              3416972820,
              4006381244,
              1617046695,
              2628476075,
              3002303598,
              1686838959,
              431878346,
              2686675385,
              1700445008,
              1080580658,
              1009431731,
              832498133,
              3223435511,
              2605976345,
              2271191193,
              2516031870,
              1648197032,
              4164389018,
              2548247927,
              300782431,
              375919233,
              238389289,
              3353747414,
              2531188641,
              2019080857,
              1475708069,
              455242339,
              2609103871,
              448939670,
              3451063019,
              1395535956,
              2413381860,
              1841049896,
              1491858159,
              885456874,
              4264095073,
              4001119347,
              1565136089,
              3898914787,
              1108368660,
              540939232,
              1173283510,
              2745871338,
              3681308437,
              4207628240,
              3343053890,
              4016749493,
              1699691293,
              1103962373,
              3625875870,
              2256883143,
              3830138730,
              1031889488,
              3479347698,
              1535977030,
              4236805024,
              3251091107,
              2132092099,
              1774941330,
              1199868427,
              1452454533,
              157007616,
              2904115357,
              342012276,
              595725824,
              1480756522,
              206960106,
              497939518,
              591360097,
              863170706,
              2375253569,
              3596610801,
              1814182875,
              2094937945,
              3421402208,
              1082520231,
              3463918190,
              2785509508,
              435703966,
              3908032597,
              1641649973,
              2842273706,
              3305899714,
              1510255612,
              2148256476,
              2655287854,
              3276092548,
              4258621189,
              236887753,
              3681803219,
              274041037,
              1734335097,
              3815195456,
              3317970021,
              1899903192,
              1026095262,
              4050517792,
              356393447,
              2410691914,
              3873677099,
              3682840055
            ],
            [
              3913112168,
              2491498743,
              4132185628,
              2489919796,
              1091903735,
              1979897079,
              3170134830,
              3567386728,
              3557303409,
              857797738,
              1136121015,
              1342202287,
              507115054,
              2535736646,
              337727348,
              3213592640,
              1301675037,
              2528481711,
              1895095763,
              1721773893,
              3216771564,
              62756741,
              2142006736,
              835421444,
              2531993523,
              1442658625,
              3659876326,
              2882144922,
              676362277,
              1392781812,
              170690266,
              3921047035,
              1759253602,
              3611846912,
              1745797284,
              664899054,
              1329594018,
              3901205900,
              3045908486,
              2062866102,
              2865634940,
              3543621612,
              3464012697,
              1080764994,
              553557557,
              3656615353,
              3996768171,
              991055499,
              499776247,
              1265440854,
              648242737,
              3940784050,
              980351604,
              3713745714,
              1749149687,
              3396870395,
              4211799374,
              3640570775,
              1161844396,
              3125318951,
              1431517754,
              545492359,
              4268468663,
              3499529547,
              1437099964,
              2702547544,
              3433638243,
              2581715763,
              2787789398,
              1060185593,
              1593081372,
              2418618748,
              4260947970,
              69676912,
              2159744348,
              86519011,
              2512459080,
              3838209314,
              1220612927,
              3339683548,
              133810670,
              1090789135,
              1078426020,
              1569222167,
              845107691,
              3583754449,
              4072456591,
              1091646820,
              628848692,
              1613405280,
              3757631651,
              526609435,
              236106946,
              48312990,
              2942717905,
              3402727701,
              1797494240,
              859738849,
              992217954,
              4005476642,
              2243076622,
              3870952857,
              3732016268,
              765654824,
              3490871365,
              2511836413,
              1685915746,
              3888969200,
              1414112111,
              2273134842,
              3281911079,
              4080962846,
              172450625,
              2569994100,
              980381355,
              4109958455,
              2819808352,
              2716589560,
              2568741196,
              3681446669,
              3329971472,
              1835478071,
              660984891,
              3704678404,
              4045999559,
              3422617507,
              3040415634,
              1762651403,
              1719377915,
              3470491036,
              2693910283,
              3642056355,
              3138596744,
              1364962596,
              2073328063,
              1983633131,
              926494387,
              3423689081,
              2150032023,
              4096667949,
              1749200295,
              3328846651,
              309677260,
              2016342300,
              1779581495,
              3079819751,
              111262694,
              1274766160,
              443224088,
              298511866,
              1025883608,
              3806446537,
              1145181785,
              168956806,
              3641502830,
              3584813610,
              1689216846,
              3666258015,
              3200248200,
              1692713982,
              2646376535,
              4042768518,
              1618508792,
              1610833997,
              3523052358,
              4130873264,
              2001055236,
              3610705100,
              2202168115,
              4028541809,
              2961195399,
              1006657119,
              2006996926,
              3186142756,
              1430667929,
              3210227297,
              1314452623,
              4074634658,
              4101304120,
              2273951170,
              1399257539,
              3367210612,
              3027628629,
              1190975929,
              2062231137,
              2333990788,
              2221543033,
              2438960610,
              1181637006,
              548689776,
              2362791313,
              3372408396,
              3104550113,
              3145860560,
              296247880,
              1970579870,
              3078560182,
              3769228297,
              1714227617,
              3291629107,
              3898220290,
              166772364,
              1251581989,
              493813264,
              448347421,
              195405023,
              2709975567,
              677966185,
              3703036547,
              1463355134,
              2715995803,
              1338867538,
              1343315457,
              2802222074,
              2684532164,
              233230375,
              2599980071,
              2000651841,
              3277868038,
              1638401717,
              4028070440,
              3237316320,
              6314154,
              819756386,
              300326615,
              590932579,
              1405279636,
              3267499572,
              3150704214,
              2428286686,
              3959192993,
              3461946742,
              1862657033,
              1266418056,
              963775037,
              2089974820,
              2263052895,
              1917689273,
              448879540,
              3550394620,
              3981727096,
              150775221,
              3627908307,
              1303187396,
              508620638,
              2975983352,
              2726630617,
              1817252668,
              1876281319,
              1457606340,
              908771278,
              3720792119,
              3617206836,
              2455994898,
              1729034894,
              1080033504
            ],
            [
              976866871,
              3556439503,
              2881648439,
              1522871579,
              1555064734,
              1336096578,
              3548522304,
              2579274686,
              3574697629,
              3205460757,
              3593280638,
              3338716283,
              3079412587,
              564236357,
              2993598910,
              1781952180,
              1464380207,
              3163844217,
              3332601554,
              1699332808,
              1393555694,
              1183702653,
              3581086237,
              1288719814,
              691649499,
              2847557200,
              2895455976,
              3193889540,
              2717570544,
              1781354906,
              1676643554,
              2592534050,
              3230253752,
              1126444790,
              2770207658,
              2633158820,
              2210423226,
              2615765581,
              2414155088,
              3127139286,
              673620729,
              2805611233,
              1269405062,
              4015350505,
              3341807571,
              4149409754,
              1057255273,
              2012875353,
              2162469141,
              2276492801,
              2601117357,
              993977747,
              3918593370,
              2654263191,
              753973209,
              36408145,
              2530585658,
              25011837,
              3520020182,
              2088578344,
              530523599,
              2918365339,
              1524020338,
              1518925132,
              3760827505,
              3759777254,
              1202760957,
              3985898139,
              3906192525,
              674977740,
              4174734889,
              2031300136,
              2019492241,
              3983892565,
              4153806404,
              3822280332,
              352677332,
              2297720250,
              60907813,
              90501309,
              3286998549,
              1016092578,
              2535922412,
              2839152426,
              457141659,
              509813237,
              4120667899,
              652014361,
              1966332200,
              2975202805,
              55981186,
              2327461051,
              676427537,
              3255491064,
              2882294119,
              3433927263,
              1307055953,
              942726286,
              933058658,
              2468411793,
              3933900994,
              4215176142,
              1361170020,
              2001714738,
              2830558078,
              3274259782,
              1222529897,
              1679025792,
              2729314320,
              3714953764,
              1770335741,
              151462246,
              3013232138,
              1682292957,
              1483529935,
              471910574,
              1539241949,
              458788160,
              3436315007,
              1807016891,
              3718408830,
              978976581,
              1043663428,
              3165965781,
              1927990952,
              4200891579,
              2372276910,
              3208408903,
              3533431907,
              1412390302,
              2931980059,
              4132332400,
              1947078029,
              3881505623,
              4168226417,
              2941484381,
              1077988104,
              1320477388,
              886195818,
              18198404,
              3786409e3,
              2509781533,
              112762804,
              3463356488,
              1866414978,
              891333506,
              18488651,
              661792760,
              1628790961,
              3885187036,
              3141171499,
              876946877,
              2693282273,
              1372485963,
              791857591,
              2686433993,
              3759982718,
              3167212022,
              3472953795,
              2716379847,
              445679433,
              3561995674,
              3504004811,
              3574258232,
              54117162,
              3331405415,
              2381918588,
              3769707343,
              4154350007,
              1140177722,
              4074052095,
              668550556,
              3214352940,
              367459370,
              261225585,
              2610173221,
              4209349473,
              3468074219,
              3265815641,
              314222801,
              3066103646,
              3808782860,
              282218597,
              3406013506,
              3773591054,
              379116347,
              1285071038,
              846784868,
              2669647154,
              3771962079,
              3550491691,
              2305946142,
              453669953,
              1268987020,
              3317592352,
              3279303384,
              3744833421,
              2610507566,
              3859509063,
              266596637,
              3847019092,
              517658769,
              3462560207,
              3443424879,
              370717030,
              4247526661,
              2224018117,
              4143653529,
              4112773975,
              2788324899,
              2477274417,
              1456262402,
              2901442914,
              1517677493,
              1846949527,
              2295493580,
              3734397586,
              2176403920,
              1280348187,
              1908823572,
              3871786941,
              846861322,
              1172426758,
              3287448474,
              3383383037,
              1655181056,
              3139813346,
              901632758,
              1897031941,
              2986607138,
              3066810236,
              3447102507,
              1393639104,
              373351379,
              950779232,
              625454576,
              3124240540,
              4148612726,
              2007998917,
              544563296,
              2244738638,
              2330496472,
              2058025392,
              1291430526,
              424198748,
              50039436,
              29584100,
              3605783033,
              2429876329,
              2791104160,
              1057563949,
              3255363231,
              3075367218,
              3463963227,
              1469046755,
              985887462
            ]
          ];
          var BLOWFISH_CTX = {
            pbox: [],
            sbox: []
          };
          function F2(ctx, x2) {
            let a2 = x2 >> 24 & 255;
            let b2 = x2 >> 16 & 255;
            let c2 = x2 >> 8 & 255;
            let d2 = x2 & 255;
            let y2 = ctx.sbox[0][a2] + ctx.sbox[1][b2];
            y2 = y2 ^ ctx.sbox[2][c2];
            y2 = y2 + ctx.sbox[3][d2];
            return y2;
          }
          function BlowFish_Encrypt(ctx, left, right) {
            let Xl = left;
            let Xr = right;
            let temp;
            for (let i2 = 0; i2 < N2; ++i2) {
              Xl = Xl ^ ctx.pbox[i2];
              Xr = F2(ctx, Xl) ^ Xr;
              temp = Xl;
              Xl = Xr;
              Xr = temp;
            }
            temp = Xl;
            Xl = Xr;
            Xr = temp;
            Xr = Xr ^ ctx.pbox[N2];
            Xl = Xl ^ ctx.pbox[N2 + 1];
            return { left: Xl, right: Xr };
          }
          function BlowFish_Decrypt(ctx, left, right) {
            let Xl = left;
            let Xr = right;
            let temp;
            for (let i2 = N2 + 1; i2 > 1; --i2) {
              Xl = Xl ^ ctx.pbox[i2];
              Xr = F2(ctx, Xl) ^ Xr;
              temp = Xl;
              Xl = Xr;
              Xr = temp;
            }
            temp = Xl;
            Xl = Xr;
            Xr = temp;
            Xr = Xr ^ ctx.pbox[1];
            Xl = Xl ^ ctx.pbox[0];
            return { left: Xl, right: Xr };
          }
          function BlowFishInit(ctx, key, keysize) {
            for (let Row = 0; Row < 4; Row++) {
              ctx.sbox[Row] = [];
              for (let Col = 0; Col < 256; Col++) {
                ctx.sbox[Row][Col] = ORIG_S[Row][Col];
              }
            }
            let keyIndex = 0;
            for (let index = 0; index < N2 + 2; index++) {
              ctx.pbox[index] = ORIG_P[index] ^ key[keyIndex];
              keyIndex++;
              if (keyIndex >= keysize) {
                keyIndex = 0;
              }
            }
            let Data1 = 0;
            let Data2 = 0;
            let res = 0;
            for (let i2 = 0; i2 < N2 + 2; i2 += 2) {
              res = BlowFish_Encrypt(ctx, Data1, Data2);
              Data1 = res.left;
              Data2 = res.right;
              ctx.pbox[i2] = Data1;
              ctx.pbox[i2 + 1] = Data2;
            }
            for (let i2 = 0; i2 < 4; i2++) {
              for (let j2 = 0; j2 < 256; j2 += 2) {
                res = BlowFish_Encrypt(ctx, Data1, Data2);
                Data1 = res.left;
                Data2 = res.right;
                ctx.sbox[i2][j2] = Data1;
                ctx.sbox[i2][j2 + 1] = Data2;
              }
            }
            return true;
          }
          var Blowfish = C_algo.Blowfish = BlockCipher.extend({
            _doReset: function() {
              if (this._keyPriorReset === this._key) {
                return;
              }
              var key = this._keyPriorReset = this._key;
              var keyWords = key.words;
              var keySize = key.sigBytes / 4;
              BlowFishInit(BLOWFISH_CTX, keyWords, keySize);
            },
            encryptBlock: function(M2, offset) {
              var res = BlowFish_Encrypt(BLOWFISH_CTX, M2[offset], M2[offset + 1]);
              M2[offset] = res.left;
              M2[offset + 1] = res.right;
            },
            decryptBlock: function(M2, offset) {
              var res = BlowFish_Decrypt(BLOWFISH_CTX, M2[offset], M2[offset + 1]);
              M2[offset] = res.left;
              M2[offset + 1] = res.right;
            },
            blockSize: 64 / 32,
            keySize: 128 / 32,
            ivSize: 64 / 32
          });
          C2.Blowfish = BlockCipher._createHelper(Blowfish);
        })();
        return CryptoJS2.Blowfish;
      });
    })(blowfish);
    return blowfish.exports;
  }
  (function(module, exports) {
    (function(root, factory, undef) {
      {
        module.exports = factory(requireCore(), requireX64Core(), requireLibTypedarrays(), requireEncUtf16(), requireEncBase64(), requireEncBase64url(), requireMd5(), requireSha1(), requireSha256(), requireSha224(), requireSha512(), requireSha384(), requireSha3(), requireRipemd160(), requireHmac(), requirePbkdf2(), requireEvpkdf(), requireCipherCore(), requireModeCfb(), requireModeCtr(), requireModeCtrGladman(), requireModeOfb(), requireModeEcb(), requirePadAnsix923(), requirePadIso10126(), requirePadIso97971(), requirePadZeropadding(), requirePadNopadding(), requireFormatHex(), requireAes(), requireTripledes(), requireRc4(), requireRabbit(), requireRabbitLegacy(), requireBlowfish());
      }
    })(commonjsGlobal, function(CryptoJS2) {
      return CryptoJS2;
    });
  })(cryptoJs);
  var cryptoJsExports = cryptoJs.exports;
  const CryptoJS = /* @__PURE__ */ getDefaultExportFromCjs(cryptoJsExports);
  const COURSE_GRADING_SECRET_KEY = "Client8Sess!06ID";
  function encryptPassword(password, secretKey = COURSE_GRADING_SECRET_KEY) {
    const key = CryptoJS.enc.Utf8.parse(secretKey);
    const encrypted = CryptoJS.AES.encrypt(password, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  }
  const STORE_STORAGE_KEY = "nodd_normalized_store_v2";
  class HomeworkDB {
    constructor(storage2) {
      __publicField(this, "storage");
      this.storage = storage2;
    }
    async load() {
      try {
        const raw = await this.storage.get(STORE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.version === 2 && parsed.courses && parsed.assignments) {
            return parsed;
          }
        }
      } catch {
      }
      return {
        version: 2,
        lastSync: 0,
        courses: {},
        assignments: {}
      };
    }
    async save(data) {
      data.lastSync = Date.now();
      await this.storage.set(STORE_STORAGE_KEY, JSON.stringify(data));
    }
    /**
     * 注册或更新课程元数据（按 courseId 唯一索引，绝无重复课程）
     */
    async upsertCourse(id, name) {
      if (!id) return;
      const store = await this.load();
      const existing = store.courses[id];
      const finalName = (!existing || existing.name === "当前课程") && name !== "当前课程" ? name : (existing == null ? void 0 : existing.name) || name;
      store.courses[id] = {
        id,
        name: finalName,
        updatedAt: Date.now()
      };
      for (const a2 of Object.values(store.assignments)) {
        if (a2.courseId === id && a2.courseName !== finalName) {
          a2.courseName = finalName;
        }
      }
      await this.save(store);
    }
    /**
     * 归一化插入或更新单项作业（以 assignId 为唯一主键）
     */
    async upsertAssignment(item) {
      if (!item.id) return;
      const store = await this.load();
      const existing = store.assignments[item.id];
      const courseId = item.courseId || (existing == null ? void 0 : existing.courseId) || "";
      let courseName = item.courseName || (existing == null ? void 0 : existing.courseName) || "专业课程";
      if (courseId && store.courses[courseId]) {
        courseName = store.courses[courseId].name;
      } else if (courseId && courseName !== "当前课程") {
        store.courses[courseId] = { id: courseId, name: courseName, updatedAt: Date.now() };
      }
      let finalDeadline = item.deadline;
      let finalTimestamp = item.deadlineTimestamp;
      let finalRemHours = item.remainingHours;
      let finalRemText = item.remainingText;
      let finalUrgency = item.urgency;
      if (finalTimestamp === 0 && existing && existing.deadlineTimestamp > 0) {
        finalDeadline = existing.deadline;
        finalTimestamp = existing.deadlineTimestamp;
        finalRemHours = existing.remainingHours;
        finalRemText = existing.remainingText;
        finalUrgency = existing.urgency;
      }
      let finalUrl = item.url || (existing == null ? void 0 : existing.url) || "";
      if (!finalUrl || !finalUrl.includes("courseID") && courseId) {
        finalUrl = courseId ? `/assignment/index.jsp?courseID=${courseId}&assignID=${item.id}` : `/assignment/index.jsp?assignID=${item.id}`;
      }
      store.assignments[item.id] = {
        id: item.id,
        courseId,
        courseName,
        title: item.title || (existing == null ? void 0 : existing.title) || `作业 ${item.id}`,
        deadline: finalDeadline,
        deadlineTimestamp: finalTimestamp,
        remainingHours: finalRemHours,
        remainingText: finalRemText,
        status: item.status || (existing == null ? void 0 : existing.status) || "pending",
        urgency: finalUrgency,
        url: finalUrl,
        updatedAt: Date.now()
      };
      await this.save(store);
    }
    /**
     * 批量归一化更新作业
     */
    async batchUpsertAssignments(items) {
      for (const item of items) {
        await this.upsertAssignment(item);
      }
    }
    /**
     * 获取结构化数据库中全部聚合作业列表，并进行最佳实践排序
     * 排序逻辑：
     * 1. 距离 DDL 越近的进行中作业排在最前
     * 2. 已超期的作业沉底展示
     * 3. 课程名称实时关联 courses 表，保证展示统一规范
     */
    async getAllAssignments() {
      const store = await this.load();
      const records = Object.values(store.assignments);
      const list = records.map((r2) => {
        var _a;
        const canonicalName = r2.courseId && ((_a = store.courses[r2.courseId]) == null ? void 0 : _a.name) ? store.courses[r2.courseId].name : r2.courseName && r2.courseName !== "当前课程" ? r2.courseName : "专业课程";
        const url = !r2.url.includes("courseID") && r2.courseId ? `/assignment/index.jsp?courseID=${r2.courseId}&assignID=${r2.id}` : r2.url;
        return {
          id: r2.id,
          courseId: r2.courseId,
          courseName: canonicalName,
          title: r2.title,
          deadline: r2.deadline,
          deadlineTimestamp: r2.deadlineTimestamp,
          remainingHours: r2.remainingHours,
          remainingText: r2.remainingText,
          status: r2.status,
          urgency: r2.urgency,
          url
        };
      });
      return list.sort((a2, b2) => {
        const aActive = a2.remainingHours > 0 && a2.deadlineTimestamp > 0;
        const bActive = b2.remainingHours > 0 && b2.deadlineTimestamp > 0;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        if (aActive && bActive) {
          return a2.deadlineTimestamp - b2.deadlineTimestamp;
        }
        if (a2.deadlineTimestamp > 0 && b2.deadlineTimestamp > 0) {
          return b2.deadlineTimestamp - a2.deadlineTimestamp;
        }
        return (b2.deadlineTimestamp || 0) - (a2.deadlineTimestamp || 0);
      });
    }
  }
  function calculateUrgency(remainingHours) {
    if (remainingHours <= 0) return "passed";
    if (remainingHours <= 6) return "critical";
    if (remainingHours <= 24) return "urgent";
    if (remainingHours <= 72) return "warning";
    return "normal";
  }
  function formatRemainingTime(remainingHours) {
    if (remainingHours <= 0) {
      const passed = Math.abs(remainingHours);
      if (passed < 24) {
        return `已超 DDL ${Math.max(1, Math.round(passed))} 小时`;
      }
      return `已超 DDL ${Math.floor(passed / 24)} 天`;
    }
    if (remainingHours < 1) {
      const mins = Math.max(1, Math.round(remainingHours * 60));
      return `仅剩 ${mins} 分钟`;
    }
    if (remainingHours < 24) {
      const hrs2 = Math.floor(remainingHours);
      const mins = Math.round((remainingHours - hrs2) * 60);
      return mins > 0 ? `剩 ${hrs2} 小时 ${mins} 分` : `剩 ${hrs2} 小时`;
    }
    const days = Math.floor(remainingHours / 24);
    const hrs = Math.round(remainingHours % 24);
    return hrs > 0 ? `剩 ${days} 天 ${hrs} 小时` : `剩 ${days} 天`;
  }
  function extractDeadlineFromText(text) {
    if (!text) return "";
    const xijiTagMatch = text.match(/作业时间[：:\s]*<b[^>]*>[^<]*<\/b>\s*(?:至|到|~)\s*<b[^>]*>([^<]+)<\/b>/i);
    if (xijiTagMatch && xijiTagMatch[1]) {
      return xijiTagMatch[1].trim();
    }
    const tagRangeMatch = text.match(/<b[^>]*>[^<]*<\/b>\s*(?:至|到|~)\s*<b[^>]*>([\d\-/年月日. :]+)<\/b>/i);
    if (tagRangeMatch && tagRangeMatch[1]) {
      return tagRangeMatch[1].trim();
    }
    const rangeParts = text.split(/\s*(?:至|到|~)\s*/);
    if (rangeParts.length > 1) {
      const candidate = rangeParts[rangeParts.length - 1].trim();
      const dateM = candidate.match(/\b(?:\d{4}[-/.年])?\d{1,2}[-/.月]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\b/);
      if (dateM) return dateM[0].trim();
    }
    const kwMatch = text.match(/(?:截止|结束)(?:时间|日期)?[:：\s]*([\d\-/年月日. :]+)/i);
    if (kwMatch && kwMatch[1]) {
      return kwMatch[1].trim();
    }
    const exactDateMatch = text.trim().match(/^(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/);
    if (exactDateMatch && exactDateMatch[1]) {
      return exactDateMatch[1].trim();
    }
    return "";
  }
  function parseDeadlineBeijing(rawInput, nowMs = Date.now()) {
    const raw = rawInput.trim();
    if (!raw) {
      return emptyDeadline("未标注截止时间");
    }
    const extracted = extractDeadlineFromText(raw);
    if (!extracted) {
      return emptyDeadline(raw);
    }
    const clean = extracted.replace(/[年月]/g, "-").replace(/[日号]/g, " ").replace(/[./]/g, "-").replace(/\s+/g, " ").trim();
    const m2 = clean.match(/(?:(\d{4})-)?(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (!m2) {
      return emptyDeadline(raw);
    }
    const curYear = new Date(nowMs).getFullYear();
    const y2 = m2[1] ? parseInt(m2[1], 10) : curYear;
    const mo = parseInt(m2[2], 10);
    const d2 = parseInt(m2[3], 10);
    const h2 = m2[4] !== void 0 ? parseInt(m2[4], 10) : 23;
    const min = m2[5] !== void 0 ? parseInt(m2[5], 10) : 59;
    const s2 = m2[6] !== void 0 ? parseInt(m2[6], 10) : 0;
    if (mo < 1 || mo > 12 || d2 < 1 || d2 > 31 || h2 < 0 || h2 > 23 || min < 0 || min > 59) {
      return emptyDeadline(raw);
    }
    const ts = Date.UTC(y2, mo - 1, d2, h2, min, s2) - 8 * 3600 * 1e3;
    const remHrs = Number(((ts - nowMs) / 36e5).toFixed(1));
    const pad = (n2) => String(n2).padStart(2, "0");
    return {
      raw,
      normalized: `${y2}-${pad(mo)}-${pad(d2)} ${pad(h2)}:${pad(min)}:${pad(s2)}`,
      timestamp: ts,
      remainingHours: remHrs,
      remainingText: formatRemainingTime(remHrs),
      urgency: calculateUrgency(remHrs)
    };
  }
  function emptyDeadline(rawText) {
    return {
      raw: rawText,
      normalized: "请查看详情",
      timestamp: 0,
      remainingHours: 9999,
      remainingText: "待定",
      urgency: "normal"
    };
  }
  function parseActiveCourseInfo(html) {
    const activeCourseM = html.match(/<span[^>]*class=["'][^"']*dropdown-item-course[^"']*font-weight-bold[^"']*["'][^>]*value=["']([^"']+)["'][^>]*>([\s\S]*?)<\/span>/i);
    if (activeCourseM) {
      return {
        id: activeCourseM[1],
        name: activeCourseM[2].replace(/<[^>]+>/g, "").trim()
      };
    }
    return {};
  }
  function parseCourseListHtml(html) {
    const list = [];
    const seen = /* @__PURE__ */ new Set();
    const spanRe = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
    let m2;
    while ((m2 = spanRe.exec(html)) !== null) {
      const id = m2[1];
      const name = m2[2].replace(/<[^>]+>/g, "").trim();
      if (id && name && !seen.has(id)) {
        seen.add(id);
        list.push({ id, name });
      }
    }
    const linkRe = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((m2 = linkRe.exec(html)) !== null) {
      const id = m2[1];
      const name = m2[2].replace(/<[^>]+>/g, "").trim();
      if (id && name && !seen.has(id)) {
        seen.add(id);
        list.push({ id, name });
      }
    }
    return list;
  }
  function parseActiveAssignmentsHtml(html, courseName = "", defaultCourseId = "") {
    const list = [];
    const seen = /* @__PURE__ */ new Set();
    let activeSection = html;
    const historyIdx = html.search(/fas\s+fa-history|历史作业/i);
    if (historyIdx !== -1) {
      const clockIdx = html.search(/fas\s+fa-clock|当前作业/i);
      if (clockIdx !== -1 && clockIdx < historyIdx) {
        activeSection = html.slice(clockIdx, historyIdx);
      } else {
        activeSection = html.slice(0, historyIdx);
      }
    }
    const linkRe = /<a[^>]*href=["']([^"']*assignID=([a-zA-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m2;
    while ((m2 = linkRe.exec(activeSection)) !== null) {
      const rawUrl = m2[1];
      const id = m2[2];
      const title = m2[3].replace(/<[^>]+>/g, "").trim();
      if (!title || seen.has(id)) continue;
      if (/^(?:返回|详细|提交|查看|重做|编辑|删除|\d+|文件上传题|程序题)$/.test(title)) continue;
      seen.add(id);
      const courseIdM = rawUrl.match(/courseID=([a-zA-Z0-9_-]+)/i);
      const courseId = courseIdM ? courseIdM[1] : defaultCourseId;
      const finalUrl = courseId ? `/assignment/index.jsp?courseID=${courseId}&assignID=${id}` : `/assignment/index.jsp?assignID=${id}`;
      list.push({
        id,
        courseId,
        courseName,
        title,
        deadline: "请查看详情",
        deadlineTimestamp: 0,
        remainingHours: 9999,
        remainingText: "待定",
        status: "pending",
        urgency: "normal",
        url: finalUrl
      });
    }
    return list;
  }
  function parseAssignmentDetailHtml(html, nowMs = Date.now()) {
    const h4Match = html.match(/<div[^>]*class=["'][^"']*bg-light[^"']*["'][^>]*>[\s\S]*?<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>/i) || html.match(/<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>\s*<p>[^<]*作业时间/i);
    let title = h4Match ? h4Match[1].replace(/<[^>]+>/g, "").trim() : void 0;
    if (!title) {
      const breadcrumbM = html.match(/<ol[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i);
      if (breadcrumbM) {
        const items = [...breadcrumbM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((i2) => i2[1].replace(/<[^>]+>/g, "").trim());
        if (items.length > 0) {
          title = items[0].replace(/<[^>]+>/g, "").trim();
        }
      }
    }
    const ddl = parseDeadlineBeijing(html, nowMs);
    return {
      title,
      deadline: ddl.timestamp > 0 ? ddl.normalized : void 0,
      deadlineTimestamp: ddl.timestamp,
      remainingHours: ddl.remainingHours,
      remainingText: ddl.remainingText
    };
  }
  function parseTestCases(html) {
    const cases = [];
    const re = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
    let m2;
    let idx = 1;
    while ((m2 = re.exec(html)) !== null) {
      cases.push({
        index: idx++,
        input: cleanCode(m2[1]),
        output: cleanCode(m2[2])
      });
    }
    return cases;
  }
  function cleanCode(s2) {
    return s2.replace(/<br\s*\/?>/gi, "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  }
  function parseProblemDetailHtml(problemId, html) {
    const contentM = html.match(/<div[^>]*class=["'][^"']*cgProblemContentClass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || html.match(/<div[^>]*id=["']cgpreviewmarkdown["'][^>]*>([\s\S]*?)<\/div>/i);
    const descHtml = contentM ? contentM[1] : html;
    const descText = descHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const codeM = html.match(/<textarea[^>]*id=["']cgsoucecode["'][^>]*>([\s\S]*?)<\/textarea>/i);
    const currentCode = codeM ? codeM[1].trim() : void 0;
    return {
      id: problemId,
      title: `题目 ${problemId}`,
      descriptionHtml: descHtml,
      descriptionText: descText,
      testCases: parseTestCases(html),
      currentCode
    };
  }
  function parseSubmissionsHtml(html) {
    const list = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let m2;
    while ((m2 = trRe.exec(html)) !== null) {
      const row = m2[1];
      if (/<th/i.test(row)) continue;
      const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((t2) => t2[1].replace(/<[^>]+>/g, "").trim());
      if (tds.length >= 6) {
        const rawStatus = tds[5];
        let status = "Unknown";
        if (/Accepted|正确|通过|AC/i.test(rawStatus)) status = "Accepted";
        else if (/Wrong Answer|答案错误|WA/i.test(rawStatus)) status = "Wrong Answer";
        else if (/Time Limit|超时|TLE/i.test(rawStatus)) status = "Time Limit Exceeded";
        else if (/Memory Limit|超内存|MLE/i.test(rawStatus)) status = "Memory Limit Exceeded";
        else if (/Compile Error|编译错误|CE/i.test(rawStatus)) status = "Compile Error";
        else if (/Judging|Running|评测中|排队/i.test(rawStatus)) status = "Judging";
        list.push({
          id: tds[0],
          problemId: tds[3],
          problemTitle: tds[3],
          status,
          submitTime: tds[1]
        });
      }
    }
    return list;
  }
  class CourseGradingClient {
    constructor(config = {}, http2 = new FetchHttpClient(), storage2) {
      __publicField(this, "baseUrl");
      __publicField(this, "http");
      __publicField(this, "sessionCookie");
      __publicField(this, "db");
      this.http = http2;
      this.baseUrl = (config.baseUrl || "http://115.156.107.145").replace(/\/+$/, "");
      this.sessionCookie = config.sessionCookie || "";
      if (storage2) {
        this.db = new HomeworkDB(storage2);
      }
    }
    setSessionCookie(cookie) {
      this.sessionCookie = cookie;
    }
    getSessionCookie() {
      return this.sessionCookie;
    }
    getAuthHeaders() {
      return this.sessionCookie ? { Cookie: this.sessionCookie } : {};
    }
    /**
     * 登录平台（自动使用固定 AES 密钥加密）
     */
    async login(stid, plainPwd) {
      const encryptedPwd = encryptPassword(plainPwd);
      const body = new URLSearchParams({
        IndexStyle: "1",
        stid,
        pwd: encryptedPwd
      }).toString();
      const responseText = await this.http.post(`${this.baseUrl}/login/loginproc.jsp`, body);
      if (responseText.includes("loginErr=1") || responseText.includes("密码错误")) {
        return { success: false, message: "账号或密码错误" };
      }
      if (responseText.includes("loginErr=6")) {
        return { success: false, message: "需要输入图形验证码" };
      }
      return { success: true, message: "登录成功" };
    }
    /**
     * 获取学生加入的课程列表（只读查询）
     */
    async getCourses() {
      try {
        const html = await this.http.get(`${this.baseUrl}/courselist.jsp`, this.getAuthHeaders());
        let courses = parseCourseListHtml(html);
        if (courses.length === 0) {
          const mainHtml = await this.http.get(`${this.baseUrl}/main.jsp`, this.getAuthHeaders());
          courses = parseCourseListHtml(mainHtml);
        }
        return courses;
      } catch {
        return [];
      }
    }
    /**
     * 切换当前激活课程上下文
     */
    async enterCourse(courseId) {
      await this.http.get(`${this.baseUrl}/courselist.jsp?courseID=${encodeURIComponent(courseId)}`, this.getAuthHeaders());
    }
    /**
     * 只读读取当前活跃课程的作业列表（不篡改 Session 状态）
     */
    async getPendingAssignments(hoursThreshold = 72) {
      const allAssignments = [];
      const seenIds = /* @__PURE__ */ new Set();
      try {
        const indexHtml = await this.http.get(
          `${this.baseUrl}/assignment/index.jsp`,
          this.getAuthHeaders()
        );
        const activeCourse = parseActiveCourseInfo(indexHtml);
        const courseId = activeCourse.id || "";
        const courseName = activeCourse.name || "";
        if (this.db && courseId && courseName) {
          await this.db.upsertCourse(courseId, courseName);
        }
        const list = parseActiveAssignmentsHtml(indexHtml, courseName, courseId);
        for (const item of list) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allAssignments.push(item);
          }
        }
      } catch {
      }
      for (const item of allAssignments) {
        if (item.deadline === "请查看详情" || item.deadlineTimestamp === 0) {
          try {
            const detailUrl = item.courseId ? `${this.baseUrl}/assignment/index.jsp?courseID=${item.courseId}&assignID=${item.id}` : `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`;
            const detailHtml = await this.http.get(detailUrl, this.getAuthHeaders());
            const detail = parseAssignmentDetailHtml(detailHtml);
            if (detail.deadlineTimestamp > 0) {
              item.deadline = detail.deadline;
              item.deadlineTimestamp = detail.deadlineTimestamp;
              item.remainingHours = detail.remainingHours;
              item.remainingText = detail.remainingText;
              item.urgency = calculateUrgency(detail.remainingHours);
            }
          } catch {
          }
        }
        if (this.db) {
          await this.db.upsertAssignment(item);
        }
      }
      if (this.db) {
        return this.db.getAllAssignments();
      }
      return allAssignments.filter((item) => item.status === "pending").sort((a2, b2) => {
        if (a2.remainingHours > 0 && b2.remainingHours <= 0) return -1;
        if (a2.remainingHours <= 0 && b2.remainingHours > 0) return 1;
        if (a2.remainingHours > 0 && b2.remainingHours > 0) {
          return a2.deadlineTimestamp - b2.deadlineTimestamp;
        }
        return b2.deadlineTimestamp - a2.deadlineTimestamp;
      });
    }
    /**
     * 全量安全同步所有课程的作业并持久化存入数据库
     * 【核心保障】爬取前记录当前用户所处课程 ID，依序抓取各门课后立即切回原课程，彻底杜绝串课
     */
    async safeSyncAllCourses(currentCourseId, onProgress) {
      const courses = await this.getCourses();
      if (courses.length === 0) {
        return this.getPendingAssignments();
      }
      for (let i2 = 0; i2 < courses.length; i2++) {
        const c2 = courses[i2];
        if (onProgress) onProgress(`正在同步 [${i2 + 1}/${courses.length}] 《${c2.name}》...`);
        try {
          if (this.db) {
            await this.db.upsertCourse(c2.id, c2.name);
          }
          await this.enterCourse(c2.id);
          const indexHtml = await this.http.get(`${this.baseUrl}/assignment/index.jsp`, this.getAuthHeaders());
          const list = parseActiveAssignmentsHtml(indexHtml, c2.name, c2.id);
          for (const item of list) {
            item.courseId = c2.id;
            item.courseName = c2.name;
            item.url = `/assignment/index.jsp?courseID=${c2.id}&assignID=${item.id}`;
            if (item.deadlineTimestamp === 0) {
              try {
                const detailHtml = await this.http.get(
                  `${this.baseUrl}/assignment/index.jsp?courseID=${c2.id}&assignID=${item.id}`,
                  this.getAuthHeaders()
                );
                const detail = parseAssignmentDetailHtml(detailHtml);
                if (detail.deadlineTimestamp > 0) {
                  item.deadline = detail.deadline;
                  item.deadlineTimestamp = detail.deadlineTimestamp;
                  item.remainingHours = detail.remainingHours;
                  item.remainingText = detail.remainingText;
                  item.urgency = calculateUrgency(detail.remainingHours);
                }
              } catch {
              }
            }
            if (this.db) {
              await this.db.upsertAssignment(item);
            }
          }
        } catch {
        }
      }
      if (currentCourseId) {
        if (onProgress) onProgress("正在恢复当前页面课程状态...");
        try {
          await this.enterCourse(currentCourseId);
        } catch {
        }
      }
      return this.db ? this.db.getAllAssignments() : this.getPendingAssignments();
    }
    /**
     * 获取题目详情与测试用例（兼容 programList.jsp 与 fileUploadList.jsp）
     */
    async getProblemDetail(assignId, proNum = 1) {
      const url = `${this.baseUrl}/assignment/programList.jsp?proNum=${proNum}&assignID=${encodeURIComponent(assignId)}`;
      const html = await this.http.get(url, this.getAuthHeaders());
      return parseProblemDetailHtml(`${assignId}_${proNum}`, html);
    }
    /**
     * 查询最新评测结果
     */
    async getLatestSubmissions() {
      const url = `${this.baseUrl}/acm/problemset_stat.jsp`;
      const html = await this.http.get(url, this.getAuthHeaders());
      return parseSubmissionsHtml(html);
    }
    /**
     * 触发 DDL 告警推送
     */
    async triggerPushAlert(config) {
      const threshold = config.hoursThreshold ?? 48;
      const allPending = this.db ? await this.db.getAllAssignments() : await this.getPendingAssignments(threshold);
      const activeUrgent = allPending.filter((a2) => a2.remainingHours > 0 && a2.remainingHours <= threshold);
      if (activeUrgent.length === 0) {
        return { sent: false, count: 0 };
      }
      const title = `【NoDDL 提醒】有 ${activeUrgent.length} 项作业即将到达 DDL`;
      const markdown = [
        `### 🔔 NoDDL 作业 DDL 提醒`,
        `当前有 **${activeUrgent.length}** 项作业即将截止：`,
        "",
        ...activeUrgent.map((item, idx) => `${idx + 1}. [${item.courseName}] ${item.title} (截止: ${item.deadline}, ${item.remainingText})`)
      ].join("\n");
      try {
        if (config.pushplusToken) {
          await this.http.post("https://www.pushplus.plus/send", {
            token: config.pushplusToken,
            title,
            content: markdown.replace(/\n/g, "<br>"),
            template: "html"
          });
        }
        if (config.barkUrl) {
          const barkBase = config.barkUrl.replace(/\/+$/, "");
          await this.http.get(`${barkBase}/${encodeURIComponent(title)}/${encodeURIComponent(markdown)}?group=NoDDL`);
        }
        if (config.customWebhookUrl) {
          await this.http.post(config.customWebhookUrl, {
            msg_type: "text",
            content: { text: `${title}

${markdown}` }
          });
        }
        return { sent: true, count: activeUrgent.length };
      } catch (err) {
        return { sent: false, count: activeUrgent.length, error: String(err) };
      }
    }
  }
  class BrowserHttpClient {
    async get(url, headers = {}) {
      const isCrossOrigin = /^https?:\/\//i.test(url) && !url.includes(window.location.host);
      if (isCrossOrigin && typeof GM_xmlhttpRequest !== "undefined") {
        return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
            method: "GET",
            url,
            headers,
            onload: (res2) => {
              if (res2.status >= 200 && res2.status < 300) {
                resolve(res2.responseText);
              } else {
                reject(new Error(`GM_xmlhttpRequest GET 失败: ${res2.status}`));
              }
            },
            onerror: (err) => reject(err)
          });
        });
      }
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers
      });
      if (!res.ok) {
        throw new Error(`fetch GET ${url} 状态错误: ${res.status}`);
      }
      return res.text();
    }
    async post(url, data, headers = {}) {
      const isCrossOrigin = /^https?:\/\//i.test(url) && !url.includes(window.location.host);
      let bodyStr = "";
      const finalHeaders = { ...headers };
      if (typeof data === "string") {
        bodyStr = data;
      } else {
        bodyStr = JSON.stringify(data);
        if (!finalHeaders["Content-Type"]) {
          finalHeaders["Content-Type"] = "application/json";
        }
      }
      if (isCrossOrigin && typeof GM_xmlhttpRequest !== "undefined") {
        return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
            method: "POST",
            url,
            headers: finalHeaders,
            data: bodyStr,
            onload: (res2) => {
              if (res2.status >= 200 && res2.status < 300) {
                resolve(res2.responseText);
              } else {
                reject(new Error(`GM_xmlhttpRequest POST 失败: ${res2.status}`));
              }
            },
            onerror: (err) => reject(err)
          });
        });
      }
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: finalHeaders,
        body: bodyStr
      });
      if (!res.ok) {
        throw new Error(`fetch POST ${url} 状态错误: ${res.status}`);
      }
      return res.text();
    }
  }
  class BrowserStorage {
    async get(key) {
      if (typeof GM_getValue !== "undefined") {
        const val = GM_getValue(key, "");
        return val || null;
      }
      return localStorage.getItem(key);
    }
    async set(key, value) {
      if (typeof GM_setValue !== "undefined") {
        GM_setValue(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    }
    async remove(key) {
      if (typeof GM_setValue !== "undefined") {
        GM_setValue(key, "");
      } else {
        localStorage.removeItem(key);
      }
    }
  }
  var n, t$1, r$1, u$2, f$1, o$2, e$1, l$1, c$1, a$1, h$1 = {}, p$1 = [], v$1 = /^m(i|n|o|s|text|space)$/, y$1 = Array.isArray, d$1 = p$1.slice, w = Object.assign;
  function _$1(n2) {
    n2 && n2.parentNode && n2.remove();
  }
  function g$1(n2, t2, i2) {
    var r2, u2, f2, o2 = {}, e2 = arguments.length;
    for (f2 in t2) "key" == f2 ? r2 = t2[f2] : "ref" == f2 && "function" != typeof n2 ? u2 = t2[f2] : o2[f2] = t2[f2];
    return e2 > 2 && (o2.children = e2 > 3 ? d$1.call(arguments, 2) : i2), b(n2, o2, r2, u2, null);
  }
  function b(i2, r2, u2, f2, o2) {
    var e2 = { type: i2, props: r2, key: u2, ref: f2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: o2 || ++t$1, __i: -1, __u: 0 };
    return !o2 && n.vnode && n.vnode(e2), e2;
  }
  function M(n2) {
    return n2.children;
  }
  function $(n2, t2) {
    this.props = n2, this.context = t2, this.__g = 0;
  }
  function x(n2, t2) {
    if (null == t2) return n2.__ ? x(n2.__, n2.__i + 1) : null;
    for (var i2; t2 < n2.__k.length; t2++) if ((i2 = n2.__k[t2]) && i2.__e) return i2.__e;
    return "function" != typeof n2.type || n2.props.__P ? null : x(n2);
  }
  function S(n2) {
    if ((n2 = n2.__) && n2.__c && !n2.props.__P) return n2.__e = null, n2.__k.some(function(t2) {
      return t2 && (n2.__e = t2.__e);
    }), S(n2);
  }
  function C$1(t2) {
    (8 & t2.__g || !(t2.__g |= 8) || !r$1.push(t2) || f$1++) && u$2 == n.debounceRendering || ((u$2 = n.debounceRendering) || queueMicrotask)(j);
  }
  function j() {
    var t2, i2, u2, e2, l2, c2, a2, s2, h2;
    try {
      for (i2 = 1; r$1.length; ) r$1.length > i2 && r$1.sort(o$2), t2 = r$1.shift(), i2 = r$1.length, 8 & t2.__g && (e2 = void 0, l2 = void 0, c2 = (l2 = (u2 = t2).__v).__e, a2 = [], s2 = [], (h2 = u2.__P) && ((e2 = w({ constructor: void 0 }, l2)).__v = l2.__v + 1, n.vnode && n.vnode(e2), N(h2, e2, l2, u2.__n, h2.namespaceURI, 32 & l2.__u ? [c2] : null, a2, c2 || x(l2), 32 & l2.__u, s2), e2.__v = l2.__v, e2.__.__k[e2.__i] = e2, z$1(a2, e2, s2), l2.__ = l2.__e = null, e2.__e != c2 && S(e2)));
    } finally {
      r$1.length = f$1 = 0;
    }
  }
  function L(n2, t2, i2, r2, u2, f2, o2, e2, l2, c2, a2) {
    var s2, v2, y2, d2, w2, _2, g2 = r2.__k || p$1, k2 = t2.length;
    for (l2 = H(i2, t2, g2, l2, k2), s2 = 0; s2 < k2; s2++) null != (y2 = i2.__k[s2]) && (v2 = ~y2.__i && g2[y2.__i] || h$1, y2.__i = s2, _2 = N(n2, y2, v2, u2, f2, o2, e2, l2, c2, a2), d2 = y2.__e, (v2.ref != y2.ref || 8 & v2.__u) && (v2.ref && D$1(v2.ref, null, y2, v2), y2.ref && a2.push(y2.ref, y2.__c || d2, y2)), w2 = w2 || d2, 4 & y2.__u ? (l2 = I(y2, l2, n2, !v2.__v), v2.__e && (v2.__e = null)) : "function" == typeof y2.type && void 0 !== _2 ? l2 = _2 : d2 && (l2 = d2.nextSibling), y2.__u &= -7);
    return i2.__e = w2, l2;
  }
  function H(n2, t2, i2, r2, u2) {
    var f2, o2, e2, l2, c2, a2, s2, h2, p2, v2, d2 = i2.length, w2 = d2, _2 = 0, g2 = false, k2 = n2.__k = Array(u2);
    for (f2 = 0; f2 < u2; f2++) null != (o2 = t2[f2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("object" != typeof o2 || o2.constructor == String ? o2 = k2[f2] = b(null, o2) : y$1(o2) ? o2 = k2[f2] = b(M, { children: o2 }) : void 0 === o2.constructor && o2.__b ? o2 = k2[f2] = b(o2.type, o2.props, o2.key, o2.ref, o2.__v) : k2[f2] = o2, l2 = f2 + _2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, ~(c2 = o2.__i = O(o2, i2, l2, w2)) && (w2--, (e2 = i2[c2]) && (e2.__u |= 2)), e2 && e2.__v ? (o2.__u |= 2, c2 == l2 - 1 ? _2-- : c2 == l2 + 1 ? _2++ : c2 != l2 && (c2 > l2 ? _2-- : _2++, g2 = true)) : (~c2 || (u2 > d2 ? _2-- : u2 < d2 && _2++), "function" != typeof o2.type && (o2.__u |= 4))) : k2[f2] = null;
    if (g2) {
      for (a2 = [], s2 = [], f2 = 0; f2 < u2; f2++) if ((o2 = k2[f2]) && 2 & o2.__u) {
        for (h2 = 0, p2 = a2.length; h2 < p2; ) a2[v2 = h2 + p2 >> 1] < o2.__i ? h2 = v2 + 1 : p2 = v2;
        a2[h2] = o2.__i, s2[f2] = h2 + 1;
      }
      for (_2 = a2.length; f2--; ) s2[f2] && (s2[f2] == _2 ? _2-- : k2[f2].__u |= 4);
    }
    if (w2) for (f2 = 0; f2 < d2; f2++) !(e2 = i2[f2]) || 2 & e2.__u || (e2.__e == r2 && (r2 = x(e2)), E$1(e2, e2));
    return r2;
  }
  function I(n2, t2, i2, r2) {
    var u2, f2, o2;
    if ("function" == typeof n2.type) {
      if (n2.props.__P) return t2;
      if (u2 = n2.__k) for (f2 = 0; f2 < u2.length; f2++) u2[f2] && (u2[f2].__ = n2, t2 = I(u2[f2], t2, i2, false));
      return t2;
    }
    for (t2 && !t2.parentNode && (t2 = x(n2)) && !t2.parentNode && (t2 = null), o2 = t2; o2 && 8 == o2.nodeType; ) o2 = o2.nextSibling;
    for (n2.__e != o2 && (!r2 && i2.moveBefore && n2.__e.parentNode ? i2.moveBefore(n2.__e, t2) : i2.insertBefore(n2.__e, t2 || null)), t2 = n2.__e; (t2 = t2 && t2.nextSibling) && 8 == t2.nodeType; ) ;
    return t2;
  }
  function O(n2, t2, i2, r2) {
    var u2, f2, o2, e2 = n2.key, l2 = n2.type, c2 = t2[i2], a2 = c2 && !(2 & c2.__u);
    if (null === c2 && null == e2 || a2 && e2 == c2.key && l2 == c2.type) return i2;
    if (r2 > (a2 ? 1 : 0)) {
      for (u2 = i2 - 1, f2 = i2 + 1; u2 >= 0 || f2 < t2.length; ) if ((c2 = t2[o2 = u2 >= 0 ? u2-- : f2++]) && !(2 & c2.__u) && e2 == c2.key && l2 == c2.type) return o2;
    }
    return -1;
  }
  function P(n2, t2, i2) {
    null == i2 && (i2 = ""), "-" == t2[0] ? n2.setProperty(t2, i2) : n2[t2] = i2;
  }
  function T(n2, t2, i2, r2, u2) {
    var f2, o2;
    n: if ("style" == t2) if ("string" == typeof i2) n2.style.cssText = i2;
    else {
      if ("string" == typeof r2 && (n2.style.cssText = r2 = ""), r2) for (t2 in r2) i2 && t2 in i2 || P(n2.style, t2, "");
      if (i2) for (t2 in i2) r2 && i2[t2] == r2[t2] || P(n2.style, t2, i2[t2]);
    }
    else if ("o" == t2[0] && "n" == t2[1]) (n2.__e || (n2.__e = {}))[t2] = i2, i2 && r2 || (o2 = a$1[t2] || (a$1[t2] = q(t2)), (n2.__a || (n2.__a = {}))[t2] = c$1, f2 = t2 != (t2 = t2.replace(l$1, "$1")), (t2 = t2.slice(2))[0] < "a" && (t2 = t2.toLowerCase()), i2 ? n2.addEventListener(t2, o2, f2) : n2.removeEventListener(t2, o2, f2));
    else {
      if ("http://www.w3.org/2000/svg" == u2) t2 = t2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != t2 && "height" != t2 && "href" != t2 && "list" != t2 && "form" != t2 && "tabIndex" != t2 && "download" != t2 && "rowSpan" != t2 && "colSpan" != t2 && "role" != t2 && "popover" != t2 && t2 in n2) try {
        n2[t2] = null == i2 ? "" : i2;
        break n;
      } catch (n3) {
      }
      "function" == typeof i2 || (null == i2 || false === i2 && "-" != t2[4] ? n2.removeAttribute(t2) : n2.setAttribute(t2, "popover" == t2 && 1 == i2 ? "" : i2));
    }
  }
  function q(t2) {
    return function(i2) {
      if (this.__e) {
        var r2 = this.__e[t2];
        if (null == i2[e$1]) i2[e$1] = c$1++;
        else if (i2[e$1] < this.__a[t2]) return;
        return r2(n.event ? n.event(i2) : i2);
      }
    };
  }
  function N(t2, i2, r2, u2, f2, o2, e2, l2, c2, a2) {
    var s2, h2, v2, d2, g2, k2, b2, m2, S2, C2, j2, H2, I2, A2, O2, P2, T2, q2, N2, z2, D2 = i2.type;
    if (void 0 !== i2.constructor) return null;
    if (128 & r2.__u && (c2 = 32 & r2.__u, s2 = r2.__c.__z)) {
      if (i2.__u |= c2, h2 = o2 = [], 8 == s2.nodeType) for (v2 = 1, d2 = s2.nextSibling; d2; d2 = d2.nextSibling) {
        if (8 == d2.nodeType) {
          if (d2.data.startsWith("$s")) v2++;
          else if (d2.data.startsWith("/$s") && !--v2) break;
        }
        o2.push(d2);
      }
      else o2.push(s2);
      l2 = o2[0];
    }
    (s2 = n.__b) && s2(i2);
    n: if ("function" == typeof D2) {
      g2 = e2.length;
      try {
        if (C2 = i2.props, j2 = (s2 = D2.prototype) && s2.render, H2 = (s2 = D2.contextType) && u2[s2.__c], I2 = s2 ? H2 ? H2.props.value : s2.__ : u2, r2.__c ? 2 & (k2 = i2.__c = r2.__c).__g && (k2.__g |= 1) : (j2 ? i2.__c = k2 = new D2(C2, I2) : (i2.__c = k2 = new $(C2, I2), k2.constructor = D2, k2.render = F), H2 && H2.sub(k2), k2.state || (k2.state = {}), k2.__n = u2, k2.__g |= 8, k2.__h = [], k2.__k = []), j2 && (k2.__s || (k2.__s = k2.state), D2.getDerivedStateFromProps && (k2.__s == k2.state && (k2.__s = w({}, k2.__s)), w(k2.__s, D2.getDerivedStateFromProps(C2, k2.__s)))), b2 = k2.props, m2 = k2.state, k2.__v = i2, r2.__c) {
          if (j2 && !D2.getDerivedStateFromProps && C2 !== b2 && k2.componentWillReceiveProps && k2.componentWillReceiveProps(C2, I2), i2.__v == r2.__v && !(8 & k2.__g) || !(4 & k2.__g) && k2.shouldComponentUpdate && false === k2.shouldComponentUpdate(C2, k2.__s, I2)) {
            i2.__v != r2.__v && (k2.props = C2, k2.state = k2.__s, k2.__g &= -9), i2.__e = r2.__e, i2.__k = r2.__k, i2.__k.some(function(n2) {
              n2 && (n2.__ = i2);
            }), p$1.push.apply(k2.__h, k2.__k), k2.__k = [], k2.__h.length && e2.push(k2), l2 = x(r2);
            break n;
          }
          k2.componentWillUpdate && k2.componentWillUpdate(C2, k2.__s, I2), j2 && k2.componentDidUpdate && k2.__h.push(function() {
            k2.componentDidUpdate(b2, m2, S2);
          });
        } else j2 && !D2.getDerivedStateFromProps && k2.componentWillMount && k2.componentWillMount(), j2 && k2.componentDidMount && k2.__h.push(k2.componentDidMount);
        if (k2.context = I2, k2.props = C2, k2.__P = t2, k2.__g &= -5, A2 = n.__r, O2 = 0, j2) k2.state = k2.__s, k2.__g &= -9, A2 && A2(i2), s2 = k2.render(k2.props, k2.state, k2.context), p$1.push.apply(k2.__h, k2.__k), k2.__k = [];
        else do {
          k2.__g &= -9, A2 && A2(i2), s2 = k2.render(k2.props, k2.state, k2.context), k2.state = k2.__s;
        } while (8 & k2.__g && ++O2 < 25);
        k2.state = k2.__s, k2.getChildContext && (u2 = w({}, u2, k2.getChildContext())), j2 && r2.__c && k2.getSnapshotBeforeUpdate && (S2 = k2.getSnapshotBeforeUpdate(b2, m2)), P2 = s2 && s2.type === M && null == s2.key ? s2.props.children : s2, C2.__P && (s2 = l2, f2 = (t2 = C2.__P).namespaceURI, c2 = o2 = null, r2.props && r2.props.__P != t2 && (r2.__k.some(function(n2) {
          n2 && E$1(n2, n2);
        }), r2.__k = null), l2 = r2.__k ? x(r2, 0) : null), l2 = L(t2, y$1(P2) ? P2 : [P2], i2, r2, u2, f2, o2, e2, l2, c2, a2), C2.__P && (i2.__e = null, l2 = s2), i2.__u &= -161, 128 & r2.__u && (k2.__z = null), h2 && h2.some(_$1), k2.__h.length && e2.push(k2), 1 & k2.__g && (k2.__g &= -4);
      } catch (t3) {
        if (e2.length = g2, i2.__v = null, c2 || o2) if (t3.then) {
          if (T2 = 0, i2.__u |= c2 ? 160 : 128, o2) {
            for (~(N2 = o2.indexOf(l2 || void 0)) || (N2 = o2.length); (z2 = o2[N2 - 1]) && 8 == z2.nodeType; ) N2--;
            for (; N2 < o2.length; N2++) if (z2 = o2[N2]) {
              if (o2[N2] = null, 8 == z2.nodeType) {
                if (z2.data.startsWith("$s")) T2++ || (q2 = z2);
                else if (T2 && z2.data.startsWith("/$s") && !--T2) {
                  l2 = z2;
                  break;
                }
              } else if (!T2) break;
            }
          }
          if (!q2) {
            for (; l2 && 8 == l2.nodeType && l2.nextSibling; ) l2 = l2.nextSibling;
            q2 = l2;
          }
          i2.__c.__z || (i2.__c.__z = q2), i2.__e = l2;
        } else o2 && o2.some(_$1);
        else i2.__e = r2.__e;
        i2.__k || (i2.__k = r2.__k || []), t3.then || V(i2), n.__e(t3, i2, r2);
      }
    } else l2 = i2.__e = B$1(r2.__e, i2, r2, u2, f2, o2, e2, c2, a2, t2);
    return (s2 = n.diffed) && s2(i2), 128 & i2.__u ? void 0 : l2;
  }
  function V(n2) {
    n2 && (n2.__c && (n2.__c.__g |= 4), n2.__k && n2.__k.some(V));
  }
  function z$1(t2, i2, r2) {
    for (var u2 = 0; u2 < r2.length; ) D$1(r2[u2++], r2[u2++], r2[u2++]);
    n.__c && n.__c(i2, t2), t2.some(function(i3) {
      try {
        t2 = i3.__h, i3.__h = [], t2.some(function(n2) {
          n2.call(i3);
        });
      } catch (t3) {
        n.__e(t3, i3.__v);
      }
    });
  }
  function B$1(t2, i2, r2, u2, f2, o2, e2, l2, c2, a2) {
    var s2, p2, w2, g2, k2, b2, m2, M2, $2, S2 = r2.props || h$1, C2 = i2.props, j2 = i2.type;
    if ("svg" == j2 ? f2 = "http://www.w3.org/2000/svg" : "math" == j2 ? f2 = "http://www.w3.org/1998/Math/MathML" : f2 || (f2 = "http://www.w3.org/1999/xhtml"), o2) {
      for (s2 = 0; s2 < o2.length; s2++) if ((k2 = o2[s2]) && (j2 ? k2.localName == j2 : 3 == k2.nodeType)) {
        t2 = k2, o2[s2] = null;
        break;
      }
    }
    if (!t2) {
      if (M2 = a2.ownerDocument || document, !j2) return M2.createTextNode(C2);
      t2 = M2.createElementNS(f2, j2, C2.is && C2), l2 && (n.__m && n.__m(i2, o2), l2 = false), o2 = null;
    }
    if (j2) {
      if (a2 = "template" == j2 ? t2.content : t2, o2 = "textarea" == j2 && null != C2.defaultValue ? null : o2 && d$1.call(a2.childNodes), !l2 && o2) for (S2 = {}, s2 = 0; s2 < t2.attributes.length; s2++) S2[(k2 = t2.attributes[s2]).name] = k2.value;
      for (s2 in S2) k2 = S2[s2], "dangerouslySetInnerHTML" == s2 ? w2 = k2 : "children" == s2 || s2 in C2 || "value" == s2 && "defaultValue" in C2 || "checked" == s2 && "defaultChecked" in C2 || T(t2, s2, null, k2, f2);
      for (s2 in $2 = 1 & r2.__u, C2) k2 = C2[s2], "children" == s2 ? g2 = k2 : "dangerouslySetInnerHTML" == s2 ? p2 = k2 : "value" == s2 ? b2 = k2 : "checked" == s2 ? m2 = k2 : l2 && "function" != typeof k2 || !(S2[s2] !== k2 || $2 && null != k2) || T(t2, s2, k2, S2[s2], f2);
      p2 ? (l2 || w2 && (p2.__html == w2.__html || p2.__html == t2.innerHTML) || (t2.innerHTML = p2.__html), i2.__k = []) : (w2 && (t2.textContent = ""), ("foreignObject" == j2 || "http://www.w3.org/1998/Math/MathML" == f2 && v$1.test(j2)) && (f2 = "http://www.w3.org/1999/xhtml"), L(a2, y$1(g2) ? g2 : [g2], i2, r2, u2, f2, o2, e2, o2 ? o2[0] : r2.__k && x(r2, 0), l2, c2), o2 && o2.some(_$1)), l2 && "textarea" != j2 || (s2 = "value", "progress" == j2 && null == b2 ? t2.removeAttribute(s2) : null == b2 || b2 === t2[s2] && ("progress" != j2 || b2) || T(t2, s2, b2, S2[s2], f2), s2 = "checked", null != m2 && m2 != t2[s2] && T(t2, s2, m2, S2[s2], f2));
    } else S2 === C2 || l2 && t2.data == C2 || (t2.data = C2);
    return t2;
  }
  function D$1(t2, i2, r2, u2) {
    try {
      "function" == typeof t2 ? i2 ? i2.__x = t2(i2) || 1 : u2 && (u2 = u2.__c || u2.__e) && (i2 = u2.__x) && (u2.__x = null, "function" == typeof i2 ? i2() : t2(null)) : t2.current = i2;
    } catch (t3) {
      n.__e(t3, r2);
    }
  }
  function E$1(t2, i2, r2) {
    var u2, f2;
    if (n.unmount && n.unmount(t2), !(u2 = t2.ref) || u2.current && u2.current != t2.__e || D$1(u2, null, i2, t2), u2 = t2.__c) {
      if (u2.componentWillUnmount) try {
        u2.componentWillUnmount();
      } catch (t3) {
        n.__e(t3, i2);
      }
      u2.__P = u2.__n = null;
    }
    if (u2 = t2.__k) for (f2 = 0; f2 < u2.length; f2++) u2[f2] && E$1(u2[f2], i2, "function" != typeof t2.type || r2 && !t2.props.__P);
    (u2 = t2.__e) && (r2 || _$1(u2), u2.__e && (u2.__e = null)), t2.__e = t2.__c = t2.__ = null;
  }
  function F(n2, t2, i2) {
    return this.constructor(n2, i2);
  }
  function G$1(t2, i2) {
    var r2, u2, f2, o2;
    n.__ && n.__(t2, i2), 9 == i2.nodeType && (i2 = i2.documentElement), u2 = (r2 = t2 && 32 & t2.__u) ? null : i2.__k, i2.__k = b(M, { children: [t2] }), f2 = [], o2 = [], N(i2, i2.__k, u2 || h$1, h$1, i2.namespaceURI, u2 ? null : i2.firstChild ? d$1.call(i2.childNodes) : null, f2, u2 ? u2.__e : i2.firstChild, r2, o2), z$1(f2, i2.__k, o2), i2.__k.props.children = null;
  }
  n = { __e: function(n2, t2, i2, r2) {
    for (var u2, o2, e2; t2 = t2.__; ) if ((u2 = t2.__c) && !(1 & u2.__g)) {
      u2.__g |= 4;
      try {
        if ((o2 = u2.constructor) && o2.getDerivedStateFromError && (u2.setState(o2.getDerivedStateFromError(n2)), e2 = 8 & u2.__g), u2.componentDidCatch && (u2.componentDidCatch(n2, r2 || {}), e2 = 8 & u2.__g), e2) return void (u2.__g |= 2);
      } catch (t3) {
        n2 = t3, e2 = 0;
      }
    }
    throw f$1 = 0, n2;
  } }, t$1 = 0, $.prototype.setState = function(n2, t2) {
    var i2 = this.__s;
    i2 && i2 != this.state || (i2 = this.__s = w({}, this.state)), "function" == typeof n2 && (n2 = n2(w({}, i2), this.props)), n2 && (w(i2, n2), this.__v && (t2 && this.__k.push(t2), C$1(this)));
  }, $.prototype.forceUpdate = function(n2) {
    this.__v && (this.__g |= 4, n2 && this.__h.push(n2), C$1(this));
  }, $.prototype.render = M, r$1 = [], f$1 = 0, o$2 = function(n2, t2) {
    return n2.__v.__b - t2.__v.__b;
  }, e$1 = Symbol(), l$1 = /(PointerCapture)$|Capture$/i, c$1 = 0, a$1 = {};
  var o$1 = 0;
  function u$1(t2, e2, n$1, f2, u2, i2) {
    e2 || (e2 = {});
    var a2, c2, l2 = e2;
    if ("ref" in l2 && "function" != typeof t2) for (c2 in l2 = {}, e2) "ref" == c2 ? a2 = e2[c2] : l2[c2] = e2[c2];
    var p2 = { type: t2, props: l2, key: n$1, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --o$1, __i: -1, __u: 0 };
    return n.vnode && n.vnode(p2), p2;
  }
  var t, r, u, i, o = Object.is, f = 0, c = [], e = [], a = n, v = a.__b, l = a.__r, m = a.diffed, s = a.__c, h = a.unmount, p = a.__;
  function y(n2, t2) {
    a.__h && a.__h(r, n2, f || t2), f = 0;
    var u2 = r.__H || (r.__H = { __: [], __h: [] });
    return n2 >= u2.__.length && u2.__.push({}), u2.__[n2];
  }
  function d(n2) {
    return f = 1, _(G, n2);
  }
  function _(n2, u2, i2) {
    var f2 = y(t++, 2);
    if (f2.t = n2, !f2.__c && (f2.__ = [G(void 0, u2), function(n3) {
      var t2 = f2.__N ? f2.__N[0] : f2.__[0], r2 = f2.t(t2, n3);
      o(t2, r2) || (f2.__N = [r2, f2.__[1]], f2.__c.setState({}));
    }], f2.__c = r, !r.__f)) {
      r.__f = true;
      var c2 = r.shouldComponentUpdate;
      r.shouldComponentUpdate = function(n3, t2, r2) {
        var u3 = this.__H;
        if (!u3) return true;
        var i3 = false, f3 = this.props != n3;
        if (u3.__.some(function(n4) {
          n4.__N && (i3 = true, o(n4.__[0], n4.__N[0]) || (f3 = true));
        }), c2) {
          var e2 = c2.call(this, n3, t2, r2);
          return i3 ? e2 || f3 : e2;
        }
        return !i3 || f3;
      };
    }
    return f2.__;
  }
  function A(n2, u2) {
    var i2 = y(t++, 3);
    !a.__s && E(i2.__H, u2) && (i2.__P = true, i2.__ = n2, i2.u = u2, r.__H.__h.push(i2));
  }
  function g() {
    var n2;
    do {
      for (; n2 = e.shift(); ) try {
        C(n2);
      } catch (t3) {
        a.__e(t3, { __: (n2 = n2.__P) && n2.__v });
      }
      for (; n2 = c.shift(); ) {
        var t2 = n2.__H;
        if (n2.__P && t2) try {
          t2.__h.some(C), t2.__h.some(D), t2.__h = [];
        } catch (r2) {
          t2.__h = [], a.__e(r2, n2.__v);
        }
      }
    } while (e.length);
  }
  a.__b = function(n2) {
    r = null, v && v(n2);
  }, a.__ = function(n2, t2) {
    n2 && t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), p && p(n2, t2);
  }, a.__r = function(n2) {
    l && l(n2), t = 0;
    var i2 = (r = n2.__c).__H;
    i2 && (u == r ? r.__h = [] : (i2.__h.some(C), i2.__h.some(D), t = 0), i2.__h = [], i2.__.some(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })), u = r;
  }, a.diffed = function(n2) {
    m && m(n2);
    var t2 = n2.__c;
    t2 && t2.__H && (t2.__H.__h.length && B(c.push(t2)), t2.__H.__.some(function(n3) {
      n3.u && (n3.__H = n3.u);
    })), u = r = null;
  }, a.__c = function(n2, t2) {
    t2.some(function(n3) {
      try {
        n3.__h.some(C), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || D(n4);
        });
      } catch (r2) {
        t2.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t2 = [], a.__e(r2, n3.__v);
      }
    }), s && s(n2, t2);
  }, a.unmount = function(n2) {
    h && h(n2);
    var t2, r2, u2 = n2.__c;
    u2 && u2.__H && (u2.__H.__.some(function(u3) {
      try {
        if (u3.__P && u3.__c) {
          if (void 0 === r2) {
            for (r2 = n2.__; r2 && (!r2.__c || !r2.__c.__P); ) r2 = r2.__;
            r2 = r2 && r2.__c;
          }
          u3.__P = r2, B(e.push(u3));
        } else C(u3);
      } catch (n3) {
        t2 = n3;
      }
    }), u2.__H = void 0, t2 && a.__e(t2, u2.__v));
  };
  var k = "function" == typeof requestAnimationFrame;
  function z(n2) {
    var t2, r2 = function() {
      clearTimeout(u2), k && cancelAnimationFrame(t2), setTimeout(n2);
    }, u2 = setTimeout(r2, 35);
    k && (t2 = requestAnimationFrame(r2));
  }
  function B(n2) {
    1 != n2 && i == a.requestAnimationFrame || ((i = a.requestAnimationFrame) || z)(g);
  }
  function C(n2) {
    var t2 = r, u2 = n2.__c;
    "function" == typeof u2 && (n2.__c = void 0, u2()), r = t2;
  }
  function D(n2) {
    var t2 = r;
    n2.__c = n2.__(), r = t2;
  }
  function E(n2, t2) {
    return !n2 || n2.length != t2.length || t2.some(function(t3, r2) {
      return !o(t3, n2[r2]);
    });
  }
  function G(n2, t2) {
    return "function" == typeof t2 ? t2(n2) : t2;
  }
  function App({ client: client2, storage: storage2, initialAssignments }) {
    const [isOpen, setIsOpen] = d(false);
    const [activeTab, setActiveTab] = d("homework");
    const [assignments, setAssignments] = d(initialAssignments);
    const [loading, setLoading] = d(false);
    const [filter, setFilter] = d("active");
    const [pushplusToken, setPushplusToken] = d("");
    const [barkUrl, setBarkUrl] = d("");
    const [threshold, setThreshold] = d(72);
    const [submissions, setSubmissions] = d([]);
    const [evalLoading, setEvalLoading] = d(false);
    const [drafts, setDrafts] = d([]);
    const [toast, setToast] = d(null);
    const showToast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3e3);
    };
    A(() => {
      (async () => {
        const token = await storage2.get("nodd_pushplus_token") || "";
        const bark = await storage2.get("nodd_bark_url") || "";
        const th = parseInt(await storage2.get("nodd_hours_threshold") || "72", 10);
        setPushplusToken(token);
        setBarkUrl(bark);
        setThreshold(th);
      })();
    }, []);
    const refreshAssignments = async () => {
      setLoading(true);
      try {
        const list = await client2.getPendingAssignments(threshold);
        setAssignments(list);
        showToast(`已刷新：发现 ${list.length} 项作业`);
      } catch {
        showToast("获取作业列表失败");
      } finally {
        setLoading(false);
      }
    };
    const syncAllCourses = async () => {
      setLoading(true);
      showToast("正在全量安全同步所有课程...");
      try {
        const curMatch = document.documentElement.innerHTML.match(/courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)/i) || window.location.search.match(/courseID=([a-zA-Z0-9_-]+)/i);
        const curId = curMatch ? curMatch[1] : void 0;
        const list = await client2.safeSyncAllCourses(curId, (msg) => showToast(msg));
        setAssignments(list);
        showToast(`同步完成！共汇总 ${list.length} 项作业`);
      } catch {
        showToast("同步全部课程失败");
      } finally {
        setLoading(false);
      }
    };
    const refreshSubmissions = async () => {
      setEvalLoading(true);
      try {
        const subs = await client2.getLatestSubmissions();
        setSubmissions(subs);
      } catch {
        showToast("获取评测历史失败");
      } finally {
        setEvalLoading(false);
      }
    };
    const loadDrafts = () => {
      const list = [];
      for (let i2 = 0; i2 < localStorage.length; i2++) {
        const key = localStorage.key(i2);
        if (key && key.startsWith("nodd_autosave_")) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || "{}");
            if (item.code) {
              list.push({
                key,
                time: item.time || "未知时间",
                length: item.code.length,
                code: item.code
              });
            }
          } catch {
          }
        }
      }
      setDrafts(list);
    };
    const savePushConfig = async () => {
      await storage2.set("nodd_pushplus_token", pushplusToken.trim());
      await storage2.set("nodd_bark_url", barkUrl.trim());
      await storage2.set("nodd_hours_threshold", String(threshold));
      showToast("推送配置已保存！");
    };
    const testPush = async () => {
      if (!pushplusToken && !barkUrl) {
        showToast("请先配置 PushPlus Token 或 Bark URL");
        return;
      }
      showToast("正在发送测试推送...");
      const res = await client2.triggerPushAlert({
        pushplusToken,
        barkUrl,
        hoursThreshold: threshold
      });
      if (res.sent) {
        showToast(`测试推送成功！包含 ${res.count} 项即将到期作业`);
      } else {
        showToast(`推送失败: ${res.error || "无即将截止作业或网络错误"}`);
      }
    };
    const copyCookie = () => {
      const cookie = document.cookie;
      if (typeof GM_setClipboard !== "undefined") {
        GM_setClipboard(cookie);
      } else {
        navigator.clipboard.writeText(cookie);
      }
      showToast("平台 Cookie 凭据已复制到剪贴板！");
    };
    const activeCount = assignments.filter((a2) => a2.remainingHours > 0).length;
    const overdueCount = assignments.filter((a2) => a2.remainingHours <= 0).length;
    const urgentCount = assignments.filter((a2) => a2.remainingHours > 0 && (a2.urgency === "critical" || a2.urgency === "urgent")).length;
    const filteredAssignments = assignments.filter((item) => {
      if (filter === "active") return item.remainingHours > 0;
      if (filter === "overdue") return item.remainingHours <= 0;
      return true;
    });
    return /* @__PURE__ */ u$1("div", { children: [
      /* @__PURE__ */ u$1("div", { className: "nodd-trigger", onClick: () => setIsOpen(!isOpen), children: [
        /* @__PURE__ */ u$1("span", { className: "logo-badge", children: "NoDDL" }),
        urgentCount > 0 ? /* @__PURE__ */ u$1("span", { className: "counter", children: urgentCount }) : activeCount > 0 ? /* @__PURE__ */ u$1("span", { className: "counter", style: "background:#3b82f6;", children: activeCount }) : null
      ] }),
      isOpen && /* @__PURE__ */ u$1("div", { className: "nodd-panel-wrapper", children: [
        toast && /* @__PURE__ */ u$1("div", { className: "nodd-toast", children: toast }),
        /* @__PURE__ */ u$1("div", { className: "nodd-header", children: [
          /* @__PURE__ */ u$1("div", { className: "nodd-header-title", children: /* @__PURE__ */ u$1("span", { children: "🚀 NoDDL 控制台" }) }),
          /* @__PURE__ */ u$1("div", { className: "nodd-header-actions", children: [
            /* @__PURE__ */ u$1(
              "button",
              {
                className: "btn btn-sm btn-secondary",
                style: "font-size:11px;padding:3px 8px;font-weight:600;",
                title: "全量扫描并同步所有课程作业",
                onClick: syncAllCourses,
                children: "🌐 同步全部课程"
              }
            ),
            /* @__PURE__ */ u$1(
              "button",
              {
                className: "icon-btn",
                title: "刷新数据",
                onClick: () => {
                  if (activeTab === "homework") refreshAssignments();
                  if (activeTab === "eval") refreshSubmissions();
                  if (activeTab === "toolbox") loadDrafts();
                },
                children: "🔄"
              }
            ),
            /* @__PURE__ */ u$1("button", { className: "icon-btn", title: "关闭面板", onClick: () => setIsOpen(false), children: "✕" })
          ] })
        ] }),
        /* @__PURE__ */ u$1("div", { className: "nodd-tabs", children: [
          /* @__PURE__ */ u$1(
            "div",
            {
              className: `nodd-tab-item ${activeTab === "homework" ? "active" : ""}`,
              onClick: () => setActiveTab("homework"),
              children: [
                "📋 DDL 看板 (",
                assignments.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ u$1(
            "div",
            {
              className: `nodd-tab-item ${activeTab === "settings" ? "active" : ""}`,
              onClick: () => setActiveTab("settings"),
              children: "⚙️ 推送配置"
            }
          ),
          /* @__PURE__ */ u$1(
            "div",
            {
              className: `nodd-tab-item ${activeTab === "toolbox" ? "active" : ""}`,
              onClick: () => {
                setActiveTab("toolbox");
                loadDrafts();
              },
              children: "🛠️ 实用工具"
            }
          ),
          /* @__PURE__ */ u$1(
            "div",
            {
              className: `nodd-tab-item ${activeTab === "eval" ? "active" : ""}`,
              onClick: () => {
                setActiveTab("eval");
                refreshSubmissions();
              },
              children: "📊 评测状态"
            }
          )
        ] }),
        /* @__PURE__ */ u$1("div", { className: "nodd-content", children: [
          activeTab === "homework" && /* @__PURE__ */ u$1("div", { children: [
            /* @__PURE__ */ u$1("div", { style: "display:flex;gap:6px;margin-bottom:12px;", children: [
              /* @__PURE__ */ u$1(
                "button",
                {
                  className: `btn btn-sm ${filter === "active" ? "btn-primary" : "btn-secondary"}`,
                  onClick: () => setFilter("active"),
                  children: [
                    "进行中 (",
                    activeCount,
                    ")"
                  ]
                }
              ),
              /* @__PURE__ */ u$1(
                "button",
                {
                  className: `btn btn-sm ${filter === "overdue" ? "btn-primary" : "btn-secondary"}`,
                  onClick: () => setFilter("overdue"),
                  children: [
                    "已超期 (",
                    overdueCount,
                    ")"
                  ]
                }
              ),
              /* @__PURE__ */ u$1(
                "button",
                {
                  className: `btn btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`,
                  onClick: () => setFilter("all"),
                  children: [
                    "全部 (",
                    assignments.length,
                    ")"
                  ]
                }
              )
            ] }),
            loading ? /* @__PURE__ */ u$1("div", { className: "empty-state", children: "正在同步作业数据..." }) : filteredAssignments.length === 0 ? /* @__PURE__ */ u$1("div", { className: "empty-state", children: [
              /* @__PURE__ */ u$1("span", { style: "font-size:24px;", children: "🎉" }),
              /* @__PURE__ */ u$1("span", { children: "当前分类下没有作业" })
            ] }) : /* @__PURE__ */ u$1("div", { style: "display:flex;flex-direction:column;gap:8px;", children: filteredAssignments.map((hw) => {
              const badgeClass = hw.remainingHours <= 0 ? "badge-critical" : hw.urgency === "critical" ? "badge-critical" : hw.urgency === "urgent" ? "badge-urgent" : hw.urgency === "warning" ? "badge-warning" : "badge-normal";
              return /* @__PURE__ */ u$1("div", { className: "nodd-card", children: [
                /* @__PURE__ */ u$1("div", { className: "card-header", children: [
                  /* @__PURE__ */ u$1("div", { children: [
                    /* @__PURE__ */ u$1("div", { className: "card-title", children: hw.title }),
                    /* @__PURE__ */ u$1("div", { className: "card-course", children: hw.courseName })
                  ] }),
                  /* @__PURE__ */ u$1("span", { className: `badge ${badgeClass}`, children: hw.remainingText })
                ] }),
                /* @__PURE__ */ u$1("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-top:4px;", children: [
                  /* @__PURE__ */ u$1("span", { style: "font-size:12px;color:var(--text-sub);", children: [
                    "DDL: ",
                    hw.deadline
                  ] }),
                  hw.url && /* @__PURE__ */ u$1(
                    "a",
                    {
                      href: hw.url.startsWith("http") ? hw.url : `${window.location.origin}${hw.url.startsWith("/") ? "" : "/"}${hw.url}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      style: "font-size:12px;color:var(--primary);text-decoration:none;font-weight:600;",
                      children: "前往作答 →"
                    }
                  )
                ] })
              ] }, hw.id);
            }) })
          ] }),
          activeTab === "settings" && /* @__PURE__ */ u$1("div", { style: "display:flex;flex-direction:column;gap:14px;", children: [
            /* @__PURE__ */ u$1("div", { className: "form-group", children: [
              /* @__PURE__ */ u$1("label", { className: "form-label", children: "PushPlus Token (微信推送通知)" }),
              /* @__PURE__ */ u$1(
                "input",
                {
                  type: "text",
                  className: "form-input",
                  placeholder: "在 pushplus.plus 获取的 Token",
                  value: pushplusToken,
                  onInput: (e2) => setPushplusToken(e2.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ u$1("div", { className: "form-group", children: [
              /* @__PURE__ */ u$1("label", { className: "form-label", children: "Bark URL (iOS 系统横幅通知)" }),
              /* @__PURE__ */ u$1(
                "input",
                {
                  type: "text",
                  className: "form-input",
                  placeholder: "https://api.day.app/YOUR_KEY",
                  value: barkUrl,
                  onInput: (e2) => setBarkUrl(e2.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ u$1("div", { className: "form-group", children: [
              /* @__PURE__ */ u$1("label", { className: "form-label", children: "DDL 提醒阈值" }),
              /* @__PURE__ */ u$1(
                "select",
                {
                  className: "form-input",
                  value: threshold,
                  onChange: (e2) => setThreshold(parseInt(e2.target.value, 10)),
                  children: [
                    /* @__PURE__ */ u$1("option", { value: 24, children: "24 小时以内 (极紧急)" }),
                    /* @__PURE__ */ u$1("option", { value: 48, children: "48 小时以内 (2天)" }),
                    /* @__PURE__ */ u$1("option", { value: 72, children: "72 小时以内 (3天)" }),
                    /* @__PURE__ */ u$1("option", { value: 168, children: "168 小时以内 (1周)" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ u$1("div", { style: "display:flex;gap:8px;margin-top:8px;", children: [
              /* @__PURE__ */ u$1("button", { className: "btn btn-primary", style: "flex:1;", onClick: savePushConfig, children: "💾 保存配置" }),
              /* @__PURE__ */ u$1("button", { className: "btn btn-secondary", onClick: testPush, children: "🔔 发送测试推送" })
            ] })
          ] }),
          activeTab === "toolbox" && /* @__PURE__ */ u$1("div", { style: "display:flex;flex-direction:column;gap:14px;", children: [
            /* @__PURE__ */ u$1("div", { className: "nodd-card", children: [
              /* @__PURE__ */ u$1("div", { className: "card-title", children: "平台会话凭据" }),
              /* @__PURE__ */ u$1("div", { style: "font-size:12px;color:var(--text-sub);", children: "一键复制当前登录的 Cookie，供外部脚本或包管理器工具使用。" }),
              /* @__PURE__ */ u$1("button", { className: "btn btn-secondary btn-sm", onClick: copyCookie, children: "📋 复制当前 Cookie 到剪贴板" })
            ] }),
            /* @__PURE__ */ u$1("div", { className: "nodd-card", children: [
              /* @__PURE__ */ u$1("div", { className: "card-title", children: [
                "代码暂存草稿箱 (",
                drafts.length,
                ")"
              ] }),
              /* @__PURE__ */ u$1("div", { style: "font-size:12px;color:var(--text-sub);", children: "本地自动备份的代码记录，误刷新或关闭网页后可随时找回。" }),
              drafts.length === 0 ? /* @__PURE__ */ u$1("div", { style: "font-size:12px;color:var(--text-sub);padding:8px 0;", children: "暂无暂存记录（在代码编辑框输入时会自动备份）" }) : /* @__PURE__ */ u$1("div", { style: "max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-top:6px;", children: drafts.map((d2) => /* @__PURE__ */ u$1(
                "div",
                {
                  style: "display:flex;justify-content:space-between;align-items:center;background:#f1f5f9;padding:6px 10px;border-radius:6px;font-size:12px;",
                  children: [
                    /* @__PURE__ */ u$1("span", { children: [
                      "🕒 ",
                      d2.time,
                      " (",
                      d2.length,
                      " 字符)"
                    ] }),
                    /* @__PURE__ */ u$1(
                      "button",
                      {
                        className: "btn btn-sm btn-secondary",
                        onClick: () => {
                          if (typeof GM_setClipboard !== "undefined") {
                            GM_setClipboard(d2.code);
                          } else {
                            navigator.clipboard.writeText(d2.code);
                          }
                          showToast("已复制草稿代码到剪贴板！");
                        },
                        children: "复制"
                      }
                    )
                  ]
                },
                d2.key
              )) })
            ] })
          ] }),
          activeTab === "eval" && /* @__PURE__ */ u$1("div", { children: evalLoading ? /* @__PURE__ */ u$1("div", { className: "empty-state", children: "正在查询最新评测结果..." }) : submissions.length === 0 ? /* @__PURE__ */ u$1("div", { className: "empty-state", children: /* @__PURE__ */ u$1("span", { children: "暂无评测记录或页面未开放评测列表" }) }) : /* @__PURE__ */ u$1("div", { style: "display:flex;flex-direction:column;gap:8px;", children: submissions.map((sub) => /* @__PURE__ */ u$1("div", { className: "nodd-card", children: [
            /* @__PURE__ */ u$1("div", { style: "display:flex;justify-content:space-between;align-items:center;", children: [
              /* @__PURE__ */ u$1("span", { style: "font-weight:600;font-size:13px;", children: [
                "提交 #",
                sub.id
              ] }),
              /* @__PURE__ */ u$1(
                "span",
                {
                  className: `badge ${sub.status === "Accepted" ? "badge-normal" : sub.status === "Judging" ? "badge-warning" : "badge-critical"}`,
                  children: sub.status
                }
              )
            ] }),
            /* @__PURE__ */ u$1("div", { style: "font-size:12px;color:var(--text-sub);", children: [
              "提交时间：",
              sub.submitTime
            ] })
          ] }, sub.id)) }) })
        ] })
      ] })
    ] });
  }
  const PANEL_STYLES = `
:host {
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --bg-panel: rgba(255, 255, 255, 0.96);
  --bg-card: #f8fafc;
  --border: #e2e8f0;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --danger: #ef4444;
  --warning: #f97316;
  --success: #10b981;
  --shadow: 0 12px 36px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  color: var(--text-main);
  box-sizing: border-box;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 悬浮球 Trigger */
.nodd-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 30px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.nodd-trigger:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.45);
}

.nodd-trigger .logo-badge {
  font-weight: 800;
  font-size: 13px;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
}

.nodd-trigger .counter {
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  margin-left: 2px;
}

/* 浮动主面板 */
.nodd-panel-wrapper {
  position: fixed;
  bottom: 80px;
  right: 24px;
  z-index: 999999;
  width: 440px;
  max-width: calc(100vw - 32px);
  max-height: 640px;
  height: 600px;
  background: var(--bg-panel);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: nodd-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes nodd-slide-in {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 面板头部 */
.nodd-header {
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nodd-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
}

.nodd-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-sub);
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 15px;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: var(--border);
  color: var(--text-main);
}

/* 导航 Tabs */
.nodd-tabs {
  display: flex;
  background: #f1f5f9;
  padding: 6px;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}

.nodd-tab-item {
  flex: 1;
  text-align: center;
  padding: 7px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.nodd-tab-item.active {
  background: #ffffff;
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 容器内容区 */
.nodd-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 卡片样式 */
.nodd-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: border-color 0.15s;
}

.nodd-card:hover {
  border-color: #cbd5e1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.3;
}

.card-course {
  font-size: 12px;
  color: var(--text-sub);
}

/* 标签 Badge */
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}

.badge-critical { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.badge-urgent { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
.badge-warning { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
.badge-normal { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

/* 按钮规范 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover { background: var(--primary-hover); }

.btn-secondary {
  background: #f1f5f9;
  color: var(--text-main);
  border-color: var(--border);
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* 表单组件 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 13px;
  background: #ffffff;
  color: var(--text-main);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* 空状态与加载态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--text-sub);
  text-align: center;
  gap: 8px;
}

/* 顶部通知 Toast */
.nodd-toast {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: nodd-fade 0.2s ease-out;
  z-index: 10;
}

@keyframes nodd-fade {
  from { opacity: 0; transform: translate(-50%, -6px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
`;
  function mountNoDDLUI(client2, storage2, initialAssignments) {
    const HOST_ID = "nodd-shadow-root";
    let hostEl = document.getElementById(HOST_ID);
    if (!hostEl) {
      hostEl = document.createElement("div");
      hostEl.id = HOST_ID;
      document.body.appendChild(hostEl);
    }
    const shadowRoot = hostEl.shadowRoot || hostEl.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = PANEL_STYLES;
    shadowRoot.appendChild(styleEl);
    const mountContainer = document.createElement("div");
    shadowRoot.appendChild(mountContainer);
    G$1(g$1(App, { client: client2, storage: storage2, initialAssignments }), mountContainer);
  }
  function setupTestCaseCopyButtons() {
    const codeBlocks = document.querySelectorAll("pre");
    if (codeBlocks.length === 0) return;
    codeBlocks.forEach((pre) => {
      if (pre.getAttribute("data-nodd-copy-injected")) return;
      pre.setAttribute("data-nodd-copy-injected", "true");
      pre.style.position = "relative";
      const copyBtn = document.createElement("button");
      copyBtn.innerText = "📋 复制样例";
      copyBtn.style.cssText = `
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(49, 130, 206, 0.85);
      color: #ffffff;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      padding: 2px 8px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
      copyBtn.onmouseenter = () => copyBtn.style.opacity = "1";
      copyBtn.onmouseleave = () => copyBtn.style.opacity = "0.7";
      copyBtn.onclick = () => {
        const text = pre.innerText.replace("📋 复制样例", "").trim();
        if (typeof GM_setClipboard !== "undefined") {
          GM_setClipboard(text);
        } else {
          navigator.clipboard.writeText(text);
        }
        copyBtn.innerText = "✅ 已复制";
        setTimeout(() => {
          copyBtn.innerText = "📋 复制样例";
        }, 1500);
      };
      pre.appendChild(copyBtn);
    });
  }
  function setupCodeAutoSave() {
    const textareas = document.querySelectorAll("textarea");
    if (textareas.length === 0) return;
    const pathname = window.location.pathname;
    const search = window.location.search;
    const storageKey = `nodd_autosave_${pathname}_${search}`;
    textareas.forEach((area) => {
      var _a;
      let timer = null;
      area.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (area.value.trim().length > 0) {
            localStorage.setItem(storageKey, JSON.stringify({
              code: area.value,
              time: (/* @__PURE__ */ new Date()).toLocaleString()
            }));
          }
        }, 2e3);
      });
      const savedData = localStorage.getItem(storageKey);
      if (savedData && !area.getAttribute("data-nodd-restore-injected")) {
        area.setAttribute("data-nodd-restore-injected", "true");
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.code && parsed.code !== area.value) {
            const restoreBtn = document.createElement("button");
            restoreBtn.innerText = `💾 恢复自动暂存代码 (${parsed.time})`;
            restoreBtn.type = "button";
            restoreBtn.style.cssText = `
            margin: 6px 0;
            background: #319795;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
          `;
            restoreBtn.onclick = () => {
              if (confirm(`是否确认恢复于 ${parsed.time} 自动暂存的代码？`)) {
                area.value = parsed.code;
                area.dispatchEvent(new Event("input", { bubbles: true }));
                restoreBtn.remove();
              }
            };
            (_a = area.parentElement) == null ? void 0 : _a.insertBefore(restoreBtn, area);
          }
        } catch {
        }
      }
    });
  }
  const storage = new BrowserStorage();
  const http = new BrowserHttpClient();
  const client = new CourseGradingClient({ baseUrl: window.location.origin }, http, storage);
  async function initNoDDL() {
    var _a;
    console.log("[NoDDL] 启动希冀平台原生解析适配");
    setupTestCaseCopyButtons();
    setupCodeAutoSave();
    const activeCourse = parseActiveCourseInfo(document.documentElement.innerHTML);
    const curUrlCourseM = window.location.search.match(/courseID=([a-zA-Z0-9_-]+)/i);
    const currentCourseId = curUrlCourseM ? curUrlCourseM[1] : activeCourse.id || "";
    const currentCourseName = activeCourse.name || "";
    if (client.db && currentCourseId && currentCourseName) {
      await client.db.upsertCourse(currentCourseId, currentCourseName);
    }
    try {
      const domAssigns = parseActiveAssignmentsHtml(
        document.documentElement.innerHTML,
        currentCourseName,
        currentCourseId
      );
      for (const item of domAssigns) {
        if (item.deadlineTimestamp === 0) {
          try {
            const detailUrl = `${window.location.origin}${item.url}`;
            const detailHtml = await http.get(detailUrl);
            const detail = parseAssignmentDetailHtml(detailHtml);
            if (detail.deadlineTimestamp > 0) {
              item.deadline = detail.deadline;
              item.deadlineTimestamp = detail.deadlineTimestamp;
              item.remainingHours = detail.remainingHours;
              item.remainingText = detail.remainingText;
              item.urgency = calculateUrgency(detail.remainingHours);
            }
          } catch {
          }
        }
        if (client.db) {
          await client.db.upsertAssignment(item);
        }
      }
    } catch {
    }
    try {
      const urlMatch = window.location.href.match(/assignID=([a-zA-Z0-9_-]+)/i);
      if (urlMatch) {
        const curAssignId = urlMatch[1];
        let curDetail = parseAssignmentDetailHtml(document.documentElement.innerHTML);
        if (curDetail.deadlineTimestamp === 0) {
          try {
            const mainUrl = currentCourseId ? `${window.location.origin}/assignment/index.jsp?courseID=${currentCourseId}&assignID=${curAssignId}` : `${window.location.origin}/assignment/index.jsp?assignID=${curAssignId}`;
            const mainAssignHtml = await http.get(mainUrl);
            const fetchedDetail = parseAssignmentDetailHtml(mainAssignHtml);
            if (fetchedDetail.deadlineTimestamp > 0) {
              curDetail = fetchedDetail;
            }
          } catch {
          }
        }
        let title = curDetail.title;
        if (!title) {
          const bc = document.querySelector(".breadcrumb li a, .breadcrumb li:first-child");
          if (bc) title = (_a = bc.textContent) == null ? void 0 : _a.trim();
        }
        title = title || `作业 ${curAssignId}`;
        const finalUrl = currentCourseId ? `/assignment/index.jsp?courseID=${currentCourseId}&assignID=${curAssignId}` : `/assignment/index.jsp?assignID=${curAssignId}`;
        const item = {
          id: curAssignId,
          courseId: currentCourseId,
          courseName: currentCourseName,
          title,
          deadline: curDetail.deadline || "未设截止时间",
          deadlineTimestamp: curDetail.deadlineTimestamp,
          remainingHours: curDetail.remainingHours,
          remainingText: curDetail.remainingText,
          status: "pending",
          urgency: calculateUrgency(curDetail.remainingHours),
          url: finalUrl
        };
        if (client.db) {
          await client.db.upsertAssignment(item);
        }
      }
    } catch {
    }
    const allAssignments = client.db ? await client.db.getAllAssignments() : [];
    mountNoDDLUI(client, storage, allAssignments);
    if (allAssignments.length > 0) {
      const mostUrgent = allAssignments.find((a2) => a2.remainingHours > 0 && (a2.urgency === "critical" || a2.urgency === "urgent"));
      if (mostUrgent && typeof GM_notification !== "undefined") {
        GM_notification({
          title: "🚨 NoDDL DDL 提醒",
          text: `【${mostUrgent.courseName}】${mostUrgent.title} ${mostUrgent.remainingText}，请尽快完成！`,
          timeout: 8e3
        });
      }
      const pushplusToken = await storage.get("nodd_pushplus_token") || "";
      const barkUrl = await storage.get("nodd_bark_url") || "";
      const hoursThreshold = parseInt(await storage.get("nodd_hours_threshold") || "72", 10);
      const pushConfig = { pushplusToken, barkUrl, hoursThreshold };
      if (pushplusToken || barkUrl) {
        client.triggerPushAlert(pushConfig).catch(console.error);
      }
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNoDDL);
  } else {
    initNoDDL();
  }

})();