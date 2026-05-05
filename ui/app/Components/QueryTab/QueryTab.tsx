import { Flex } from '@dynatrace/strato-components/layouts';
import { useDqlQuery } from '@dynatrace-sdk/react-hooks';
import React, { useMemo, useState } from 'react';
import { bizEventsInitialQuery, bizEventsQueryWithTimeframe } from '../../constants/Queries';
import { extractColumnsAndTableDataFroDataTableV2, getQueryStatusForRunQueryButton } from '../../utils/helpers';
import { showErrorToast } from '../Reusable/Toasts/toasts';
import Editor from './Editor/Editor';
import EditorResult from './EditorResult/EditorResult';

// Query Status
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

const QueryTab: React.FC = () => {
  // Temporary state to hold the current query string while typing
  const [tempQueryString, setTempQueryString] = useState(bizEventsQueryWithTimeframe);

  // Main state used to trigger the data query (passed to the hook)
  const [queryString, setQueryString] = useState(bizEventsQueryWithTimeframe);

  const {
    cancel: cancelQueryCall,
    refetch: refetchQuery,
    data: bizEventsQueryResult,
    isLoading: isQueryLoading,
    status: queryStatus,
    errorDetails,
  } = useDqlQuery({ body: { query: queryString } }); // eslint-disable-line

  /** Takes the result and return the columns for DataTableV2 */
  const { columns } = useMemo(
    () => extractColumnsAndTableDataFroDataTableV2(bizEventsQueryResult),
    [bizEventsQueryResult],
  );

  /** Handle Temp State Update */
  const handleTempQueryStringUpdate = (val: string) => setTempQueryString(val);

  /** Handle Run Query Button Click */
  const onClickQuery = () => {
    // first check if, query is loading/still fetching

    if (isQueryLoading) {
      cancelQueryCall();
    }

    if (tempQueryString.includes(bizEventsInitialQuery)) {
      if (tempQueryString !== queryString) {
        setQueryString(tempQueryString);
        void refetchQuery();
      }
    } else {
      console.error(`Cannot Query Other than BizEvents!`);
      showErrorToast({ title: `Error!`, message: `Cannot Query Other than BizEvents!` });
    }
  };

  return (
    <Flex width='100%' flexDirection='column' justifyContent='center' gap={16}>
      <Flex flexItem padding={16}>
        <Editor
          queryString={queryString}
          queryStatus={getQueryStatusForRunQueryButton(queryStatus)}
          handleTempQueryStringUpdate={handleTempQueryStringUpdate}
          onClickQuery={onClickQuery}
          queryErrorDetails={errorDetails}
        />
      </Flex>
      <Flex flexItem padding={16}>
        <EditorResult
          tableV2Columns={columns}
          queryRecords={bizEventsQueryResult?.records ?? []}
          queryStatus={getQueryStatusForRunQueryButton(queryStatus)}
        />
      </Flex>
    </Flex>
  );
};

export default QueryTab;
