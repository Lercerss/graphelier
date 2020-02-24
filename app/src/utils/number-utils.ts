/**
 * @desc rounds number to always show a minimum of decimals
 * @param number
 * @param decimals
 * @returns {string}
 */
export const roundNumber = (number: number, decimals: number) => {
    return Number(number).toFixed(decimals);
};

/**
 * @desc Given a number, pads with zeroes based on a decimal precision
 * @param num
 * @param places
 */
export const zeroLeftPad = (num: number, places: number) => {
    const zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
};
