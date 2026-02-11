(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
    get: (a2, b2) => (typeof require !== "undefined" ? require : a2)[b2]
  }) : x2)(function(x2) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x2 + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // web/libs/socket.io.esm.min.js
  var socket_io_esm_min_exports = {};
  __export(socket_io_esm_min_exports, {
    Manager: () => vt,
    Socket: () => bt,
    connect: () => _t,
    default: () => _t,
    io: () => _t,
    protocol: () => ut
  });
  function h(t2) {
    return t2 instanceof Uint8Array ? t2 : t2 instanceof ArrayBuffer ? new Uint8Array(t2) : new Uint8Array(t2.buffer, t2.byteOffset, t2.byteLength);
  }
  function m() {
    return new TransformStream({ transform(t2, e2) {
      !(function(t3, e3) {
        n && t3.data instanceof Blob ? t3.data.arrayBuffer().then(h).then(e3) : i && (t3.data instanceof ArrayBuffer || r(t3.data)) ? e3(h(t3.data)) : o(t3, false, ((t4) => {
          c || (c = new TextEncoder()), e3(c.encode(t4));
        }));
      })(t2, ((s2) => {
        const n2 = s2.length;
        let i2;
        if (n2 < 126) i2 = new Uint8Array(1), new DataView(i2.buffer).setUint8(0, n2);
        else if (n2 < 65536) {
          i2 = new Uint8Array(3);
          const t3 = new DataView(i2.buffer);
          t3.setUint8(0, 126), t3.setUint16(1, n2);
        } else {
          i2 = new Uint8Array(9);
          const t3 = new DataView(i2.buffer);
          t3.setUint8(0, 127), t3.setBigUint64(1, BigInt(n2));
        }
        t2.data && "string" != typeof t2.data && (i2[0] |= 128), e2.enqueue(i2), e2.enqueue(s2);
      }));
    } });
  }
  function w(t2) {
    return t2.reduce(((t3, e2) => t3 + e2.length), 0);
  }
  function v(t2, e2) {
    if (t2[0].length === e2) return t2.shift();
    const s2 = new Uint8Array(e2);
    let n2 = 0;
    for (let i2 = 0; i2 < e2; i2++) s2[i2] = t2[0][n2++], n2 === t2[0].length && (t2.shift(), n2 = 0);
    return t2.length && n2 < t2[0].length && (t2[0] = t2[0].slice(n2)), s2;
  }
  function k(t2) {
    if (t2) return (function(t3) {
      for (var e2 in k.prototype) t3[e2] = k.prototype[e2];
      return t3;
    })(t2);
  }
  function E(t2, ...e2) {
    return e2.reduce(((e3, s2) => (t2.hasOwnProperty(s2) && (e3[s2] = t2[s2]), e3)), {});
  }
  function T(t2, e2) {
    e2.useNativeTimers ? (t2.setTimeoutFn = A.bind(_), t2.clearTimeoutFn = O.bind(_)) : (t2.setTimeoutFn = _.setTimeout.bind(_), t2.clearTimeoutFn = _.clearTimeout.bind(_));
  }
  function P(t2) {
    let e2 = "";
    do {
      e2 = B[t2 % S] + e2, t2 = Math.floor(t2 / S);
    } while (t2 > 0);
    return e2;
  }
  function j() {
    const t2 = P(+/* @__PURE__ */ new Date());
    return t2 !== x ? (L = 0, x = t2) : t2 + "." + P(L++);
  }
  function I(t2) {
    const e2 = t2.xdomain;
    try {
      if ("undefined" != typeof XMLHttpRequest && (!e2 || D)) return new XMLHttpRequest();
    } catch (t3) {
    }
    if (!e2) try {
      return new _[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (t3) {
    }
  }
  function F() {
  }
  function H() {
    for (let t2 in V.requests) V.requests.hasOwnProperty(t2) && V.requests[t2].abort();
  }
  function Q(t2) {
    const e2 = t2, s2 = t2.indexOf("["), n2 = t2.indexOf("]");
    -1 != s2 && -1 != n2 && (t2 = t2.substring(0, s2) + t2.substring(s2, n2).replace(/:/g, ";") + t2.substring(n2, t2.length));
    let i2 = J.exec(t2 || ""), r2 = {}, o2 = 14;
    for (; o2--; ) r2[$[o2]] = i2[o2] || "";
    return -1 != s2 && -1 != n2 && (r2.source = e2, r2.host = r2.host.substring(1, r2.host.length - 1).replace(/;/g, ":"), r2.authority = r2.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r2.ipv6uri = true), r2.pathNames = (function(t3, e3) {
      const s3 = /\/{2,9}/g, n3 = e3.replace(s3, "/").split("/");
      "/" != e3.slice(0, 1) && 0 !== e3.length || n3.splice(0, 1);
      "/" == e3.slice(-1) && n3.splice(n3.length - 1, 1);
      return n3;
    })(0, r2.path), r2.queryKey = (function(t3, e3) {
      const s3 = {};
      return e3.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, (function(t4, e4, n3) {
        e4 && (s3[e4] = n3);
      })), s3;
    })(0, r2.query), r2;
  }
  function nt(t2) {
    return G && (t2 instanceof ArrayBuffer || Z(t2)) || et && t2 instanceof Blob || st && t2 instanceof File;
  }
  function it(t2, e2) {
    if (!t2 || "object" != typeof t2) return false;
    if (Array.isArray(t2)) {
      for (let e3 = 0, s2 = t2.length; e3 < s2; e3++) if (it(t2[e3])) return true;
      return false;
    }
    if (nt(t2)) return true;
    if (t2.toJSON && "function" == typeof t2.toJSON && 1 === arguments.length) return it(t2.toJSON(), true);
    for (const e3 in t2) if (Object.prototype.hasOwnProperty.call(t2, e3) && it(t2[e3])) return true;
    return false;
  }
  function rt(t2) {
    const e2 = [], s2 = t2.data, n2 = t2;
    return n2.data = ot(s2, e2), n2.attachments = e2.length, { packet: n2, buffers: e2 };
  }
  function ot(t2, e2) {
    if (!t2) return t2;
    if (nt(t2)) {
      const s2 = { _placeholder: true, num: e2.length };
      return e2.push(t2), s2;
    }
    if (Array.isArray(t2)) {
      const s2 = new Array(t2.length);
      for (let n2 = 0; n2 < t2.length; n2++) s2[n2] = ot(t2[n2], e2);
      return s2;
    }
    if ("object" == typeof t2 && !(t2 instanceof Date)) {
      const s2 = {};
      for (const n2 in t2) Object.prototype.hasOwnProperty.call(t2, n2) && (s2[n2] = ot(t2[n2], e2));
      return s2;
    }
    return t2;
  }
  function at(t2, e2) {
    return t2.data = ht(t2.data, e2), delete t2.attachments, t2;
  }
  function ht(t2, e2) {
    if (!t2) return t2;
    if (t2 && true === t2._placeholder) {
      if ("number" == typeof t2.num && t2.num >= 0 && t2.num < e2.length) return e2[t2.num];
      throw new Error("illegal attachments");
    }
    if (Array.isArray(t2)) for (let s2 = 0; s2 < t2.length; s2++) t2[s2] = ht(t2[s2], e2);
    else if ("object" == typeof t2) for (const s2 in t2) Object.prototype.hasOwnProperty.call(t2, s2) && (t2[s2] = ht(t2[s2], e2));
    return t2;
  }
  function lt(t2) {
    return "[object Object]" === Object.prototype.toString.call(t2);
  }
  function gt(t2, e2, s2) {
    return t2.on(e2, s2), function() {
      t2.off(e2, s2);
    };
  }
  function wt(t2) {
    t2 = t2 || {}, this.ms = t2.min || 100, this.max = t2.max || 1e4, this.factor = t2.factor || 2, this.jitter = t2.jitter > 0 && t2.jitter <= 1 ? t2.jitter : 0, this.attempts = 0;
  }
  function _t(t2, e2) {
    "object" == typeof t2 && (e2 = t2, t2 = void 0);
    const s2 = (function(t3, e3 = "", s3) {
      let n3 = t3;
      s3 = s3 || "undefined" != typeof location && location, null == t3 && (t3 = s3.protocol + "//" + s3.host), "string" == typeof t3 && ("/" === t3.charAt(0) && (t3 = "/" === t3.charAt(1) ? s3.protocol + t3 : s3.host + t3), /^(https?|wss?):\/\//.test(t3) || (t3 = void 0 !== s3 ? s3.protocol + "//" + t3 : "https://" + t3), n3 = Q(t3)), n3.port || (/^(http|ws)$/.test(n3.protocol) ? n3.port = "80" : /^(http|ws)s$/.test(n3.protocol) && (n3.port = "443")), n3.path = n3.path || "/";
      const i3 = -1 !== n3.host.indexOf(":") ? "[" + n3.host + "]" : n3.host;
      return n3.id = n3.protocol + "://" + i3 + ":" + n3.port + e3, n3.href = n3.protocol + "://" + i3 + (s3 && s3.port === n3.port ? "" : ":" + n3.port), n3;
    })(t2, (e2 = e2 || {}).path || "/socket.io"), n2 = s2.source, i2 = s2.id, r2 = s2.path, o2 = kt[i2] && r2 in kt[i2].nsps;
    let a2;
    return e2.forceNew || e2["force new connection"] || false === e2.multiplex || o2 ? a2 = new vt(n2, e2) : (kt[i2] || (kt[i2] = new vt(n2, e2)), a2 = kt[i2]), s2.query && !e2.query && (e2.query = s2.queryKey), a2.socket(s2.path, e2);
  }
  var t, e, s, n, i, r, o, a, c, u, p, l, d, f, y, g, b, _, A, O, R, C, B, S, N, x, L, q, U, D, M, V, K, Y, W, z, J, $, X, G, Z, tt, et, st, ct, ut, pt, dt, ft, yt, mt, bt, vt, kt;
  var init_socket_io_esm_min = __esm({
    "web/libs/socket.io.esm.min.js"() {
      t = /* @__PURE__ */ Object.create(null);
      t.open = "0", t.close = "1", t.ping = "2", t.pong = "3", t.message = "4", t.upgrade = "5", t.noop = "6";
      e = /* @__PURE__ */ Object.create(null);
      Object.keys(t).forEach(((s2) => {
        e[t[s2]] = s2;
      }));
      s = { type: "error", data: "parser error" };
      n = "function" == typeof Blob || "undefined" != typeof Blob && "[object BlobConstructor]" === Object.prototype.toString.call(Blob);
      i = "function" == typeof ArrayBuffer;
      r = (t2) => "function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t2) : t2 && t2.buffer instanceof ArrayBuffer;
      o = ({ type: e2, data: s2 }, o2, h2) => n && s2 instanceof Blob ? o2 ? h2(s2) : a(s2, h2) : i && (s2 instanceof ArrayBuffer || r(s2)) ? o2 ? h2(s2) : a(new Blob([s2]), h2) : h2(t[e2] + (s2 || ""));
      a = (t2, e2) => {
        const s2 = new FileReader();
        return s2.onload = function() {
          const t3 = s2.result.split(",")[1];
          e2("b" + (t3 || ""));
        }, s2.readAsDataURL(t2);
      };
      u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      p = "undefined" == typeof Uint8Array ? [] : new Uint8Array(256);
      for (let t2 = 0; t2 < 64; t2++) p[u.charCodeAt(t2)] = t2;
      l = "function" == typeof ArrayBuffer;
      d = (t2, n2) => {
        if ("string" != typeof t2) return { type: "message", data: y(t2, n2) };
        const i2 = t2.charAt(0);
        if ("b" === i2) return { type: "message", data: f(t2.substring(1), n2) };
        return e[i2] ? t2.length > 1 ? { type: e[i2], data: t2.substring(1) } : { type: e[i2] } : s;
      };
      f = (t2, e2) => {
        if (l) {
          const s2 = ((t3) => {
            let e3, s3, n2, i2, r2, o2 = 0.75 * t3.length, a2 = t3.length, h2 = 0;
            "=" === t3[t3.length - 1] && (o2--, "=" === t3[t3.length - 2] && o2--);
            const c2 = new ArrayBuffer(o2), u2 = new Uint8Array(c2);
            for (e3 = 0; e3 < a2; e3 += 4) s3 = p[t3.charCodeAt(e3)], n2 = p[t3.charCodeAt(e3 + 1)], i2 = p[t3.charCodeAt(e3 + 2)], r2 = p[t3.charCodeAt(e3 + 3)], u2[h2++] = s3 << 2 | n2 >> 4, u2[h2++] = (15 & n2) << 4 | i2 >> 2, u2[h2++] = (3 & i2) << 6 | 63 & r2;
            return c2;
          })(t2);
          return y(s2, e2);
        }
        return { base64: true, data: t2 };
      };
      y = (t2, e2) => "blob" === e2 ? t2 instanceof Blob ? t2 : new Blob([t2]) : t2 instanceof ArrayBuffer ? t2 : t2.buffer;
      g = String.fromCharCode(30);
      k.prototype.on = k.prototype.addEventListener = function(t2, e2) {
        return this._callbacks = this._callbacks || {}, (this._callbacks["$" + t2] = this._callbacks["$" + t2] || []).push(e2), this;
      }, k.prototype.once = function(t2, e2) {
        function s2() {
          this.off(t2, s2), e2.apply(this, arguments);
        }
        return s2.fn = e2, this.on(t2, s2), this;
      }, k.prototype.off = k.prototype.removeListener = k.prototype.removeAllListeners = k.prototype.removeEventListener = function(t2, e2) {
        if (this._callbacks = this._callbacks || {}, 0 == arguments.length) return this._callbacks = {}, this;
        var s2, n2 = this._callbacks["$" + t2];
        if (!n2) return this;
        if (1 == arguments.length) return delete this._callbacks["$" + t2], this;
        for (var i2 = 0; i2 < n2.length; i2++) if ((s2 = n2[i2]) === e2 || s2.fn === e2) {
          n2.splice(i2, 1);
          break;
        }
        return 0 === n2.length && delete this._callbacks["$" + t2], this;
      }, k.prototype.emit = function(t2) {
        this._callbacks = this._callbacks || {};
        for (var e2 = new Array(arguments.length - 1), s2 = this._callbacks["$" + t2], n2 = 1; n2 < arguments.length; n2++) e2[n2 - 1] = arguments[n2];
        if (s2) {
          n2 = 0;
          for (var i2 = (s2 = s2.slice(0)).length; n2 < i2; ++n2) s2[n2].apply(this, e2);
        }
        return this;
      }, k.prototype.emitReserved = k.prototype.emit, k.prototype.listeners = function(t2) {
        return this._callbacks = this._callbacks || {}, this._callbacks["$" + t2] || [];
      }, k.prototype.hasListeners = function(t2) {
        return !!this.listeners(t2).length;
      };
      _ = "undefined" != typeof self ? self : "undefined" != typeof window ? window : Function("return this")();
      A = _.setTimeout;
      O = _.clearTimeout;
      R = class extends Error {
        constructor(t2, e2, s2) {
          super(t2), this.description = e2, this.context = s2, this.type = "TransportError";
        }
      };
      C = class extends k {
        constructor(t2) {
          super(), this.writable = false, T(this, t2), this.opts = t2, this.query = t2.query, this.socket = t2.socket;
        }
        onError(t2, e2, s2) {
          return super.emitReserved("error", new R(t2, e2, s2)), this;
        }
        open() {
          return this.readyState = "opening", this.doOpen(), this;
        }
        close() {
          return "opening" !== this.readyState && "open" !== this.readyState || (this.doClose(), this.onClose()), this;
        }
        send(t2) {
          "open" === this.readyState && this.write(t2);
        }
        onOpen() {
          this.readyState = "open", this.writable = true, super.emitReserved("open");
        }
        onData(t2) {
          const e2 = d(t2, this.socket.binaryType);
          this.onPacket(e2);
        }
        onPacket(t2) {
          super.emitReserved("packet", t2);
        }
        onClose(t2) {
          this.readyState = "closed", super.emitReserved("close", t2);
        }
        pause(t2) {
        }
        createUri(t2, e2 = {}) {
          return t2 + "://" + this._hostname() + this._port() + this.opts.path + this._query(e2);
        }
        _hostname() {
          const t2 = this.opts.hostname;
          return -1 === t2.indexOf(":") ? t2 : "[" + t2 + "]";
        }
        _port() {
          return this.opts.port && (this.opts.secure && Number(443 !== this.opts.port) || !this.opts.secure && 80 !== Number(this.opts.port)) ? ":" + this.opts.port : "";
        }
        _query(t2) {
          const e2 = (function(t3) {
            let e3 = "";
            for (let s2 in t3) t3.hasOwnProperty(s2) && (e3.length && (e3 += "&"), e3 += encodeURIComponent(s2) + "=" + encodeURIComponent(t3[s2]));
            return e3;
          })(t2);
          return e2.length ? "?" + e2 : "";
        }
      };
      B = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
      S = 64;
      N = {};
      L = 0;
      q = 0;
      for (; q < S; q++) N[B[q]] = q;
      U = false;
      try {
        U = "undefined" != typeof XMLHttpRequest && "withCredentials" in new XMLHttpRequest();
      } catch (t2) {
      }
      D = U;
      M = null != new I({ xdomain: false }).responseType;
      V = class _V extends k {
        constructor(t2, e2) {
          super(), T(this, e2), this.opts = e2, this.method = e2.method || "GET", this.uri = t2, this.data = void 0 !== e2.data ? e2.data : null, this.create();
        }
        create() {
          var t2;
          const e2 = E(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
          e2.xdomain = !!this.opts.xd;
          const s2 = this.xhr = new I(e2);
          try {
            s2.open(this.method, this.uri, true);
            try {
              if (this.opts.extraHeaders) {
                s2.setDisableHeaderCheck && s2.setDisableHeaderCheck(true);
                for (let t3 in this.opts.extraHeaders) this.opts.extraHeaders.hasOwnProperty(t3) && s2.setRequestHeader(t3, this.opts.extraHeaders[t3]);
              }
            } catch (t3) {
            }
            if ("POST" === this.method) try {
              s2.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (t3) {
            }
            try {
              s2.setRequestHeader("Accept", "*/*");
            } catch (t3) {
            }
            null === (t2 = this.opts.cookieJar) || void 0 === t2 || t2.addCookies(s2), "withCredentials" in s2 && (s2.withCredentials = this.opts.withCredentials), this.opts.requestTimeout && (s2.timeout = this.opts.requestTimeout), s2.onreadystatechange = () => {
              var t3;
              3 === s2.readyState && (null === (t3 = this.opts.cookieJar) || void 0 === t3 || t3.parseCookies(s2)), 4 === s2.readyState && (200 === s2.status || 1223 === s2.status ? this.onLoad() : this.setTimeoutFn((() => {
                this.onError("number" == typeof s2.status ? s2.status : 0);
              }), 0));
            }, s2.send(this.data);
          } catch (t3) {
            return void this.setTimeoutFn((() => {
              this.onError(t3);
            }), 0);
          }
          "undefined" != typeof document && (this.index = _V.requestsCount++, _V.requests[this.index] = this);
        }
        onError(t2) {
          this.emitReserved("error", t2, this.xhr), this.cleanup(true);
        }
        cleanup(t2) {
          if (void 0 !== this.xhr && null !== this.xhr) {
            if (this.xhr.onreadystatechange = F, t2) try {
              this.xhr.abort();
            } catch (t3) {
            }
            "undefined" != typeof document && delete _V.requests[this.index], this.xhr = null;
          }
        }
        onLoad() {
          const t2 = this.xhr.responseText;
          null !== t2 && (this.emitReserved("data", t2), this.emitReserved("success"), this.cleanup());
        }
        abort() {
          this.cleanup();
        }
      };
      if (V.requestsCount = 0, V.requests = {}, "undefined" != typeof document) {
        if ("function" == typeof attachEvent) attachEvent("onunload", H);
        else if ("function" == typeof addEventListener) {
          addEventListener("onpagehide" in _ ? "pagehide" : "unload", H, false);
        }
      }
      K = "function" == typeof Promise && "function" == typeof Promise.resolve ? (t2) => Promise.resolve().then(t2) : (t2, e2) => e2(t2, 0);
      Y = _.WebSocket || _.MozWebSocket;
      W = "undefined" != typeof navigator && "string" == typeof navigator.product && "reactnative" === navigator.product.toLowerCase();
      z = { websocket: class extends C {
        constructor(t2) {
          super(t2), this.supportsBinary = !t2.forceBase64;
        }
        get name() {
          return "websocket";
        }
        doOpen() {
          if (!this.check()) return;
          const t2 = this.uri(), e2 = this.opts.protocols, s2 = W ? {} : E(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
          this.opts.extraHeaders && (s2.headers = this.opts.extraHeaders);
          try {
            this.ws = W ? new Y(t2, e2, s2) : e2 ? new Y(t2, e2) : new Y(t2);
          } catch (t3) {
            return this.emitReserved("error", t3);
          }
          this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
        }
        addEventListeners() {
          this.ws.onopen = () => {
            this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
          }, this.ws.onclose = (t2) => this.onClose({ description: "websocket connection closed", context: t2 }), this.ws.onmessage = (t2) => this.onData(t2.data), this.ws.onerror = (t2) => this.onError("websocket error", t2);
        }
        write(t2) {
          this.writable = false;
          for (let e2 = 0; e2 < t2.length; e2++) {
            const s2 = t2[e2], n2 = e2 === t2.length - 1;
            o(s2, this.supportsBinary, ((t3) => {
              try {
                this.ws.send(t3);
              } catch (t4) {
              }
              n2 && K((() => {
                this.writable = true, this.emitReserved("drain");
              }), this.setTimeoutFn);
            }));
          }
        }
        doClose() {
          void 0 !== this.ws && (this.ws.close(), this.ws = null);
        }
        uri() {
          const t2 = this.opts.secure ? "wss" : "ws", e2 = this.query || {};
          return this.opts.timestampRequests && (e2[this.opts.timestampParam] = j()), this.supportsBinary || (e2.b64 = 1), this.createUri(t2, e2);
        }
        check() {
          return !!Y;
        }
      }, webtransport: class extends C {
        get name() {
          return "webtransport";
        }
        doOpen() {
          "function" == typeof WebTransport && (this.transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]), this.transport.closed.then((() => {
            this.onClose();
          })).catch(((t2) => {
            this.onError("webtransport error", t2);
          })), this.transport.ready.then((() => {
            this.transport.createBidirectionalStream().then(((t2) => {
              const e2 = (function(t3, e3) {
                b || (b = new TextDecoder());
                const n3 = [];
                let i3 = 0, r3 = -1, o3 = false;
                return new TransformStream({ transform(a2, h2) {
                  for (n3.push(a2); ; ) {
                    if (0 === i3) {
                      if (w(n3) < 1) break;
                      const t4 = v(n3, 1);
                      o3 = 128 == (128 & t4[0]), r3 = 127 & t4[0], i3 = r3 < 126 ? 3 : 126 === r3 ? 1 : 2;
                    } else if (1 === i3) {
                      if (w(n3) < 2) break;
                      const t4 = v(n3, 2);
                      r3 = new DataView(t4.buffer, t4.byteOffset, t4.length).getUint16(0), i3 = 3;
                    } else if (2 === i3) {
                      if (w(n3) < 8) break;
                      const t4 = v(n3, 8), e4 = new DataView(t4.buffer, t4.byteOffset, t4.length), o4 = e4.getUint32(0);
                      if (o4 > Math.pow(2, 21) - 1) {
                        h2.enqueue(s);
                        break;
                      }
                      r3 = o4 * Math.pow(2, 32) + e4.getUint32(4), i3 = 3;
                    } else {
                      if (w(n3) < r3) break;
                      const t4 = v(n3, r3);
                      h2.enqueue(d(o3 ? t4 : b.decode(t4), e3)), i3 = 0;
                    }
                    if (0 === r3 || r3 > t3) {
                      h2.enqueue(s);
                      break;
                    }
                  }
                } });
              })(Number.MAX_SAFE_INTEGER, this.socket.binaryType), n2 = t2.readable.pipeThrough(e2).getReader(), i2 = m();
              i2.readable.pipeTo(t2.writable), this.writer = i2.writable.getWriter();
              const r2 = () => {
                n2.read().then((({ done: t3, value: e3 }) => {
                  t3 || (this.onPacket(e3), r2());
                })).catch(((t3) => {
                }));
              };
              r2();
              const o2 = { type: "open" };
              this.query.sid && (o2.data = `{"sid":"${this.query.sid}"}`), this.writer.write(o2).then((() => this.onOpen()));
            }));
          })));
        }
        write(t2) {
          this.writable = false;
          for (let e2 = 0; e2 < t2.length; e2++) {
            const s2 = t2[e2], n2 = e2 === t2.length - 1;
            this.writer.write(s2).then((() => {
              n2 && K((() => {
                this.writable = true, this.emitReserved("drain");
              }), this.setTimeoutFn);
            }));
          }
        }
        doClose() {
          var t2;
          null === (t2 = this.transport) || void 0 === t2 || t2.close();
        }
      }, polling: class extends C {
        constructor(t2) {
          if (super(t2), this.polling = false, "undefined" != typeof location) {
            const e3 = "https:" === location.protocol;
            let s2 = location.port;
            s2 || (s2 = e3 ? "443" : "80"), this.xd = "undefined" != typeof location && t2.hostname !== location.hostname || s2 !== t2.port;
          }
          const e2 = t2 && t2.forceBase64;
          this.supportsBinary = M && !e2, this.opts.withCredentials && (this.cookieJar = void 0);
        }
        get name() {
          return "polling";
        }
        doOpen() {
          this.poll();
        }
        pause(t2) {
          this.readyState = "pausing";
          const e2 = () => {
            this.readyState = "paused", t2();
          };
          if (this.polling || !this.writable) {
            let t3 = 0;
            this.polling && (t3++, this.once("pollComplete", (function() {
              --t3 || e2();
            }))), this.writable || (t3++, this.once("drain", (function() {
              --t3 || e2();
            })));
          } else e2();
        }
        poll() {
          this.polling = true, this.doPoll(), this.emitReserved("poll");
        }
        onData(t2) {
          ((t3, e2) => {
            const s2 = t3.split(g), n2 = [];
            for (let t4 = 0; t4 < s2.length; t4++) {
              const i2 = d(s2[t4], e2);
              if (n2.push(i2), "error" === i2.type) break;
            }
            return n2;
          })(t2, this.socket.binaryType).forEach(((t3) => {
            if ("opening" === this.readyState && "open" === t3.type && this.onOpen(), "close" === t3.type) return this.onClose({ description: "transport closed by the server" }), false;
            this.onPacket(t3);
          })), "closed" !== this.readyState && (this.polling = false, this.emitReserved("pollComplete"), "open" === this.readyState && this.poll());
        }
        doClose() {
          const t2 = () => {
            this.write([{ type: "close" }]);
          };
          "open" === this.readyState ? t2() : this.once("open", t2);
        }
        write(t2) {
          this.writable = false, ((t3, e2) => {
            const s2 = t3.length, n2 = new Array(s2);
            let i2 = 0;
            t3.forEach(((t4, r2) => {
              o(t4, false, ((t5) => {
                n2[r2] = t5, ++i2 === s2 && e2(n2.join(g));
              }));
            }));
          })(t2, ((t3) => {
            this.doWrite(t3, (() => {
              this.writable = true, this.emitReserved("drain");
            }));
          }));
        }
        uri() {
          const t2 = this.opts.secure ? "https" : "http", e2 = this.query || {};
          return false !== this.opts.timestampRequests && (e2[this.opts.timestampParam] = j()), this.supportsBinary || e2.sid || (e2.b64 = 1), this.createUri(t2, e2);
        }
        request(t2 = {}) {
          return Object.assign(t2, { xd: this.xd, cookieJar: this.cookieJar }, this.opts), new V(this.uri(), t2);
        }
        doWrite(t2, e2) {
          const s2 = this.request({ method: "POST", data: t2 });
          s2.on("success", e2), s2.on("error", ((t3, e3) => {
            this.onError("xhr post error", t3, e3);
          }));
        }
        doPoll() {
          const t2 = this.request();
          t2.on("data", this.onData.bind(this)), t2.on("error", ((t3, e2) => {
            this.onError("xhr poll error", t3, e2);
          })), this.pollXhr = t2;
        }
      } };
      J = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
      $ = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
      X = class _X extends k {
        constructor(t2, e2 = {}) {
          super(), this.binaryType = "arraybuffer", this.writeBuffer = [], t2 && "object" == typeof t2 && (e2 = t2, t2 = null), t2 ? (t2 = Q(t2), e2.hostname = t2.host, e2.secure = "https" === t2.protocol || "wss" === t2.protocol, e2.port = t2.port, t2.query && (e2.query = t2.query)) : e2.host && (e2.hostname = Q(e2.host).host), T(this, e2), this.secure = null != e2.secure ? e2.secure : "undefined" != typeof location && "https:" === location.protocol, e2.hostname && !e2.port && (e2.port = this.secure ? "443" : "80"), this.hostname = e2.hostname || ("undefined" != typeof location ? location.hostname : "localhost"), this.port = e2.port || ("undefined" != typeof location && location.port ? location.port : this.secure ? "443" : "80"), this.transports = e2.transports || ["polling", "websocket", "webtransport"], this.writeBuffer = [], this.prevBufferLen = 0, this.opts = Object.assign({ path: "/engine.io", agent: false, withCredentials: false, upgrade: true, timestampParam: "t", rememberUpgrade: false, addTrailingSlash: true, rejectUnauthorized: true, perMessageDeflate: { threshold: 1024 }, transportOptions: {}, closeOnBeforeunload: false }, e2), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), "string" == typeof this.opts.query && (this.opts.query = (function(t3) {
            let e3 = {}, s2 = t3.split("&");
            for (let t4 = 0, n2 = s2.length; t4 < n2; t4++) {
              let n3 = s2[t4].split("=");
              e3[decodeURIComponent(n3[0])] = decodeURIComponent(n3[1]);
            }
            return e3;
          })(this.opts.query)), this.id = null, this.upgrades = null, this.pingInterval = null, this.pingTimeout = null, this.pingTimeoutTimer = null, "function" == typeof addEventListener && (this.opts.closeOnBeforeunload && (this.beforeunloadEventListener = () => {
            this.transport && (this.transport.removeAllListeners(), this.transport.close());
          }, addEventListener("beforeunload", this.beforeunloadEventListener, false)), "localhost" !== this.hostname && (this.offlineEventListener = () => {
            this.onClose("transport close", { description: "network connection lost" });
          }, addEventListener("offline", this.offlineEventListener, false))), this.open();
        }
        createTransport(t2) {
          const e2 = Object.assign({}, this.opts.query);
          e2.EIO = 4, e2.transport = t2, this.id && (e2.sid = this.id);
          const s2 = Object.assign({}, this.opts, { query: e2, socket: this, hostname: this.hostname, secure: this.secure, port: this.port }, this.opts.transportOptions[t2]);
          return new z[t2](s2);
        }
        open() {
          let t2;
          if (this.opts.rememberUpgrade && _X.priorWebsocketSuccess && -1 !== this.transports.indexOf("websocket")) t2 = "websocket";
          else {
            if (0 === this.transports.length) return void this.setTimeoutFn((() => {
              this.emitReserved("error", "No transports available");
            }), 0);
            t2 = this.transports[0];
          }
          this.readyState = "opening";
          try {
            t2 = this.createTransport(t2);
          } catch (t3) {
            return this.transports.shift(), void this.open();
          }
          t2.open(), this.setTransport(t2);
        }
        setTransport(t2) {
          this.transport && this.transport.removeAllListeners(), this.transport = t2, t2.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", ((t3) => this.onClose("transport close", t3)));
        }
        probe(t2) {
          let e2 = this.createTransport(t2), s2 = false;
          _X.priorWebsocketSuccess = false;
          const n2 = () => {
            s2 || (e2.send([{ type: "ping", data: "probe" }]), e2.once("packet", ((t3) => {
              if (!s2) if ("pong" === t3.type && "probe" === t3.data) {
                if (this.upgrading = true, this.emitReserved("upgrading", e2), !e2) return;
                _X.priorWebsocketSuccess = "websocket" === e2.name, this.transport.pause((() => {
                  s2 || "closed" !== this.readyState && (c2(), this.setTransport(e2), e2.send([{ type: "upgrade" }]), this.emitReserved("upgrade", e2), e2 = null, this.upgrading = false, this.flush());
                }));
              } else {
                const t4 = new Error("probe error");
                t4.transport = e2.name, this.emitReserved("upgradeError", t4);
              }
            })));
          };
          function i2() {
            s2 || (s2 = true, c2(), e2.close(), e2 = null);
          }
          const r2 = (t3) => {
            const s3 = new Error("probe error: " + t3);
            s3.transport = e2.name, i2(), this.emitReserved("upgradeError", s3);
          };
          function o2() {
            r2("transport closed");
          }
          function a2() {
            r2("socket closed");
          }
          function h2(t3) {
            e2 && t3.name !== e2.name && i2();
          }
          const c2 = () => {
            e2.removeListener("open", n2), e2.removeListener("error", r2), e2.removeListener("close", o2), this.off("close", a2), this.off("upgrading", h2);
          };
          e2.once("open", n2), e2.once("error", r2), e2.once("close", o2), this.once("close", a2), this.once("upgrading", h2), -1 !== this.upgrades.indexOf("webtransport") && "webtransport" !== t2 ? this.setTimeoutFn((() => {
            s2 || e2.open();
          }), 200) : e2.open();
        }
        onOpen() {
          if (this.readyState = "open", _X.priorWebsocketSuccess = "websocket" === this.transport.name, this.emitReserved("open"), this.flush(), "open" === this.readyState && this.opts.upgrade) {
            let t2 = 0;
            const e2 = this.upgrades.length;
            for (; t2 < e2; t2++) this.probe(this.upgrades[t2]);
          }
        }
        onPacket(t2) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) switch (this.emitReserved("packet", t2), this.emitReserved("heartbeat"), this.resetPingTimeout(), t2.type) {
            case "open":
              this.onHandshake(JSON.parse(t2.data));
              break;
            case "ping":
              this.sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong");
              break;
            case "error":
              const e2 = new Error("server error");
              e2.code = t2.data, this.onError(e2);
              break;
            case "message":
              this.emitReserved("data", t2.data), this.emitReserved("message", t2.data);
          }
        }
        onHandshake(t2) {
          this.emitReserved("handshake", t2), this.id = t2.sid, this.transport.query.sid = t2.sid, this.upgrades = this.filterUpgrades(t2.upgrades), this.pingInterval = t2.pingInterval, this.pingTimeout = t2.pingTimeout, this.maxPayload = t2.maxPayload, this.onOpen(), "closed" !== this.readyState && this.resetPingTimeout();
        }
        resetPingTimeout() {
          this.clearTimeoutFn(this.pingTimeoutTimer), this.pingTimeoutTimer = this.setTimeoutFn((() => {
            this.onClose("ping timeout");
          }), this.pingInterval + this.pingTimeout), this.opts.autoUnref && this.pingTimeoutTimer.unref();
        }
        onDrain() {
          this.writeBuffer.splice(0, this.prevBufferLen), this.prevBufferLen = 0, 0 === this.writeBuffer.length ? this.emitReserved("drain") : this.flush();
        }
        flush() {
          if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
            const t2 = this.getWritablePackets();
            this.transport.send(t2), this.prevBufferLen = t2.length, this.emitReserved("flush");
          }
        }
        getWritablePackets() {
          if (!(this.maxPayload && "polling" === this.transport.name && this.writeBuffer.length > 1)) return this.writeBuffer;
          let t2 = 1;
          for (let s2 = 0; s2 < this.writeBuffer.length; s2++) {
            const n2 = this.writeBuffer[s2].data;
            if (n2 && (t2 += "string" == typeof (e2 = n2) ? (function(t3) {
              let e3 = 0, s3 = 0;
              for (let n3 = 0, i2 = t3.length; n3 < i2; n3++) e3 = t3.charCodeAt(n3), e3 < 128 ? s3 += 1 : e3 < 2048 ? s3 += 2 : e3 < 55296 || e3 >= 57344 ? s3 += 3 : (n3++, s3 += 4);
              return s3;
            })(e2) : Math.ceil(1.33 * (e2.byteLength || e2.size))), s2 > 0 && t2 > this.maxPayload) return this.writeBuffer.slice(0, s2);
            t2 += 2;
          }
          var e2;
          return this.writeBuffer;
        }
        write(t2, e2, s2) {
          return this.sendPacket("message", t2, e2, s2), this;
        }
        send(t2, e2, s2) {
          return this.sendPacket("message", t2, e2, s2), this;
        }
        sendPacket(t2, e2, s2, n2) {
          if ("function" == typeof e2 && (n2 = e2, e2 = void 0), "function" == typeof s2 && (n2 = s2, s2 = null), "closing" === this.readyState || "closed" === this.readyState) return;
          (s2 = s2 || {}).compress = false !== s2.compress;
          const i2 = { type: t2, data: e2, options: s2 };
          this.emitReserved("packetCreate", i2), this.writeBuffer.push(i2), n2 && this.once("flush", n2), this.flush();
        }
        close() {
          const t2 = () => {
            this.onClose("forced close"), this.transport.close();
          }, e2 = () => {
            this.off("upgrade", e2), this.off("upgradeError", e2), t2();
          }, s2 = () => {
            this.once("upgrade", e2), this.once("upgradeError", e2);
          };
          return "opening" !== this.readyState && "open" !== this.readyState || (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", (() => {
            this.upgrading ? s2() : t2();
          })) : this.upgrading ? s2() : t2()), this;
        }
        onError(t2) {
          _X.priorWebsocketSuccess = false, this.emitReserved("error", t2), this.onClose("transport error", t2);
        }
        onClose(t2, e2) {
          "opening" !== this.readyState && "open" !== this.readyState && "closing" !== this.readyState || (this.clearTimeoutFn(this.pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), "function" == typeof removeEventListener && (removeEventListener("beforeunload", this.beforeunloadEventListener, false), removeEventListener("offline", this.offlineEventListener, false)), this.readyState = "closed", this.id = null, this.emitReserved("close", t2, e2), this.writeBuffer = [], this.prevBufferLen = 0);
        }
        filterUpgrades(t2) {
          const e2 = [];
          let s2 = 0;
          const n2 = t2.length;
          for (; s2 < n2; s2++) ~this.transports.indexOf(t2[s2]) && e2.push(t2[s2]);
          return e2;
        }
      };
      X.protocol = 4;
      G = "function" == typeof ArrayBuffer;
      Z = (t2) => "function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t2) : t2.buffer instanceof ArrayBuffer;
      tt = Object.prototype.toString;
      et = "function" == typeof Blob || "undefined" != typeof Blob && "[object BlobConstructor]" === tt.call(Blob);
      st = "function" == typeof File || "undefined" != typeof File && "[object FileConstructor]" === tt.call(File);
      ct = ["connect", "connect_error", "disconnect", "disconnecting", "newListener", "removeListener"];
      ut = 5;
      !(function(t2) {
        t2[t2.CONNECT = 0] = "CONNECT", t2[t2.DISCONNECT = 1] = "DISCONNECT", t2[t2.EVENT = 2] = "EVENT", t2[t2.ACK = 3] = "ACK", t2[t2.CONNECT_ERROR = 4] = "CONNECT_ERROR", t2[t2.BINARY_EVENT = 5] = "BINARY_EVENT", t2[t2.BINARY_ACK = 6] = "BINARY_ACK";
      })(pt || (pt = {}));
      dt = class _dt extends k {
        constructor(t2) {
          super(), this.reviver = t2;
        }
        add(t2) {
          let e2;
          if ("string" == typeof t2) {
            if (this.reconstructor) throw new Error("got plaintext data when reconstructing a packet");
            e2 = this.decodeString(t2);
            const s2 = e2.type === pt.BINARY_EVENT;
            s2 || e2.type === pt.BINARY_ACK ? (e2.type = s2 ? pt.EVENT : pt.ACK, this.reconstructor = new ft(e2), 0 === e2.attachments && super.emitReserved("decoded", e2)) : super.emitReserved("decoded", e2);
          } else {
            if (!nt(t2) && !t2.base64) throw new Error("Unknown type: " + t2);
            if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
            e2 = this.reconstructor.takeBinaryData(t2), e2 && (this.reconstructor = null, super.emitReserved("decoded", e2));
          }
        }
        decodeString(t2) {
          let e2 = 0;
          const s2 = { type: Number(t2.charAt(0)) };
          if (void 0 === pt[s2.type]) throw new Error("unknown packet type " + s2.type);
          if (s2.type === pt.BINARY_EVENT || s2.type === pt.BINARY_ACK) {
            const n3 = e2 + 1;
            for (; "-" !== t2.charAt(++e2) && e2 != t2.length; ) ;
            const i2 = t2.substring(n3, e2);
            if (i2 != Number(i2) || "-" !== t2.charAt(e2)) throw new Error("Illegal attachments");
            s2.attachments = Number(i2);
          }
          if ("/" === t2.charAt(e2 + 1)) {
            const n3 = e2 + 1;
            for (; ++e2; ) {
              if ("," === t2.charAt(e2)) break;
              if (e2 === t2.length) break;
            }
            s2.nsp = t2.substring(n3, e2);
          } else s2.nsp = "/";
          const n2 = t2.charAt(e2 + 1);
          if ("" !== n2 && Number(n2) == n2) {
            const n3 = e2 + 1;
            for (; ++e2; ) {
              const s3 = t2.charAt(e2);
              if (null == s3 || Number(s3) != s3) {
                --e2;
                break;
              }
              if (e2 === t2.length) break;
            }
            s2.id = Number(t2.substring(n3, e2 + 1));
          }
          if (t2.charAt(++e2)) {
            const n3 = this.tryParse(t2.substr(e2));
            if (!_dt.isPayloadValid(s2.type, n3)) throw new Error("invalid payload");
            s2.data = n3;
          }
          return s2;
        }
        tryParse(t2) {
          try {
            return JSON.parse(t2, this.reviver);
          } catch (t3) {
            return false;
          }
        }
        static isPayloadValid(t2, e2) {
          switch (t2) {
            case pt.CONNECT:
              return lt(e2);
            case pt.DISCONNECT:
              return void 0 === e2;
            case pt.CONNECT_ERROR:
              return "string" == typeof e2 || lt(e2);
            case pt.EVENT:
            case pt.BINARY_EVENT:
              return Array.isArray(e2) && ("number" == typeof e2[0] || "string" == typeof e2[0] && -1 === ct.indexOf(e2[0]));
            case pt.ACK:
            case pt.BINARY_ACK:
              return Array.isArray(e2);
          }
        }
        destroy() {
          this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
        }
      };
      ft = class {
        constructor(t2) {
          this.packet = t2, this.buffers = [], this.reconPack = t2;
        }
        takeBinaryData(t2) {
          if (this.buffers.push(t2), this.buffers.length === this.reconPack.attachments) {
            const t3 = at(this.reconPack, this.buffers);
            return this.finishedReconstruction(), t3;
          }
          return null;
        }
        finishedReconstruction() {
          this.reconPack = null, this.buffers = [];
        }
      };
      yt = Object.freeze({ __proto__: null, protocol: 5, get PacketType() {
        return pt;
      }, Encoder: class {
        constructor(t2) {
          this.replacer = t2;
        }
        encode(t2) {
          return t2.type !== pt.EVENT && t2.type !== pt.ACK || !it(t2) ? [this.encodeAsString(t2)] : this.encodeAsBinary({ type: t2.type === pt.EVENT ? pt.BINARY_EVENT : pt.BINARY_ACK, nsp: t2.nsp, data: t2.data, id: t2.id });
        }
        encodeAsString(t2) {
          let e2 = "" + t2.type;
          return t2.type !== pt.BINARY_EVENT && t2.type !== pt.BINARY_ACK || (e2 += t2.attachments + "-"), t2.nsp && "/" !== t2.nsp && (e2 += t2.nsp + ","), null != t2.id && (e2 += t2.id), null != t2.data && (e2 += JSON.stringify(t2.data, this.replacer)), e2;
        }
        encodeAsBinary(t2) {
          const e2 = rt(t2), s2 = this.encodeAsString(e2.packet), n2 = e2.buffers;
          return n2.unshift(s2), n2;
        }
      }, Decoder: dt });
      mt = Object.freeze({ connect: 1, connect_error: 1, disconnect: 1, disconnecting: 1, newListener: 1, removeListener: 1 });
      bt = class extends k {
        constructor(t2, e2, s2) {
          super(), this.connected = false, this.recovered = false, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = t2, this.nsp = e2, s2 && s2.auth && (this.auth = s2.auth), this._opts = Object.assign({}, s2), this.io._autoConnect && this.open();
        }
        get disconnected() {
          return !this.connected;
        }
        subEvents() {
          if (this.subs) return;
          const t2 = this.io;
          this.subs = [gt(t2, "open", this.onopen.bind(this)), gt(t2, "packet", this.onpacket.bind(this)), gt(t2, "error", this.onerror.bind(this)), gt(t2, "close", this.onclose.bind(this))];
        }
        get active() {
          return !!this.subs;
        }
        connect() {
          return this.connected || (this.subEvents(), this.io._reconnecting || this.io.open(), "open" === this.io._readyState && this.onopen()), this;
        }
        open() {
          return this.connect();
        }
        send(...t2) {
          return t2.unshift("message"), this.emit.apply(this, t2), this;
        }
        emit(t2, ...e2) {
          if (mt.hasOwnProperty(t2)) throw new Error('"' + t2.toString() + '" is a reserved event name');
          if (e2.unshift(t2), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) return this._addToQueue(e2), this;
          const s2 = { type: pt.EVENT, data: e2, options: {} };
          if (s2.options.compress = false !== this.flags.compress, "function" == typeof e2[e2.length - 1]) {
            const t3 = this.ids++, n3 = e2.pop();
            this._registerAckCallback(t3, n3), s2.id = t3;
          }
          const n2 = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
          return this.flags.volatile && (!n2 || !this.connected) || (this.connected ? (this.notifyOutgoingListeners(s2), this.packet(s2)) : this.sendBuffer.push(s2)), this.flags = {}, this;
        }
        _registerAckCallback(t2, e2) {
          var s2;
          const n2 = null !== (s2 = this.flags.timeout) && void 0 !== s2 ? s2 : this._opts.ackTimeout;
          if (void 0 === n2) return void (this.acks[t2] = e2);
          const i2 = this.io.setTimeoutFn((() => {
            delete this.acks[t2];
            for (let e3 = 0; e3 < this.sendBuffer.length; e3++) this.sendBuffer[e3].id === t2 && this.sendBuffer.splice(e3, 1);
            e2.call(this, new Error("operation has timed out"));
          }), n2), r2 = (...t3) => {
            this.io.clearTimeoutFn(i2), e2.apply(this, t3);
          };
          r2.withError = true, this.acks[t2] = r2;
        }
        emitWithAck(t2, ...e2) {
          return new Promise(((s2, n2) => {
            const i2 = (t3, e3) => t3 ? n2(t3) : s2(e3);
            i2.withError = true, e2.push(i2), this.emit(t2, ...e2);
          }));
        }
        _addToQueue(t2) {
          let e2;
          "function" == typeof t2[t2.length - 1] && (e2 = t2.pop());
          const s2 = { id: this._queueSeq++, tryCount: 0, pending: false, args: t2, flags: Object.assign({ fromQueue: true }, this.flags) };
          t2.push(((t3, ...n2) => {
            if (s2 !== this._queue[0]) return;
            return null !== t3 ? s2.tryCount > this._opts.retries && (this._queue.shift(), e2 && e2(t3)) : (this._queue.shift(), e2 && e2(null, ...n2)), s2.pending = false, this._drainQueue();
          })), this._queue.push(s2), this._drainQueue();
        }
        _drainQueue(t2 = false) {
          if (!this.connected || 0 === this._queue.length) return;
          const e2 = this._queue[0];
          e2.pending && !t2 || (e2.pending = true, e2.tryCount++, this.flags = e2.flags, this.emit.apply(this, e2.args));
        }
        packet(t2) {
          t2.nsp = this.nsp, this.io._packet(t2);
        }
        onopen() {
          "function" == typeof this.auth ? this.auth(((t2) => {
            this._sendConnectPacket(t2);
          })) : this._sendConnectPacket(this.auth);
        }
        _sendConnectPacket(t2) {
          this.packet({ type: pt.CONNECT, data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, t2) : t2 });
        }
        onerror(t2) {
          this.connected || this.emitReserved("connect_error", t2);
        }
        onclose(t2, e2) {
          this.connected = false, delete this.id, this.emitReserved("disconnect", t2, e2), this._clearAcks();
        }
        _clearAcks() {
          Object.keys(this.acks).forEach(((t2) => {
            if (!this.sendBuffer.some(((e2) => String(e2.id) === t2))) {
              const e2 = this.acks[t2];
              delete this.acks[t2], e2.withError && e2.call(this, new Error("socket has been disconnected"));
            }
          }));
        }
        onpacket(t2) {
          if (t2.nsp === this.nsp) switch (t2.type) {
            case pt.CONNECT:
              t2.data && t2.data.sid ? this.onconnect(t2.data.sid, t2.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
              break;
            case pt.EVENT:
            case pt.BINARY_EVENT:
              this.onevent(t2);
              break;
            case pt.ACK:
            case pt.BINARY_ACK:
              this.onack(t2);
              break;
            case pt.DISCONNECT:
              this.ondisconnect();
              break;
            case pt.CONNECT_ERROR:
              this.destroy();
              const e2 = new Error(t2.data.message);
              e2.data = t2.data.data, this.emitReserved("connect_error", e2);
          }
        }
        onevent(t2) {
          const e2 = t2.data || [];
          null != t2.id && e2.push(this.ack(t2.id)), this.connected ? this.emitEvent(e2) : this.receiveBuffer.push(Object.freeze(e2));
        }
        emitEvent(t2) {
          if (this._anyListeners && this._anyListeners.length) {
            const e2 = this._anyListeners.slice();
            for (const s2 of e2) s2.apply(this, t2);
          }
          super.emit.apply(this, t2), this._pid && t2.length && "string" == typeof t2[t2.length - 1] && (this._lastOffset = t2[t2.length - 1]);
        }
        ack(t2) {
          const e2 = this;
          let s2 = false;
          return function(...n2) {
            s2 || (s2 = true, e2.packet({ type: pt.ACK, id: t2, data: n2 }));
          };
        }
        onack(t2) {
          const e2 = this.acks[t2.id];
          "function" == typeof e2 && (delete this.acks[t2.id], e2.withError && t2.data.unshift(null), e2.apply(this, t2.data));
        }
        onconnect(t2, e2) {
          this.id = t2, this.recovered = e2 && this._pid === e2, this._pid = e2, this.connected = true, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(true);
        }
        emitBuffered() {
          this.receiveBuffer.forEach(((t2) => this.emitEvent(t2))), this.receiveBuffer = [], this.sendBuffer.forEach(((t2) => {
            this.notifyOutgoingListeners(t2), this.packet(t2);
          })), this.sendBuffer = [];
        }
        ondisconnect() {
          this.destroy(), this.onclose("io server disconnect");
        }
        destroy() {
          this.subs && (this.subs.forEach(((t2) => t2())), this.subs = void 0), this.io._destroy(this);
        }
        disconnect() {
          return this.connected && this.packet({ type: pt.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
        }
        close() {
          return this.disconnect();
        }
        compress(t2) {
          return this.flags.compress = t2, this;
        }
        get volatile() {
          return this.flags.volatile = true, this;
        }
        timeout(t2) {
          return this.flags.timeout = t2, this;
        }
        onAny(t2) {
          return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t2), this;
        }
        prependAny(t2) {
          return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t2), this;
        }
        offAny(t2) {
          if (!this._anyListeners) return this;
          if (t2) {
            const e2 = this._anyListeners;
            for (let s2 = 0; s2 < e2.length; s2++) if (t2 === e2[s2]) return e2.splice(s2, 1), this;
          } else this._anyListeners = [];
          return this;
        }
        listenersAny() {
          return this._anyListeners || [];
        }
        onAnyOutgoing(t2) {
          return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(t2), this;
        }
        prependAnyOutgoing(t2) {
          return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(t2), this;
        }
        offAnyOutgoing(t2) {
          if (!this._anyOutgoingListeners) return this;
          if (t2) {
            const e2 = this._anyOutgoingListeners;
            for (let s2 = 0; s2 < e2.length; s2++) if (t2 === e2[s2]) return e2.splice(s2, 1), this;
          } else this._anyOutgoingListeners = [];
          return this;
        }
        listenersAnyOutgoing() {
          return this._anyOutgoingListeners || [];
        }
        notifyOutgoingListeners(t2) {
          if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
            const e2 = this._anyOutgoingListeners.slice();
            for (const s2 of e2) s2.apply(this, t2.data);
          }
        }
      };
      wt.prototype.duration = function() {
        var t2 = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
          var e2 = Math.random(), s2 = Math.floor(e2 * this.jitter * t2);
          t2 = 0 == (1 & Math.floor(10 * e2)) ? t2 - s2 : t2 + s2;
        }
        return 0 | Math.min(t2, this.max);
      }, wt.prototype.reset = function() {
        this.attempts = 0;
      }, wt.prototype.setMin = function(t2) {
        this.ms = t2;
      }, wt.prototype.setMax = function(t2) {
        this.max = t2;
      }, wt.prototype.setJitter = function(t2) {
        this.jitter = t2;
      };
      vt = class extends k {
        constructor(t2, e2) {
          var s2;
          super(), this.nsps = {}, this.subs = [], t2 && "object" == typeof t2 && (e2 = t2, t2 = void 0), (e2 = e2 || {}).path = e2.path || "/socket.io", this.opts = e2, T(this, e2), this.reconnection(false !== e2.reconnection), this.reconnectionAttempts(e2.reconnectionAttempts || 1 / 0), this.reconnectionDelay(e2.reconnectionDelay || 1e3), this.reconnectionDelayMax(e2.reconnectionDelayMax || 5e3), this.randomizationFactor(null !== (s2 = e2.randomizationFactor) && void 0 !== s2 ? s2 : 0.5), this.backoff = new wt({ min: this.reconnectionDelay(), max: this.reconnectionDelayMax(), jitter: this.randomizationFactor() }), this.timeout(null == e2.timeout ? 2e4 : e2.timeout), this._readyState = "closed", this.uri = t2;
          const n2 = e2.parser || yt;
          this.encoder = new n2.Encoder(), this.decoder = new n2.Decoder(), this._autoConnect = false !== e2.autoConnect, this._autoConnect && this.open();
        }
        reconnection(t2) {
          return arguments.length ? (this._reconnection = !!t2, this) : this._reconnection;
        }
        reconnectionAttempts(t2) {
          return void 0 === t2 ? this._reconnectionAttempts : (this._reconnectionAttempts = t2, this);
        }
        reconnectionDelay(t2) {
          var e2;
          return void 0 === t2 ? this._reconnectionDelay : (this._reconnectionDelay = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setMin(t2), this);
        }
        randomizationFactor(t2) {
          var e2;
          return void 0 === t2 ? this._randomizationFactor : (this._randomizationFactor = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setJitter(t2), this);
        }
        reconnectionDelayMax(t2) {
          var e2;
          return void 0 === t2 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setMax(t2), this);
        }
        timeout(t2) {
          return arguments.length ? (this._timeout = t2, this) : this._timeout;
        }
        maybeReconnectOnOpen() {
          !this._reconnecting && this._reconnection && 0 === this.backoff.attempts && this.reconnect();
        }
        open(t2) {
          if (~this._readyState.indexOf("open")) return this;
          this.engine = new X(this.uri, this.opts);
          const e2 = this.engine, s2 = this;
          this._readyState = "opening", this.skipReconnect = false;
          const n2 = gt(e2, "open", (function() {
            s2.onopen(), t2 && t2();
          })), i2 = (e3) => {
            this.cleanup(), this._readyState = "closed", this.emitReserved("error", e3), t2 ? t2(e3) : this.maybeReconnectOnOpen();
          }, r2 = gt(e2, "error", i2);
          if (false !== this._timeout) {
            const t3 = this._timeout, s3 = this.setTimeoutFn((() => {
              n2(), i2(new Error("timeout")), e2.close();
            }), t3);
            this.opts.autoUnref && s3.unref(), this.subs.push((() => {
              this.clearTimeoutFn(s3);
            }));
          }
          return this.subs.push(n2), this.subs.push(r2), this;
        }
        connect(t2) {
          return this.open(t2);
        }
        onopen() {
          this.cleanup(), this._readyState = "open", this.emitReserved("open");
          const t2 = this.engine;
          this.subs.push(gt(t2, "ping", this.onping.bind(this)), gt(t2, "data", this.ondata.bind(this)), gt(t2, "error", this.onerror.bind(this)), gt(t2, "close", this.onclose.bind(this)), gt(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        onping() {
          this.emitReserved("ping");
        }
        ondata(t2) {
          try {
            this.decoder.add(t2);
          } catch (t3) {
            this.onclose("parse error", t3);
          }
        }
        ondecoded(t2) {
          K((() => {
            this.emitReserved("packet", t2);
          }), this.setTimeoutFn);
        }
        onerror(t2) {
          this.emitReserved("error", t2);
        }
        socket(t2, e2) {
          let s2 = this.nsps[t2];
          return s2 ? this._autoConnect && !s2.active && s2.connect() : (s2 = new bt(this, t2, e2), this.nsps[t2] = s2), s2;
        }
        _destroy(t2) {
          const e2 = Object.keys(this.nsps);
          for (const t3 of e2) {
            if (this.nsps[t3].active) return;
          }
          this._close();
        }
        _packet(t2) {
          const e2 = this.encoder.encode(t2);
          for (let s2 = 0; s2 < e2.length; s2++) this.engine.write(e2[s2], t2.options);
        }
        cleanup() {
          this.subs.forEach(((t2) => t2())), this.subs.length = 0, this.decoder.destroy();
        }
        _close() {
          this.skipReconnect = true, this._reconnecting = false, this.onclose("forced close"), this.engine && this.engine.close();
        }
        disconnect() {
          return this._close();
        }
        onclose(t2, e2) {
          this.cleanup(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", t2, e2), this._reconnection && !this.skipReconnect && this.reconnect();
        }
        reconnect() {
          if (this._reconnecting || this.skipReconnect) return this;
          const t2 = this;
          if (this.backoff.attempts >= this._reconnectionAttempts) this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = false;
          else {
            const e2 = this.backoff.duration();
            this._reconnecting = true;
            const s2 = this.setTimeoutFn((() => {
              t2.skipReconnect || (this.emitReserved("reconnect_attempt", t2.backoff.attempts), t2.skipReconnect || t2.open(((e3) => {
                e3 ? (t2._reconnecting = false, t2.reconnect(), this.emitReserved("reconnect_error", e3)) : t2.onreconnect();
              })));
            }), e2);
            this.opts.autoUnref && s2.unref(), this.subs.push((() => {
              this.clearTimeoutFn(s2);
            }));
          }
        }
        onreconnect() {
          const t2 = this.backoff.attempts;
          this._reconnecting = false, this.backoff.reset(), this.emitReserved("reconnect", t2);
        }
      };
      kt = {};
      Object.assign(_t, { Manager: vt, Socket: bt, io: _t, connect: _t });
    }
  });

  // web/js/modules/api.js
  var API_BASE_URL = "https://davcenter.servequake.com/app";
  async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const finalOptions = {
      ...options,
      headers,
      cache: "no-store"
      // Siempre pedir datos frescos
    };
    const finalUrl = `${API_BASE_URL}${endpoint}`;
    try {
      console.log(`[API Fetch LOG] Enviando petici\xF3n a: ${finalUrl}`);
      const response = await fetch(finalUrl, finalOptions);
      const responseText = await response.text();
      if (!response.ok) {
        console.error(`[API Fetch ERROR] Respuesta no-OK (${response.status}) para ${endpoint}. Texto:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(errorJson.message || `Error del servidor: ${response.status}`);
        } catch (e2) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }
      try {
        if (responseText === "") {
          return { success: true };
        }
        return JSON.parse(responseText);
      } catch (e2) {
        console.error(`[API Fetch ERROR] La respuesta para ${endpoint} no era un JSON v\xE1lido, aunque el estado era OK. Texto:`, responseText);
        throw new Error("La respuesta del servidor no ten\xEDa el formato esperado.");
      }
    } catch (error) {
      console.error(`[API Fetch NETWORK ERROR] Error de red para ${endpoint}:`, error);
      throw error;
    }
  }
  var ChatCache = {
    // Guarda los mensajes de un chat específico
    set: (myId, partnerId, messages) => {
      const key = `chat_cache_${myId}_${partnerId}`;
      localStorage.setItem(key, JSON.stringify(messages.slice(-200)));
    },
    // Recupera los mensajes del disco
    get: (myId, partnerId) => {
      const key = `chat_cache_${myId}_${partnerId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  };

  // web/js/modules/utils.js
  function getFullImageUrl(pathOrUrl) {
    if (!pathOrUrl) {
      return "./assets/img/default-avatar.png";
    }
    if (pathOrUrl.startsWith("http")) {
      return pathOrUrl;
    }
    return `${API_BASE_URL}${pathOrUrl}`;
  }
  function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const secondsAgo = Math.round((now - date) / 1e3);
    const minutesAgo = Math.round(secondsAgo / 60);
    const hoursAgo = Math.round(minutesAgo / 60);
    if (secondsAgo < 60) return `Hace ${secondsAgo}s`;
    if (minutesAgo < 60) return `Hace ${minutesAgo}m`;
    if (hoursAgo < 24) return `Hace ${hoursAgo}h`;
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  }
  function formatMessageTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString(navigator.language, {
      hour: "numeric",
      minute: "2-digit"
    });
  }
  function formatDateSeparator(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((nowStart - dateStart) / (1e3 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays > 1 && diffDays < 7) {
      return new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
    }
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(date);
  }

  // web/js/modules/controllers/chatController.js
  var FAV_ICONS = {
    add: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    remove: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#facc15"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  };
  function showToast(message, type = "success") {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
  async function initChatController(domElements, partnerId, currentUserId) {
    const elements = domElements;
    const otherUserId = partnerId;
    const loggedInUserId2 = currentUserId;
    const scrollBtn = document.getElementById("scroll-bottom-btn");
    const scrollBadge = document.getElementById("scroll-unread-badge");
    if (scrollBtn) {
      scrollBtn.onclick = () => {
        elements.messagesContainer.scrollTo({
          top: elements.messagesContainer.scrollHeight,
          behavior: "smooth"
        });
      };
    }
    let activeClone = null;
    let originalParent = null;
    let nextSibling = null;
    let timerInterval = null;
    let longPressTimer = null;
    let unreadScrollCount = 0;
    if (!otherUserId || !loggedInUserId2 || !elements.messagesContainer) return null;
    const chatState = { currentReplyToId: null, socket: null, roomName: null };
    const mediaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const media = entry.target;
          if (media.dataset.src) {
            media.src = media.dataset.src;
            media.removeAttribute("data-src");
            if (media.tagName === "VIDEO") {
              media.load();
              media.play().catch(() => {
              });
            }
          }
          mediaObserver.unobserve(media);
        }
      });
    }, {
      root: elements.messagesContainer,
      rootMargin: "200px 0px",
      // Carga 200px antes de que aparezca (para que no se vea el hueco)
      threshold: 0.01
    });
    const copyMessageText = (el) => {
      const text = el.querySelector("p")?.textContent;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          console.log("Copiado al portapapeles");
        }).catch((err) => console.error("Error al copiar:", err));
      }
    };
    const addToCache = (message) => {
      const cached = ChatCache.get(loggedInUserId2, otherUserId) || [];
      if (cached.some((m2) => String(m2.message_id) === String(message.message_id))) return;
      const messageToStore = {
        ...message,
        is_read: true
      };
      cached.push(messageToStore);
      ChatCache.set(loggedInUserId2, otherUserId, cached.slice(-200));
    };
    const appendMessage = (message, shouldScroll = true) => {
      if (document.getElementById(`msg-${message.message_id}`)) return;
      const previousLast = elements.messagesContainer.querySelector(".message-bubble:last-child");
      const messageNode = createQuickMessageNode(message, shouldScroll);
      elements.messagesContainer.appendChild(messageNode);
      if (previousLast) {
        previousLast.className = previousLast.className.replace(/single|start-group|middle-group|end-group/g, "").trim();
        previousLast.classList.add(getGroupClassFor(previousLast));
      }
      messageNode.classList.add(getGroupClassFor(messageNode));
      if (!String(message.message_id).startsWith("temp-")) {
        addToCache(message);
      }
      if (shouldScroll) {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
      }
    };
    const getGroupClassFor = (messageEl) => {
      const timeThreshold = 6e4;
      const senderId = messageEl.dataset.senderId;
      const timestamp = new Date(messageEl.dataset.timestamp);
      let prev = messageEl.previousElementSibling;
      while (prev && !prev.classList.contains("message-bubble")) prev = prev.previousElementSibling;
      let next = messageEl.nextElementSibling;
      while (next && !next.classList.contains("message-bubble")) next = next.nextElementSibling;
      const isStart = !prev || prev.dataset.senderId !== senderId || timestamp - new Date(prev.dataset.timestamp) > timeThreshold;
      const isEnd = !next || next.dataset.senderId !== senderId || new Date(next.dataset.timestamp) - timestamp > timeThreshold;
      if (isStart && isEnd) return "single";
      if (isStart) return "start-group";
      if (isEnd) return "end-group";
      return "middle-group";
    };
    const scrollToMessage = (messageId) => {
      const target = document.getElementById(messageId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("highlighted");
        setTimeout(() => target.classList.remove("highlighted"), 2e3);
      }
    };
    const enterReplyMode = (messageId, username, content, mediaUrl = null) => {
      chatState.currentReplyToId = messageId;
      elements.replyToUser.textContent = username;
      elements.replySnippet.textContent = content;
      const prevMedia = elements.replyContextBar.querySelector(".reply-media-preview");
      if (prevMedia) prevMedia.remove();
      if (mediaUrl) {
        const isVideo = mediaUrl.toLowerCase().endsWith(".mp4");
        const thumb = document.createElement(isVideo ? "video" : "img");
        thumb.src = mediaUrl;
        thumb.className = "reply-media-preview";
        if (isVideo) {
          thumb.muted = true;
          thumb.autoplay = true;
          thumb.loop = true;
          thumb.playsInline = true;
        }
        elements.replyContextBar.querySelector(".reply-preview").appendChild(thumb);
      }
      elements.replyContextBar.classList.add("visible");
      elements.chatInput.focus();
    };
    const cancelReplyMode = () => {
      chatState.currentReplyToId = null;
      elements.replyContextBar.classList.remove("visible");
    };
    function openContextMenu(messageElement) {
      if (!messageElement) return;
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
      messageElement.style.setProperty("--message-color", accentColor);
      activeClone = messageElement.cloneNode(true);
      const rect = messageElement.getBoundingClientRect();
      originalParent = messageElement.parentElement;
      nextSibling = messageElement.nextElementSibling;
      const isFloatingWindow = window.self !== window.top;
      if (isFloatingWindow) {
        activeClone.style.position = "fixed";
        activeClone.style.top = `${rect.top}px`;
      } else {
        activeClone.style.position = "fixed";
        activeClone.style.top = `${rect.top}px`;
        activeClone.style.left = `${rect.left}px`;
      }
      activeClone.style.zIndex = "100";
      activeClone.classList.add("context-active");
      messageElement.classList.add("context-hidden");
      document.body.appendChild(activeClone);
      const originalVid = messageElement.querySelector("video");
      const clonedVid = activeClone.querySelector("video");
      if (clonedVid) {
        if (originalVid) {
          clonedVid.src = originalVid.src || originalVid.dataset.src;
        }
        clonedVid.style.opacity = "1";
        clonedVid.muted = true;
        clonedVid.play().catch((err) => console.warn("Error al reproducir clon:", err));
      }
      const overlay = elements.contextMenuOverlay;
      const menu = elements.contextMenu;
      const replyBtn = elements.replyFromMenuBtn;
      const copyBtn = elements.copyBtn;
      const deleteBtn = elements.deleteBtn;
      const copyText = copyBtn.querySelector(".context-menu-text");
      const copyIcon = copyBtn.querySelector(".context-menu-icon");
      const isSticker = messageElement.classList.contains("is-sticker");
      if (isSticker) {
        const mediaEl = messageElement.querySelector(".sticker-render");
        const fullUrl = mediaEl.src;
        const relativeUrl = fullUrl.includes("/uploads") ? fullUrl.substring(fullUrl.indexOf("/uploads")) : fullUrl;
        const collectionsObj = JSON.parse(localStorage.getItem("stickerCollections")) || { "Favoritos": [] };
        const favoriteList = collectionsObj["Favoritos"] || [];
        const isAlreadyFav = favoriteList.some((url) => url === relativeUrl);
        copyText.innerText = isAlreadyFav ? "Quitar de favoritos" : "A\xF1adir a favoritos";
        copyIcon.innerHTML = isAlreadyFav ? FAV_ICONS.remove : FAV_ICONS.add;
        copyBtn.onclick = () => {
          let freshCols = JSON.parse(localStorage.getItem("stickerCollections")) || { "Favoritos": [] };
          if (!freshCols["Favoritos"]) freshCols["Favoritos"] = [];
          if (isAlreadyFav) {
            freshCols["Favoritos"] = freshCols["Favoritos"].filter((url) => url !== relativeUrl);
            showToast("Eliminado de favoritos", "info");
          } else {
            freshCols["Favoritos"].unshift(relativeUrl);
            showToast("A\xF1adido a favoritos");
          }
          localStorage.setItem("stickerCollections", JSON.stringify(freshCols));
          window.dispatchEvent(new CustomEvent("customStickersUpdated"));
          closeContextMenu();
        };
      } else {
        copyText.innerText = "Copiar";
        copyIcon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.3438 16.875H6.46875C5.79742 16.875 5.15359 16.6083 4.67889 16.1336C4.20418 15.6589 3.9375 15.0151 3.9375 14.3438V6.46875C3.9375 5.79742 4.20418 5.15359 4.67889 4.67889C5.15359 4.20418 5.79742 3.9375 6.46875 3.9375H14.3438C15.0151 3.9375 15.6589 4.20418 16.1336 4.67889C16.6083 5.15359 16.875 5.79742 16.875 6.46875V14.3438C16.875 15.0151 16.6083 15.6589 16.1336 16.1336C15.6589 16.6083 15.0151 16.875 14.3438 16.875Z"/><path d="M5.625 2.8125H13.9177C13.7426 2.31934 13.4193 1.89242 12.9921 1.59029C12.5648 1.28816 12.0545 1.12563 11.5312 1.125H3.65625C2.98492 1.125 2.34109 1.39168 1.86639 1.86639C1.39168 2.34109 1.125 2.98492 1.125 3.65625V11.5312C1.12563 12.0545 1.28816 12.5648 1.59029 12.9921C1.89242 13.4193 2.31934 13.7426 2.8125 13.9177V5.625C2.8125 4.87908 3.10882 4.16371 3.63626 3.63626C4.16371 3.10882 4.87908 2.8125 5.625 2.8125Z"/></svg>`;
        copyBtn.onclick = () => {
          copyMessageText(messageElement);
          closeContextMenu();
        };
      }
      if (!overlay || !menu) return;
      chatState.contextMenuTarget = messageElement;
      deleteBtn.style.display = messageElement.classList.contains("sent") ? "flex" : "none";
      overlay.classList.add("visible");
      const menuRect = menu.getBoundingClientRect();
      let menuTop = rect.bottom + 10;
      if (menuTop + menuRect.height > window.innerHeight) {
        menuTop = rect.top - menuRect.height - 10;
      }
      let menuLeft = rect.left + rect.width / 2 - menuRect.width / 2;
      if (menuLeft < 10) menuLeft = 10;
      if (menuLeft + menuRect.width > window.innerWidth - 10) {
        menuLeft = window.innerWidth - menuRect.width - 10;
      }
      menu.style.top = `${menuTop}px`;
      menu.style.left = `${menuLeft}px`;
      setTimeout(() => menu.classList.add("visible"), 0);
      replyBtn.onclick = () => {
        const isOwn = messageElement.classList.contains("sent");
        const username = isOwn ? "T\xFA" : elements.userUsername.textContent;
        const mediaEl = messageElement.querySelector(".sticker-render");
        const mediaUrl = mediaEl ? mediaEl.src || mediaEl.dataset.src : null;
        const content = messageElement.querySelector("p")?.textContent || (mediaUrl ? "Sticker" : "Mensaje");
        enterReplyMode(messageElement.id.replace("msg-", ""), username, content, mediaUrl);
        closeContextMenu();
      };
      deleteBtn.onclick = () => {
        deleteMessage(messageElement.id.replace("msg-", ""));
        closeContextMenu();
      };
      overlay.onclick = closeContextMenu;
    }
    function closeContextMenu() {
      const overlay = elements.contextMenuOverlay;
      const menu = elements.contextMenu;
      if (!overlay || !menu) return;
      if (activeClone) {
        activeClone.remove();
        activeClone = null;
      }
      if (chatState.contextMenuTarget) {
        chatState.contextMenuTarget.classList.remove("context-hidden");
      }
      overlay.classList.remove("visible");
      menu.classList.remove("visible");
      chatState.contextMenuTarget = null;
      originalParent = null;
      nextSibling = null;
    }
    const addInteractionHandlers = (messageElement) => {
      let startX = 0, deltaX = 0, longPressTimer2;
      const swipeThreshold = 80;
      messageElement.addEventListener("touchstart", (e2) => {
        startX = e2.touches[0].clientX;
        deltaX = 0;
        messageElement.style.transition = "transform 0.1s ease-out";
        longPressTimer2 = setTimeout(() => {
          openContextMenu(messageElement);
        }, 500);
      }, { passive: false });
      messageElement.addEventListener("touchmove", (e2) => {
        clearTimeout(longPressTimer2);
        deltaX = e2.touches[0].clientX - startX;
        if (deltaX > 0) {
          const pullDistance = Math.min(deltaX, swipeThreshold + 40);
          messageElement.style.transform = `translateX(${pullDistance}px)`;
        }
      }, { passive: true });
      messageElement.addEventListener("touchend", () => {
        clearTimeout(longPressTimer2);
        messageElement.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        if (deltaX > 80) {
          const username = messageElement.classList.contains("sent") ? "T\xFA" : elements.userUsername.textContent;
          const mediaEl = messageElement.querySelector(".sticker-render");
          const mediaUrl = mediaEl ? mediaEl.src : null;
          const content = messageElement.querySelector("p")?.textContent || (mediaUrl ? "Sticker" : "Mensaje");
          enterReplyMode(messageElement.id.replace("msg-", ""), username, content, mediaUrl);
        }
        messageElement.style.transform = "translateX(0)";
        deltaX = 0;
      });
    };
    const sendMessage = (messageData) => {
      if (!chatState.socket || !chatState.socket.connected) {
        console.error("Socket desconectado");
        return;
      }
      const tempId = messageData.message_id || `temp-${Date.now()}`;
      let parentContent = null;
      let parentUsername = null;
      if (chatState.currentReplyToId) {
        const parentEl = document.getElementById(`msg-${chatState.currentReplyToId}`);
        if (parentEl) {
          parentUsername = parentEl.classList.contains("sent") ? "T\xFA" : elements.userUsername.textContent;
          const p2 = parentEl.querySelector("p");
          const media = parentEl.querySelector(".sticker-render");
          parentContent = p2 ? p2.textContent : media ? media.src : "Sticker";
        }
      }
      const fullMessageData = {
        ...messageData,
        message_id: tempId,
        receiver_id: parseInt(otherUserId),
        roomName: chatState.roomName,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        // <--- AHORA SÍ LLEVA HORA
        parent_message_id: chatState.currentReplyToId,
        parent_username: parentUsername,
        parent_content: parentContent
      };
      chatState.socket.emit("send_message", fullMessageData);
      appendMessage(fullMessageData, true);
      cancelReplyMode();
    };
    const deleteMessage = async (messageId) => {
      elements.deleteConfirmModal.style.display = "flex";
      const confirmBtn = elements.confirmDeleteBtn;
      const cancelBtn = elements.cancelDeleteBtn;
      const handleConfirm = async () => {
        elements.deleteConfirmModal.style.display = "none";
        try {
          const res = await apiFetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
          if (res.success) {
            removeMessageFromDOM(messageId);
          }
        } catch (e2) {
          console.error("Error al borrar:", e2);
        }
        cleanup();
      };
      const cleanup = () => {
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        elements.deleteConfirmModal.style.display = "none";
      };
      confirmBtn.onclick = handleConfirm;
      cancelBtn.onclick = () => cleanup();
    };
    const removeMessageFromDOM = (messageId) => {
      const el = document.getElementById(`msg-${messageId}`);
      if (!el) return;
      el.style.transition = "all 0.3s ease";
      el.style.opacity = "0";
      el.style.transform = "scale(0.8)";
      setTimeout(() => {
        el.remove();
        elements.messagesContainer.querySelectorAll(".message-bubble").forEach((m2) => {
          m2.className = m2.className.replace(/single|start-group|middle-group|end-group/g, "").trim();
          m2.classList.add(getGroupClassFor(m2));
        });
      }, 300);
    };
    const createQuickMessageNode = (message, shouldScroll = false) => {
      const isOwn = String(message.sender_id) === String(loggedInUserId2);
      const msgId = String(message.message_id || "");
      const isPending = msgId.startsWith("temp-");
      const messageDiv = document.createElement("div");
      messageDiv.id = `msg-${msgId}`;
      messageDiv.className = `message-bubble ${isOwn ? "sent" : "received"} ${isPending ? "pending" : ""}`;
      messageDiv.dataset.senderId = message.sender_id;
      messageDiv.dataset.timestamp = message.created_at;
      if (message.parent_message_id) {
        const replyLink = document.createElement("a");
        replyLink.className = "replied-to-snippet";
        replyLink.href = "#";
        const parentContent = message.parent_content || "";
        const isParentMedia = parentContent.startsWith("http");
        let displayLabel = parentContent;
        let mediaTagHTML = "";
        if (isParentMedia) {
          displayLabel = parentContent.includes("stickers") || parentContent.includes("giphy") ? "Sticker" : "Imagen";
          if (parentContent.toLowerCase().endsWith(".mp4")) {
            mediaTagHTML = `<video src="${parentContent}" class="replied-media-thumb" muted playsinline autoplay loop></video>`;
          } else {
            mediaTagHTML = `<img src="${parentContent}" class="replied-media-thumb">`;
          }
        }
        replyLink.innerHTML = `
    <span class="replied-user">${message.parent_username || "Usuario"}</span>
    <div class="replied-text-with-media">
        ${mediaTagHTML}
        <span class="replied-text">${displayLabel}</span>
    </div>`;
        replyLink.onclick = (e2) => {
          e2.preventDefault();
          scrollToMessage(`msg-${message.parent_message_id}`);
        };
        messageDiv.appendChild(replyLink);
      }
      const mainContentWrapper = document.createElement("div");
      mainContentWrapper.className = "message-main-content";
      const content = message.content;
      const isSticker = content.includes("/uploads/stickers") || content.includes("giphy.com");
      const isVideo = content.toLowerCase().endsWith(".mp4");
      if (isSticker) {
        messageDiv.classList.add("is-sticker");
        const stickerContainer = document.createElement("div");
        stickerContainer.className = "sticker-container";
        if (isVideo) {
          const vid = document.createElement("video");
          vid.className = "sticker-render video-sticker";
          vid.dataset.src = content;
          vid.muted = vid.loop = true;
          vid.setAttribute("playsinline", "");
          vid.setAttribute("preload", "metadata");
          const soundIndicator = document.createElement("div");
          soundIndicator.className = "video-sound-indicator is-muted";
          soundIndicator.style.display = "none";
          soundIndicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <!-- Cuerpo del altavoz -->
                    <path d="M11 5L6 9H2V15H6L11 19V5Z"></path>
                    <!-- Onda 1 (Peque\xF1a) -->
                    <path class="sound-wave sound-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <!-- Onda 2 (Grande) -->
                    <path class="sound-wave sound-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>`;
          vid.onloadeddata = () => {
            setTimeout(() => {
              const hasAudio = vid.webkitAudioDecodedByteCount > 0 || vid.audioTracks?.length > 0 || vid.mozHasAudio;
              if (hasAudio) {
                soundIndicator.style.display = "flex";
                soundIndicator.style.opacity = "1";
                stickerContainer.dataset.hasAudio = "true";
              }
            }, 300);
            if (shouldScroll) elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
          };
          vid.onclick = (e2) => {
            e2.stopPropagation();
            document.querySelectorAll("video.video-sticker").forEach((otherVid) => {
              if (otherVid !== vid) {
                otherVid.muted = true;
                const otherContainer = otherVid.closest(".sticker-container");
                if (otherContainer && otherContainer.dataset.hasAudio === "true") {
                  const otherIcon = otherContainer.querySelector(".video-sound-indicator");
                  if (otherIcon) {
                    otherIcon.classList.add("is-muted");
                    otherIcon.classList.remove("is-playing");
                    otherIcon.style.opacity = "1";
                  }
                }
              }
            });
            vid.muted = !vid.muted;
            if (vid.muted) {
              soundIndicator.classList.add("is-muted");
              soundIndicator.classList.remove("is-playing");
              soundIndicator.style.opacity = "1";
            } else {
              soundIndicator.classList.remove("is-muted");
              soundIndicator.classList.add("is-playing");
              soundIndicator.style.opacity = "0.9";
            }
            if (vid.paused) vid.play();
          };
          mediaObserver.observe(vid);
          stickerContainer.appendChild(vid);
          stickerContainer.appendChild(soundIndicator);
        } else {
          const img = document.createElement("img");
          img.dataset.src = content;
          img.className = "sticker-render";
          img.loading = "lazy";
          mediaObserver.observe(img);
          stickerContainer.appendChild(img);
        }
        mainContentWrapper.appendChild(stickerContainer);
      } else {
        const p2 = document.createElement("p");
        p2.textContent = content;
        mainContentWrapper.appendChild(p2);
      }
      const timestampSpan = document.createElement("span");
      timestampSpan.className = "message-timestamp";
      if (isPending) {
        timestampSpan.innerHTML = "\u{1F552}";
      } else {
        timestampSpan.innerHTML = formatMessageTime(message.created_at);
      }
      mainContentWrapper.appendChild(timestampSpan);
      messageDiv.appendChild(mainContentWrapper);
      addInteractionHandlers(messageDiv);
      return messageDiv;
    };
    function renderMessagesList(messages, shouldScroll = true) {
      if (!messages) return;
      const oldScrollHeight = elements.messagesContainer.scrollHeight;
      const oldScrollTop = elements.messagesContainer.scrollTop;
      const fragment = document.createDocumentFragment();
      let lastDate = null;
      let dividerAdded = false;
      const unreads = messages.filter((m2) => String(m2.sender_id) === String(otherUserId) && m2.is_read === false);
      messages.forEach((message) => {
        const mDate = new Date(message.created_at).toDateString();
        if (mDate !== lastDate) {
          const sep = document.createElement("div");
          sep.className = "date-separator";
          sep.innerHTML = `<span>${formatDateSeparator(message.created_at)}</span>`;
          fragment.appendChild(sep);
          lastDate = mDate;
        }
        if (!dividerAdded && unreads.length > 0 && String(message.message_id) === String(unreads[0].message_id)) {
          const unreadDiv = document.createElement("div");
          unreadDiv.className = "unread-divider";
          unreadDiv.innerHTML = `<span>${unreads.length} Mensajes nuevos</span>`;
          fragment.appendChild(unreadDiv);
          dividerAdded = true;
        }
        fragment.appendChild(createQuickMessageNode(message));
      });
      elements.messagesContainer.innerHTML = "";
      elements.messagesContainer.appendChild(fragment);
      const allBubbles = elements.messagesContainer.querySelectorAll(".message-bubble");
      allBubbles.forEach((bubble) => {
        bubble.classList.remove("single", "start-group", "middle-group", "end-group");
        bubble.classList.add(getGroupClassFor(bubble));
      });
      if (shouldScroll) {
        const divider = elements.messagesContainer.querySelector(".unread-divider");
        if (divider) {
          divider.scrollIntoView({ behavior: "auto", block: "start" });
        } else {
          elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }
      } else {
        const newScrollHeight = elements.messagesContainer.scrollHeight;
        elements.messagesContainer.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
      }
    }
    const fetchChatHistory = async () => {
      const loader = document.createElement("div");
      loader.className = "chat-loading-screen";
      loader.innerHTML = `<div class="chat-spinner"></div><span style="font-size: 10px; opacity: 0.5;">Sincronizando...</span>`;
      elements.messagesContainer.parentElement.appendChild(loader);
      try {
        const cached = ChatCache.get(loggedInUserId2, otherUserId) || [];
        if (cached.length > 0) {
          renderMessagesList(cached, true);
        }
        const [profileRes, historyRes] = await Promise.all([
          apiFetch(`/api/user/profile/${otherUserId}`),
          apiFetch(`/api/chat/history/${otherUserId}`)
        ]);
        if (profileRes.success && profileRes.data) {
          const partnerUser = profileRes.data;
          elements.userAvatar.src = getFullImageUrl(partnerUser.profile_pic_url);
          elements.userUsername.textContent = partnerUser.username;
        }
        const serverMessages = historyRes.messages;
        const serverUnreads = serverMessages.filter(
          (m2) => String(m2.sender_id) === String(otherUserId) && m2.is_read === false
        );
        const lastCachedId = cached.length > 0 ? String(cached[cached.length - 1].message_id) : null;
        const lastServerId = serverMessages.length > 0 ? String(serverMessages[serverMessages.length - 1].message_id) : null;
        const hasDividerInUI = !!elements.messagesContainer.querySelector(".unread-divider");
        if (serverUnreads.length > 0 && !hasDividerInUI) {
          renderMessagesList(serverMessages, true);
        } else if (lastCachedId === lastServerId) {
          if (serverMessages.length > cached.length) renderMessagesList(serverMessages, false);
        } else {
          renderMessagesList(serverMessages, true);
        }
        const messagesToCache = serverMessages.map((m2) => ({
          ...m2,
          is_read: true
          // Forzamos a que en el disco del móvil aparezcan como leídos
        }));
        ChatCache.set(loggedInUserId2, otherUserId, messagesToCache);
        if (serverUnreads.length > 0) {
          apiFetch(`/api/chat/read-all/${otherUserId}`, { method: "POST" });
        }
        setTimeout(() => {
          loader.style.opacity = "0";
          setTimeout(() => loader.remove(), 400);
          elements.messagesContainer.classList.add("ready");
        }, 300);
      } catch (e2) {
        console.error(e2);
        loader.remove();
        elements.messagesContainer.classList.add("ready");
      }
    };
    try {
      const { default: io } = await Promise.resolve().then(() => (init_socket_io_esm_min(), socket_io_esm_min_exports));
      chatState.socket = io(API_BASE_URL.replace("/app", ""), { path: "/app/socket.io/" });
      chatState.roomName = [loggedInUserId2, parseInt(otherUserId)].sort().join("-");
      chatState.socket.on("connect", () => {
        chatState.socket.emit("authenticate", localStorage.getItem("authToken"));
        chatState.socket.emit("join_room", chatState.roomName);
      });
      chatState.socket.on("receive_message", (msg) => {
        if (String(msg.sender_id) === String(otherUserId)) {
          const container = elements.messagesContainer;
          const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          appendMessage(msg, isAtBottom);
          if (scrollBtn && !isAtBottom) {
            unreadScrollCount++;
            if (scrollBadge) {
              scrollBadge.innerText = unreadScrollCount;
              scrollBadge.style.display = "flex";
            }
          }
          apiFetch(`/api/chat/read-all/${otherUserId}`, { method: "POST" });
        }
      });
      chatState.socket.on("message_confirmed", ({ tempId, realMessage }) => {
        const tempEl = document.getElementById(`msg-${tempId}`);
        if (tempEl) {
          tempEl.id = `msg-${realMessage.message_id}`;
          tempEl.classList.remove("pending");
          const ts = tempEl.querySelector(".message-timestamp");
          if (ts) {
            ts.innerHTML = formatMessageTime(realMessage.created_at);
          }
          addToCache(realMessage);
        }
      });
      chatState.socket.on("message_deleted", ({ messageId }) => {
        console.log("\u{1F5D1}\uFE0F Socket: Mensaje eliminado por el otro usuario:", messageId);
        removeMessageFromDOM(messageId);
      });
      if (elements.chatForm) {
        elements.chatForm.onsubmit = (e2) => {
          e2.preventDefault();
          const content = elements.chatInput.value.trim();
          if (content) {
            const tempId = `temp-${Date.now()}`;
            const data = {
              message_id: tempId,
              sender_id: loggedInUserId2,
              receiver_id: otherUserId,
              content,
              roomName: chatState.roomName,
              parent_message_id: chatState.currentReplyToId,
              created_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            sendMessage(data);
            elements.chatInput.value = "";
          }
        };
      }
      if (elements.cancelReplyBtn) {
        elements.cancelReplyBtn.addEventListener("click", cancelReplyMode);
      }
      elements.messagesContainer.onscroll = () => {
        const seps = Array.from(elements.messagesContainer.querySelectorAll(".date-separator"));
        let active = null;
        const top = elements.messagesContainer.getBoundingClientRect().top;
        seps.forEach((s2) => {
          if (s2.getBoundingClientRect().top < top + 50) active = s2.querySelector("span")?.textContent;
        });
        if (active && elements.stickyHeader) {
          elements.stickyHeaderText.textContent = active;
          elements.stickyHeader.classList.add("visible");
          clearTimeout(timerInterval);
          timerInterval = setTimeout(() => elements.stickyHeader.classList.remove("visible"), 1500);
        }
        if (scrollBtn) {
          const container = elements.messagesContainer;
          const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          if (isAtBottom) {
            scrollBtn.classList.remove("visible");
            setTimeout(() => {
              if (!scrollBtn.classList.contains("visible")) scrollBtn.style.display = "none";
            }, 300);
            unreadScrollCount = 0;
            if (scrollBadge) scrollBadge.style.display = "none";
          } else {
            scrollBtn.style.display = "flex";
            setTimeout(() => scrollBtn.classList.add("visible"), 10);
          }
        }
      };
      await fetchChatHistory();
      return {
        sendMessage
      };
    } catch (e2) {
      console.error("Error init:", e2);
      return null;
    }
  }

  // web/js/floating_content.js
  var loggedInUserId = null;
  var currentPackageName = null;
  var appDataCache = /* @__PURE__ */ new Map();
  async function getAppData(packageName) {
    if (!packageName) return null;
    if (appDataCache.has(packageName)) return appDataCache.get(packageName);
    try {
      const data = await apiFetch(`/api/apps/${packageName}`);
      console.log("Respuesta de la API para " + packageName + ":", data);
      if (data.found) {
        const appData = { name: data.app.app_name, icon: data.app.icon_url, is_game: data.app.is_game };
        appDataCache.set(packageName, appData);
        return appData;
      } else {
        appDataCache.set(packageName, null);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener datos de la app para ${packageName}:`, error);
      return null;
    }
  }
  function renderProfile(user) {
    const avatarEl = document.getElementById("user-avatar");
    const usernameEl = document.getElementById("user-username");
    if (avatarEl && usernameEl && user) {
      avatarEl.src = getFullImageUrl(user.profile_pic_url);
      usernameEl.textContent = user.username;
    }
  }
  document.addEventListener("DOMContentLoaded", async () => {
    const closeBtn = document.getElementById("close-button");
    const mainViewHeader = document.querySelector("body > header");
    const mainViewContent = document.querySelector("body > main");
    const chatView = document.getElementById("chat-view");
    const backToMainViewBtn = document.getElementById("back-to-main-view-btn");
    const tabs = document.querySelectorAll(".nav-tab");
    const pages = document.querySelectorAll(".page-content");
    const chatListContainer = document.getElementById("chat-list-container");
    const registerSection = document.getElementById("registration-section");
    const registerInitialView = document.getElementById("register-initial-view");
    const registerFormView = document.getElementById("register-form-view");
    const registerBtn = document.getElementById("register-btn");
    const appNameInput = document.getElementById("register-app-name-input");
    const saveAppBtn = document.getElementById("save-app-btn");
    let socket;
    let isInteractingWithForm = false;
    function resetRegistrationForm() {
      if (!registerInitialView || !registerFormView || !appNameInput || !saveAppBtn) return;
      registerFormView.style.display = "none";
      registerInitialView.style.display = "block";
      appNameInput.value = "";
      saveAppBtn.disabled = false;
      saveAppBtn.textContent = "Guardar";
      isInteractingWithForm = false;
    }
    async function updateGameStatus({ appName, packageName }) {
      console.log(`[JS LOG] updateGameStatus llamado con: ${packageName}`);
      if (socket && socket.connected && packageName) {
        console.log(`[JS LOG] Emitiendo 'update_current_app' al backend con paquete: ${packageName}`);
        socket.emit("update_current_app", { package: packageName, name: appName });
      }
      if (isInteractingWithForm) {
        console.log("[JS LOG] UI Bloqueada: Interacci\xF3n en progreso. Se ignora la actualizaci\xF3n de UI.");
        return;
      }
      const gameInfoSection = document.getElementById("game-info");
      if (!gameInfoSection) return;
      const gameNameEl = document.getElementById("game-name");
      const gameIconEl = document.getElementById("game-icon");
      const classificationSection = document.getElementById("classification-section");
      const titleEl = gameInfoSection.querySelector(".section-title");
      if (!gameNameEl || !gameIconEl || !registerSection || !classificationSection || !titleEl) return;
      registerSection.style.display = "none";
      classificationSection.style.display = "none";
      currentPackageName = packageName;
      const appData = await getAppData(packageName);
      console.log("Datos de la App recibidos en updateGameStatus:", appData);
      if (appData) {
        titleEl.textContent = "Jugando ahora:";
        gameNameEl.textContent = appData.name;
        gameIconEl.src = getFullImageUrl(appData.icon) || "";
        gameIconEl.style.display = "block";
        gameInfoSection.style.display = "block";
        if (appData.is_game === null) {
          classificationSection.style.display = "block";
        }
      } else if (packageName) {
        titleEl.textContent = "Juego no registrado:";
        gameNameEl.textContent = packageName;
        gameIconEl.style.display = "none";
        resetRegistrationForm();
        registerSection.style.display = "block";
        gameInfoSection.style.display = "block";
      } else {
        gameInfoSection.style.display = "none";
      }
    }
    function applyThemeUpdate(theme) {
      console.log("FLOATING: Aplicando actualizaci\xF3n de tema completa:", theme);
      const root = document.documentElement;
      if (theme.bgColor) root.style.setProperty("--color-bg", theme.bgColor);
      if (theme.textColor) root.style.setProperty("--color-text", theme.textColor);
      if (theme.secondaryTextColor) root.style.setProperty("--text-secondary-color", theme.secondaryTextColor);
      if (theme.surfaceColor) root.style.setProperty("--color-surface", theme.surfaceColor);
      if (theme.accentColor) root.style.setProperty("--color-accent", theme.accentColor);
      if (theme.uiColor) root.style.setProperty("--color-ui", theme.uiColor);
      if (theme.borderColor) root.style.setProperty("--color-border", theme.borderColor);
    }
    const updateFriendStatusInUI = async (data) => {
      const { userId, isOnline, currentApp, currentAppPackage, currentAppIcon } = data;
      const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
      if (!friendItem) return;
      const statusDot = friendItem.querySelector(".status-dot");
      const statusText = friendItem.querySelector(".friend-status");
      let newStatusText = "Desconectado";
      let newStatusClass = "offline";
      let newStatusIconHTML = "";
      if (isOnline) {
        if (currentApp && currentAppPackage) {
          const appName = currentApp;
          const appIcon = currentAppIcon ? getFullImageUrl(currentAppIcon) : (await getAppData(currentAppPackage))?.icon;
          newStatusText = `Jugando a ${appName}`;
          newStatusClass = "playing";
          if (appIcon) {
            newStatusIconHTML = `<img src="${appIcon}" class="status-app-icon" alt="${appName}">`;
          }
        } else {
          newStatusText = "En l\xEDnea";
          newStatusClass = "online";
        }
      }
      statusDot.className = `status-dot ${newStatusClass}`;
      statusDot.innerHTML = newStatusIconHTML;
      statusText.textContent = newStatusText;
    };
    const renderChatList = (conversations, container) => {
      if (!conversations || conversations.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">No tienes chats recientes.</p>';
        return;
      }
      container.innerHTML = conversations.map((convo) => {
        const snippet = convo.last_message_content.length > 25 ? convo.last_message_content.substring(0, 25) + "..." : convo.last_message_content;
        return `<div class="chat-list-item" data-user-id="${convo.user_id}"><img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar"><div class="chat-list-content"><div class="chat-list-header"><span class="chat-list-username">${convo.username}</span><span class="chat-list-time">${formatTimeAgo(convo.last_message_at)}</span></div><p class="chat-list-snippet">${snippet}</p></div></div>`;
      }).join("");
    };
    const renderFriends = async (friends, container) => {
      if (!friends || friends.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">A\xFAn no tienes amigos.</p>';
        return;
      }
      const friendItemsHTML = await Promise.all(friends.map(async (friend) => {
        let statusText = "Desconectado";
        let statusClass = "offline";
        let statusIconHTML = "";
        if (friend.is_online) {
          if (friend.current_app && friend.current_app_package) {
            const appData = await getAppData(friend.current_app_package);
            if (appData) {
              statusText = `Jugando a ${appData.name}`;
              statusClass = "playing";
              statusIconHTML = `<img src="${appData.icon}" class="status-app-icon" alt="${appData.name}">`;
            } else {
              statusText = `En ${friend.current_app}`;
              statusClass = "playing";
            }
          } else {
            statusText = "En l\xEDnea";
            statusClass = "online";
          }
        }
        return `<div class="friend-item" data-user-id="${friend.id}"><div class="friend-avatar-container"><img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}"><div class="status-dot ${statusClass}">${statusIconHTML}</div></div><div class="friend-info"><div class="friend-username">${friend.username}</div><div class="friend-status">${statusText}</div></div></div>`;
      }));
      container.innerHTML = friendItemsHTML.join("");
    };
    const NativeBridge = {
      closeWindow: () => {
        NativeBridge.releaseWindowFocus();
        if (window.Android) Android.closeWindow();
        else window.parent.postMessage("closeWindow", "*");
      },
      reopenWindow: () => {
        if (window.Android) Android.reopenWindow();
        else location.reload();
      },
      requestWindowFocus: () => {
        if (window.Android) Android.requestWindowFocus();
        else console.log("DEBUG: Solicitando foco (simulado).");
      },
      releaseWindowFocus: () => {
        if (window.Android) Android.releaseWindowFocus();
        else console.log("DEBUG: Liberando foco (simulado).");
      },
      jsReady: () => {
        if (window.Android) Android.jsReady();
        else window.parent.postMessage("jsReady", "*");
      },
      getAuthToken: async () => {
        if (window.Android) return await Android.getAuthToken();
        else return localStorage.getItem("authToken");
      }
    };
    window.updateGameInfo = updateGameStatus;
    window.applyThemeUpdate = applyThemeUpdate;
    if (closeBtn) closeBtn.addEventListener("click", () => NativeBridge.closeWindow());
    NativeBridge.jsReady();
    async function openChatView(userId, username, avatarUrl) {
      mainViewHeader.style.display = "none";
      mainViewContent.style.display = "none";
      chatView.style.display = "flex";
      NativeBridge.requestWindowFocus();
      const domElements = {
        messagesContainer: document.getElementById("chat-messages-container"),
        userAvatar: document.getElementById("chat-partner-avatar"),
        userUsername: document.getElementById("chat-partner-username"),
        chatForm: document.getElementById("chat-form"),
        chatInput: document.getElementById("chat-message-input"),
        replyContextBar: document.getElementById("reply-context-bar"),
        replyToUser: document.getElementById("reply-to-user"),
        replySnippet: document.getElementById("reply-snippet"),
        cancelReplyBtn: document.getElementById("cancel-reply-btn"),
        contextMenuOverlay: document.getElementById("context-menu-overlay"),
        contextMenu: document.getElementById("context-menu"),
        replyFromMenuBtn: document.getElementById("reply-from-menu-btn"),
        copyBtn: document.getElementById("copy-btn"),
        deleteBtn: document.getElementById("delete-from-menu-btn"),
        stickyHeader: document.getElementById("sticky-date-header"),
        stickyHeaderText: document.getElementById("sticky-date-header")?.querySelector("span"),
        deleteConfirmModal: document.getElementById("delete-confirm-modal"),
        cancelDeleteBtn: document.getElementById("cancel-delete-btn"),
        confirmDeleteBtn: document.getElementById("confirm-delete-btn")
      };
      domElements.userAvatar.src = avatarUrl;
      domElements.userUsername.textContent = username;
      await initChatController(domElements, userId, loggedInUserId);
    }
    function closeChatView() {
      mainViewHeader.style.display = "flex";
      mainViewContent.style.display = "block";
      chatView.style.display = "none";
      NativeBridge.releaseWindowFocus();
    }
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      const { type, data } = event.data;
      if (type === "updateGameInfo" && window.updateGameInfo) {
        window.updateGameInfo(data);
      } else if (type === "applyThemeUpdate" && window.applyThemeUpdate) {
        window.applyThemeUpdate(data);
      }
    });
    try {
      const token = await NativeBridge.getAuthToken();
      if (!token) throw new Error("Error de Autenticaci\xF3n");
      localStorage.setItem("authToken", token);
      const userResponse = await apiFetch("/api/user/me");
      if (!userResponse.success) throw new Error("No se pudieron obtener los datos del usuario.");
      loggedInUserId = userResponse.data.userId;
      renderProfile(userResponse.data);
      const friendsContainer = document.getElementById("friends-container");
      const friendsResponse = await apiFetch("/api/user/friends");
      if (friendsResponse.success) await renderFriends(friendsResponse.friends, friendsContainer);
      const { default: io } = await import("https://cdn.socket.io/4.7.5/socket.io.esm.min.js");
      socket = io(API_BASE_URL.replace("/app", ""), { path: "/app/socket.io/" });
      socket.on("connect", () => {
        console.log("[JS LOG] Socket conectado. Autenticando...");
        socket.emit("authenticate", token);
        console.log("[JS LOG] Notificando a la capa nativa que el JS y el Socket est\xE1n listos.");
        NativeBridge.jsReady();
      });
      socket.on("friend_status_update", (data) => updateFriendStatusInUI(data));
      tabs.forEach((tab) => {
        tab.addEventListener("click", async () => {
          const tabName = tab.dataset.tab;
          tabs.forEach((t2) => t2.classList.remove("active"));
          tab.classList.add("active");
          pages.forEach((p2) => p2.style.display = "none");
          const activePage = document.getElementById(`${tabName}-content`);
          if (activePage) activePage.style.display = "block";
          if (tabName === "chats" && !activePage.dataset.loaded) {
            chatListContainer.innerHTML = '<p class="friend-status" style="text-align: center;">Cargando chats...</p>';
            try {
              const chatResponse = await apiFetch("/api/chat/conversations");
              if (chatResponse.success) {
                renderChatList(chatResponse.conversations, chatListContainer);
                activePage.dataset.loaded = "true";
              }
            } catch (error) {
              chatListContainer.innerHTML = `<p class="friend-status" style="color: red;">${error.message}</p>`;
            }
          }
          resetRegistrationForm();
        });
      });
      chatListContainer.addEventListener("click", (e2) => {
        const chatItem = e2.target.closest(".chat-list-item");
        if (chatItem) {
          const userId = chatItem.dataset.userId;
          const username = chatItem.querySelector(".chat-list-username").textContent;
          const avatarUrl = chatItem.querySelector(".chat-list-avatar").src;
          openChatView(userId, username, avatarUrl);
        }
      });
      backToMainViewBtn.addEventListener("click", closeChatView);
      if (registerBtn) {
        registerBtn.addEventListener("click", () => {
          isInteractingWithForm = true;
          NativeBridge.requestWindowFocus();
          if (registerInitialView) registerInitialView.style.display = "none";
          if (registerFormView) registerFormView.style.display = "block";
          if (appNameInput) {
            setTimeout(() => appNameInput.focus(), 100);
          }
        });
      }
      if (saveAppBtn) {
        saveAppBtn.addEventListener("click", () => {
          const newAppName = appNameInput.value.trim();
          if (newAppName && currentPackageName) {
            saveAppBtn.disabled = true;
            saveAppBtn.textContent = "Guardando...";
            const appData = { packageName: currentPackageName, appName: newAppName };
            apiFetch("/api/apps/add", {
              method: "POST",
              body: JSON.stringify(appData)
            }).then((response) => {
              if (response.success) {
                NativeBridge.releaseWindowFocus();
                appDataCache.delete(currentPackageName);
                resetRegistrationForm();
                updateGameStatus({ packageName: currentPackageName, appName: newAppName });
              }
            }).catch((error) => {
              alert(`Error: ${error.message}`);
              NativeBridge.releaseWindowFocus();
              resetRegistrationForm();
            });
          }
        });
      }
      async function classifyApp(isGame) {
        if (!currentPackageName) return;
        const yesBtn = document.getElementById("classify-yes-btn");
        const noBtn = document.getElementById("classify-no-btn");
        if (yesBtn) yesBtn.disabled = true;
        if (noBtn) noBtn.disabled = true;
        try {
          await apiFetch("/api/apps/classify", {
            method: "POST",
            body: JSON.stringify({ packageName: currentPackageName, is_game: isGame })
          });
          appDataCache.delete(currentPackageName);
          await updateGameStatus({ packageName: currentPackageName, appName: "" });
        } catch (error) {
          alert(`Error al clasificar: ${error.message}`);
        } finally {
          if (yesBtn) yesBtn.disabled = false;
          if (noBtn) noBtn.disabled = false;
        }
      }
      const classifyYesBtn = document.getElementById("classify-yes-btn");
      const classifyNoBtn = document.getElementById("classify-no-btn");
      if (classifyYesBtn) classifyYesBtn.addEventListener("click", () => classifyApp(true));
      if (classifyNoBtn) classifyNoBtn.addEventListener("click", () => classifyApp(false));
    } catch (error) {
      document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
    NativeBridge.jsReady();
  });
})();
/*!
 * Socket.IO v4.7.5
 * (c) 2014-2024 Guillermo Rauch
 * Released under the MIT License.
 */
