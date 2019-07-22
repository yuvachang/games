import React, { Component } from 'react'
import Timer from './Timer'

class Minesweeper extends Component {
  state = {
    size: [],
    mineCount: 0,
    flagCount: 0,
    board: [],
    started: false, //mines set, board layout set
    ended: false,
    victory: false,

    holdLeft: false,
    holdRight: false,
    releaseTime: 0,
  }

  // TODO:
  //x## SET FLAGS
  //x## PREVENT OPEN CELL IF HAS FLAG%3>0
  //x## R+LMB OPEN NEIGHBORS IF FLAG NUMBERS MATCH NEIGHBORMINES
  //x#### this.openNeighbors function, open all neighbors except flagged
  //x###### if empty && !neighborMines, this.cascade()
  //x## END GAME IF MINE IS OPENED
  //x#### End game sequence, blow all mines.
  //x## FLAG COUNTER VS TOTAL MINE COUNT
  //x## WIN :: ALL EMPTY CELLS OPENED
  //x#### Condition: all empty cells opened regardless of flags.

  createBoard = async selectedSize => {
    // Add event listeners on board creation.
    this.canvas.addEventListener('mouseup', this.onMouseUp)
    this.canvas.addEventListener('mousedown', this.onMouseDown)

    let [size, mineCount, board] = [this.state.size || 0, this.state.mineCount || 0, []]

    // Determine board size/game difficulty selected.
    if (!selectedSize && !this.state.size.length) return
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
    // ## (board is passed by reference, reference updated and return not required)
    this.setMines(size, mineCount, board)

    console.log('Board initialized =>', board)

    await this.setState({
      size,
      mineCount,
      board,
    })
  }

  setMines = (size, mineCount, board, neighborPos) => {
    // Function: Generate random integer within 0-row/col.length range.
    const randomize = rowOrCol => Math.floor(Math.random() * rowOrCol)

    let mines = 0

    while (mines < mineCount) {
      // Get random row and column within xy range of board.
      let row = randomize(size[0])
      let col = randomize(size[1])
      let pos = String(row).padStart(2, '0') + String(col).padStart(2, '0')

      // Avoid setting mines on 9 cell block.
      if (neighborPos) {
        if (neighborPos.includes(pos)) continue
      }

      // Skip cell if mine already exists on cell.
      if (board[row][col].mine === 1) continue

      // Set mine.
      board[row][col].mine = 1
      mines++
    }

    // After setting mines, set neighborCounts of mines for each cell.
    this.setNeighborCounts(board)

    // // ## Uncomment to count total mines.
    // let totalmines = 0
    // board.forEach(row=> {
    //   row.forEach(cell=>{
    //     if (cell.mine){totalmines+=1}
    //   })
    // })
    // console.log(totalmines)
    // // ##
  }

  setNeighborCounts = board => {
    // Count mines in neighboring cells for each cell on board.
    for (let i = 0, n = board.length; i < n; i++) {
      for (let j = 0, n = board[i].length; j < n; j++) {
        const { neighborMines } = this.getNeighborCells(i, j, 0, board)
        board[i][j].neighborMines = neighborMines
      }
    }
  }

