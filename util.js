function generate9DigitNumber() {
    let randomNumber = '';
    randomNumber += Math.floor(Math.random() * 9 + 1).toString();

    for (let i = 1; i < 9; i++) {
        randomNumber += Math.floor(Math.random() * 10).toString();
    }
    return randomNumber
}

export {generate9DigitNumber};