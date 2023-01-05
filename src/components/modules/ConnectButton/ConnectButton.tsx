import { InjectedConnector } from 'wagmi/connectors/injected';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { Button, Text, HStack, Avatar, useToast } from '@chakra-ui/react';
import { getEllipsisTxt } from 'utils/format';
import { useAuthRequestChallengeEvm } from '@moralisweb3/next';
import { useTrezor } from 'components/Trezor';
import { Fragment } from 'react';

const ConnectButton = () => {
  const { connectAsync } = useConnect({ connector: new InjectedConnector() });
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();
  const { data } = useSession();
  const { requestChallengeAsync } = useAuthRequestChallengeEvm();
  const { getAccounts } = useTrezor();

  const handleAuth = async () => {
    // await getAccounts();

    if (isConnected) {
      await disconnectAsync();
    }
    try {
      const { account, chain } = await connectAsync();
      console.log('chain', chain);
      const challenge = await requestChallengeAsync({ address: account, chainId: chain.id });

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
    await getAccounts();
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
