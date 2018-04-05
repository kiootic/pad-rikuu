import { Grid, GridCellRangeProps, defaultCellRangeRenderer, GridProps, GridState } from "react-virtualized";


export class RecyclingGrid extends Grid {
  static defaultProps = {
    ...Grid.defaultProps,
    cellRangeRenderer: RecyclingGrid.cellRangeRenderer
  };

  private _height: number;
  private _overscan: number;
  componentWillUpdate(props: GridProps, state: GridState) {
    this._height = props.height;
    this._overscan = props.overscanRowCount;
    super.componentWillUpdate(props, state);
  }

  private static cellRangeRenderer(params: GridCellRangeProps) {
    const grid = params.parent as any as RecyclingGrid;
    const rowHeight = params.rowSizeAndPositionManager.getEstimatedCellSize();
    const maxVisibleRows = Math.ceil(grid._height / rowHeight) + grid._overscan + 1;
    return defaultCellRangeRenderer({
      ...params,
      cellRenderer: (cellParams) => {
        return params.cellRenderer({
          ...cellParams,
          key: `${cellParams.rowIndex % maxVisibleRows}-${cellParams.columnIndex}`
        })
      }
    });
  }
}