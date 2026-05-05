import { Flex } from '@dynatrace/strato-components/layouts';
import { ExternalLink } from '@dynatrace/strato-components/typography';
import { ExternalLinkIcon } from '@dynatrace/strato-icons';
import React from 'react';
import { FormattedMessage } from 'react-intl';

interface ExternalLinkComponentForMenuItemProps {
  message: { defaultMessage: string; description: string; id: string };
}

export const ExternalLinkComponentForMenuItem: React.FC<ExternalLinkComponentForMenuItemProps> = ({ message }) => {
  return (
    <Flex width='inherit' justifyContent='space-between'>
      <FormattedMessage {...message} />
      <ExternalLinkIcon style={{ flexShrink: 0 }} />
    </Flex>
  );
};

interface ExternalLinkComponentForDirectLinkProps {
  message: { defaultMessage: string; description: string; id: string };
  href: string;
}

export const ExternalLinkComponentForDirectLink: React.FC<ExternalLinkComponentForDirectLinkProps> = ({
  message,
  href,
}) => {
  return (
    <ExternalLink href={href}>
      <FormattedMessage {...message} />
    </ExternalLink>
  );
};
