const { ipcRenderer, remote, webFrame } = require('electron');

onerror = message => {
  ipcRenderer.sendSync('error');
  console.error(message);
  close();

  return true;
};

onunhandledrejection = event => { // eslint-disable-line no-undef
  ipcRenderer.sendSync('error');
  console.error(event.reason);
  close();

  return true;
};

const { RgbaEmitter } = require('musicvideo-generator');
const path = require('path');
const url = require('url');
const yargs = require('yargs');

const { argv } = yargs(remote.process.argv.slice(remote.process.argv.indexOf('--') + 1)).options({
  'resolution': {
    string: true,
    demandOption: true,
    description: 'WIDTHxHEIGHT',
  },
  'backgroundcolor': {
    number: true,
    description: 'background color in 24-bit',
    default: 0,
  },
  'blur.movement.band.bottom': {
    number: true,
    description: 'the bottom of the band triggering the movement of the blur in hertz',
  },
  'blur.movement.band.top': {
    number: true,
    description: 'the top of the band triggering the movement of the blur in hertz',
  },
  'blur.movement.band.threshold': {
    number: true,
    description: 'the threshold for the band triggering the movement of the blur in hertz',
  },
  'blur.blink.band.bottom': {
    number: true,
    description: 'the bottom of the band triggering the movement of the blur in hertz',
  },
  'blur.blink.band.top': {
    number: true,
    description: 'the top of the band triggering the movement of the blur in hertz',
  },
  'blur.blink.band.threshold': {
    number: true,
    description: 'the threshold for the band triggering the movement of the blur in hertz',
  },
  'particle.limit.band.bottom': {
    number: true,
    description: 'the bottom of the band triggering the change of the particle in hertz',
  },
  'particle.limit.band.top': {
    number: true,
    description: 'the top of the band triggering the change of the particle in hertz',
  },
  'particle.limit.band.threshold': {
    number: true,
    description: 'the threshold for the band triggering the change of the particle in hertz',
  },
  'particle.alpha': {
    number: true,
    description: 'the alpha of the particle in range from 0 to 1',
  },
  'particle.color': {
    number: true,
    description: 'the color of the particle in 24-bit',
  },
  'lightleaks.alpha': {
    number: true,
    description: 'the alpha of the light leaks in range from 0 to 1',
  },
  'lightleaks.interval': {
    number: true,
    description: 'the interval of the light leaks in seconds',
  },
  'spectrum.mode': {
    number: true,
    description: 'the mode of the spectrum (0, 1, 2, or 3)',
  },
  'spectrum.alpha': {
    number: true,
    description: 'the alpha of the spectrum in range from 0 to 1',
  },
  'spectrum.color': {
    number: true,
    description: 'the color of the spectrum in 24-bit',
  },
  'text.alpha': {
    number: true,
    description: 'the alpha of the texts in range from 0 to 1',
  },
  'text.color': {
    number: true,
    description: 'the alpha of the texts in 24-bit',
  },
  'text.title': {
    string: true,
    description: 'the title',
  },
  'text.sub': {
    string: true,
    description: 'the subtitle',
  },
  'banner.image': {
    string: true,
    description: 'the path to the banner',
  },
  'banner.alpha': {
    number: true,
    description: 'the alpha the banner in range from 0 to 1',
  },
  'image': {
    string: true,
    description: 'the path to the image',
  },
  '_': {
    string: true,
    description: 'the path to the music',
  },
});

const [width, height] = argv.resolution.split('x').map(Number);

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
      resolution: { width, height },
      backgroundColor: argv.backgroundcolor,
      image: argv.image === undefined ? null : url.format({
        pathname: path.resolve(argv.image),
        protocol: 'file:',
      }),
      banner: argv.banner && {
        image: url.format({
          pathname: path.resolve(argv.banner.image),
          protocol: 'file:',
        }),
        alpha: argv.banner.alpha,
      },
      blur: argv.blur,
      particle: argv.particle,
      lightLeaks: argv.lightleaks,
      spectrum: argv.spectrum,
      text: argv.text,
    });

    // XXX: The documentation says the default value of end is true, but somehow
    // it does not trigger finish event nor flush the stream. Ignore it.
    emitter.pipe(process.stdout, { end: false });

    emitter.on('end', () => process.stdout.end(close));

    emitter.on('error', error => {
      ipcRenderer.sendSync('error');
      console.error(error);
    });

    process.stdout.on('error', error => {
      ipcRenderer.sendSync('error');
      console.error(error);
    });
  });
