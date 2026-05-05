import { DataTable, type DataTableColumnVisibilityState } from '@dynatrace/strato-components-preview/tables';
import { isUndefined } from 'lodash-es';
import React, { useMemo, useState, type ReactElement } from 'react';
import { queryWithNoRecordsMessage } from '../../QueryTab/messages';
import CustomEmptyState from '../CustomEmptyState/CustomEmptyState';
import type { DataTableColumnDefinition } from '../../../Interfaces/Interfaces';

// component generic
interface GenericDataTableV2Props<T> {
  data: T[];
  isLoading: boolean;
  columns: DataTableColumnDefinition<T>[];
  isThereRowActions?: boolean;
  rowActionsJsx?: (rowData: T) => ReactElement;
  isThereExpandableRows?: boolean;
  expandableRowsJsx?: (rowData: T) => ReactElement;
  isThereTableHeaderActions?: boolean;
  tableHeaderActionsJsx?: () => ReactElement;
  visibleColumnsInTable?: Set<string>;
}

const GenericDataTableV2 = <T,>(props: GenericDataTableV2Props<T>) => {
  const {
    data,
    isLoading,
    columns,
    rowActionsJsx,
    isThereRowActions,
    isThereExpandableRows,
    expandableRowsJsx,
    isThereTableHeaderActions,
    tableHeaderActionsJsx,
    visibleColumnsInTable,
  } = props;

  const initialVisibility = useMemo(
    () =>
      columns.reduce<DataTableColumnVisibilityState>((acc, column) => {
        acc[column.id] = !isUndefined(visibleColumnsInTable) && visibleColumnsInTable.has(column.id);
        return acc;
      }, {}),
    [columns, visibleColumnsInTable],
  );

  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  return (
    <DataTable
      columns={columns}
      data={data}
      fullWidth
      resizable
      sortable
      loading={isLoading}
      variant={{
        rowDensity: 'comfortable',
        rowSeparation: 'zebraStripes',
        verticalDividers: true,
        contained: true,
      }}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
    >
      <DataTable.Toolbar>
        {/* https://developer.dynatracelabs.com/design/components-preview/tables/DataTableV2/#column-visibility-reset */}
        <DataTable.VisibilitySettings />

        {/* https://developer.dynatracelabs.com/design/components-preview/tables/DataTableV2/#download-data */}
        <DataTable.DownloadData />
      </DataTable.Toolbar>

      {/* For Table Header Actions */}
      {!isUndefined(isThereTableHeaderActions) && !isUndefined(tableHeaderActionsJsx) && (
        <DataTable.TableActions>{tableHeaderActionsJsx()}</DataTable.TableActions>
      )}

      {/* For Table Actions */}
      {!isUndefined(isThereRowActions) && !isUndefined(rowActionsJsx) && (
        <DataTable.RowActions>{(row: T) => rowActionsJsx(row)}</DataTable.RowActions>
      )}

      {/* For Expandable rows. */}
      {!isUndefined(isThereExpandableRows) && !isUndefined(expandableRowsJsx) && (
        <DataTable.ExpandableRow>{({ row }: { row: T }) => expandableRowsJsx(row)}</DataTable.ExpandableRow>
      )}

      {/* Empty State if Query Result is 0  */}
      <DataTable.EmptyState style={{ padding: '15px' }}>
        <CustomEmptyState context='table' type='no-result' titleMessage={queryWithNoRecordsMessage} />
      </DataTable.EmptyState>

      {/* For Table Pagination */}
      <DataTable.Pagination defaultPageSize={10} defaultPageIndex={0} />
    </DataTable>
  );
};

export default GenericDataTableV2;
