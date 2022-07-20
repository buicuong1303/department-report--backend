export const calcDurationPhone = array => {
  const totalTime = array.reduce((total, item) => {
    const splitTimeNew = item.split(':');
    const splitTimeOld = total.split(':');

    let hour: any = parseInt(splitTimeNew[0]) + parseInt(splitTimeOld[0]);
    let minute: any = parseInt(splitTimeNew[1]) + parseInt(splitTimeOld[1]);
    let second: any = parseInt(splitTimeNew[2]) + parseInt(splitTimeOld[2]);

    hour = `0${hour + Math.floor(minute / 60)}`.slice(-2);
    minute = minute % 60;
    minute = `0${minute + Math.floor(second / 60)}`.slice(-2);
    second = `0${second % 60}`.slice(-2);
    total = [hour, minute, second].join(':');
    return total;
  }, '00:00:00');
  return totalTime;
};

export const formatDurationPhone = (ts: string) => {
  let [hour, minute, second] = ts.split(':');
  hour = `0${hour}`.slice(-2);
  minute = `0${minute}`.slice(-2);
  second = `0${second}`.slice(-2);
  const result = [hour, minute, second].join(':');
  return result;
};
