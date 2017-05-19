# socket.io-topic-router

Express like routing middleware for socket.io

## Install

`npm install socket.io-topic-router`

## Usage

### Server
```javascript
const io = require('socket.io')(8080)
const ioRouter = require('socket.io-topic-router')()

io.use(ioRouter)
ioRouter.route('foo/:bar', (params, arg1, arg2) => {
  console.log(params, arg1, arg2)
  // params.bar === '1234'
  // arg1 === 'arg1'
  // arg2 === 'arg2'
})
```

### Client

```javascript
const io = require('socket.io-client')

var socket = io('http://localhost:8080')
socket.emit('foo/1234', 'arg1', 'arg2')
```
