import React, { Component } from 'react'
import Timer from './Timer'

class Minesweeper extends Component {
  state = {
    size: [],
    mineCount: 0,
    board: [],
    started: false, //mines set, board layout set
    ended: false,

    holdLeft: false,
    holdRight: false,
    releaseTime: 0,
  }

  createBoard = async selectedSize => {
    // Add event listeners on board creation.
    this.canvas.addEventListener('mouseup', this.onMouseUp)
    this.canvas.addEventListener('mousedown', this.onMouseDown)

    let [size, mineCount, board] = [0, 0, []]

    // Determine board size/game difficulty selected.
    if (!selectedSize) return
    if (selectedSize === 'small') {
      size = [8, 8]
      mineCount = 10
    } else if (selectedSize === 'medium') {
      size = [16, 16]
      mineCount = 40
    } else if (selectedSize === 'large') {
      size = [24, 24]
      mineCount = 99
    }

    // Initialize board arrays.
    for (let i = 0; i < size[0]; i++) {
      board[i] = []
      for (let j = 0; j < size[1]; j++) {
        // Set cell objects.
        board[i].push({
          mine: 0,
          flag: 0,
          open: 0,
          neighborMines: 0,
          pos: [i, j],
          highlighted: 0,
        })
      }
    }

    // Set mines after board initialized.
    this.setMines({ size, mineCount, board })

    console.log('Board initialized =>', board)

    await this.setState({
      size,
      mineCount,
      board,
    })
  }

  setMines = ({ size, mineCount, board }, i, j) => {
    // If i&j passed, ensure no mines in vicinity of given cell.
    const neighborPos = (() => {
      if (i && j) {
        const { neighborPos: nbc } = this.getNeighborCells(i, j, 1, board)
        return nbc
      } else return 0
    })()

    // Function: generate random integer within 0-row/col.length range.
    const randomize = rowOrCol => Math.floor(Math.random() * rowOrCol)

    let mines = 0

    while (mines < mineCount) {
      // Get random row and column within xy range of board.
      let row = randomize(size[0])
      let col = randomize(size[1])

      // Avoid setting mines on 9 cell block.
      if (neighborPos) {
        if (neighborPos.includes(`${row}${col}`)) continue
      }

      // Skip cell if mine already exists on cell.
      if (board[row][col].mine === 1) continue
      // Otherwise set mine.
      board[row][col].mine = 1
      mines++
    }

    // After setting mines, set neighborCounts of mines for each cell.
    board = this.setNeighborCounts(board)

    // // ## Uncomment to count total mines.
    // let totalmines = 0
    // board.forEach(row=> {
    //   row.forEach(cell=>{
    //     if (cell.mine){totalmines+=1}
    //   })
    // })
    // console.log(totalmines)
    // // ##

    return board
  }

  setNeighborCounts = board => {
    // Count mines in neighboring cells for each cell on board.
    for (let i = 0, n = board.length; i < n; i++) {
      for (let j = 0, n = board[i].length; j < n; j++) {
        const { neighborMines } = this.getNeighborCells(i, j, 0, board)
        board[i][j].neighborMines = neighborMines
      }
    }
    return board
  }

  getNeighborCells = (i, j, includeSelf, board) => {
    const neighborCells = []
    const neighborPos = []
    let neighborMines = 0
    let neighborFlags = 0

    // Return 8 or 9 cell block around center point i&j.
    for (let k = -1; k <= 1; k++) {
      for (let p = -1; p <= 1; p++) {
        if (
          i + k >= 0 &&
          i + k < board.length &&
          j + p >= 0 &&
          j + p < board[i].length
        ) {
          if (!includeSelf && (k === 0 && p === 0)) continue
          neighborCells.push(board[i + k][j + p])
          neighborPos.push(`${i + k}${j + p}`)
          neighborMines += board[i + k][j + p].mine
          if (board[i + k][j + p].flag % 3 === 1) {
            neighborFlags++
          }
        }
      }
    }

    return { neighborPos, neighborCells, neighborMines, neighborFlags }
  }

  ensureSafeFirstClick = (i, j, board) => {
    const { neighborCells } = this.getNeighborCells(i, j, 1, board)
    let mineCount = 0

    // Count mines around clicked cell including the cell.
    neighborCells.forEach(cell => {
      if (board[cell.pos[0]][cell.pos[1]].mine) {
        board[cell.pos[0]][cell.pos[1]].mine = 0
        mineCount++
      }
    })

    // Move mines from 9 cell block around clicked cell to rest of board.
    return this.setMines({ size: this.state.size, mineCount, board }, i, j)
  }

