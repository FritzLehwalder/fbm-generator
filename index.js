import {genmap} from './terrain.js';
import {generate9DigitNumber} from './util.js';
import {writeToCanvas} from './canvas.js';
import consts from './config.json' assert { type: 'json' };

const seed = consts.useCustomSeed ? consts.customSeed : generate9DigitNumber();
const finalNoiseMap = await genmap(consts.width, consts.height, consts.passes, seed);
writeToCanvas(finalNoiseMap, consts.width, consts.height, seed, consts.passes, consts.addImageData);