  getNeighborCells = (i, j, includeSelf, board) => {
    const neighborCells = []
    const neighborPos = []
    let neighborMines = 0
    let neighborFlags = 0

    // Return 8 or 9 cell block around center point i&j.
    for (let k = -1; k <= 1; k++) {
      for (let p = -1; p <= 1; p++) {
        if (i + k >= 0 && i + k < board.length && j + p >= 0 && j + p < board[i].length) {
          if (!includeSelf && (k === 0 && p === 0)) continue
          neighborCells.push(board[i + k][j + p])
          neighborPos.push(`${String(i + k).padStart(2, '0')}${String(j + p).padStart(2, '0')}`)
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
    const { neighborCells, neighborPos } = this.getNeighborCells(i, j, 1, board)
    let mineCount = 0

    // Count mines around clicked cell including the cell.
    neighborCells.forEach(cell => {
      if (board[cell.pos[0]][cell.pos[1]].mine) {
        board[cell.pos[0]][cell.pos[1]].mine = 0

        mineCount++
      }
    })

    // Move mines from 9 cell block around clicked cell to rest of board.
    this.setMines(this.state.size, mineCount, board, neighborPos)
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
          this.cascade(row, col, board)
        }
      }
    })
  }

  openNeighborCells = (i, j, board) => {
    const cell = board[i][j]
    const { neighborFlags, neighborCells } = this.getNeighborCells(i, j, 0, board)

    if (neighborFlags === cell.neighborMines) {
      neighborCells.forEach(cell => {
        if (!cell.flag && !cell.open) {
          this.openCell(cell.pos[0], cell.pos[1], board)
        }
      })
    }
  }

  openAllMines = board => {
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.mine) {
          board[cell.pos[0]][cell.pos[1]].open = 1
        }
      })
    })
  }

  countOpenCells = board => {
    let opened = 0
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.open) {
          opened++
        }
      })
    })
    return opened
  }

  openCell = async (i, j, board) => {
    if (this.state.ended || board[i][j].open) return

    // If cell is first cell open, make sure first click is on empty cascading cell.
    if (!this.state.started) {
      this.ensureSafeFirstClick(i, j, board)
    }

    // If timer is paused or uninitialized, start timer.
    if (!this.timer.state.start) {
      this.timer.startTimer()
    }

    const cell = board[i][j]
    // Open cell.
    board[i][j].open = 1

    // If opened cell has 0 mines and 0 neighborMines, cascade.
    if (cell.neighborMines === 0 && !cell.mine) {
      this.cascade(i, j, board)
    }

    const emptyCells = this.state.size[0] * this.state.size[1] - this.state.mineCount
    const openedCells = this.countOpenCells(board)

    // End game if a mine is opened.
    let ended = this.state.ended
    let victory = this.state.victory
    if (cell.mine) {
      ended = true
      this.openAllMines(board)
    }

    // End and win game if all empty cells opened.
    else if (openedCells === emptyCells) {
      ended = true
      victory = true
    }

    // Stop timer if game ends.
    if (ended) {
      this.timer.pauseTimer()
    }

    await this.setState({
      board,
      ended,
      victory,
      started: true,
    })
  }

  countFlags = board => {
    let flagCount = 0
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.flag % 3 === 1) {
          flagCount++
        }
      })
    })
    return flagCount
  }

  setFlag = (i, j, board) => {
    if (!board[i][j].open && this.state.started) {
      board[i][j].flag++

      const flagCount = this.countFlags(board)

      this.setState({ board, flagCount })
    }
  }

  highlightNeighborCells = (i, j) => {
    if (this.highlightTimeout) {
      window.clearTimeout(this.highlightTimeout)
    }

    let highlighted = []

    for (let k = -2; k <= 2; k++) {
      for (let p = -2; p <= 2; p++) {
        if (i + k >= 0 && i + k < this.state.board.length && j + p >= 0 && j + p < this.state.board[i].length) {
          if (k === 0 && p === 0) continue
          const elid = `${String(i + k).padStart(2, '0')}${String(j + p).padStart(2, '0')}`
          if (Math.abs(p) === 2 || Math.abs(k) === 2) {
            document.getElementById(elid).classList.remove('highlighted')
          } else {
            const cell = this.state.board[i + k][j + p]
            if (cell.flag % 3 === 0 && !cell.open) {
              document.getElementById(elid).classList.add('highlighted')
              highlighted.push(elid)
            }
          }
        }
      }
    }

    this.highlightTimeout = window.setTimeout(() => {
      this.clearAllHighlights(highlighted)
    }, 5)
  }

  clearAllHighlights = highlighted => {
    this.state.board.forEach(row => {
      row.forEach(cell => {
        const elid = `${String(cell.pos[0]).padStart(2, '0')}${String(cell.pos[1]).padStart(2, '0')}`
        if (highlighted && !highlighted.includes(elid)) {
          document.getElementById(elid).classList.remove('highlighted')
        } else if (!highlighted) {
          document.getElementById(elid).classList.remove('highlighted')
        }
      })
    })
  }

  mouseOver = async e => {
    if (!e.target.className.includes('cell')) {
      this.clearAllHighlights()
      return
    }
    let clickedCellPos = JSON.parse(e.target.getAttribute('cellpos'))
    let i = Number(clickedCellPos[0])
    let j = Number(clickedCellPos[1])

    this.highlightNeighborCells(i, j)
  }

  onMouseUp = e => {
    this.clearAllHighlights()
    this.canvas.removeEventListener('mouseover', this.mouseOver)

    // ## If mouse released outside of board, avoid board logic.
    if (!e.target.className.includes('cell')) {
      if (e.button === 0) {
        // LMB up.
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
    // ## If mouse released outside of board, avoid board logic.

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
        if (!this.timer.state.start && this.state.started && !this.state.ended) {
          this.timer.startTimer()
        }
        if (!this.state.ended) {
          this.setFlag(i, j, board)
        }
      }

      this.setState({
        // board,
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

  startOver = () => {
    this.createBoard()
    this.timer.clearTimer()
    this.setState({
      started: false,
      ended: false,
      victory: false,
    })
  }

  componentWillUnmount() {
    this.canvas.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
  }

  render() {
    const { size, mineCount, board, started, holdLeft, ended } = this.state
    return (
      <div className='minesweeper-container' ref={node => (this.canvas = node)}>
        {/* SELECT DIFFICULTY */}
        {!size.length && (
          <div className='select-board'>
            <button onClick={() => this.createBoard('small')}>Easy (8x8)</button>
            <button onClick={() => this.createBoard('medium')}>Medium (16x16)</button>
            <button onClick={() => this.createBoard('large')}>Hard (30x30)</button>
          </div>
        )}

        {/* BOARD SIZE SELECTED */}
        {!!size.length && (
          <div
            className='canvas'
            onContextMenu={e => {
              e.preventDefault()
              return false
            }}>
            <div className='minesweeper-menu'>
              <div className='buttons'>
                <button onClick={this.clearBoard}>
                  {/* Change Difficulty */}
                  <img alt='back' src='icons/back.svg' className='icon' />
                </button>
                <button className={`${started && !ended ? '' : 'hidden'}`} onClick={this.timer ? this.timer.pauseTimer : null}>
                  {/* Pause Timer */}
                  <img alt='pause' src='icons/pause.svg' className='icon' />
                </button>
                <button className={`${started ? '' : 'hidden'}`} onClick={this.startOver}>
                  {/* Start Over */}
                  <img alt='reset' src='icons/reset.svg' className='icon' />
                </button>
              </div>

              <div className='counter'>
                <h3> Mines:</h3> <h3>{this.state.mineCount}</h3>
              </div>
              <div className='counter'>
                <h3>Flags:</h3>
                <h3>{this.state.flagCount}</h3>
              </div>
              <Timer ref={node => (this.timer = node)} />
            </div>
            <div className='board'>
              {this.state.victory && (
                <div className='game-end-overlay'>
                  <h3>You won in</h3>
                  <h3>{this.timer.state.seconds.toFixed(1)} seconds!</h3>
                </div>
              )}
              {this.state.ended && !this.state.victory && (
                <div className='game-end-overlay'>
                  <h3>You lost in </h3>
                  <h3>{this.timer.state.seconds.toFixed(1)} seconds!</h3>
                </div>
              )}

              {board.map((row, rowIdx) => {
                return (
                  <div className='board-row' key={rowIdx}>
                    {row.map((cell, colIdx) => {
                      return (
                        <div
                          className={`cell${cell.open ? (cell.mine ? ' exploded' : ' open') : holdLeft ? ' hover' : ''}${
                            cell.highlighted ? ' highlighted' : ''
                          }`}
                          id={`${String(rowIdx).padStart(2, '0')}${String(colIdx).padStart(2, '0')}`}
                          cellpos={`[${rowIdx},${colIdx}]`}
                          key={`${rowIdx},${colIdx}`}>
                          {cell.open ? (cell.mine ? 'X' : `${cell.neighborMines}`) : cell.flag % 3 === 1 ? 'f' : cell.flag % 3 === 2 ? '?' : null}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default Minesweeper