  cascade = (i, j, board) => {
    const { neighborCells } = this.getNeighborCells(i, j, 0, board)

    neighborCells.forEach(cell => {
      const row = cell.pos[0]
      const col = cell.pos[1]

      // Base case: cell has neighborMines && not already open.
      if (!!board[row][col].neighborMines) {
        if (!board[row][col].open) {
          board[row][col].open = 1
        }
      } else if (!board[row][col].neighborMines) {
        // Recurse if cell not open && has no neighborMines.
        if (!board[row][col].open) {
          board[row][col].open = 1
          board = this.cascade(row, col, board)
        }
      }
    })

    return board
  }

  openNeighborCells = (i, j, board) => {
    const cell = board[i][j]
    const { neighborFlags, neighborCells } = this.getNeighborCells(
      i,
      j,
      0,
      board
    )

    if (neighborFlags === cell.neighborMines) {
      neighborCells.forEach(cell => {
        if (!cell.flag) {
          this.openCell(cell.pos[0], cell.pos[1], board)
        }
      })
    }
  }

  openCell = async (i, j, board) => {
    if (this.state.ended) return

    // If cell is first cell open, make sure first click is on empty cascading cell.
    if (!this.state.started) {
      board = this.ensureSafeFirstClick(i, j, board)
    }

    // If timer is paused or uninitialized, start timer.
    if (!this.timer.state.start) {
      this.timer.startTimer()
    }

    const cell = board[i][j]
    // Open cell.
    // // Separate function to open cell(s), return new board.
    cell.open = 1

    // If opened cell has 0 mines and 0 neighborMines, cascade.
    if (cell.neighborMines === 0 && !cell.mine) {
      board = this.cascade(i, j, board)
    }

    // IF OPENED CELL HAS MINE, END GAME
    // // Run end game script, blow up all mines.
    let ended = this.state.ended
    if (cell.mine) {
      ended = true
      this.timer.pauseTimer()
    }

    await this.setState({
      board,
      ended,
      started: true,
    })
  }

  clearHighlights = (board, neighborsArr) => {
    if (!board) {
      // If board not passed in, clear entire board.
      let board = this.state.board
      board.forEach(row => {
        row.forEach(cell => {
          if (cell.highlighted) {
            board[cell.pos[0]][cell.pos[1]].highlighted = 0
          }
        })
      })
      this.setState({ board })
    } else {
      // If board passed in, clear everything except neighboring cells around cursor.
      board.forEach(row => {
        row.forEach(cell => {
          if (neighborsArr.includes(cell.pos)) return
          if (cell.highlighted) {
            board[cell.pos[0]][cell.pos[1]].highlighted = 0
          }
        })
      })
      return board
    }
  }

  highlightNeighborCells = async e => {
    // Highlight surrounding cells when L+RMB held down.
    let { board } = this.state
    let clickedCellPos = JSON.parse(e.target.getAttribute('cellpos'))
    let i = Number(clickedCellPos[0])
    let j = Number(clickedCellPos[1])
    const { neighborCells, neighborPos } = this.getNeighborCells(i, j, 0, board)

    // Clear all highlighted cells from board.
    board = this.clearHighlights(board, neighborPos)

    neighborCells.forEach(cell => {
      board[cell.pos[0]][cell.pos[1]].highlighted = 1
    })

    await this.setState({
      board,
    })
  }

  setFlag = (i, j, board) => {
    if (!board[i][j].open && this.state.started) {
      board[i][j].flag++
      this.setState({ board })
    }
  }

  mouseOver = async e => {
    if (!e.target.className.includes('cell')) {
      this.clearHighlights()
      return
    }

    console.log('mouseOver, calling highlightNeighborCells')
    this.highlightNeighborCells(e)
  }

