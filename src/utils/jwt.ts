export const checkExpirationToken = (expValue: number) => {
  return expValue < Date.now() / 1000;
};
