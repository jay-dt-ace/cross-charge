import React from 'react';
import { FormattedMessage } from 'react-intl';
import { BIZ_EVENTS_SETTINGS_SCHEMA_ID, RATE_CARD_SETTINGS_SCHEMA_ID } from '../../constants/appIds';
import { giveSettingsLink } from '../../utils/helpers';
import { ExternalLinkComponentForDirectLink } from '../Reusable/ExternalLinkComponents/ExternalLinkComponents';
import { bizEventsSettingsMessage, configureTextMessage, rateCardSettingsMessage } from './messages';

const AppSettingsComponent: React.FC = () => {
  return (
    <>
      <FormattedMessage {...configureTextMessage} />
      &nbsp; &nbsp;
      <ExternalLinkComponentForDirectLink
        href={giveSettingsLink(RATE_CARD_SETTINGS_SCHEMA_ID)}
        message={rateCardSettingsMessage}
      />
      &nbsp; &nbsp;
      <ExternalLinkComponentForDirectLink
        href={giveSettingsLink(BIZ_EVENTS_SETTINGS_SCHEMA_ID)}
        message={bizEventsSettingsMessage}
      />
    </>
  );
};

export default AppSettingsComponent;
