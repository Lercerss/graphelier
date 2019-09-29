export const getFormattedDate = (date) => {
    // let date = new Date();

    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let min = date.getMinutes();
    let sec = date.getMilliseconds();

    month = (month < 10 ? '0' : '') + month;
    day = (day < 10 ? '0' : '') + day;
    hour = (hour < 10 ? '0' : '') + hour;
    min = (min < 10 ? '0' : '') + min;

    let str = date.getFullYear() + '-' + month + '-' + day + ' ' +  hour + ':' + min + ':' + sec;

    return str;
}