import { Box, Container, Flex, HStack } from '@chakra-ui/react';
import { ColorModeButton, MoralisLogo, NavBar } from '../../elements';
import { ConnectButton } from '../ConnectButton';

const Header = () => {
  return (
    <Box borderBottom="1px" borderBottomColor="chakra-border-color">
      <Container maxW="container.xl" p={'10px'}>
        <Flex align="center" justify="space-between">
          <MoralisLogo />
          <div style={{ display: 'flex' }}>
            <NavBar />
            <HStack gap={'10px'}>
              <ConnectButton />
              <ColorModeButton />
            </HStack>
          </div>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
