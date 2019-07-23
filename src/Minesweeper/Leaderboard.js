import React, { Component } from 'react'
import { firestore } from '../firebase'

class Leaderboard extends Component {
  state = {
    topFive: [],
  }

  getData = async () => {
    try {
      const timesGet = await firestore.collection('minesweeper').get()
      const data = []
      await timesGet.forEach(qSnap => {
        data.push(qSnap.data())
      })
      const allTimes = await Promise.all(data)
      if (this.props.size) {
        allTimes.filter(entry=>entry.size[0]===this.props.size[0])
      }
      const topFive = allTimes.sort((a, b) => (Number(a.time) > Number(b.time) ? 1 : -1)).slice(0, 5)
      this.setState({ topFive })
    } catch (error) {
      console.error(error)
    }
  }

  componentDidMount = async () => {
    this.unsubscribeListener = await firestore.collection('minesweeper').onSnapshot(async querySnapshot => {
      this.getData()
    })
  }

  componentWillUnmount = () => {
    this.unsubscribeListener()
  }

  render() {
    const { topFive } = this.state
    return (
      <div className='leaderboard'>
        <h4 style={{ textAlign: 'center', marginBottom: '4px' }}>Top 5 times:</h4>

        {!!topFive.length ? (
          topFive.map(score => {
            return (
              <div className='score' key={Math.random() * 999}>
                <div>{score.name}: &nbsp;</div>
                <div style={{ textAlign: 'right' }}>
                  {score.time.toFixed(1)} seconds on {score.size[0] === 8 ? 'Easy' : score.size[0] === 16 ? 'Medium' : 'Hard'}.
                </div>
              </div>
            )
          })
        ) : (
          <div className='score' key={Math.random() * 999}>
            There are no scores yet!
          </div>
        )}
      </div>
    )
  }
}

export default Leaderboard
