module.exports = fn => (req, res, next) => fn(req, res, next).catch(next);

// const asyncatch = fn => (req, res, next) => {
//   try {
//     fn(req, res, next);
//   } catch (err) {
//     next(err);
//   }
// };
