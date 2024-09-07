import consts from './config.json' assert {type: 'json'};
import { generate9DigitNumber } from './util.js';

//pseudo-random num generator using mulberry32 algorithm
function mulberry32(seed) {
    let t = seed + 0x6D2B79F5;
    return function() {
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296; //dividing by 2^32 normalizes output between 0-1 (i actually have no idea why this works)
    }
}

//linear interpolation function
function lerp(a, b, t) {
    return a + t * (b - a);
}

//fade function to smooth transitions
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

//gradient for the perlin noise
function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v); //calculated here
}

//perlin noise function
function perlin(x, y, p) {
    //wrap x/y coords to fit permutation size
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    //fade coords
    const u = fade(xf);
    const v = fade(yf);

    //permutations from hash
    const aaa = p[p[xi] + yi];
    const aba = p[p[xi] + yi + 1];
    const baa = p[p[xi + 1] + yi];
    const bba = p[p[xi + 1] + yi + 1];

    //calculate noise values
    const n0 = grad(aaa, xf, yf);
    const n1 = grad(baa, xf - 1, yf);
    const n2 = grad(aba, xf, yf - 1);
    const n3 = grad(bba, xf - 1, yf - 1);

    //interpolate
    const nx0 = lerp(n0, n1, u);
    const nx1 = lerp(n2, n3, u);

    return lerp(nx0, nx1, v) * 0.507;
}

//make a permutation table for random noise
function generatePermutation(seed) {
    const random = mulberry32(seed); //make randomness
    let p = Array.from({length: 256}, (_, i) => i);
    for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1)); //shuffle array
        [p[i], p[j]] = [p[j], p[i]];
    }
    return p.concat(p);
}

//make initial FBM noise layer(s)
function generateFBM(width, height, octaves, persistence, scale, seed) {
    const p = generatePermutation(seed); //gen permutation table
    let fBmArray = new Array(width * height).fill(0);
    console.log("Processing noise map...");
    console.log("Array size: " + fBmArray.length);

    //loop through every value of each array
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let amplitude = 1.0;
            let frequency = 1.0;
            let total = 0;

            for (let k = 0; k < octaves; k++) {
                const sampleX = i * frequency * scale;
                const sampleY = j * frequency * scale;

                total += perlin(sampleX, sampleY, p) * amplitude;

                amplitude *= persistence; //decrease amplitude
                frequency *= 2; //increase frequency
            }

            fBmArray[i * height + j] = Math.pow(total, 2);
        }
    }

    console.log("Finished noise map processing");

    //normalization
    let max = 0;
    let min = 0;
    for(let i = 0; i < fBmArray.length; i++) {
        if(fBmArray[i] > max) max = fBmArray[i];
        if(fBmArray[i] < min) min = fBmArray[i];
    }
    return fBmArray.map(value => Math.round((value - min) / (max - min) * consts.maxNoiseValue-consts.minNoiseValue) + consts.minNoiseValue); //ensure values stay within config max/min values
}

//final map with layerd perlin noise
function genmap(width, height, passes, seed) {
    let result = new Array(width * height).fill(0);
    for (let pass = 1; pass <= passes; pass++) {
        //adjust values passed to FBM gen to great "low valleys" and "high peaks"
        const octaves = pass * 1.2;
        const persistence = 0.5;
        const scale = consts.scaleSize * pass;

        console.log("Completed pass " + pass);

        const newSeed = seed + pass; // make sure seed is updated on each pass to prevent localized bunches of noise
        const fBmArray = generateFBM(width, height, octaves, persistence, scale, newSeed);

        const weight = 1 / Math.pow(consts.octaveWeight, pass);

        for (let i = 0; i < result.length; i++) {
            result[i] += fBmArray[i] * weight;
        }
    }

    //normalization
    let max = result[0];
    let min = result[0];
    for (let i = 1; i < result.length; i++) {
        if (result[i] > max) max = result[i];
        if (result[i] < min) min = result[i];
    }
    
    for (let i = 0; i < result.length; i++) {
        result[i] = Math.round((result[i] - min) / (max - min) * (consts.maxNoiseValue - consts.minNoiseValue) + consts.minNoiseValue); //ensure values stay within config max/min values
    }

    console.log("Done!");
    return result;
}

//unused function to display map in console, replaced with PNG output
async function displaymap(array, width) {
    let outputString = "";
    for(let i = 0; i < array.length; i++) {
        outputString += array[i];
        if((i+1) % width == 0) outputString += "\n";
    }
    console.log(outputString);
}

export {genmap, displaymap};
