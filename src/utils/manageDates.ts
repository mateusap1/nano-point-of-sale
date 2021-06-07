const dateFormat = require('dateformat');

interface DateFormat {
  date: string;
  hour: string;
}

export function convertUnixToDateAndHour(time: number): DateFormat {
  const timeString = dateFormat(time, 'mmm dd, yyyy\nhh:MM TT');

  return {
    date: timeString.split('\n')[0],
    hour: timeString.split('\n')[1],
  };
}

export function convertUnixToDate(time: number): string {
  return dateFormat(time, 'dd-mm-yyyy');
}
