import {EventEmitter} from "djipevents";

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
export class VideoInput extends EventEmitter {

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

    // /**
    //  * An object containing references to registered listeners
    //  * @type {{}}
    //  */
    // this.listeners = {};

    // this.recorder = null;
    // this.recordedChunks = [];

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


  // /**
  //  *
  //  *       mimeType : 'video/mp4'
  //  *       audioBitsPerSecond : 128000,
  //  *       videoBitsPerSecond : 2500000,
  //  *
  //  * @param options
  //  */
  // startRecording(options = {}) {
  //
  //   if (!this.started || !this.stream) {
  //     return;
  //   }
  //
  //   this.recorder = new MediaRecorder(this.stream, options);
  //
  //   this.listeners.onDataAvailable = e => {
  //     if (e.data.size > 0) this.recordedChunks.push(e.data);
  //   };
  //
  //   this.recorder.addEventListener("dataavailable", this.listeners.onDataAvailable);
  //
  // }
  //
  // stopRecording() {
  //   if (!this.recorder) return;
  //   this.recorder.stop();
  //   this.recorder.removeEventListener("dataavailable", this.listeners.onDataAvailable);
  //   this.listeners.onDataAvailable = undefined;
  // }
  //
  //
  // saveRecording() {
  //   // downloadLink.href = URL.createObjectURL(new Blob(recordedChunks));
  //   // downloadLink.download = 'acetest.webm';
  // }

  /**
   * Return an array of supported MIME types (on the current platform) for audio and video
   * recording.
   *
   * @return {Array}
   */
  getSupportedRecordingTypes() {

    if (!MediaRecorder || !MediaRecorder.isTypeSupported) return [];

    let types = [

      "audio/webm",
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",              // FF

      "video/webm",
      "video/webm;codecs=vp8",              // FF
      "video/webm;codecs=vp8.0",            // FF
      "video/webm;codecs=vp8,opus",
      "video/WEBM;codecs=VP8,OPUS",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp9.0",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,vp9,opus",
      "video/webm;codecs=h264",
      "video/webm;codecs=H264",
      "video/webm;codecs=avc1",
      "video/webm;codecs=h264,opus",
      "video/webm;codecs=h264,vp9,opus",
      "video/webm;codecs=daala",
      "video/webm;codecs=h264",

      "video/mpeg",

      "video/x-matroska;codecs=avc1"

    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));

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

/**
 * The `AudioMeter` class analyzes audio input and reports on its level (volume). It can be used in
 * a WebAudio chain by connecting a source node to the `AudioMeter` object.
 *
 * ```javascript
 * let meter = new AudioMeter(context);
 * someSourceAudioNode.connect(meter);
 * ```
 */
export class AudioMeter extends mix(AnalyserNode, new EventEmitter()) {
// export class AudioMeter extends EventEmitter {

  /**
   * @param {AudioContext} context The `AudioContext` that this object belongs to.
   * @param {Object} [options={}]
   * @param {number} [options.smoothingTimeConstant=0.8] A number between 0 and 1 to quantify the
   * amount of smoothing applied to the calculated volume.
   * @param {number} [options.minDecibels=-100] A number representing the minimum decibel value
   * for scaling the FFT analysis data, where 0 dB is the loudest possible sound. The default
   * value is -100 dB.
   * @param {number} [options.maxDecibels=-30] A number representing the maximum decibel value
   * for scaling the FFT analysis data, where 0 dB is the loudest possible sound. The default
   * value is-30 dB.
   * @param {number} [options.fftSize=2048] An unsigned integer, representing the window size
   * of the FFT, given in number of samples. A higher value will result in more details in the
   * frequency domain but fewer details in the time domain.
   */
  constructor(context, options = {}) {

    super(context, options);

    this.volume = 0;

    this.processor = this.context.createScriptProcessor(2048, 1, 1);
    this.connect(this.processor);
    this.processor.onaudioprocess = this.processAudioVolumeEvent.bind(this);

    // This fixes a still-standing bug in Chrome!
    this.processor.connect(this.context.destination);

  }

