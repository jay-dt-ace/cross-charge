import { defineMessage } from 'react-intl';

export const runQueryButtonMessage = defineMessage({
  defaultMessage: 'Run Query',
  description: 'Run Query Button label message',
  id: 'Zn/RbADTK8q8NQZ9',
});

/**
 * Editor Result Component Messages
 */

export const queryWithNoRecordsMessage = defineMessage({
  defaultMessage: 'Above Query Didnt return data',
  description: 'Message when query does not returned any data',
  id: 'xEOghk+bWHhmjmHB',
});

export const queryWithUnsupportedVisualization = defineMessage({
  defaultMessage: 'Above Query is Not Suitable for DataTable, Please change Query or Try changing timeframe',
  description: 'Message when query does not support dataTable',
  id: 'wOx4tVqPK9MkZ/D7',
});
