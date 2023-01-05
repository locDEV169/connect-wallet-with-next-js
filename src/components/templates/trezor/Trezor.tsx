import {
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  Heading,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEvmWalletNFTTransfers } from '@moralisweb3/next';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getEllipsisTxt } from 'utils/format';
import { useNetwork } from 'wagmi';

const TrezorAccount = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data } = useSession();
  const { chain } = useNetwork();
  const { data: transfers } = useEvmWalletNFTTransfers({
    address: data?.user?.address,
    chain: chain?.id,
  });

  useEffect(() => console.log('transfers: ', transfers), [transfers]);

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        Trezor Account
      </Heading>
      {transfers?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table>
              <Thead>
                <Tr>
                  <Th>Token</Th>
                  <Th>Token Id</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th isNumeric>Tx Hash</Th>
                </Tr>
              </Thead>
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
