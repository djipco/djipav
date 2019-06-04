# DjipAV

The DjipAV library provides objects to work with video and audio inputs in the browser. It is 
**currently in early alpha and is definitely not production ready**.  

DjipAV uses the very last APIs (such as MediaDevices and ImageCapture) and will only work in a 
subset of browsers. Since I'm using it in projects based on NW.js and Electron, this works fine for
me.

## Basic usage

### Webcam

Here's an example of how to open a webcam and display the video feed via an automatically-created 
`<video>` tag:

```javascript
import {VideoInput} from "./djipav.js";

let cam = new VideoInput({element: "create"});
cam.start();
```
You can fetch available inputs in this way: 

```javascript
import * as djipav from "./djipav.js";
djipav.getInputs().then(inputs => console.log(inputs));
```

### Microphone

```javascript
import {AudioInput} from "./djipav.js";

let mic = new djipav.AudioInput();
mic.addListener("volume", e => console.log(e));
mic.start();
```

## API Reference

This library is documented via its [API Reference](https://djipco.github.io/djipav/).