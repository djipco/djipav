# DjipAV

The DjipAV library provides objects to work with video and audio inputs in the browser. It is 
**currently in early alpha and is definitely not production ready**.  

DjipAV uses the latest APIs (such as 
[MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) and 
[ImageCapture](https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture)) and will only work in 
a narrow subset of browsers. Since I'm using it in projects based on NW.js and Electron, this works 
fine for me.

## Installing the library

The prefered way to install the library is by using NPM:

```
npm install djipav
```

## Importing the library

The library is imported using JavaScript's module syntax:

```javascript
import * as djipav from "./node_modules/dist/djipav.esm.min.js";
```

## Basic usage

### Webcam

Here's an example of how to open a webcam and display the video feed via an automatically-created 
`<video>` tag:

```javascript
import {VideoInput} from "./node_modules/dist/djipav.esm.min.js";

let cam = new VideoInput({element: "create"});
cam.start();
```
You can fetch available inputs in this way: 

```javascript
import * as djipav from "./node_modules/dist/djipav.esm.min.js";
djipav.getInputs().then(inputs => console.log(inputs));
```

### Microphone

Here's an example of how to open the first audio input and display its volume anytime it changes:

```javascript
import {AudioInput} from "./djipav.js";

let mic = new djipav.AudioInput();
mic.addListener("volume", e => console.log(e));
mic.start();
```

## API Reference

This library is documented via its [API Reference](https://djipco.github.io/djipav/).