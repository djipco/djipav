/**
 * EventEmitter Module
 *
 * This module is simply a refactoring of the great `eventemitter3` library created by primus
 * (https://github.com/primus/eventemitter3) The library was refactored as an ES6 module and cleaned
 * up a bit for my own purposes.
 *
 * @module eventemitter
 * @private
 */


/**
 * The `Listener` class represents a single event listener object. Such objects store the callback
 * (listener) function, the context to execute the function in (often `this`) and whether or not
 * the callback should only be executed once.
 *
 * @private
 */
class Listener {

  /**
   * Creates a `Listener` object which keeps track of the callback function to execute, the context
   * to execute it in and whether or not it is a single execution callback (a.k.a. `once`).
   *
   * @param {Function} callback The listener function
   * @param {*} context The context to invoke the listener in
   * @param {Boolean} [once=false] Whether the callback function should be executed only once
   */
  constructor(callback, context, once = false) {
    this.fn = callback;
    this.context = context;
    this.once = once === true || false;
  }

}

/**
 * The `EventEmitter` class provides methods to implement the observable design pattern. It is meant
 * to be extended on or mixed in to add methods such as `addListener()`, `removeListener()`,
 * `emit()`, etc.
 *
 * @private
 * @mixin
 */
export class EventEmitter {

  /**
   * Creates an `EventEmitter` instance
   */
  constructor() {
    this._events = {};
    this._eventsCount = 0;
  }

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function (i.e. callback)
   * @param {*} context The context to invoke the listener in.
   * @param {Boolean} once Specify if the listener is a one-time listener.
   * @returns {EventEmitter}
   */
  addListener(event, fn, context, once = false) {

    if (typeof fn !== "function") throw new TypeError("The listener must be a function");

    let listener = new Listener(fn, context || this, once);

    if (!this._events[event]) {
      this._events[event] = listener;
      this._eventsCount++;
    } else if (!this._events[event].fn) {
      this._events[event].push(listener);
    } else {
      this._events[event] = [this._events[event], listener];
    }

    return this;
  }

  /**
   * Clear event by name.
   *
   * @param {(String|Symbol)} event The Event name
   */
  clearEvent(event) {

    if (--this._eventsCount === 0) {
      this._events = {};
    } else {
      delete this._events[event];
    }

  }

  /**
   * Array of all the unique events for which the emitter has registered listeners.
   *
   * @type {Array}
   * @readonly
   */
  get eventNames() {
    let names = []
      , events
      , name;

    if (this._eventsCount === 0) return names;

    for (name in (events = this._events)) {
      if (Object.prototype.hasOwnProperty.call(events, name)) {
        names.push(name);
      }
    }

    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }

