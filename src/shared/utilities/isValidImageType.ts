const fileTypes = [
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/apng',
  'image/webp',
];

const isValidImageType = (file: File) => fileTypes.includes(file.type);

export default isValidImageType;