  onMouseUp = e => {
    this.clearHighlights()
    this.canvas.removeEventListener('mouseover', this.mouseOver)

    // ## If mouse released outside of board, avoid board logic.
    if (!e.target.className.includes('cell')) {
      if (e.button === 0) {
        // LEFT BUTTON UP
        this.setState(prevState => {
          if (prevState.holdLeft) {
            return {
              holdLeft: false,
              releaseTime: Date.now(),
            }
          }
        })
      } else if (e.button === 2) {
        this.setState({
          holdRight: false,
          releaseTime: Date.now(),
        })
      }
      return
    }
    // ##

    const board = this.state.board
    let clickedCellPos = JSON.parse(e.target.getAttribute('cellpos'))
    let i = Number(clickedCellPos[0])
    let j = Number(clickedCellPos[1])
    const cell = board[i][j]

    if (Date.now() - this.state.releaseTime < 50) {
      // L+RMB up.

      // Open neighborCells if:
      // 1) Game has started.
      // 2) Clicked cell is open already.
      // 3) NeighborFlagCount===cell.neighborMines.
      // 3a) Unopened neighbor count === cell.neighborMines.
      if (cell.open) {
        this.openNeighborCells(i, j, board)
      }

      this.setState({
        holdLeft: false,
        holdRight: false,
      })
    } else if (e.button === 0) {
      // LMB up.

      // Open cell if:
      // 1) LMB up on cell,
      // 2) Cell isn't already open,
      // 3) RMB isn't pressed,
      if (e.target.className.includes('cell')) {
        let flagStatus = cell.flag % 3
        if (!cell.open && !this.state.holdRight && flagStatus === 0) {
          this.openCell(i, j, board)
        }
      }

      this.setState({
        holdLeft: false,
        releaseTime: Date.now(),
      })
    } else if (e.button === 2) {
      // RMB up.

      // Increment cell.flag if:
      // 1) RMB up on cell,
      // 2) LMB isn't pressed,
      if (!this.state.holdLeft) {
        // Set flag on cell.
        this.setFlag(i, j, board)
      }

      // TODO:
      //x## SET FLAGS
      //x## PREVENT OPEN CELL IF HAS FLAG%3>0
      // ## R+LMB OPEN NEIGHBORS IF FLAG NUMBERS MATCH NEIGHBORMINES
      // #### this.openNeighbors function, open all neighbors except flagged
      // ###### if empty && !neighborMines, this.cascade()
      // ## END GAME IF MINE IS OPENED
      // ## FLAG COUNTER VS TOTAL MINE COUNT
      // ## WIN :: ALL EMPTY CELLS OPENED

      this.setState({
        holdRight: false,
        releaseTime: Date.now(),
      })
    }
  }

  onMouseDown = async e => {
    // trigger hover class for board
    if (e.button === 0) {
      // LEFT BUTTON DOWN
      // left click: hover only individual cells
      await this.setState({
        holdLeft: true,
      })
    } else if (e.button === 2) {
      // RIGHT BUTTON DOWN
      await this.setState({
        holdRight: true,
      })
    }

    const { holdLeft, holdRight } = this.state
    if (holdLeft && holdRight) {
      // highlight surrounding cells
      // trigger highlight function for this cell, mouseOver initiates for cells mouseOver'd after this cell
      this.mouseOver(e)
      this.canvas.addEventListener('mouseover', this.mouseOver)
    }
  }

  clearBoard = () => {
    console.log('Clearing board.')

    this.canvas.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)

    this.setState({
      size: [],
      mineCount: 0,
      board: [],
      started: false,
      ended: false,
    })
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.canvas.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    // window.clearTimeout(this.LMBtimeout--)
  }

  render() {
    const { size, mineCount, board, started, holdLeft } = this.state
    return (
      <div className='minesweeper-container' ref={node => (this.canvas = node)}>
        <div className='minesweeper-canvas'>
          {/* MENU BUTTONS */}
          {!!size.length && (
            <div className='minesweeper-menu'>
              <div>
                <button onClick={this.clearBoard}>Back</button>
                <button onClick={() => this.timer.startTimer()}>
                  Start Timer
                </button>
                <button onClick={() => this.timer.pauseTimer()}>
                  Pause Timer
                </button>
                <button onClick={() => this.timer.clearTimer()}>
                  Clear Timer
                </button>
              </div>

              <Timer ref={node => (this.timer = node)} />
            </div>
          )}

          {/* SELECT BOARD SIZE */}
          {!size.length && (
            <div className='select-board'>
              <button onClick={() => this.createBoard('small')}>
                Easy (8x8)
              </button>
              <button onClick={() => this.createBoard('medium')}>
                Medium (16x16)
              </button>
              <button onClick={() => this.createBoard('large')}>
                Hard (30x30)
              </button>
            </div>
          )}

          {/* BOARD SIZE SELECTED */}
          {!!size.length && (
            <div
              className='board'
              onContextMenu={e => {
                e.preventDefault()
                return false
              }}>
              {board.map((row, rowIdx) => {
                return (
                  <div className='board-row' key={rowIdx}>
                    {row.map((cell, colIdx) => {
                      return (
                        <div
                          className={`cell${cell.open ? ' open' : ''}${
                            holdLeft ? ' hover' : ''
                          }${cell.highlighted ? ' highlighted' : ''}`}
                          cellpos={`[${rowIdx},${colIdx}]`}
                          key={`${rowIdx},${colIdx}`}>
                          {cell.neighborMines}
                          {cell.mine}
                          {cell.flag % 3 === 1
                            ? 'f'
                            : cell.flag % 3 === 2
                            ? '?'
                            : null}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Minesweeper
