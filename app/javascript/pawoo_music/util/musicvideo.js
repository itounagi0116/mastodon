import { isMobile } from './is_mobile';
import isEqual from 'lodash/isEqual';

const fps = isMobile() ? 15 : 30;

export function constructRgbObject (color, a) {
  return {
    r: (0xff & (color >> 16)),
    g: (0xff & (color >> 8)),
    b: (0xff & color),
    a,
  };
};

export function constructRgbCode (color, a) {
  return `rgba(${0xff & (color >> 16)},${0xff & (color >> 8)},${0xff & color},${a})`;
};

export function extractRgbFromRgbObject ({ r, g, b }) {
  return (r << 16) | (g << 8) | b;
}

export function constructGeneratorOptions(track, image) {
  const video = track.get('video');

  const options = { fps, image };

  for (const [trackKey, optionKey] of [
    ['blur', 'blur'],
    ['particle', 'particle'],
    ['lightleaks', 'lightLeaks'],
    ['spectrum', 'spectrum'],
    ['text', 'text'],
  ]) {
    const trackProperty = video.get(trackKey);

    if (trackProperty) {
      options[optionKey] = trackProperty.toJS();
      if (!trackProperty.has('visible')) {
        // 投稿後のパラメータはvisibleキーを持たない
        options[optionKey].visible = true;
      }
    }
  }

  if (options.text) {
    options.text.title = track.get('title');
    options.text.sub = track.get('artist');
  }

  return options;
}

export function validateIsFileMp3(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (progress) => {
      const buf = new Uint8Array(progress.target.result);
      resolve((buf[0] === 73 && buf[1] === 68 && buf[2] === 51) || (buf[0] === 255 && (buf[1] === 251 || buf[1] === 250)));
    };
    reader.readAsArrayBuffer(file);
  });
}

export function validateIsFileImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (progress) => {
      const buf = new Uint8Array(progress.target.result);
      const png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const jpg = [0xFF, 0xD8, 0xFF];
      resolve(
        isEqual(Array.from(buf.slice(0, png.length)), png)
        || isEqual(Array.from(buf.slice(0, jpg.length)), jpg)
      );
    };
    reader.readAsArrayBuffer(file);
  });
}
