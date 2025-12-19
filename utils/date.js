exports.nowUtcPlus7 = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};
