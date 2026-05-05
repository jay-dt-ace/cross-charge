import React from 'react';
import { FormattedMessage } from 'react-intl';
import { CROSS_CHARGE_REPORTING_DASHBOARD_ID } from '../../constants/appIds';
import { giveDocumentLink } from '../../utils/helpers';
import { ExternalLinkComponentForDirectLink } from '../Reusable/ExternalLinkComponents/ExternalLinkComponents';
import { dashboardTextMessage, crossChargeReportMessage } from './messages';

const AppVisualizationComponent: React.FC = () => {
  return (
    <>
      <FormattedMessage {...dashboardTextMessage} />
      &nbsp; &nbsp;
      <ExternalLinkComponentForDirectLink
        href={giveDocumentLink(CROSS_CHARGE_REPORTING_DASHBOARD_ID)}
        message={crossChargeReportMessage}
      />
    </>
  );
};

export default AppVisualizationComponent;
