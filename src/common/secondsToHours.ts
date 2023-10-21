const secondsToHours = (s: number) => {
  let seconds = s;
  let minutes = (seconds - (seconds %= 60)) / 60;
  const hours = (minutes - (minutes %= 60)) / 60;

  return { seconds, minutes, hours };
};

export default secondsToHours;
