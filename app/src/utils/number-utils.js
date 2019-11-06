/**
 * @desc rounds number to always show a minimum of decimals
 * @param number
 * @param decimals
 * @returns {string}
 */
export const roundNumber = (number, decimals) => Number(number).toFixed(decimals);
