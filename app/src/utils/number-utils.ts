/**
 * @desc rounds number to always show a minimum of decimals
 * @param number
 * @param decimals
 * @returns {string}
 */
export const roundNumber = (number: number, decimals: number) => {
    return Number(number).toFixed(decimals);
};
