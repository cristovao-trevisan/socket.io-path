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