    return names;
  };

  /**
   * Return the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Array} The registered listeners.
   */
  getListeners(event) {

    let ee = [];
    let handlers = this._events[event];

    if (!handlers) return [];
    if (handlers.fn) return [handlers.fn];

    for (let i = 0; i < handlers.length; i++) {
      ee[i] = handlers[i].fn;
    }

    return ee;

  };

  /**
   * Return the number of listeners listening to a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Number} The number of listeners.
   */
  getListenerCount(event) {

    // let evt = PREFIX ? PREFIX + event : event;
    let listeners = this._events[event];

    if (!listeners) return 0;
    if (listeners.fn) return 1;
    return listeners.length;

  };

  /**
   * Calls each of the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Boolean} `true` if the event had listeners, else `false`.
   */
  emit(event, a1, a2, a3, a4, a5) {

    // let evt = PREFIX ? PREFIX + event : event;

    if (!this._events[event]) return false;

    let listeners = this._events[event]
      , len = arguments.length
      , args
      , i;

    if (listeners.fn) {

      if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

      switch (len) {
        case 1: return listeners.fn.call(listeners.context), true;
        case 2: return listeners.fn.call(listeners.context, a1), true;
        case 3: return listeners.fn.call(listeners.context, a1, a2), true;
        case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }

      for (i = 1, args = new Array(len -1); i < len; i++) {
        args[i - 1] = arguments[i];
      }

      listeners.fn.apply(listeners.context, args);

    } else {

      let length = listeners.length
        , j;

      for (i = 0; i < length; i++) {
        if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

        switch (len) {
          case 1: listeners[i].fn.call(listeners[i].context); break;
          case 2: listeners[i].fn.call(listeners[i].context, a1); break;
          case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
          case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
          default:
            if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
              args[j - 1] = arguments[j];
            }

            listeners[i].fn.apply(listeners[i].context, args);
        }
      }

    }

    return true;

  };

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} callback The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   *
   * @returns {EventEmitter} `this`
   */
  on(event, callback, context) {
    return this.addListener(event, callback, context, false);
  };

  /**
   * Add a one-time listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} callback The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   *
   * @returns {EventEmitter} `this`
   */
  once(event, callback, context) {
    return this.addListener(event, callback, context, true);
  };

  /**
   * Remove the listeners of a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {*} context Only remove the listeners that have this context.
   * @param {Boolean} once Only remove one-time listeners.
   *
   * @returns {EventEmitter} `this`
   */
  removeListener(event, fn, context, once) {

    let events = [];

    if (!this._events[event]) return this;
    if (!fn) {
      this.clearEvent(event);
      return this;
    }

    let listeners = this._events[event];

    if (listeners.fn) {
      if (
        listeners.fn === fn &&
        (!once || listeners.once) &&
        (!context || listeners.context === context)
      ) {
        this.clearEvent(event);
      }
    } else {
      for (let i = 0, events = [], length = listeners.length; i < length; i++) {
        if (
          listeners[i].fn !== fn ||
          (once && !listeners[i].once) ||
          (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }

      // Reset the array, or remove it completely if we have no more listeners.
      if (events.length) this._events[event] = events.length === 1 ? events[0] : events;
      else this.clearEvent(event);
    }

    return this;

  }

  /**
   * Remove all listeners, or those for the specified event (if present).
   *
   * @param {(String|Symbol)} [event] The event name.
   *
   * @returns {EventEmitter} `this`
   */
  removeAllListeners(event) {

    if (event) {
      if (this._events[event]) this.clearEvent(event);
    } else {
      this._events = {};
      this._eventsCount = 0;
    }

    return this;

  }

}







/**
 * @module djipav
 */
export class VideoInput extends EventEmitter {

  /**
   * Creates a new `VideoInput` object and attaches it to the specified `<video>` element for
   * viewing. If no `<video>` element is specified, the stream will not be visible. If the special
   * value `"create"` is used, a new `<video>` element is created and appended to the `<body>`. A
   * reference to the video element is accessible via the `video` property.
   *
   * By default, the first video input track will be used. To find a specific video input, a
   * [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
   * must be specified in the `constraints` parameter.
   *
   * @param {{}} [options]
   * @param {HTMLVideoElement|"create"} [options.element] The `<video>` element to attach the video
   * stream to. If none is supplied, the video feed will not be visible. If the special value
   * `"create"` is used, a new `<video>` element will be created and appended to the body.
   * @param {string} [options.elementId] The `id` attribute of the new `<video>` element (if a new
   * `<video>` element is created).
   */
  constructor(options = {}) {

    super();

    /**
     * An `ImageCapture` object used to grab frames per the ImageCapture API.
     * @type {ImageCapture}
     */
    this.capture = null;

    /**
     * The [constraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
     * which must be met by the video track. At the minimum, the value `true` is used which means
     * all input video streams.
     * @type {MediaTrackConstraints}
     */
    this.constraints = true;

    /**
     * The actual media stream that is currently being used.
     * @type {MediaStream}
     */
    this.stream = null;

    /**
     * An object containing the timeouts used throughout this class (mostly for internal use)
     * @type {Object}
     */
    this.timeouts = {};

    /**
     * The `<video>` element used to display the video feed (may be `null` if none is used)
     * @type {HTMLMediaElement}
     */
    this.video = this._parseAndBuildVideoElement(options);

  }

  /**
   * Properly destroys this object and all internal references. By calling this method when you are
   * done with this object, you insure there are no lingering listeners or processes.
   *
   * @returns {Promise<void>}
   */
  async destroy() {

    this.cancelFade();
    this.removeAllListeners();
    await this.stop();

    if (this.video && this.video.hasAttribute("data-djipav")) {
      this.video.parentNode.removeChild(this.video);
    }

    this.offScreenCanvas = null;

  }

  /**
   * Tries to find a video stream matching the specified constraints. If one is found, the stream is
   * attached to the `<video>` element specified upon construction of the `VideoInput` object (if
   * any).
   *
   * @param {Object} [options]
   * @param {boolean} [options.deviceId] The id of a specific device to connect to. Device IDs
   * can be viewed by calling the `getInputs()` method.
   * @param {boolean} [options.visible=true] Whether the `<video>` element should initially be
   * visible or not.
   * @param {MediaTrackConstraints} [options.constraints] The video constraints to apply when
   * looking for an input video track (see
   * [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
   * for more info).
   * @returns {Promise<void>}
   */
  async start(options = {}) {

    if (this.started) return;
    if (!navigator.mediaDevices) return Promise.reject("MediaDevices API not supported.");
    this.opacity = 0;

    if (options.constraints) this.constraints = options.constraints;

    // DO WE NEED TO DO SOMETHING WHEN NO STREAM IS FOUND?!

    this.stream = await navigator.mediaDevices.getUserMedia({
      deviceId: options.deviceId,
      video: this.constraints
    });

    if (!ImageCapture) return Promise.reject("ImageCapture API not supported.");
    this.capture = new ImageCapture(this.track);

    this.offScreenCanvas = new OffscreenCanvas(
      this.settings.width,
      this.settings.height
    );

    // The <video> element is not necessarily used.
    if (this.video) {

      this.video.srcObject = this.stream;

      await new Promise(resolve => {
        this.video.addEventListener("canplay", () => resolve());
      });

      await this.video.play();

      if (options.visible != false) await this.fadeIn(200);

    }

  }

  /**
   * Disconnects the video input and stops all associated tracks.
   *
   * @returns {Promise<void>}
   */
  async stop() {

    if (!this.started || !this.video || !this.video.srcObject) return;

    await this.fadeOut(200);
    this.video.pause();
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.capture = null;
    this.video.srcObject = null;
    this.video.src = "";

  }

  /**
   * Fades in the `<video>` element used to display the video feed.
   *
   * @param {number} [duration] Duration of the fade in (in milliseconds)
   * @returns {Promise<void>}
   */
  async fadeIn(duration = 5000) {
    await this.fade("in", duration);
  }

  /**
   * Fades out the `<video>` element used to display the video feed.
   *
   * @param {number} [duration] Duration of the fade out (in milliseconds)
   * @returns {Promise<void>}
   */
  async fadeOut(duration = 5000) {
    await this.fade("out", duration);
  }

  /**
   * Fades the `<video>` element in or out for the specified duration.
   *
   * @param {string} [type="in"] Type of fade ("in" or "out")
   * @param {number} [duration=5000] Duration of fade in milliseconds
   * @returns {Promise<void>}
   */
  async fade(type = "in", duration = 5000) {

    this.cancelFade();

    if (!this.video) return;

    this.video.style.transitionDuration = parseInt(duration) + "ms";
    this.opacity = type !== "in" ? 0 : 1;

    await new Promise(resolve => {

      this.timeouts.fadeOutTimeout = setTimeout(() => {
        if (type !== "in") {
          this.emit("fadeoutdone");
        } else {
          this.emit("fadeindone");
        }
        resolve();
      }, parseInt(duration));

    });

  }

  /**
   * Cancels any fade ins or fade outs that are currently ongoing.
   */
  cancelFade() {

    clearTimeout(this.timeouts.fadeOutTimeout);
    clearTimeout(this.timeouts.fadeInTimeout);
    this.timeouts.fadeOutTimeout = null;
    this.timeouts.fadeInTimeout = null;

    if (!this.video) return;

    let value = window.getComputedStyle(this.video).getPropertyValue("opacity");
    this.opacity = value;

    this.emit("fadecancelled");

  }

  /**
   * @private
   */
  _parseAndBuildVideoElement(options = {}) {

    if (options.element === "create") {
      let element = document.createElement("video");
      if (options.elementId) element.setAttribute("id", options.elementId);
      element.setAttribute("data-djipav", "true");
      document.body.append(element);
      return element;
    } else if (options.element) {
      return options.element;
    } else {
      return null;
    }

  }

  /**
   * A `MediaTrackCapabilities` object detailing the exact capabilities of the video track (or
   * `null` if no video track is currently open).
   * @type {MediaTrackCapabilities}
   */
  get capabilities() {
    if (!this.stream) return null;
    return this.stream.getVideoTracks()[0].getCapabilities();
  }

  /**
   * The opacity of the `<video>` element used to display the video stream (between 0 and 1).
   * @type {number}
   */
  get opacity() {
    if (!this.video) return null;
    return Number.parseFloat(this.video.style.opacity);
  }

  set opacity(value) {
    if (!this.video) return null;
    this.video.style.opacity = Number.parseFloat(value);
  }

  /**
   * A `MediaTrackSettings` object detailing the precise settings of the video track (or `null` if
   * no stream is open).
   * @type {MediaTrackSettings}
   */
  get settings() {
    if (!this.stream) return null;
    return this.track ? this.track.getSettings() : null;
  }

  /**
   * Whether or not the video input is currently started.
   * @type {boolean}
   */
  get started() {

    // We rely on the stream when the <video> element is not used.
    if (!this.video && !this.stream) {
      return false;
    } else if (!this.video && this.stream) {
      return true;
    }

    // If the <video> element is used, we use the recommended way.
    return this.video.currentTime > 0 &&
      !this.video.paused &&
      !this.video.ended &&
      this.video.readyState >= 2;

  }

  /**
   * The video track currently being used. This will be `null` if there are no active stream.
   * @type {MediaStreamTrack}
   */
  get track() {

    if (this.stream) {
      return this.stream.getVideoTracks()[0];
    } else {
      return null;
    }

  }

  // photograph(options = {}) {
  //
  //   if (!this.video) {
  //     throw "Need to implement ImageCapture API here!";
  //   }
  //
  //   let context = this.canvas.getContext("2d");
  //
  //   let flipX = options.flipX === true || false;
  //   let mimeType = options.mimeType || "image/jpeg";
  //   let quality = options.quality || 0.92;
  //   let format = options.format || "base64";    // base64 or url
  //
  //   context.save();
  //
  //   // If requested, flip the image along the x axis
  //   if (flipX) {
  //     context.translate(this.canvas.width, 0);
  //     context.scale(-1, 1);
  //   }
  //
  //   // Draw the snapshot/image onto the canvas.
  //   context.drawImage(
  //     this.video,
  //     0,
  //     0,
  //     this.canvas.width,
  //     this.canvas.height
  //   );
  //
  //   // Restore context to original settings (if flipped)
  //   context.restore();
  //
  //   // Return image in data "base64" or "url" format
  //   if (options.format === "url") {
  //     return this.canvas.toDataURL(mimeType, quality);
  //   } else {
  //     return this.canvas.toDataURL(mimeType, quality).replace(/^data:image\/\w+;base64,/, "");
  //   }
  //
  // }

  /**
   * Grabs a frame from the video stream and returns it in the specified data format.
   *
   * @param {{}} [options]
   * @param {string} [options.format="ImageBitmap"] The format to return the image data in. Can be:
   * "ImageBitmap" (default), "Blob" or "ObjectURL".
   * @param {string} [options.mimeType="image/png"] If the image is being returned as a `Blob`, you
   * can specify the MIME type of that blob. Typically, this will be "image/png" (default) or
   * "image/jpeg" but can also be any image MIME type supported by the environment.
   * @param {number} [options.quality] For certain MIME types such as `image/jpeg` or `image/webp`,
   * a quality parameter can be specified. This should be a float between 0 and 1.
   * @returns {Promise<(ImageBitmap|DOMString|Blob)>}
   */
  async grabFrame(options = {}) {

    let image = await this.capture.grabFrame();

    if (options.format === "Blob" || options.format === "ObjectURL") {

      let context = this.offScreenCanvas.getContext("2d");
      context.drawImage(image, 0, 0);

      let blob = await this.offScreenCanvas.convertToBlob({
        type: options.mimeType,
        quality: options.quality
      });

      if (options.format === "Blob") {
        return blob;
      } else {
        return URL.createObjectURL(blob);
      }

    } else {

      return image;

    }

  }

  async takePhoto(options = {}) {

    let blob = await this.capture.takePhoto(options);
    return URL.createObjectURL(blob);

  }

}







export class AudioInput extends EventEmitter {

  constructor() {

    super();

    this.constraints = true;
    this.context = new AudioContext();
    this.meter = null;

  }

  destroy() {
    this.stop();
  }

  async start(options = {}) {

    if (!navigator.mediaDevices) return Promise.reject("MediaDevices API not supported.");

    if (options.constraints) this.constraints = options.constraints;

    // Without a deviceId, it is entirely possible that the constraints will match an audio output
    // which is not what we want. In this case, we grab all the inputs and keep the first audio
    // input found.
    if (!options.deviceId) {

      // Since we may stumble upon an "audiooutput" device and there's no way to add a constraint
      // for that, we must first query the inputs and get the first found id.
      let inputs = await getInputs("audio");
      let filtered = inputs.filter(input => input.kind === "audioinput");
      options.deviceId = filtered[0].deviceId;

    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      deviceId: options.deviceId,
      audio: this.constraints
    });


    // This is the source AudioNode whose media is obtained from the specified input audio stream
    this.source = this.context.createMediaStreamSource(this.stream);

    // Add audio meter
    // this.meter = new AudioMeter(this.source);
    this.meter = new AudioMeter(this.context);
    this.source.connect(this.meter.input);
    this.meter.addListener("change", e => this.emit("volume", e));





    // this.analyzer = new AnalyserNode(this.source.context);
    // this.analyzer.fftSize = 2048;

    // var tailleMemoireTampon = this.analyzer.frequencyBinCount;
    // var tableauDonnees = new Uint8Array(tailleMemoireTampon);
    // this.analyzer.getByteTimeDomainData(tableauDonnees);

    // this.source.connect(this.analyzer);

    // dessiner();
    //
    //
    // var canvas = document.getElementById("oscilloscope");
    // var contexteCanvas = canvas.getContext("2d");
    //
    //
    // function dessiner() {
    //
    //   dessin = requestAnimationFrame(dessiner);
    //
    //   analyseur.getByteTimeDomainData(tableauDonnees);
    //
    //   contexteCanvas.fillStyle = 'rgb(200, 200, 200)';
    //   contexteCanvas.fillRect(0, 0, WIDTH, HEIGHT);
    //
    //   contexteCanvas.lineWidth = 2;
    //   contexteCanvas.strokeStyle = 'rgb(0, 0, 0)';
    //
    //   contexteCanvas.beginPath();
    //
    //   var sliceWidth = WIDTH * 1.0 / tailleMemoireTampon;
    //   var x = 0;
    //
    //   for(var i = 0; i < tailleMemoireTampon; i++) {
    //
    //     var v = tableauDonnees[i] / 128.0;
    //     var y = v * HEIGHT/2;
    //
    //     if(i === 0) {
    //       contexteCanvas.moveTo(x, y);
    //     } else {
    //       contexteCanvas.lineTo(x, y);
    //     }
    //
    //     x += sliceWidth;
    //   }
    //
    //   contexteCanvas.lineTo(canvas.width, canvas.height/2);
    //   contexteCanvas.stroke();
    // };
    //
    //











  }

  stop() {

    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.constraints = true;



    // This is the source AudioNode whose media is obtained from the specified input audio stream
    this.source = this.context.createMediaStreamSource(this.stream);

    // Add audio meter
    this.meter.destroy();
    this.meter = null;

    this.meter.addListener("change", e => this.emit("volume", e));


  }

}























