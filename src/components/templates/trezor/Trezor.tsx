import { Box, Heading, Table, TableContainer, Tbody, Td, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react';
import { useAuthRequestChallengeEvm } from '@moralisweb3/next';
import { useTrezor } from 'components/Trezor';
import { useTrezorAccount } from 'hooks/useTrezor';
import { useSession } from 'next-auth/react';
import { useNetwork, useSignMessage } from 'wagmi';

const TrezorAccount = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data } = useSession();
  const { chain } = useNetwork();

  const { trezorAccounts, getFullAccounts } = useTrezorAccount();
  const { signWallet } = useTrezor();

  // useEffect(() => console.log('transfers: ', data), []);
  console.log('data', data, 'chain', chain, trezorAccounts);

  const onClick = async (address: string, serializedPath: string) => {
    signWallet(address, serializedPath);
  };

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        Trezor Account
      </Heading>
      {trezorAccounts?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table>
              <Thead>
                <Tr>
                  <Th>Id</Th>
                  <Th>Address</Th>
                </Tr>
              </Thead>
              <Tbody>
                {trezorAccounts?.map((account: any, key: number) => (
                  <Tr key={key} _hover={{ bgColor: hoverTrColor }} cursor="pointer">
                    <Td>{key + 1}</Td>
                    <Td onClick={() => onClick(account.address, account.serializedPath)}>{account.address}</Td>
                    {/* <>{readBalance(account.address)}</> */}
                    {/* <Td>{getBalance(account.address)}</Td> */}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks Like you do not have any Trezor Account</Box>
      )}
    </>
  );
};

export default TrezorAccount;
