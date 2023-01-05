import { Avatar, Button, HStack, Text, useToast } from '@chakra-ui/react';
import { useAuthRequestChallengeEvm } from '@moralisweb3/next';
import { useTrezor } from 'components/Trezor';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { web3Actions } from 'stores/web3-slice';
import { getEllipsisTxt } from 'utils/format';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

const ConnectButton = () => {
  const { connectAsync } = useConnect({ connector: new InjectedConnector() });
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();
  const { data } = useSession();
  const { requestChallengeAsync } = useAuthRequestChallengeEvm();
  const { getAccounts } = useTrezor();
  const dispatch = useDispatch();

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
      console.log('connected Trezor',account);
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
  }

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

  return (
    <Fragment>
      <Button size="sm" onClick={handleAuth} colorScheme="blue">
        Connect Wallet
      </Button>
      <Button size="sm" onClick={handleConnectTrezor} colorScheme="blue">
        Connect Trezor
      </Button>
    </Fragment>
  );
};

export default ConnectButton;
