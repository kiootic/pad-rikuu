import { defaultCellRangeRenderer, Grid, GridCellRangeProps } from 'react-virtualized';

export class RecyclingGrid extends Grid {
  public static defaultProps = {
    ...Grid.defaultProps,
    cellRangeRenderer: RecyclingGrid.cellRangeRenderer
  };

  private static cellRangeRenderer(params: GridCellRangeProps) {
    const grid = params.parent as any as RecyclingGrid;
    const rowHeight = params.rowSizeAndPositionManager.getEstimatedCellSize();
    const maxVisibleRows = Math.ceil(grid._height / rowHeight) + grid._overscan + 1;
    return defaultCellRangeRenderer({
      ...params,
      cellRenderer: (cellParams) => params.cellRenderer({
        ...cellParams,
        key: `${cellParams.rowIndex % maxVisibleRows}-${cellParams.columnIndex}`
      })
    });
  }

  private _height: number;
  private _overscan: number;
  public render() {
    this._height = this.props.height;
    this._overscan = this.props.overscanRowCount || 10;
    return super.render();
  }
}