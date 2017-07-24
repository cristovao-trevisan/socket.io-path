# socket.io-topic-router
<p align="center">
  <a href="https://badge.fury.io/js/socket.io-topic-router"><img src="https://badge.fury.io/js/socket.io-topic-router.svg" alt="npm version" height="18"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a>
</p>

<p align="center">
  <b>
  Express like routing middleware for socket.io
  </b>
</p>

## Install

`npm install socket.io-topic-router`

## Usage

### Basic

#### Server
```javascript
const io = require('socket.io')(8080)
const ioRouter = require('socket.io-topic-router')()

io.use(ioRouter)
ioRouter.route('foo/:bar', (params, [arg1, arg2], next, socket) => {
  console.log(params, arg1, arg2)
  // params.bar === '1234'
  // arg1 === 'arg1'
  // arg2 === 'arg2'
  socket.emit('foo/1234', 'bar')
})
```

#### Client

```javascript
const io = require('socket.io-client')

var socket = io('http://localhost:8080')
socket.on('foo/1234', resp => {
  console.log(resp)
  // resp === 'bar'
})
socket.emit('foo/1234', 'arg1', 'arg2')
```

### Multiple Callbacks

#### Server
```javascript
const io = require('socket.io')(8080)
const ioRouter = require('socket.io-topic-router')()

const ensureAuth = (params, args, next) => {
  var {username, password} = args[0]
  if (username === 'admin' && password === '1234') {
    next()
  } else {
    next(new Error('Need authentication'))
  }
}

io.use(ioRouter)
ioRouter.route('user/:id', ensureAuth, (params, args, next, socket) => {
  var user = {name: 'Jack Sparrow'}
  socket.emit('user/' + params.id, user)
})
```

#### Client

```javascript
const io = require('socket.io-client')

var socket1 = io('http://localhost:8080')
socket1.on('user/1', user => {
  console.log('Socket 1:', user)
  // user.name === 'Jack Sparrow'
})
socket1.emit('user/1', {
  username: 'admin',
  password: '1234'
})

var socket2 = io('http://localhost:8080')
socket2.on('user/1', user => {
  // never called'
})
socket2.on('error', err => {
  console.log('Socket 2:', err)
  // Need authentication
})
socket2.emit('user/1', {
  username: 'admin',
  password: 'not this'
})
```
