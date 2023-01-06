import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { configureChains } from '@wagmi/core';
import {
  arbitrum,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  fantom,
  fantomTestnet,
  foundry,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  sepolia
} from '@wagmi/core/chains';
import { TrezorProvider } from 'components/Trezor';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { store } from 'stores/store';
import { createClient, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

const { provider, webSocketProvider } = configureChains(
  [
    arbitrum,
    arbitrumGoerli,
    avalanche,
    avalancheFuji,
    bsc,
    bscTestnet,
    fantom,
    fantomTestnet,
    foundry,
    goerli,
    mainnet,
    optimism,
    optimismGoerli,
    polygon,
    polygonMumbai,
    sepolia,
  ],
  [publicProvider()],
);

const client = createClient({
  provider,
  webSocketProvider,
  autoConnect: true,
});

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <ChakraProvider resetCSS theme={theme}>
        <WagmiConfig client={client}>
          <SessionProvider session={pageProps.session} refetchInterval={0}>
            <TrezorProvider>
              <Component {...pageProps} />
            </TrezorProvider>
          </SessionProvider>
        </WagmiConfig>
      </ChakraProvider>
    </Provider>
  );
};

export default MyApp;
