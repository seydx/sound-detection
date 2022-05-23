const http = require('http');
const pcm = require('./libs/pcm');
const qmean = require('compute-qmean');
const mean = require('compute-incrmmean');

const DEFAULT_OPTIONS = {
  format: {
    bitDepth: 16,
    numberOfChannels: 1,
    signed: true,
  },
  triggerLevel: 30,
};

class NoiseDetection {
  constructor(options, callback) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.streamDecoder = new pcm.StreamDecoder(options.format);
    this.streamDecoder.on('readable', this.processBlock.bind(this, callback));
  }

  processBlock(callback) {
    const rmsAvg = mean(2000);

    const block = this.streamDecoder.read();
    const samples = [];

    let rms;
    let dB;

    if (block) {
      for (const sample of block[0]) {
        samples.push(sample);
      }

      rms = qmean(samples);
      rmsAvg(rms);

      dB = (rms * 100).toFixed(2);
      this.processDatabase(dB, callback);
    }
  }

  processDatabase(dB, callback) {
    if (this.options.triggerLevel && this.options.triggerLevelMax) {
      if (dB > this.options.triggerLevel && dB < this.options.triggerLevelMax) {
        callback(dB);
      }
    } else if (this.options.triggerLevel) {
      if (dB > this.options.triggerLevel) {
        callback(dB);
      }
    } else {
      return callback;
    }
  }

  start() {
    if (this.options.url) {
      this.httpStream = http.get(this.options.url, (source) => {
        source.pipe(this.streamDecoder);
      });
    }
  }

  stop() {
    this.httpStream?.destroy();
  }

  write(audioData) {
    this.streamDecoder.write(audioData);
  }
}

module.exports = NoiseDetection;