/**
 * Returns an object whose properties identify which constraints are supported by the current
 * environment.
 *
 * @returns {MediaTrackSupportedConstraints}
 */
export function getSupportedConstraints() {
  if (!navigator.mediaDevices) return null;
  return navigator.mediaDevices.getSupportedConstraints();
}

/**
 * @private
 */
function _parseWebcamInfoFromLabel(label = "") {
  let [, n, v, p] = label.match(/(.+) \(([0-9a-f]+):([0-9a-f]+)\)/i);
  v = parseInt("0x" + v, 16);
  p = parseInt("0x" + p, 16);
  return {name: n, vendorId: v, productId: p};
}

/**
 * Returns a promise fulfilled with an array of `InputDeviceInfo` objects detailing the currently
 * available inputs.
 *
 * @param {string} [type] The type of input devices to return (`"audio"` or `"video"`). If no type
 * is specified, all input devices are returned.
 * @returns {Promise<InputDeviceInfo[]>}
 */
export async function getInputs(type) {

  if (!navigator.mediaDevices) return Promise.resolve([]);

  let devices = await navigator.mediaDevices.enumerateDevices();

  let inputDevices = devices.filter(device => {
    return (device.kind === "videoinput" || device.kind === "audioinput");
  });

  if (type === "audio") {
    return devices.filter(device => device.kind === "audioinput");
  } else if (type === "video") {

    let videoDevices = devices.filter(device => device.kind === "videoinput");

    return videoDevices.map(camera => {
      let {name, vendorId, productId} = _parseWebcamInfoFromLabel(camera.label);
      camera.vendorId = vendorId;
      camera.productId = productId;
      camera.name = name;
      return camera;
    });

  } else {
    return inputDevices;
  }

}

