# DjipAV

The DjipAV library provides objects to work with video and audio inputs in the browser. It is 
currently in early alpha and is definitely not production ready.  

DjipAV uses the very last APIs (such as MediaDevices and ImageCapture) and will only work in a 
subset of browsers. Since I'm using it in projects based on NW.js and Electron, this works fine for
me.

[API documentation](https://djipco.github.io/djipav/)

## Basic usage

Here's an example of how to open a webcam and display the video feed via a `<video>` tag:

```javascript
import * as djipav from "../djipav.js";

let cam = new djipav.VideoInput({element: "create"});
cam.start();
```
You can fetch the available inputs in this way: 

```javascript
djipav.getInputs().then(inputs => console.log(inputs));
```
