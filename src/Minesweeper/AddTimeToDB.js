import React, { Component } from 'react'
import { firestore } from '../firebase'
import profanity from '../data/profanity'

class AddTimeToDB extends Component {
  state = {
    error: '',
  }

  addTime = async () => {
    let name = this.nameInput.value
    if (!name.length) {
      return
    }

    if (profanity.includes(name)) {
      await this.setState({
        error: 'Please try a friendlier name!',
      })
    } else {
      try {
        await firestore.collection('minesweeper').add({
          name,
          time: this.props.time,
          size: this.props.size,
        })
        console.log('submitted')
        this.props.showLeaderBoard()
      } catch (error) {
        console.error(error)
        this.setState({
          error: 'Server error.',
        })
      }
    }
  }

  componentDidMount = async () => {}

  render() {
    const { error } = this.state
    return (
      <div className='add-to-db'>
        <div className='input'>
          <input type='text' ref={node => (this.nameInput = node)} placeholder='Your name' />
          <button onClick={this.addTime}>Submit</button>
        </div>
        {error && <div className='error'>{error}</div>}
      </div>
    )
  }
}

export default AddTimeToDB
