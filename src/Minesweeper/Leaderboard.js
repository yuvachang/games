import React, { Component } from 'react'
import { firestore } from '../firebase'

class Leaderboard extends Component {
  state = {
    topTimes: [],
  }

  getData = async () => {
    try {
      const timesGet = await firestore.collection('minesweeper').get()
      const data = []
      await timesGet.forEach(qSnap => {
        data.push(qSnap.data())
      })
      let allTimes = await Promise.all(data)
      let topTimes

      if (this.props.size) {
        topTimes = allTimes
          .filter(entry => entry.size[0] === this.props.size[0])
          .sort((a, b) => (Number(a.time) > Number(b.time) ? 1 : -1))
          .slice(0, 5)
      } else {
        topTimes = allTimes.sort((a, b) => (Number(a.time) > Number(b.time) ? 1 : -1)).slice(0, 10)
      }
      this.setState({ topTimes })
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
    const { topTimes } = this.state
    return (
      <div className='leaderboard'>
        <h4 style={{ textAlign: 'center', marginBottom: '4px' }}>Top {this.props.size ? '5' : '10'} times:</h4>

        {!!topTimes.length ? (
          topTimes.map(score => {
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
