const secondsToHours = (s: number) => {
  let seconds = s;
  let minutes = (seconds - (seconds %= 60)) / 60;
  let hours = (minutes - (minutes %= 60)) / 60;

  return { seconds, minutes, hours };
};

export default secondsToHours;
