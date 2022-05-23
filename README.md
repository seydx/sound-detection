Sound Detection
===

Library to detect sudden noises above ambient from a network stream such as an IP Webcam or network microphone.

Example usage would be to monitor the microphone of an IP camera used as a Baby monitor, the trigger could be used to switch lights on, trigger a pushover alert or video recording. 

## Installation

``` bash
$ npm install @seydx/sound-detection
```
## Usage 

The ambient noise is constantly monitored and adapts over time, the `triggerLevel` variables indicates how much over the background noise in decibels is required to trigger the callback which is invoked with the detected decibel value. 

The decibel value is referenced against the maximum volume transmitted in a PCM stream. 

### Sample App 1 (HTTP)

```javascript
const SoundDetection = require('@seydx/sound-detection');

const options = {
  url: 'http://babymonitorcam/audio.cgi'
  format: {
    bitDepth: 16,
    numberOfChannels: 1,
    signed: true
  },
  triggerLevel: 30
}

const detector = new SoundDetection(options, (dB) => {
  console.log('Noise Detected at %sdB', dB);
});

detector.start();
```

### Sample App 2 (FFMPEG)

```javascript
const SoundDetection = require('@seydx/sound-detection');

const options = {
  format: {
    bitDepth: 16,
    numberOfChannels: 1,
    signed: true
  },
  triggerLevel: 30
}

const detector = new SoundDetection(options, (dB) => {
  console.log('Noise Detected at %sdB', dB);
});

const ffmpegPath = '/usr/lib/ffmpeg';

const ffmpegArguments = [
  '-hide_banner',
  '-loglevel',
  'error',
  '-rtsp_transport',
  'tcp',
  '-i',
  'rtsp://admin:Samsun551991@192.168.178.166:554/11',
  '-vn',
  '-acodec',
  'pcm_s16le',
  '-f',
  's16le',
  'pipe:1',
];

const ffmpeg = spawn(ffmpegPath, ffmpegArguments, {
  env: process.env,
});

ffmpeg.stdout.pipe(detector.streamDecoder);
```
