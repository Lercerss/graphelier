/**
 * @desc rounds number to always show a minimum of decimals
 * @param number
 * @param decimals
 * @returns {string}
 */
export const roundNumber = (number, decimals) => {
    return Number(number).toFixed(decimals);
};