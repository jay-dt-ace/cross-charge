import { Skeleton } from "@dynatrace/strato-components/content";
import { FilterBar } from "@dynatrace/strato-components-preview/filters";
import { TextInput } from "@dynatrace/strato-components-preview/forms";
import { type ResultRecord } from "@dynatrace-sdk/client-query";
import React, { Fragment } from "react";
import { visibleColumnsInDataTableV2 } from "../../../constants/constants";
import useGiveDataTableFilter from "../../../hooks/useGiveDataTableFilter";
import GenericDataTableV2 from "../../Reusable/GenericDataTableV2/GenericDataTableV2";
import type { DataTableColumnDefinition } from "../../../Interfaces/Interfaces";

export interface EditorResultProps {
  tableV2Columns: DataTableColumnDefinition<ResultRecord | null>[];
  queryRecords: (ResultRecord | null)[];
  queryStatus: "idle" | "loading" | "success" | "error";
}

const EditorResult: React.FC<EditorResultProps> = (props) => {
  const { queryRecords, tableV2Columns, queryStatus } = props;

  // Custom Hooks
  const { dataTableFilteredData, onFilterChange } = useGiveDataTableFilter({
    queryRecords,
  });

  const tableActions = () => {
    return (
      <FilterBar onFilterChange={onFilterChange} style={{ width: "20%" }}>
        <FilterBar.Item name="filterItem" label="Filter all columns">
          <TextInput />
        </FilterBar.Item>
      </FilterBar>
    );
  };

  return (
    <Fragment>
      {queryStatus === "loading" ? <Skeleton height={300} /> : null}
      {/* If Query is success, then pass result to table */}
      {queryStatus === "success" ? (
        // && queryRecords.length > 0
        <GenericDataTableV2
          columns={tableV2Columns}
          data={dataTableFilteredData}
          isLoading={false}
          isThereTableHeaderActions
          tableHeaderActionsJsx={tableActions}
          visibleColumnsInTable={visibleColumnsInDataTableV2}
        />
      ) : null}
    </Fragment>
  );
};

export default EditorResult;
