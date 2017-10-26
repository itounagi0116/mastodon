onerror = message => {
  console.error(message);
  close();

  return true;
};

onunhandledrejection = event => {
  console.error(event.reason);
  close();

  return true;
};

const { RgbaEmitter } = require('musicvideo-generator');
const { remote, webFrame } = require('electron');
const path = require('path');
const url = require('url');
const yargs = require('yargs');
const { argv } = yargs(remote.process.argv.slice(remote.process.argv.indexOf('--') + 1));

function parseLimit(bottom, top, threshold) {
  const band = argv[bottom] === undefined && argv[top] === undefined ?
    undefined :
    { bottom: argv[bottom], top: argv[top] };

  return band === undefined && argv[threshold] === undefined ?
    undefined : { band, threshold: argv[threshold] };
}

function parseResolution(resolution) {
  const [width, height] = resolution.split('x').map(Number);
  return { width, height };
}

const resolution = parseResolution(argv.resolution);

const blurMovement = parseLimit('blurMovementBandBottom',
                                'blurMovementBandTop',
                                'blurMovementThreshold');

const blurBlink = parseLimit('blurBlinkBandBottom',
                             'blurBlinkBandTop',
                             'blurBlinkThreshold');

const blur = blurMovement === undefined && blurBlink === undefined ?
  undefined : { movement: blurMovement, blink: blurBlink };

const particleLimit = parseLimit('particleLimitBandBottom',
                                 'particleLimitBandTop',
                                 'particleLimitThreshold');

const particle =
  particleLimit === undefined &&
  argv.particleAlpha === undefined && argv.particleColor === undefined ?
    undefined :
    { limit: particleLimit, alpha: argv.particleAlpha, color: argv.particleColor };

const lightLeaks =
  argv.lightleaksAlpha === undefined && argv.lightleaksInterval === undefined ?
    undefined :
    { alpha: argv.lightleaksAlpha, interval: argv.lightleaksInterval };

const spectrum =
  argv.spectrumMode === undefined && argv.spectrumAlpha === undefined &&
  argv.spectrumColor === undefined ?
    undefined :
    { mode: argv.spectrumMode, alpha: argv.spectrumAlpha, color: argv.spectrumColor };

const text =
  argv.textAlpha === undefined && argv.textColor === undefined &&
  argv.textTitle === undefined && argv.textSub === undefined ?
    undefined :
    { alpha: argv.textAlpha, color: argv.textColor, title: argv.textTitle, sub: argv.textSub };

const image = argv.image === undefined ? undefined : url.format({
  pathname: path.resolve(argv.image),
  protocol: 'file:',
});

webFrame.registerURLSchemeAsPrivileged('file');

fetch(url.format({ pathname: path.resolve(argv._[0]), protocol: 'file:' }))
  .then(response => response.arrayBuffer())
  .then(audio => (new AudioContext).decodeAudioData(audio))
  .then(audio => {
    const emitter = new RgbaEmitter(audio, {
      /*
       * Video Views: Instagram Video | Facebook Ads Guide
       * https://www.facebook.com/business/ads-guide/video-views/instagram-video-views
       * > Frame rate: 30fps max
       *
       * Media Best Practices — Twitter Developers
       * https://developer.twitter.com/en/docs/media/upload-media/uploading-media/media-best-practices
       * > Frame rate should be 40fps or less
       */
      fps: 30,
      resolution,
      image,
      blur,
      particle,
      lightLeaks,
      spectrum,
      text,
    });

    // XXX: The documentation says the default value of end is true, but somehow
    // it does not trigger finish event nor flush the stream. Ignore it.
    emitter.pipe(process.stdout, { end: false });

    emitter.on('end', () => process.stdout.end(close));
    emitter.on('error', console.error);
    process.stdout.on('error', console.error);
  });
