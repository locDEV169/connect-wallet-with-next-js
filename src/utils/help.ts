export const compareAddress = (address: string, otherAddress: string): boolean => {
  if (address.startsWith('0x')) {
    address = `ronin:${address.substring(2)}`;
  }
  if (otherAddress.startsWith('0x')) {
    otherAddress = `ronin:${otherAddress.substring(2)}`;
  }
  return address.toLocaleLowerCase() === otherAddress.toLocaleLowerCase();
};
