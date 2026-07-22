export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatISODate = (string = '') => {
  const dateArr = string.split('-');
  const monthInd = parseInt(dateArr[1], 10) - 1;
  return (dateArr.length > 1) && (monthInd > -1) && (monthInd < 12) &&
    `${months[monthInd]}, ${dateArr[0]}`;
};

export default formatISODate;
