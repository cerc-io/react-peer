import React, {Component} from 'react'
import {render} from 'react-dom'

import { DebugPanel } from '../../src'

export default class Demo extends Component {
  render() {
    return <div>
      <h1>react-libp2p-debug Demo</h1>
      <DebugPanel />
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
