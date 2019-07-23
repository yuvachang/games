import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import {
  // Home,
  Minesweeper,
} from '../components'

export default function Routes() {
  return (
    <Route
      render={() => (
        <Switch>
          {/* <Route exact path='/' component={Home} /> */}
          <Route path='/minesweeper' component={Minesweeper} />
          <Redirect from='/' to='/minesweeper' component={() => null} />
          <Redirect from='*' to='/' component={() => null} />
        </Switch>
      )}
    />
  )
}
