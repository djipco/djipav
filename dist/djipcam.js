
/**
 * EventEmitter Module
 *
 * This module is simply a refactoring of the great `eventemitter3` library created by primus
 * (https://github.com/primus/eventemitter3) The library was refactored as an ES6 module and cleaned
 * up a bit for my own purposes.
 *
 * @module eventemitter
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
  constructor(callback, context, once = false)  {
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
 * @public
 * @mixin
 */
class EventEmitter {

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

    if (typeof fn !== 'function') throw new TypeError('The listener must be a function');

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



























export class VideoInput extends EventEmitter {

  /**
   * Creates a new `VideoInput` object and attaches it to the specified `<video>` element for
   * viewing. If no `<video>` element is specified, a new one is created and appended to the
   * `<body>` element.
   *
   * @param {object} [options]
   * @param {HTMLMediaElement} [options.videoElement]
   * @param {string} [options.videoElementId]
   * @param {object} [options.constraints] The constraints to apply when trying to find an
   * appropriate media stream. More info on constraints here:
   * https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API/Constraints
   */
  constructor(options = {}) {

    super();


    if (options.videoElement) {
      this.videoElement = options.videoElement
    } else {
      this.videoElement = buildVideoElement(options.videoElementId);
    }

    this.constraints = options.constraints ? options.constraints : { video: true };

    this.timeouts = {};

  }

  destroy() {
    // document.body.removeChild(this.mask);
    // this.mask = null;
    // clearTimeout(this.timeouts.fadeInTimeout);
    // clearTimeout(this.timeouts.fadeOutTimeout);
    // this.removeAllListeners();
    // this.close();
  }

  /**
   *
   * @param {Object} [options]
   * @param {boolean} [options.visible=true]
   * @returns {Promise}
   */
  async open(options = {}) {

    if (!navigator.mediaDevices) return Promise.reject("MediaDevices API not supported.");

    if (options.visible === false) this.visible = false;

    let stream = null;
    stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    this.videoElement.srcObject = stream;
    this.videoElement.play();



    // return navigator.mediaDevices
    //   .getUserMedia(this.constraints) // This is where the user is prompted!
    //   .then(stream => {
    //
    //     this.videoElement.srcObject = stream;
    //     this.videoElement.play();
    //
    //     // Récupération des caractéristiques de la première piste vidéo du flux média trouvé
    //     // let caracteristics = flux.getVideoTracks()[0].getSettings();
    //
    //     // Redimensionnement de la balise <canvas> pour que la photo corresponde au flux video
    //     // this.photo.width = caracteristiques.width;
    //     // this.photo.height = caracteristiques.height;
    //
    //     // Pour savoir précisément ce qui est supporté par la caméra
    //     // console.log(flux.getVideoTracks()[0].getCapabilities());
    //
    //   });

    // // Prise de photo et avalanche lors d'un clic sur le <canevas> photo
    // this.videoElement.addEventListener("click", () => {
    //
    //   // Version séquentielle (1ère partie)
    //   // this.photographier();
    //   // this.avalanche();
    //   // this.sauvegarder();
    //
    //   // Version avec promesse (2e partie)
    //   this.photographier()
    //     .then(this.avalanche.bind(this))
    //     .then(this.sauvegarder.bind(this));
    //
    // });

  }

  close() {

    if (!this.videoElement || !this.videoElement.srcObject) return;

    this.videoElement.pause();
    this.videoElement.srcObject.getTracks().forEach(track => track.stop());
    this.videoElement.srcObject = undefined;
    this.videoElement.src = "";

  }

  async fadeIn(duration = 5000) {

    this.cancelFade();

    this.videoElement.style.transitionDuration = parseInt(duration) + "ms";
    this.videoElement.style.opacity = "1";

    return new Promise(resolve => {

      this.timeouts.fadeInTimeout = setTimeout(() => {
        this.emit("fadeindone");
        resolve();
      }, parseInt(duration));

    });

  }

  cancelFade() {

    clearTimeout(this.timeouts.fadeOutTimeout);
    clearTimeout(this.timeouts.fadeInTimeout);
    this.timeouts.fadeOutTimeout = null;
    this.timeouts.fadeInTimeout = null;

    let value = window.getComputedStyle(this.videoElement).getPropertyValue('opacity');
    this.videoElement.style.opacity = value;

    this.emit("fadecancelled");

  }

  async fadeOut(duration = 5000) {

    this.cancelFade();

    this.videoElement.style.transitionDuration = parseInt(duration) + "ms";
    this.videoElement.style.opacity = "0";

    return new Promise(resolve => {

      this.timeouts.fadeOutTimeout = setTimeout(() => {
        this.emit("fadeoutdone");
        resolve();
      }, parseInt(duration));

    });

  }

  get visible() {
    return this.videoElement.style.opacity > 0;
  }

  set visible(value) {

    if (value) {
      this.fadeIn(0);
    } else {
      this.fadeOut(0);
    }

  }

  get playing() {

    return
      this.videoElement.currentTime > 0 &&
      !this.videoElement.paused &&
      !this.videoElement.ended &&
      this.videoElement.readyState >= 2;

  }

  photograph() {
    // Récupération des données de l'image présente actuellement sur le canevas. La méthode
    // toDataURL() retourne une longue chaîne de caractère dans laquelle l'image est encodée au
    // format base64.
    // let image = this.photo.toDataURL();
  }

}

export async function getVideoInputs() {

  let webcams = [];
  if (!navigator.mediaDevices) return Promise.resolve(webcams);

  return new Promise(resolve => {

    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => {

        let filtered = devices.filter(device => device.kind === "videoinput");

        filtered.map(camera => {
          let {name, vendorId, productId} = parseInfoFromLabel(camera.label);
          camera.vendorId = vendorId;
          camera.productId = productId;
          camera.name = name;
          return camera;
        });

        resolve(filtered);

      });

  });

}

/**
 *
 * @returns {{}}
 */
export function getSupportedConstraints() {
  return (navigator.mediaDevices ? navigator.mediaDevices.getSupportedConstraints() : undefined);
}

function parseInfoFromLabel(label) {
  let [, n, v, p] = label.match(/(.+) \(([0-9a-f]+):([0-9a-f]+)\)/i);
  v = parseInt("0x" + v, 16);
  p = parseInt("0x" + p, 16);
  return {name: n, vendorId: v, productId: p};
}

function buildVideoElement(id) {
  let element = document.createElement("video");
  if (id) element.setAttribute("id", id);
  document.body.append(element);
  return element;
}






















