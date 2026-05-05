import { Button } from '@dynatrace/strato-components/buttons';
import { Flex, Surface } from '@dynatrace/strato-components/layouts';
import { Paragraph } from '@dynatrace/strato-components/typography';
import React from 'react';
import { FormattedMessage } from 'react-intl';

interface ErrorBoundaryFallbackUIProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

export const ErrorBoundaryFallbackUI = ({ error, resetErrorBoundary }: ErrorBoundaryFallbackUIProps) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    <Flex>
      <Surface>
        <Paragraph>
          <FormattedMessage defaultMessage='Something went wrong:' id='/fWn7iGI2LV4yTM7' />
          &nbsp; &nbsp;
          {errorMessage}
          <br />
          <br />
        </Paragraph>
        <Button onClick={resetErrorBoundary} variant='emphasized'>
          <FormattedMessage defaultMessage='Try Again' id='zvL+CTto+pcMfT2b' />
        </Button>
      </Surface>
    </Flex>
  );
};
