'use-strict';

const { EventEmitter } = require('events');
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

class NoiseDetection extends EventEmitter {
  constructor(options) {
    super();

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.streamDecoder = new pcm.StreamDecoder(this.options.format);
    this.streamDecoder.on('readable', this.processBlock.bind(this));
  }

  processBlock() {
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

      dB = Number.parseFloat((rms * 100).toFixed(2));
      this.processDatabase(dB);
    }
  }

  processDatabase(dB) {
    if (
      this.options.triggerLevel &&
      this.options.triggerLevelMax &&
      dB > this.options.triggerLevel &&
      dB < this.options.triggerLevelMax
    ) {
      this.emit('noise', dB);
    } else if (this.options.triggerLevel && dB > this.options.triggerLevel) {
      this.emit('noise', dB);
    }

    this.emit('dB', dB);
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
