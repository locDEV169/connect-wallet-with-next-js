import { Default } from 'components/layouts/Default';
import { TrezorAccount } from 'components/templates/trezor';

const TrezorPage = () => {
  return (
    <Default pageName="NFT Transfers">
      <TrezorAccount />
    </Default>
  );
};

export default TrezorPage;
