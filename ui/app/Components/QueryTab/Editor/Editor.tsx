import { Flex } from '@dynatrace/strato-components/layouts';
import { Paragraph } from '@dynatrace/strato-components/typography';
import { RunQueryButton } from '@dynatrace/strato-components-preview/buttons';
import { DQLEditor } from '@dynatrace/strato-components-preview/editors';
import * as Colors from '@dynatrace/strato-design-tokens/colors';
import { CriticalIcon } from '@dynatrace/strato-icons';
import { type ErrorResponse } from '@dynatrace-sdk/client-query';
import React from 'react';
import { type QueryStatus } from '../QueryTab';

interface EditorProps {
  onClickQuery: VoidFunction;
  queryString: string;
  handleTempQueryStringUpdate: (val: string) => void;
  queryErrorDetails: ErrorResponse | undefined;
  queryStatus: QueryStatus;
}

const Editor: React.FC<EditorProps> = ({
  onClickQuery,
  queryErrorDetails,
  queryString,
  queryStatus,
  handleTempQueryStringUpdate,
}) => {
  return (
    <Flex flexDirection='column' style={{ width: '100%' }}>
      <Flex flexDirection='row'>
        {/*  DQL Editor with queryString i.e, main State is passed. OnChange is handled and updated to temp state */}
        <DQLEditor value={queryString} onChange={handleTempQueryStringUpdate} />

        <Flex justifyContent='flex-end'>
          {/* Run Button to re-fetch the query */}
          <RunQueryButton onClick={onClickQuery} queryState={queryStatus} style={{ width: 'max-content' }} />
        </Flex>
      </Flex>

      {/* Display error messages, when query throws error */}
      {queryStatus === 'error' && (
        <Flex alignItems='center' style={{ color: Colors.default.Text.Critical.Default }}>
          <CriticalIcon />
          <Paragraph>{queryErrorDetails?.details?.errorMessage}</Paragraph>
        </Flex>
      )}
    </Flex>
  );
};

export default Editor;