/**
 * @class AudioMeter
 */
export class AudioMeter extends EventEmitter {

  /**
   *
   * Creates an `AudioMeter`object. The resulting object can then be used in an audio chain by
   * connecting a source node to its `input` property:
   *
   *  let am = new AudioMeter(context);
   *  someSourceAudioNode.connect(am.input);
   *
   * @todo when there is wider support, this should be rewritten as an AudioWorklet
   *
   * @param {AudioContext} context The `AudioContext` that this object belongs to.
   * @param {number} clippingLevel The threshold above which a sound is considered to clip (float
   * between 0 and 1). The default is 0.98.
   * @param {number} averaging
   * @param {number} clippingDelay The number of milliseconds to hold the clipping indicator after a
   * clipping event.
   */
  constructor(context, clippingLevel = 0.98, averaging = 0.95, clippingDelay = 750) {

    super();

    this.clippingLevel = clippingLevel;
    this.clippingDelay = clippingDelay;
    this.averaging = averaging;

    this.clipping = false;
    this.lastClip = 0;
    this.volume = 0;

    this.context = context;
    this.input = this.context.createScriptProcessor(512);
    this.input.onaudioprocess = this.processAudioVolumeEvent.bind(this);

    // This fixes a still-standing bug in Chrome!
    this.input.connect(this.context.destination);

  }

  destroy() {
    this.input.disconnect();
    this.input.onaudioprocess = null;
    this.removeAllListeners();
  }

  processAudioVolumeEvent(e) {

    let buf = e.inputBuffer.getChannelData(0);
    let bufLength = buf.length;
    let sum = 0;
    let x;

    // Do a root-mean-square on the samples: sum up the squares...
    for (let i = 0; i < bufLength; i++) {

      x = buf[i];

      if (Math.abs(x) >= this.clippingLevel) {
        this.clipping = true;
        this.lastClip = window.performance.now();
      }

      sum += x * x;

    }

    // Reset clipping if clipping delay expired
    if (!this.clipping && this.lastClip + this.clippingDelay < window.performance.now()) {
      this.clipping = false;
    }

    // Calculate RMS and smooth it out with the averaging factor. We use the max to have a fast
    // attack and a slow release.
    let rms = Math.sqrt(sum / bufLength);
    this.volume = Math.max(rms, this.volume * this.averaging);

    // Emit a `change` event when new data is received
    this.emit(
      "change",
      {type: "change", target: this, volume: this.volume, clipping: this.clipping}
    );

  }

}
