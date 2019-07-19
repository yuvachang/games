import React, { Component } from 'react'
import Timer from './Timer'

class Minesweeper extends Component {
  state = {
    size: [],
    mineCount: 0,
    board: [],
    started: false, //mines set, board layout set
    seconds: 0,
  }

  createBoard = async selectedSize => {
    let [size, mineCount, board] = [0, 0, []]

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

    for (let i = 0; i < size[0]; i++) {
      board[i] = []
      for (let j = 0; j < size[1]; j++) {
        board[i].push({
          mine: 0,
          open: 0,
          neighborCount: 0,
        })
      }
    }

    await this.setState({
      size,
      mineCount,
      board,
    })
  }

  setMines = async firstCellClicked => {
    const { mineCount, size, board } = this.state
    const randomize = rowOrCol => Math.floor((Math.random() * 10) % rowOrCol)
    // const firstCellClicked = e.target.getAttribute('cellpos')
    let mines = 0

    // MAKE FIRST CLICKED CELL CASCADE? MAKE SURE NO MINE IN +1 VICINITY 
    
    while (mines <= mineCount) {
      // get random row and column
      let row = randomize(size[0])
      let col = randomize(size[1])

      // avoid setting mine on clicked cell
      if (`${row}${col}` === firstCellClicked) continue

      // skip if mine already exists on cell
      if (board[row][col].mine === 1) continue

      board[row][col].mine = 1
      mines++
    }

    const newBoard = this.setNeighborCounts(board)

    // console.log(mines, board)
    await this.setState({
      started: true,
      board: newBoard,
    })
  }

  setNeighborCounts = board => {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        let mineCount = 0
        for (let k = -1; k <= 1; k++) {
          for (let p = -1; p <= 1; p++) {
            if (
              i + k >= 0 &&
              i + k < board.length &&
              j + p >= 0 &&
              j + p < board[i].length &&
              board[i + k][j + p].mine
            ) {
              mineCount++
            }
          }
        }
        board[i][j].neighborCount = mineCount
      }
    }
    return board
  }

  handleClick = async e => {
    if (e.target.className === 'cell') {
      console.log(e.target.getAttribute('cellpos'))
      const { start } = this.timer.state

      if (!this.state.started) {
        await this.setMines(e.target.getAttribute('cellpos'))
        this.timer.startTimer()
      } else if (start === 0) {
        this.timer.startTimer()
      }

      const row = e.target.getAttribute('cellpos')[0]
      const col = e.target.getAttribute('cellpos')[1]

      const board = this.state.board

      if (e.button === 0) {
        // left click 
        // open 
        board[row][col].open = 1
      } else if (e.button ===2) {
        // right click
        // set flag
        console.log('rightclicked')
      }

      // if clicked cell neighbor count = 0, open all surrounding cells

      await this.setState({
        board,
      })
    }
  }

  clearBoard = () => {
    this.setState({
      size: [],
      mineCount: 0,
      board: [],
      started: false,
      seconds: 0,
    })
  }

  componentDidMount() {
    this.canvas.addEventListener('mouseup', this.handleClick)
  }

  componentWillUnmount() {
    this.canvas.removeEventListener('mouseup', this.handleClick)
  }

  render() {
    const { size, mineCount, board, started, seconds } = this.state
    return (
      <div className='minesweeper-container'>
        <div className='minesweeper-canvas' ref={node => (this.canvas = node)}>
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
                          className={`cell${cell.open ? ' open' : ''}`}
                          cellpos={`${rowIdx}${colIdx}`}
                          key={`${rowIdx},${colIdx}`}>
                          {cell.neighborCount}
                          {cell.mine}
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