  destroy() {
    this.disconnect();
    this.processor.onaudioprocess = null;
    this.processor.disconnect();
    this.processor = null;
    this.removeAllListeners();
  }

  processAudioVolumeEvent() {

    let array = new Uint8Array(this.frequencyBinCount);
    this.getByteFrequencyData(array);

    let total = 0;

    var length = array.length;
    for (let i = 0; i < length; i++) {
      total += (array[i] / 255);
    }

    // let average = parseFloat((total / length).toFixed(3));
    let average = total / length;

    if (average !== this.volume) {

      this.volume = average;

      // console.info("process", this.volume, total, length);

      // Emit a `change` event when volume changes
      this.emit(
        "change",
        {type: "change", target: this, volume: this.volume}
      );

    }

  }







  // constructor(context, clippingLevel = 0.98, averaging = 0.95, clippingDelay = 750) {
  //
  //   super();
  //
  //   this.clippingLevel = clippingLevel;
  //   this.clippingDelay = clippingDelay;
  //   this.averaging = averaging;
  //
  //   this.clipping = false;
  //   this.lastClip = 0;
  //   this.volume = 0;
  //
  //   this.context = context;
  //   this.input = this.context.createScriptProcessor(512);
  //   this.input.onaudioprocess = this.processAudioVolumeEvent.bind(this);
  //
  //   // This fixes a still-standing bug in Chrome!
  //   this.input.connect(this.context.destination);
  //
  // }
  //
  // destroy() {
  //   this.input.disconnect();
  //   this.input.onaudioprocess = null;
  //   this.removeAllListeners();
  // }
  //
  // processAudioVolumeEvent(e) {
  //
  //   let buf = e.inputBuffer.getChannelData(0);
  //   let bufLength = buf.length;
  //   let sum = 0;
  //   let x;
  //
  //   // Do a root-mean-square on the samples: sum up the squares...
  //   for (let i = 0; i < bufLength; i++) {
  //
  //     x = buf[i];
  //
  //     if (Math.abs(x) >= this.clippingLevel) {
  //       this.clipping = true;
  //       this.lastClip = window.performance.now();
  //     }
  //
  //     sum += x * x;
  //
  //   }
  //
  //   // Reset clipping if clipping delay expired
  //   if (!this.clipping && this.lastClip + this.clippingDelay < window.performance.now()) {
  //     this.clipping = false;
  //   }
  //
  //   // Calculate RMS and smooth it out with the averaging factor. We use the max to have a fast
  //   // attack and a slow release.
  //   let rms = Math.sqrt(sum / bufLength);
  //   this.volume = Math.max(rms, this.volume * this.averaging);
  //
  //   // Emit a `change` event when new data is received
  //   this.emit(
  //     "change",
  //     {type: "change", target: this, volume: this.volume, clipping: this.clipping}
  //   );
  //
  // }

}

/**
 * The `AudioInput` class facilitates the use of available audio inputs such as physical microphones
 * or other virtual audio input devices.
 */
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

  /**
   * Connects to the first audio input matching the constraints.
   * @param options
   * @returns {Promise<Promise<never>|undefined>}
   */
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
    this.meter = new AudioMeter(this.context);
    this.source.connect(this.meter);
    this.meter.on("change", e => this.emit("volume", e.volume));


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

  /**
   * Stops the currently playing audio input device.
   */
  stop() {
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.constraints = true;
    this.source.disconnect();
    this.meter.destroy();
    this.meter = null;
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
 * @param {string} [type] The type (`"audio"` or `"video"`) of input devices to return. If no type
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
 * This function mixes into the parent class the properties of specified objects. The mixins must be
 * objects (and not classes).
 *
 * @param {Class} parent The parent class (superclass)
 * @param {...Object} mixins Objects whose properties should be mixed into the parent class.
 * @returns {Class}
 */
export function mix(parent, ...mixins) {

  class Mixed extends parent {}

  mixins.forEach(mixin => {

    for (let prop in mixin) Mixed.prototype[prop] = mixin[prop];

    Object.getOwnPropertyNames(Object.getPrototypeOf(mixin)).forEach(prop => {
      Mixed.prototype[prop] = mixin[prop];
    });

  });

  return Mixed;

};