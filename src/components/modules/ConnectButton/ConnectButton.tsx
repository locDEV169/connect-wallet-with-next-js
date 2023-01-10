import { Avatar, Button, HStack, Text, useToast } from '@chakra-ui/react';
import { useAuthRequestChallengeEvm } from '@moralisweb3/next';
import { useTrezor } from 'components/Trezor';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { web3Actions } from 'stores/web3-slice';
import { getEllipsisTxt } from 'utils/format';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { providers } from 'ethers';

const ConnectButton = () => {
  const { connectAsync } = useConnect({ connector: new InjectedConnector() });
  const { disconnectAsync } = useDisconnect();
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();
  const { data } = useSession();
  const { requestChallengeAsync } = useAuthRequestChallengeEvm();
  const { getAccounts } = useTrezor();
  const dispatch = useDispatch();

  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [account, setAccount] = useState<string>('');

  const handleAuth = async () => {
    // await getAccounts();

    if (isConnected) {
      await disconnectAsync();
    }
    try {
      const { account, chain } = await connectAsync();
      console.log('chain', chain);
      const challenge = await requestChallengeAsync({ address: account, chainId: chain.id });
      console.log('challenge', challenge);
      if (!challenge) {
        throw new Error('No challenge received');
      }

      const signature = await signMessageAsync({ message: challenge.message });

      await signIn('moralis-auth', { message: challenge.message, signature, network: 'Evm', redirect: false });
    } catch (e) {
      toast({
        title: 'Oops, something went wrong...',
        description: (e as { message: string })?.message,
        status: 'error',
        position: 'top-right',
        isClosable: true,
      });
    }
  };

  const handleConnectTrezor = async () => {
    try {
      await getAccounts();
      const account = await getAccounts();
      console.log('connected Trezor', account);
      dispatch(web3Actions.setTrezorAccounts(account));
      // const challenge = await requestChallengeAsync({ address: account[0].address, chainId: chain.id });

      // if (!challenge) {
      //   throw new Error('No challenge received');
      // }

      // const signature = await signMessageAsync({ message: challenge.message });

      // await signIn('moralis-auth', { message: challenge.message, signature, network: 'Evm', redirect: false });
    } catch (e) {
      toast({
        title: 'Oops, something went wrong...',
        description: (e as { message: string })?.message,
        status: 'error',
        position: 'top-right',
        isClosable: true,
      });
    }
  };

  const handleConnectWallet = async () => {
    try {
      // const { default: WalletConnectProvider } = await import('@walletconnect/web3-provider');

      // const walletConnectProvider = await new WalletConnectProvider({
      //   //hard code
      //   // set up infura.io
      //   infuraId: 'fa81668a88f749e092d99583b6fa8279',
      //   // chainId: 1,
      // });
      // if (isConnected) {
      //   await disconnectAsync();
      // }
      
      // // Subscribe to accounts change
      // walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
      //   console.log(accounts);
      //   setAccount(accounts[0]);
      // });

      // // Subscribe to chainId change
      // walletConnectProvider.on('chainChanged', (chainId: number) => {
      //   console.log(chainId);
      // });

      // // Subscribe to session disconnection
      // walletConnectProvider.on('disconnect', (code: number, reason: string) => {
      //   console.log(code, reason);
      // });

      // await walletConnectProvider.enable();

      // console.log('walletConnectProvider', walletConnectProvider);

      // const web3Provider = new providers.Web3Provider(walletConnectProvider);
      // setProvider(web3Provider);

      // return walletConnectProvider;


      const { account, chain } = await connectAsync({
        connector: new WalletConnectConnector({
          options: {
            qrcode: true,
          },
        }),
      });
      console.log('-------------- ', account, chain);

      // const challenge = await requestChallengeAsync({ address: account, chainId: chain.id });
      const challenge = await requestChallengeAsync({ address: account, chainId: 97 });
      console.log('challenge', challenge);
      if (!challenge) {
        throw new Error('No challenge received');
      }

      const signature = await signMessageAsync({ message: challenge.message });

      await signIn('moralis-auth', { message: challenge.message, signature, network: 'Evm', redirect: false });
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (!provider) return;
    console.log('--------provider', provider, 'account', account, 'ad', address);

    (async () => {
      try {
        const block = await provider.getBlockNumber();
        console.log('last block:', block);
        console.log('data', data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [provider]);

  const handleDisconnect = async () => {
    await disconnectAsync();
    signOut({ callbackUrl: '/' });
  };

  if (data?.user) {
    return (
      <HStack onClick={handleDisconnect} cursor={'pointer'}>
        <Avatar size="xs" />
        <Text fontWeight="medium">{getEllipsisTxt(data.user.address)}</Text>
      </HStack>
    );
  }

  if (account) {
    return (
      <HStack onClick={handleDisconnect} cursor={'pointer'}>
        <Avatar size="xs" />
        <Text fontWeight="medium">{getEllipsisTxt(account)}</Text>
      </HStack>
    );
  }

  return (
    <Fragment>
      <Button size="sm" onClick={handleAuth} colorScheme="blue">
        Connect Wallet
      </Button>
      <Button size="sm" onClick={handleConnectWallet} colorScheme="blue">
        Connect WalletConnect
      </Button>
      <Button size="sm" onClick={handleConnectTrezor} colorScheme="blue">
        Connect Trezor
      </Button>
    </Fragment>
  );
};

export default ConnectButton;
