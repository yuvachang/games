import React, { Component } from 'react'

class Timer extends Component {
  state = {
    start: 0,
    seconds: 0,
    minutes: 0,
    timer: '00:00.0',
    status: 'clear',
  }

  startTimer = async () => {
    // prevent duplicate interval if timer already running
    if (this.timerInterval && this.timerInterval !== 'cleared') {
      return
    }
    const currentTimer = this.state.seconds + this.state.minutes * 60

    this.timerInterval = await setInterval(async () => {
      const start = this.state.start || Date.now()

      let seconds = (Date.now() - start) / 1000 + currentTimer
      const minutes = Math.floor(seconds / 60)
      seconds = seconds - minutes * 60
      const timer = `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`

      await this.setState({
        start,
        seconds,
        minutes,
        timer,
      })
    }, 100)
  }

  clearInterval = () => {
    clearInterval(this.timerInterval)
    this.timerInterval = 'cleared'
  }

  pauseTimer = async () => {
    this.clearInterval()

    this.setState({
      start: 0,
    })
  }

  clearTimer = () => {
    this.clearInterval()
    this.setState({
      start: 0,
      seconds: 0,
      minutes: 0,
      timer: '00:00.0',
    })
  }

  componentWillUnmount() {
    this.clearTimer()
  }

  render() {
    const { start, timer } = this.state
    return (
      <div className='timer'>
        <h3>Time: {timer}</h3>
      </div>
    )
  }
}

export default Timer
