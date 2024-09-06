import { createCanvas } from "canvas";
import fs from "fs";
import consts from './config.json' assert {type: 'json'};

async function writeToCanvas(array, width, height, seed, passes, drawextra = false) {
    console.log("Adding to file...");
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    let h = 0;
    let w = 0;
    
    for(let i = 0; i < array.length; i++) {
        const value = array[i];
        if((i+1) % width == 0){
            h++;
            w = 0;
        } 
        ctx.fillStyle = getGreyFromValue(value);
        ctx.fillRect(w, h, 1, 1);
        w++;
    }

    if(drawextra) increaseCanvasSize(canvas, 40, "seed: " + seed + ", passes: " + passes);

    const buffer = canvas.toBuffer();
    if(fs.existsSync(`${seed}-${width}-${height}-${passes}.png`)) return console.log(`${seed}-${width}-${height}-${passes}.png`, "already exists");
    await fs.writeFileSync(`${seed}-${width}-${height}-${passes}.png`, buffer);
    console.log("Saved file at " + `${seed}-${width}-${height}-${passes}.png`);
}

function getColorFromValue(value) {
    value = Math.max(1, Math.min(consts.maxNoiseValue, value));
    
    const normalized = (value - 1) / consts.maxNoiseValue-1;

    const red = Math.round(255 * normalized);
    const blue = Math.round(255 * (1 - normalized));
    const green = 0;

    return `rgb(${red}, ${green}, ${blue})`;
}

function getGreyFromValue(value) {
    const intensity = Math.round(value - 1);
    const normalized = (intensity - consts.minNoiseValue) / (consts.maxNoiseValue - consts.minNoiseValue);
    const clampedValue = Math.max(0, Math.min(1, normalized));
    const greyValue = Math.round(clampedValue * 255);
    return `rgb(${greyValue}, ${greyValue}, ${greyValue})`;
  }

function increaseCanvasSize(canvas, increaseBy, text) {
    if (!canvas.getContext) {
        console.error("Provided object is not a canvas.");
        return;
    }

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.height += increaseBy;

    ctx.putImageData(imageData, 0, 0);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, canvas.height - increaseBy, canvas.width, increaseBy);

    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, (canvas.height+7) - increaseBy / 2);
}

export {writeToCanvas}