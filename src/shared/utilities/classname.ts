const classnames = (...classes: (string | boolean | null | undefined)[]) =>
  classes.filter(c => !!c && typeof c === 'string').join(' ');

export default classnames;
