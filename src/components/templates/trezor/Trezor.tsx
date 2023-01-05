import {
  Box, Heading, Table, TableContainer, Tbody,
  Td, Th, Thead,
  Tr, useColorModeValue
} from '@chakra-ui/react';
import { useEvmWalletNFTTransfers } from '@moralisweb3/next';
import { useTrezorAccount } from 'hooks/useTrezor';
import { useSession } from 'next-auth/react';
import { useNetwork } from 'wagmi';

const TrezorAccount = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data } = useSession();
  const { chain } = useNetwork();
  const { data: transfers } = useEvmWalletNFTTransfers({
    address: data?.user?.address,
    chain: chain?.id,
  });

  const { trezorAccounts, getFullAccounts } = useTrezorAccount();

  // useEffect(() => console.log('transfers: ', transfers, data), [transfers]);

  console.log(trezorAccounts);

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
                  <Th>Token Id</Th>
                  <Th>Address</Th>
                </Tr>
              </Thead>
              <Tbody>
                {trezorAccounts?.map((account: any, key: number) => (
                  <Tr key={key} _hover={{ bgColor: hoverTrColor }} cursor="pointer">
                    <Td>{key + 1}</Td>
                    <Td>{account.address}</Td>
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
