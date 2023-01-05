import TrezorConnect from 'trezor-connect';

export const get50Accounts = async () => {
  TrezorConnect.manifest({
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
    email: 'my_email@example.com',
  });
  const baseEthereumPath = "m/44'/60'/0'/0/";
  const bundle = [];

  for (let i = 0; i < 50; i++) {
    bundle.push({
      path: `${baseEthereumPath}${i}`,
      showOnTrezor: false,
    });
  }

  return TrezorConnect.ethereumGetAddress({
    bundle,
  });
};
