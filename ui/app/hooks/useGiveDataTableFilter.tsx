import { type FilterItemValues } from "@dynatrace/strato-components-preview/filters";
import { useFilteredData } from "@dynatrace/strato-components-preview/tables";
import { type ResultRecord } from "@dynatrace-sdk/client-query";
import { isNull } from "lodash-es";
import { useCallback, useMemo } from "react";

interface UseGiveDataTableFilterProps {
  queryRecords: (ResultRecord | null)[];
}

/**
 * This Custom Hook is used in filtering dataTableV2 records
 * More Info: https://developer.dynatrace.com/design/components-preview/filters/FilterBar/
 * @param QueryRecords
 * @returns FilteredData and OnChange Handler
 */

const useGiveDataTableFilter = ({
  queryRecords,
}: UseGiveDataTableFilterProps) => {
  /**
   * Modify QueryRecords from (ResultRecord | null)[] to ResultRecord[]
   */

  const modifiedQueryRecords = useMemo(
    () => queryRecords.filter((eachRecord) => !isNull(eachRecord)),
    [queryRecords],
  );

  // filter function
  const filterFn = useCallback(
    (filters: FilterItemValues, entry: ResultRecord): boolean => {
      return Object.keys(filters).every((filterName) =>
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        Object.values(entry)
          .join()
          .toLowerCase()
          .includes((filters[filterName].value as string).toLowerCase()),
      );
    },
    [],
  );

  const { onChange: onFilterChange, filteredData: dataTableFilteredData } =
    useFilteredData(modifiedQueryRecords, filterFn);

  return { onFilterChange, dataTableFilteredData };
};

export default useGiveDataTableFilter;
