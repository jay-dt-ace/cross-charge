import { EmptyState } from '@dynatrace/strato-components-preview/content';
import React from 'react';
import { FormattedMessage, type MessageDescriptor } from 'react-intl';

interface CustomEmptyStateProps {
  context: 'chart' | 'document' | 'generic' | 'table' | 'query';
  type: 'something-missing' | 'no-result' | 'something-wrong' | 'create-new' | 'no-permission';
  titleMessage?: MessageDescriptor;
  detailsMessage?: MessageDescriptor;
}

const CustomEmptyState: React.FC<CustomEmptyStateProps> = ({ context, type, titleMessage, detailsMessage }) => {
  return (
    <EmptyState>
      <EmptyState.Visual>
        <EmptyState.VisualPreset context={context} type={type} />
      </EmptyState.Visual>

      {titleMessage ? (
        <EmptyState.Title>
          <FormattedMessage {...titleMessage} />
        </EmptyState.Title>
      ) : null}

      {detailsMessage ? (
        <EmptyState.Details>
          <FormattedMessage {...detailsMessage} />
        </EmptyState.Details>
      ) : null}
    </EmptyState>
  );
};
export default CustomEmptyState;
