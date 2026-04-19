module.exports = {
  default: require('./database').prisma,
  ...require('./database'),
};
